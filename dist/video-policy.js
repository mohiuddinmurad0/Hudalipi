// Site-only exclusions: this does not change anything on YouTube.
export const excludedVideoIds = new Set(['SZ15Bb2leLo']);
export function allowedVideo(video) {
  return video && typeof video.title === 'string' && video.title.trim() &&
    /^[\w-]{11}$/.test(video.id) && !excludedVideoIds.has(video.id) &&
    ['video', 'short'].includes(video.format);
}

export function latestPublishedVideo(videos) {
  return videos.filter(allowedVideo).filter(video => Number.isFinite(Date.parse(video.publishedAt)))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))[0];
}
