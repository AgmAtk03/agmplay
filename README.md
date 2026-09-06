# AgmPlay

Playback infrastructure for AgmBizz’s existing media library. Web foundation now; the same JSON contracts are ready for a later mobile app.

This is **not** a fake Netflix catalog. The shipped titles are a **demo adapter** — legal sample / public-domain files so Play works before your source is connected.

## Live preview

- **Vercel (APIs + player):** see the pull request / deployment comment after CI
- **Static CDN (UI + player, no API routes):** `https://raw.githack.com/AgmAtk03/agmplay/live-demo/index.html`

Success path: Library → title → Play → demo video (pre-roll stub, then content).

## Architecture

```
[Browse UI] ──GET /api/catalog|search──► LibraryProvider
[Player]    ──GET /api/playback/:id───►   ├─ demo  (sample files)
[Mobile]    ──same JSON contracts───►    ├─ http  (your API)
                                         └─ s3    (R2/S3 manifest)

[Player] ──GET /api/ads/config──► stub ad engine
          pre-roll → content → mid-roll cues → HTML overlay
```

| Layer | What it does |
| --- | --- |
| **Player** | Full-page HTML5 player. HLS via hls.js (Safari native), DASH via dashjs, progressive MP4 fallback. Protocol switcher, skippable ads, continue-watching in `localStorage`. |
| **LibraryProvider** | `listTitles`, `getTitle`, `getPlayback`, `search`. Swap adapters with `LIBRARY_PROVIDER`. |
| **Ads** | Pre-roll, mid-roll cue points, overlay container. Stub creatives today; same config shape for VAST/SSAI later. |
| **Mobile API** | Next.js route handlers under `/api/*` with CORS. |

## Local

```bash
npm install
cp .env.example .env.local   # defaults to demo adapter
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo adapter (temporary scaffolding)

`LIBRARY_PROVIDER=demo` (default) reads `data/demo-catalog.json`.

Items are **Blender Open Movies** and **Google / Apple test streams** only:

- Big Buck Bunny (HLS + DASH + MP4)
- Sintel (HLS + MP4)
- Tears of Steel (HLS + MP4)
- Elephants Dream (MP4)
- Short Google samples + Apple BipBop HLS

No scraped, embedded, or unauthorized copyrighted streams.

When your library is connected, these rows go away — they are not the product.

## Connect the real library

AgmBizz needs to provide:

1. **How titles are listed** — REST API, or a JSON manifest on S3/R2/CDN
2. **Auth** — API key / bearer token, or public/signed object URLs
3. **Playback URL form** — `.m3u8` (HLS), `.mpd` (DASH), and/or `.mp4`
4. **Whether URLs expire** — if yes, `/api/playback/:id` should mint a fresh URL
5. **Posters / thumbs** — HTTPS URLs (or omit; UI uses gradients)
6. **Ad vendor** (later) — VAST/VMAP tag or SSAI; stub stays until then

### HTTP adapter

```bash
LIBRARY_PROVIDER=http
LIBRARY_API_URL=https://your-library.example
LIBRARY_AUTH_HEADER=Authorization
LIBRARY_API_KEY=Bearer <token>
# Optional if your paths differ:
LIBRARY_PATH_CATALOG=/catalog
LIBRARY_PATH_TITLE=/catalog/:id
LIBRARY_PATH_PLAYBACK=/playback/:id
LIBRARY_PATH_SEARCH=/search
```

Your API can return the AgmPlay shapes below, or arrays of `Title`.

### S3 / R2 adapter

```bash
LIBRARY_PROVIDER=s3
LIBRARY_MANIFEST_URL=https://<cdn-or-r2>/library/manifest.json
LIBRARY_PUBLIC_BASE=https://<cdn-or-r2>/library
```

Manifest:

```json
{
  "titles": [
    {
      "id": "film-1",
      "title": "Film 1",
      "type": "movie",
      "posterUrl": "https://…/poster.jpg",
      "sources": [
        { "protocol": "hls", "url": "film-1/master.m3u8" },
        { "protocol": "mp4", "url": "film-1/mezz.mp4" }
      ]
    }
  ]
}
```

`url` may be absolute or a key under `LIBRARY_PUBLIC_BASE`.

## Mobile / partner API

All routes are `GET`, CORS `*`.

| Route | Response |
| --- | --- |
| `/api/health` | `{ ok, service, provider, ads }` |
| `/api/catalog?collection=&type=&limit=&cursor=` | `{ items: Title[], nextCursor?, provider }` |
| `/api/catalog/:id` | `Title` |
| `/api/playback/:id` | `PlaybackSession` |
| `/api/search?q=` | `{ items, query, provider }` |
| `/api/ads/config` | `AdConfig` |

### `Title`

```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "type": "movie | episode | clip | live",
  "year": 2012,
  "durationSeconds": 734,
  "posterUrl": "https://…",
  "backdropUrl": "https://…",
  "tags": ["hls"],
  "collection": "featured",
  "license": "optional"
}
```

### `PlaybackSession`

```json
{
  "titleId": "big-buck-bunny",
  "title": "Big Buck Bunny",
  "preferred": "hls",
  "sources": [
    { "protocol": "hls", "url": "https://…/master.m3u8", "mimeType": "application/vnd.apple.mpegurl" },
    { "protocol": "mp4", "url": "https://…/file.mp4", "mimeType": "video/mp4", "drm": null }
  ]
}
```

The player tries `sources` in order and falls forward on error.

### `AdConfig` (stub)

```json
{
  "enabled": true,
  "provider": "stub",
  "preroll": { "enabled": true, "creative": { "type": "video", "url": "https://…mp4", "skipOffsetSeconds": 5 } },
  "midroll": { "enabled": true, "cuePoints": [{ "atPercent": 40 }], "creative": { "type": "video", "url": "https://…mp4" } },
  "overlay": { "enabled": true, "startSeconds": 12, "endSeconds": 22, "html": "<div>…</div>" }
}
```

Set `ADS_ENABLED=false` to disable the stub.

A real network later: keep this config, change `provider` to `vast` / `ssai`, and resolve creatives in `lib/ads/` without rewriting the player chrome.

## Pages

| Path | Role |
| --- | --- |
| `/` | Library home — hero + rows (empty-safe if the provider returns nothing) |
| `/browse` | Search + type filter |
| `/title/:id` | Detail, sources, Play / Resume |
| `/watch/:id` | Player + ads |
| `/login` | Mocked account shell only |

## Deploy

- **Vercel:** App Router + `/api/*`. This is the source of truth for mobile clients.
- **Static `live-demo`:** `npm run export:githack` then publish `out/` to the `live-demo` branch (HTML + assets, same commit). UI talks to `public/data/demo-catalog.json` when APIs are absent.

```bash
npm run export:githack
# publish out/ → branch live-demo
```
