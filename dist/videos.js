import { videos } from './video-catalog.js';
import { allowedVideo, latestPublishedVideo, newestFirst } from './video-policy.js';
import { configureYouTubeLink } from './youtube-links.js';

const grid = document.getElementById('video-grid');
const status = document.getElementById('video-status');
const search = document.getElementById('video-search');
const empty = document.getElementById('video-empty');
const moreControls = document.getElementById('video-more');
const loadMore = document.getElementById('load-more-videos');
const pageSize = 6;
let visibleLimit = pageSize;
const dialog = document.getElementById('video-dialog');
let lastFocused;
const visitKey = 'hudalipi.followPromptSeen';
let promptSeen = false;
try { promptSeen = sessionStorage.getItem(visitKey) === '1'; } catch { /* In-memory fallback when storage is unavailable. */ }
function markPromptSeen() {
  promptSeen = true;
  try { sessionStorage.setItem(visitKey, '1'); } catch { /* Keep this visit usable without storage. */ }
}
// Use the same official subscription/profile links as the site's follow section.
const followLinks = [...document.querySelectorAll('.social-actions a')].map(link => {
  const copy = link.cloneNode(true);
  copy.className = 'prewatch-social';
  return copy;
});
document.getElementById('prewatch-socials').replaceChildren(...followLinks);
const filters = [...document.querySelectorAll('[data-filter]')];
const bnNumber = new Intl.NumberFormat('bn-BD');
let validVideos = newestFirst(videos);
let activeFilter = 'all';
let visibleVideos = validVideos;

function updateHero(video) {
  if (!video || !allowedVideo(video)) return;
  const feature = document.querySelector('.hero-feature');
  const image = feature.querySelector('.feature-play img');
  image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  image.alt = `${video.title} — থাম্বনেইল`;
  feature.querySelector('.feature-heading').innerHTML = '<span class="feature-dot" aria-hidden="true"></span> সর্বশেষ প্রকাশিত <span>NEW UPLOAD</span>';
  feature.querySelector('.feature-copy h2').textContent = video.title.split('|')[0].trim();
  feature.querySelector('.feature-copy > span').textContent = video.format === 'short' ? 'SHORTS · নতুন ভিডিও' : 'নতুন ভিডিও';
  const published = video.publishedAt;
  feature.querySelector('.feature-copy p').textContent = Number.isFinite(Date.parse(published))
    ? `প্রকাশিত: ${new Intl.DateTimeFormat('bn-BD', {day:'numeric', month:'long', year:'numeric', timeZone:'Asia/Dhaka'}).format(new Date(published))}`
    : 'সর্বশেষ ভিডিওটি YouTube-এ দেখুন।';
  feature.querySelector('.feature-duration').textContent = video.format === 'short' ? 'Shorts' : (video.duration || 'ভিডিও');
  feature.querySelector('.feature-play').classList.toggle('is-short', video.format === 'short');
  for (const link of feature.querySelectorAll('a[data-play]')) {
    link.dataset.play = video.id;
    link.setAttribute('aria-label', `${video.title} — YouTube-এ দেখুন`);
    configureYouTubeLink(link, video);
  }
}

function searchable(value) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[\u200c\u200d]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
}

function render({ focusNew = false } = {}) {
  const previouslyShown = grid.children.length;
  const query = searchable(search.value.trim());
  visibleVideos = validVideos.filter(video =>
    (activeFilter === 'all' || video.format === activeFilter) &&
    (!query || searchable(video.title).includes(query))
  );
  const cards = visibleVideos.slice(0, visibleLimit).map(video => {
    const article = document.createElement('article');
    const button = document.createElement('a');
    button.className = 'video-card';
    configureYouTubeLink(button, video);
    button.dataset.play = video.id;
    button.setAttribute('aria-label', `${video.title} — YouTube-এ দেখুন`);
    const media = document.createElement('span');
    media.className = `video-thumbnail ${video.format === 'short' ? 'is-short' : ''}`;
    const image = document.createElement('img');
    image.src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
    image.alt = '';
    image.width = 480;
    image.height = 360;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.addEventListener('error', () => image.hidden = true, {once:true});
    const play = document.createElement('span');
    play.className = 'card-play';
    play.textContent = '▶';
    play.setAttribute('aria-hidden', 'true');
    const badge = document.createElement('span');
    badge.className = 'video-badge';
    badge.textContent = video.format === 'short' ? 'Shorts' : (video.duration || 'ভিডিও');
    media.append(image, play, badge);
    const body = document.createElement('span');
    body.className = 'video-card-body';
    const kind = document.createElement('span');
    kind.className = 'video-kind';
    kind.textContent = /সূরা|surah/i.test(video.title) ? 'কুরআন তিলাওয়াত' : /নামাজ|সালাত|salah|namaz/i.test(video.title) ? 'নামাজ শিক্ষা' : 'Hudalipi';
    const heading = document.createElement('strong');
    heading.textContent = video.title;
    const action = document.createElement('span');
    action.className = 'video-card-action';
    action.textContent = 'YouTube-এ দেখুন ↗';
    body.append(kind, heading, action);
    button.append(media, body);
    article.append(button);
    return article;
  });
  grid.replaceChildren(...cards);
  empty.hidden = cards.length !== 0;
  status.textContent = `${bnNumber.format(visibleVideos.length)}টি ভিডিও${query ? ' পাওয়া গেছে' : ' · নতুন থেকে পুরোনো'}`;
  moreControls.hidden = visibleVideos.length <= pageSize;
  loadMore.hidden = cards.length >= visibleVideos.length;
  document.getElementById('video-progress').textContent = `${bnNumber.format(visibleVideos.length)}টির মধ্যে ${bnNumber.format(cards.length)}টি দেখানো হচ্ছে`;
  if (focusNew) grid.children[previouslyShown]?.querySelector('a')?.focus({preventScroll:true});
}

