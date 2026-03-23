# desper

A minimal digital signage system for conference/convention screens.

Many kiosk OSes already exist, but there are very few simple browser-based digital signage systems.

## How it works

Each screen loads `index.html` and polls a JSON file regularly for updated content. When the content changes, slides are swapped in automatically. If `forcePageReload` is set within the JSON, the page hard-reloads to pick up a new `main.js`.

Slides cycle by timeout (e.g. a picture for 10 seconds) or, for video slides, when all videos have finished playing (unless the timeout is shorter). A slide can contain multiple media items displayed simultaneously.

## Content file format (example)

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

- **`lastChange`** — any string; change it to trigger a content update on the screens (ideally Epoch time)
- **`forcePageReload`** — if `true`, reload the page (and thus `main.js`) on loading
- **`defaultTimeout`** — fallback slide duration in seconds
- **`timeout`** — seconds before advancing; `0` means wait for all videos to finish or default timeout for pictures
- **`urls`** — list of images (`.jpg` `.png` `.svg` `.gif`) or videos (`.mp4` `.webm`)

## Multiple screens

In the future, different screens will load different content files based on their URL, allowing each screen in a venue to be controlled independently from the same deployment.

## No dependencies

No build step, no framework, no server-side logic required. Drop the files on any static host.
