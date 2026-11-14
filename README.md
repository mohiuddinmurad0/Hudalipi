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

`dist/video-policy.js` holds site-only exclusions, enforced both on the server and in the browser. `SZ15Bb2leLo` is excluded from live responses, saved data, search, cards, and player navigation. Nothing is removed from the YouTube channel.

`dist/video-catalog.js` is an offline fallback, not the primary live source. Four allowed public uploads are retained there.

Playback uses YouTube's privacy-enhanced embed domain. The player is created only when chosen and removed when closed. Subscribe opens the channel's subscription confirmation URL; Facebook/TikTok Follow buttons open the supplied official profiles. The viewer completes subscription/follow on the platform while logged in; the website does not claim or silently perform that action.

## Validation

Run `npm test` for automatic-new-upload, exclusion, upstream failure, partial source failure, source validation, and read-only endpoint checks. Node's built-in test runner is used.

## Files

- `dist/index.html` — Bengali content, featured video, library and player dialog
- `dist/style.css` — responsive brand and video layouts
- `dist/app.js` — topic selection and accessible mobile navigation
- `dist/videos.js` — search, filters, lazy player, previous/next and playback cleanup
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

## Optional pre-play invitation

Choosing a library or featured video first opens a dismissible Subscribe/Follow invitation. Its official outbound links do not claim to verify subscription or follow status. “এখনই ভিডিও দেখুন” starts the selected video immediately, with no waiting period or social action required. No player iframe is loaded before this choice. Escape, the close button and backdrop dismiss the invitation; normal previous/next navigation inside the player remains uninterrupted.
