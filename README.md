# Hudalipi

A responsive Bengali website for Hudalipi, with an on-site YouTube video library, searchable videos and Shorts, a featured recitation, and social profile links.

## Local preview

Node.js 22 or later; no dependencies or API keys are required:

```sh
npm run dev
```

Open http://127.0.0.1:5173. This serves both the static page and `/api/videos`.

## Automatic YouTube uploads

`api/videos.js` is a read-only Vercel function. On visits it fetches the channel's public Videos and Shorts tabs, validates the channel identity, and returns current listings. Vercel caches successful responses for five minutes. The open page checks again every five minutes while visible and refreshes on return to the tab. No rebuild or manual catalog edit is required for new public uploads.

`lib/youtube.js` supports current and older YouTube public-page renderers. If YouTube is unavailable, the allowed saved catalog remains available; the UI identifies that saved state. This uses public page data rather than the authenticated YouTube Data API, so future YouTube markup changes may require a parser update. Only publicly listed uploads can be discovered. Upload processing/listing delays are controlled by YouTube.

`dist/video-policy.js` holds site-only exclusions, enforced both on the server and in the browser. `SZ15Bb2leLo` is excluded from live responses, saved data, search and video links. Nothing is removed from the YouTube channel.

`dist/video-catalog.js` is an offline fallback, not the primary live source. Four allowed public uploads are retained there.

Videos open directly on YouTube (app handoff on supported mobile browsers, new tab on desktop); no embedded player, iframe, or on-site playback is created. Native links support keyboard, modified clicks and the browser's standard new-tab controls. The initial optional follow invitation appears once per tab visit using sessionStorage, including across reloads; displaying or dismissing it counts as seen. When storage is unavailable, an in-memory flag still avoids repeats on the open page. A new browser tab/session can receive a fresh invitation.

Subscribe opens the channel's subscription confirmation URL; Facebook/TikTok Follow buttons open the supplied official profiles. These remain optional, with an immediate YouTube watch link in the invitation.

## Validation

Run `npm test` for automatic-new-upload, exclusion, upstream failure, partial source failure, source validation, and read-only endpoint checks. Node's built-in test runner is used.

## Files

- `dist/index.html` — Bengali content, featured video, library and optional follow dialog
- `dist/style.css` — responsive brand and video layouts
- `dist/app.js` — topic selection and accessible mobile navigation
- `dist/videos.js` — search, filters, once-per-visit invitation and direct YouTube links
- `dist/video-catalog.js` — allowed fallback videos
- `dist/video-policy.js` — exclusions shared by client and server
- `api/videos.js`, `lib/youtube.js` — live YouTube listing endpoint
- `vercel.json` — static output and function deployment
- `scripts/dev-server.js` — local static/API preview
- `dist/assets/` — channel logo and banner
- `.openai/hosting.json` — retained Sites hosting configuration

The GitHub repository is connected to the existing Vercel deployment. Its static output directory remains `dist`; `vercel.json` also deploys the Node.js function in `api/`. No API key or new account is required.

## Social profiles

- YouTube: https://www.youtube.com/channel/UC7un7g0eyf21XUKVgOt6-6g
- Facebook: https://www.facebook.com/profile.php?id=61596143356410
- TikTok: https://www.tiktok.com/@hudalipi

## Optional follow invitation

Choosing a featured video or library item first opens the invitation once per visit. “এখনই ভিডিও দেখুন” links directly to the selected YouTube video or Shorts, with mobile app handoff when supported. No waiting period, social action or subscription verification is required. Later video selections open YouTube directly. The close button, Escape and backdrop dismiss the invitation and restore focus.

## Mobile app handoff

`dist/youtube-links.js` configures featured, library and invitation watch links consistently. Android Chromium browsers use a user-tapped HTTPS intent targeting `com.google.android.youtube`, with an encoded HTTPS browser fallback. iPhone/iPad use normal YouTube HTTPS Universal Links in the same browsing context; other Android browsers and embedded webviews also use HTTPS. Desktop links keep their new-tab behavior. No timed redirects, app-install detection, or autoplay are used. App opening depends on the installed app, OS link preferences and browser support and cannot be forced by the website.

Routing tests cover Android intent and fallback URLs for videos and Shorts, iPhone/iPad Universal Links, embedded browsers, desktop behavior, and malformed video IDs. Actual native app launch needs testing on a physical phone.
