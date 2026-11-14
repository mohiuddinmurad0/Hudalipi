// Site-only exclusions: this does not change anything on YouTube.
export const excludedVideoIds = new Set(['SZ15Bb2leLo']);
export function allowedVideo(video) {
  return video && typeof video.title === 'string' && video.title.trim() &&
    /^[\w-]{11}$/.test(video.id) && !excludedVideoIds.has(video.id) &&
    ['video', 'short'].includes(video.format);
}

export function newestFirst(videos) {
  const timestamp = video => Number.isFinite(Date.parse(video.publishedAt)) ? Date.parse(video.publishedAt) : -Infinity;
  return videos.filter(allowedVideo).slice().sort((a, b) => {
    const left = timestamp(a), right = timestamp(b);
    return left === right ? 0 : right > left ? 1 : -1;
  });
}

export function latestPublishedVideo(videos) {
  return newestFirst(videos).find(video => Number.isFinite(Date.parse(video.publishedAt)));
}
