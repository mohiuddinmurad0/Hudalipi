// Keep app handoff on a real user-tapped link, with no timer or forced redirect.
export function youtubeDestination(video, device = {}) {
  if (!/^[\w-]{11}$/.test(video.id)) throw new Error('Invalid YouTube video ID');
  const path = video.format === 'short' ? `/shorts/${video.id}` : `/watch?v=${video.id}`;
  const webUrl = `https://www.youtube.com${path}`;
  const ua = device.userAgent || '';
  const android = /Android/i.test(ua);
  const ios = /iPhone|iPad|iPod/i.test(ua) ||
    (device.platform === 'MacIntel' && device.maxTouchPoints > 1);
  const chromium = /(?:Chrome|Chromium|SamsungBrowser|EdgA|OPR)\//i.test(ua);
  const embeddedBrowser = /FBAN|FBAV|Instagram|; wv\)/i.test(ua);
  if (android && chromium && !embeddedBrowser) {
    return {
      href: `intent://www.youtube.com${path}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`,
      target: '_self', webUrl
    };
  }
  // On iOS and other mobile browsers, let the OS resolve YouTube's HTTPS app link.
  return { href: webUrl, target: android || ios ? '_self' : '_blank', webUrl };
}

export function configureYouTubeLink(link, video, device = navigator) {
  const destination = youtubeDestination(video, device);
  link.href = destination.href;
  link.target = destination.target;
  link.rel = 'noopener noreferrer';
  return destination;
}
