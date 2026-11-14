# Hudalipi

A responsive Bengali website for Hudalipi, with an on-site YouTube video library, searchable videos and Shorts, a featured recitation, and social profile links.

## Local preview

No dependencies or build step are required:

```sh
python3 -m http.server 5173 --directory dist
```

Open http://localhost:5173. Serve over HTTP rather than opening the HTML as a file, because the video library uses JavaScript modules.

## Video library

`dist/video-catalog.js` contains public videos verified from the channel on 2026-11-14. Each item has a YouTube `id`, the actual `title`, `format` (`video` or `short`), and an optional `duration`. Add newly published videos to this file to update the library; no YouTube API key is required. The catalog currently includes the five publicly listed videos/Shorts.

Playback uses YouTube's privacy-enhanced embed domain. The player is created only when a visitor chooses a video and is removed when closed. The native dialog supports keyboard focus containment and Escape; search and format filters include an empty state. An external YouTube link remains available if playback is restricted by YouTube or the viewer's browser.

Channel links use the verified channel ID so they remain valid when the handle changes. YouTube currently reports the handle `@hudalipiofficial` for this channel.

## Files

- `dist/index.html` — Bengali content, featured video, library and player dialog
- `dist/style.css` — responsive brand and video layouts
- `dist/app.js` — topic selection and accessible mobile navigation
- `dist/videos.js` — search, filters, lazy player, previous/next and playback cleanup
- `dist/video-catalog.js` — verified public video IDs and titles
- `dist/assets/` — channel logo and banner
- `.openai/hosting.json` — retained Sites hosting configuration

The GitHub repository is connected to the existing Vercel deployment. Its static output directory remains `dist`; no server, API key, new hosting configuration or account is required.

## Social profiles

- YouTube: https://www.youtube.com/channel/UC7un7g0eyf21XUKVgOt6-6g
- Facebook: https://www.facebook.com/profile.php?id=61596143356410
- TikTok: https://www.tiktok.com/@hudalipi
