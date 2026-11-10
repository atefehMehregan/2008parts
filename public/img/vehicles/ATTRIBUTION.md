# Vehicle photograph attribution

Photographs used by the homepage vehicle gallery (`#vehicles` in `src/views/pages/home.njk`).

**Retrieved:** 2026-11-09 · **Source:** Wikimedia Commons

These are **vehicle** photographs. They are a separate asset category from spare-part
photographs, which live in `storage/products/<uuid>/` and are served from `/media/products/`.
A vehicle photograph must never be used as a product image or as a fallback for a missing
product image — see `src/views/partials/media-placeholder.njk` for the product fallback.

| Local file | Vehicle record (`vehicles.slug`) | Vehicle shown | Author | License |
|---|---|---|---|---|
| `پژو-508.webp` / `.jpg` | `پژو-508` | Peugeot 508 (first generation, facelift) | DieselFordMondeo | CC BY-SA 4.0 |
| `پژو-206.webp` / `.jpg` | `پژو-206` | Peugeot 206 five-door hatchback | Cutlass | CC0 1.0 |
| `سیتروئن-c3.webp` / `.jpg` | `سیتروئن-c3` | Citroën C3 (third generation) | Cutlass | CC0 1.0 |
| `پژو-ds.webp` / `.jpg` | `پژو-ds` | **DS 7 Crossback** — see the note below | Vauxford | CC BY-SA 4.0 |

## Exact sources

**`پژو-508`** — `2018 Peugeot 508 Allure - 2.0 BlueHDi Diesel (150PS) Manual - 2025-04-05, Front Left.png`
<https://commons.wikimedia.org/wiki/File:2018_Peugeot_508_Allure_-_2.0_BlueHDi_Diesel_(150PS)_Manual_-_2025-04-05,_Front_Left.png>
Author: DieselFordMondeo · CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0> · source 3553 × 1698

**`پژو-206`** — `2001 Peugeot 206 in Amazonian Green, front left, 06-11-2025.jpg`
<https://commons.wikimedia.org/wiki/File:2001_Peugeot_206_in_Amazonian_Green,_front_left,_06-11-2025.jpg>
Author: Cutlass · CC0 1.0 <http://creativecommons.org/publicdomain/zero/1.0/deed.en> · source 3140 × 1748

**`سیتروئن-c3`** — `2019 Citroën C3 in Cumulus Grey, front left, 06-08-2025.jpg`
<https://commons.wikimedia.org/wiki/File:2019_Citro%C3%ABn_C3_in_Cumulus_Grey,_front_left,_06-08-2025.jpg>
Author: Cutlass · CC0 1.0 <http://creativecommons.org/publicdomain/zero/1.0/deed.en> · source 3344 × 1828

**`پژو-ds`** — `2018 DS 7 Crossback PERFORMANCE Line PureTech 1.6 Front.jpg`
<https://commons.wikimedia.org/wiki/File:2018_DS_7_Crossback_PERFORMANCE_Line_PureTech_1.6_Front.jpg>
Author: Vauxford · CC BY-SA 4.0 <https://creativecommons.org/licenses/by-sa/4.0> · source 4845 × 2620

## ⚠️ What the DS photograph does and does not claim

The database record `id=3` stores `make='پژو'`, `model='DS'`, `display_name='DS'` and
`generation = NULL`. **It does not identify a DS model or generation.**

The photograph above shows a **DS 7 Crossback**. It was chosen only because it is a clearly
recognisable DS Automobiles vehicle suitable for a visual gallery. It is **not** a statement
that the store's `DS` record refers to the DS 7 Crossback, and it is **not** evidence of that
vehicle's generation. The database record was not changed.

If the store owner confirms which DS model the record means, this photograph should be
replaced with one of that model.

## Licence obligations

- **CC0 1.0** (`پژو-206`, `سیتروئن-c3`) places the work in the public domain. No attribution is
  legally required; the author is credited here anyway.
- **CC BY-SA 4.0** (`پژو-508`, `پژو-ds`) **does** require attribution and share-alike. Credit the
  author and the licence wherever the image is displayed publicly, and keep this file with the
  assets. Neither photograph carries any additional restriction on its Commons page.
- No photograph here carries a watermark, promotional text, dealership branding, or any
  unrelated mark. Each was opened and visually checked before use.

## How these files were produced

`node scripts/build-vehicle-images.mjs <source-dir>`

- Resized to a maximum width of **800 px** with `fit: 'inside'`, so the original proportions are
  preserved — nothing is stretched and nothing is cropped.
- Written as WebP (quality 82) with a JPEG (quality 84, mozjpeg) fallback, matching the quality
  settings the project uses for product images.
- **No watermark is applied**, and the global `WATERMARK_ENABLED` setting used by the product
  pipeline was not changed. The vehicle script never loads it.

Output sizes: `پژو-508` 800 × 383 · `پژو-206` 800 × 445 · `سیتروئن-c3` 800 × 438 · `پژو-ds` 800 × 433.

The 4:3 card frame is created in CSS (`.vehicle-card`), not baked into the files, and
`object-fit: contain` keeps every vehicle fully visible inside it.

## Consistency note

All four are exterior three-quarter views in daylight. They are not a matched set: the three
Peugeot/Citroën cars face left in frame while the DS 7 faces right, and the backgrounds differ
(foliage, a brick street, a suburban street, a car park). Commons did not offer a single
photographer covering all four models in one style. If a uniform set matters, these should be
replaced by commissioned or studio photographs.
