# Adding photos to the site

Photos of Tom in action go in `images/action/`, headshots go in `images/headshots/`. Action photos that are used on the site are sorted into a sub-folder by what the photo actually shows — `back/`, `neck/`, `shoulder/`, `nerve/`, `joints/`, `room/` — and given a plain-English name, e.g. `images/action/neck/neck-adjustment.jpg`. Photos still loose in `images/action/` are the ones not yet used anywhere. Whichever folder they go in, every photo on the site is resized and compressed the same way before it's added, so pages load quickly and nothing looks out of place next to the others.

## The easy way: run the script

From the project folder, in Terminal:

```
images/resize.sh action ~/Desktop/new-photo.jpg
```

Use `headshots` instead of `action` if that's what the photo is. You can also do several at once:

```
images/resize.sh action ~/Desktop/photo1.jpg ~/Desktop/photo2.jpg
```

It'll print something like:

```
new-photo.jpg: 6.1M -> 178K  (saved to images/action/)
```

That's it — the photo is now in the right folder, at the right size, ready to use on a page. Your original photo is untouched; the script only ever writes a new, smaller copy.

## What "resized the same way" actually means

- **1600 pixels on the longest side.** Camera and phone photos are usually 4000–6000 pixels, which is much bigger than any photo appears on the site — that just makes the page slower to load for no visible benefit. 1600px is sharp on any screen at the sizes photos actually appear.
- **JPEG format, quality 80.** Small file size, no visible loss of quality on screen.

If you ever need to do this by hand instead of running the script (e.g. resize.sh isn't working), the equivalent Mac Terminal command for a single photo is:

```
sips -Z 1600 -s format jpeg -s formatOptions 80 your-photo.jpg
```

`-Z 1600` means "shrink so the longest side is 1600px" — `sips` never stretches a smaller photo up, so it's safe to run on anything.

## Using a photo on the site

Once a photo is in `images/action/` or `images/headshots/`, add it to a page with a normal image tag, e.g.:

```html
<img src="images/action/new-photo.jpg" alt="Tom performing an adjustment">
```

(From a page inside `conditions/`, the path needs `../` in front: `../images/action/new-photo.jpg`.)

Always write a real `alt` description of what's actually happening in that specific photo — not the name of whatever condition the page is about. A generic photo of an adjustment shouldn't be labelled "treating sciatica" just because it happens to sit on the sciatica page.

## A note on phone photos

If a photo comes from a phone rather than a proper camera, it may have your location saved inside it (GPS metadata). Camera shoots normally don't have this, so it's mostly a phone-photo thing to check before sending a photo along or uploading it anywhere.