function setFilter(value) {
  activeFilter = value;
  visibleLimit = pageSize;
  filters.forEach(button => {
    const selected = button.dataset.filter === value;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  render();
}

function showInvitation(video) {
  lastFocused = document.activeElement;
  document.getElementById('prewatch-video-title').textContent = video.title;
  document.getElementById('prewatch-thumbnail').src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  configureYouTubeLink(document.getElementById('watch-now'), video);
  dialog.showModal();
  markPromptSeen(); // Count displaying it, including dismissal, as this visit's one invitation.
  document.body.classList.add('player-open');
}

document.getElementById('watch-now').addEventListener('click', () => dialog.close());

filters.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
search.addEventListener('input', () => {
  visibleLimit = pageSize;
  render();
});
loadMore.addEventListener('click', () => {
  visibleLimit += pageSize;
  render({focusNew:true});
});
document.getElementById('reset-videos').addEventListener('click', () => {
  search.value = '';
  setFilter('all');
  search.focus();
});
document.addEventListener('click', event => {
  const link = event.target.closest('a[data-play]');
  if (!link || promptSeen || event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
  const video = validVideos.find(item => item.id === link.dataset.play);
  if (!video) return;
  event.preventDefault();
  showInvitation(video);
});
document.getElementById('close-player').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  if (dialog.open) return; // Ignore a queued close event after a newer video opens.
  document.body.classList.remove('player-open');
  if (lastFocused?.isConnected) lastFocused.focus({preventScroll:true});
});
// Upgrade the static featured links as well as dynamically rendered cards.
for (const link of document.querySelectorAll('a[data-play]')) {
  const video = validVideos.find(item => item.id === link.dataset.play);
  if (video) configureYouTubeLink(link, video);
}
render();
updateHero(latestPublishedVideo(validVideos));


// Vercel caches the public channel response for five minutes. The local catalog
// remains usable when the connection or YouTube is temporarily unavailable.
let refreshing = false;
let lastAttempt = 0;
async function refreshVideos() {
  if (refreshing || document.hidden || Date.now() - lastAttempt < 60000) return;
  refreshing = true;
  lastAttempt = Date.now();
  const syncStatus = document.getElementById('video-sync-status');
  try {
    const response = await fetch('/api/videos', {signal: AbortSignal.timeout(22000)});
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    if (!Array.isArray(data.videos)) throw new Error('Invalid catalog');
    validVideos = newestFirst(data.videos);
    updateHero(validVideos.find(video => video.id === data.featuredVideoId));
    render();
    syncStatus.textContent = data.source === 'youtube' ? 'YouTube থেকে স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে' :
      data.source === 'partial' ? 'ভিডিও তালিকা আপডেট হচ্ছে' : 'সংরক্ষিত ভিডিও · আরও ভিডিও YouTube-এ';
    syncStatus.classList.toggle('is-saved', data.source === 'saved');
  } catch {
    syncStatus.textContent = 'সংরক্ষিত ভিডিও · আরও ভিডিও YouTube-এ';
    syncStatus.classList.add('is-saved');
  } finally {
    refreshing = false;
  }
}
refreshVideos();
setInterval(refreshVideos, 5 * 60 * 1000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && Date.now() - lastAttempt >= 5 * 60 * 1000) refreshVideos();
});
