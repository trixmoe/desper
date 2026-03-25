# desper

A minimal digital signage system for conference/convention screens.

Many kiosk OSes already exist, but there are very few simple browser-based digital signage systems.

## How it works

Each screen loads `index.html` and polls a JSON file regularly for updated content. When the content changes, slides are swapped in automatically. If `forcePageReload` is set within the JSON, the page hard-reloads to pick up a new `main.js`.

Slides cycle by timeout (e.g. a picture for 10 seconds) or, for video slides, when all videos have finished playing (unless the timeout is shorter). A slide can contain multiple media items displayed simultaneously.

## Content file format

An example `content.json` is provided, but you may want to understand the format and implications of any changes:

```json
{
    "formatVersion": "0",
    "lastChange": "1234567890",
    "forcePageReload": true,
    "defaultTimeout": 15,
    "slides": [
        {
            "urls": ["image.jpg", "video.mp4"],
            "timeout": 10
        }
    ]
}
```

- **`lastChange`** — any string; change it to trigger a content update on the screens (e.g. current epoch time)
- **`forcePageReload`** — if `true`, reload the page (and thus `main.js`) on loading
- **`defaultTimeout`** — fallback slide duration in seconds (default: 30)
- **`slides`** - list of all slides
  - **`urls`** — list of images (`.jpg` `.png` `.svg` `.gif`), videos (`.mp4` `.webm`), or any URL (loaded as a `iframe`)
  - **`timeout`** — seconds before advancing; `0` means wait for all videos to finish or use default timeout for pictures; `-1` disables advancing entirely (useful for iframes)

## Generating the content file automatically

`generate.sh` can generate the content JSON from a directory of media files, and is intended for use in a cronjob to keep slides up to date automatically:

```
*/5 * * * * /path/to/generate.sh /var/www/example /var/www/example.json
```

Files are grouped into slides by their numeric prefix (e.g. `01-photo.jpg` and `01-logo.png` become one slide). `.txt` files are treated as a URL for an iframe slide. The file is only updated when the slides have actually changed.

## Multiple screens

Each screen is identified by the URL anchor. `index.html#main` loads `main.json`, `index.html#side` loads `side.json`, and so on. No anchor falls back to `content.json`.

## No dependencies

No build step, no framework, no server-side logic required. Any static host/HTTP server works.

**Must be served over HTTP(s)**: JS `fetch()` does not work over `file://`. A basic server is enough:

```
python -m http.server
```
