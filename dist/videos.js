import { videos } from './video-catalog.js';
import { allowedVideo } from './video-policy.js';

const grid = document.getElementById('video-grid');
const status = document.getElementById('video-status');
const search = document.getElementById('video-search');
const empty = document.getElementById('video-empty');
const dialog = document.getElementById('video-dialog');
const mount = document.getElementById('player-mount');
const title = document.getElementById('player-title');
const previous = document.getElementById('previous-video');
const next = document.getElementById('next-video');
const filters = [...document.querySelectorAll('[data-filter]')];
const bnNumber = new Intl.NumberFormat('bn-BD');
let validVideos = videos.filter(allowedVideo);
let activeFilter = 'all';
let currentId;
let lastFocused;
let visibleVideos = validVideos;

function searchable(value) {
  return value.normalize('NFKC').toLocaleLowerCase().replace(/[\u200c\u200d]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
}

function render() {
  const query = searchable(search.value.trim());
  visibleVideos = validVideos.filter(video =>
    (activeFilter === 'all' || video.format === activeFilter) &&
    (!query || searchable(video.title).includes(query))
  );
  const cards = visibleVideos.map(video => {
    const article = document.createElement('article');
    const button = document.createElement('button');
    button.className = 'video-card';
    button.dataset.play = video.id;
    button.setAttribute('aria-label', `${video.title} — ভিডিও চালান`);
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
    action.textContent = 'ভিডিও দেখুন ↗';
    body.append(kind, heading, action);
    button.append(media, body);
    article.append(button);
    return article;
  });
  grid.replaceChildren(...cards);
  empty.hidden = cards.length !== 0;
  status.textContent = `${bnNumber.format(cards.length)}টি ভিডিও${query ? ' পাওয়া গেছে' : ' · আপনার পছন্দটি বেছে নিন'}`;
}

function setFilter(value) {
  activeFilter = value;
  filters.forEach(button => {
    const selected = button.dataset.filter === value;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  render();
}

function playVideo(id) {
  const video = validVideos.find(item => item.id === id);
  if (!video) return;
  currentId = id;
  title.textContent = video.title;
  document.getElementById('player-kind').textContent = video.format === 'short' ? 'SHORTS · সংক্ষিপ্ত ভিডিও' : 'HUDALIPI · ভিডিও';
  document.getElementById('youtube-fallback').href = `https://www.youtube.com/watch?v=${id}`;
  dialog.classList.toggle('is-short', video.format === 'short');
  const iframe = document.createElement('iframe');
  iframe.title = video.title;
  iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  mount.replaceChildren(iframe);
  const index = validVideos.findIndex(item => item.id === id);
  previous.disabled = index === 0;
  next.disabled = index === validVideos.length - 1;
  if (!dialog.open) {
    lastFocused = document.activeElement;
    dialog.showModal();
    document.body.classList.add('player-open');
  }
}

filters.forEach(button => button.addEventListener('click', () => setFilter(button.dataset.filter)));
search.addEventListener('input', render);
document.getElementById('reset-videos').addEventListener('click', () => {
  search.value = '';
  setFilter('all');
  search.focus();
});
document.addEventListener('click', event => {
  const button = event.target.closest('[data-play]');
  if (button) playVideo(button.dataset.play);
});
document.getElementById('close-player').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  mount.replaceChildren(); // Stop playback when closed, including with Escape.
  document.body.classList.remove('player-open');
  if (lastFocused?.isConnected) lastFocused.focus({preventScroll:true});
});
previous.addEventListener('click', () => {
  const index = validVideos.findIndex(item => item.id === currentId);
  if (index > 0) playVideo(validVideos[index - 1].id);
});
next.addEventListener('click', () => {
  const index = validVideos.findIndex(item => item.id === currentId);
  if (index < validVideos.length - 1) playVideo(validVideos[index + 1].id);
});
render();


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
    const response = await fetch('/api/videos', {signal: AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    if (!Array.isArray(data.videos)) throw new Error('Invalid catalog');
    validVideos = data.videos.filter(allowedVideo);
    // Keep the current player running while the catalog refreshes.
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
