import { allowedVideo } from '../dist/video-policy.js';
import { videos as savedVideos } from '../dist/video-catalog.js';

export const channelId = 'UC7un7g0eyf21XUKVgOt6-6g';
const textOf = value => value?.simpleText || value?.runs?.map(run => run.text).join('') || '';

export function uniqueAllowed(videos) {
  const ids = new Set();
  return videos.filter(allowedVideo).filter(video => {
    if (ids.has(video.id)) return false;
    ids.add(video.id);
    return true;
  }).map(({ id, title, format, duration = '' }) => ({ id, title: title.trim().slice(0, 500), format, duration }));
}

export function parseChannelPage(html, format) {
  const match = html.match(/(?:var\s+ytInitialData\s*=\s*|window\["ytInitialData"\]\s*=\s*)([\s\S]*?);\s*<\/script>/);
  if (!match) throw new Error('Channel data unavailable');
  const data = JSON.parse(match[1]);
  if (data.metadata?.channelMetadataRenderer?.externalId !== channelId) throw new Error('Unexpected channel');
  const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs;
  const selected = tabs?.find(tab => tab.tabRenderer?.selected)?.tabRenderer?.content;
  if (!selected) throw new Error('Channel tab unavailable');
  const videos = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.lockupViewModel?.contentType === 'LOCKUP_CONTENT_TYPE_VIDEO') {
      const item = node.lockupViewModel;
      const overlays = item.contentImage?.thumbnailViewModel?.overlays || [];
      const duration = overlays.flatMap(overlay => overlay.thumbnailBottomOverlayViewModel?.badges || [])
        .map(badge => badge.thumbnailBadgeViewModel?.text).find(Boolean) || '';
      videos.push({ id: item.contentId, title: item.metadata?.lockupMetadataViewModel?.title?.content, format, duration });
    }
    if (node.videoRenderer) {
      const item = node.videoRenderer;
      videos.push({ id: item.videoId, title: textOf(item.title), format, duration: textOf(item.lengthText) });
    }
    if (node.shortsLockupViewModel) {
      const item = node.shortsLockupViewModel;
      const command = item.onTap?.innertubeCommand;
      videos.push({ id: command?.reelWatchEndpoint?.videoId,
        title: item.overlayMetadata?.primaryText?.content, format: 'short', duration: '' });
    }
    if (node.reelItemRenderer) {
      const item = node.reelItemRenderer;
      videos.push({ id: item.videoId, title: textOf(item.headline), format: 'short', duration: '' });
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === 'object') visit(value);
    }
  }
  visit(selected);
  // A genuinely empty public tab is valid; malformed responses must not clear the catalog.
  if (!videos.length && !JSON.stringify(selected).includes('messageRenderer')) throw new Error('Video data unavailable');
  return uniqueAllowed(videos);
}

export async function loadChannelVideos(fetcher = fetch) {
  const results = await Promise.allSettled([
    ['videos', 'video'], ['shorts', 'short']
  ].map(async ([tab, format]) => {
    const response = await fetcher(`https://www.youtube.com/channel/${channelId}/${tab}?hl=en`, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('YouTube unavailable');
    return parseChannelPage(await response.text(), format);
  }));
  const syncedFormats = results.map((result, i) => result.status === 'fulfilled' ? (i ? 'short' : 'video') : null).filter(Boolean);
  const items = results.flatMap((result, i) => result.status === 'fulfilled'
    ? result.value : savedVideos.filter(video => video.format === (i ? 'short' : 'video')));
  return {
    videos: uniqueAllowed(items),
    source: syncedFormats.length === 2 ? 'youtube' : syncedFormats.length ? 'partial' : 'saved',
    syncedFormats,
    checkedAt: new Date().toISOString()
  };
}
