/* ============================================================================
 * scripts/build-vehicle-images.mjs — ساخت تصاویر گالری خودرو
 * ----------------------------------------------------------------------------
 * تصاویر خودرو و تصاویر قطعه دو دستهٔ کاملا جدا هستند:
 *
 *   قطعه  → storage/products/<uuid>/<size>.{webp,jpg}   (src/services/images.js)
 *   خودرو → public/img/vehicles/<slug>.{webp,jpg}       (همین اسکریپت)
 *
 * این اسکریپت عمدا از src/services/images.js استفاده *نمی‌کند*:
 *
 *   ۱. آن سرویس خروجی را در storage/products می‌گذارد و publicUrl اش
 *      /media/products/ را هاردکد کرده (src/services/storage.js:153).
 *   ۲. شناسهٔ ورودی‌اش باید UUID باشد (assertImageId)، نه اسلاگ فارسی.
 *   ۳. واترمارک در آن با سوئیچ *سراسری* WATERMARK_ENABLED کنترل می‌شود؛
 *      خاموش‌کردنش برای خودرو، تصاویر محصول را هم بی‌واترمارک می‌کرد.
 *   ۴. نسبت آنجا ۳:۴ عمودی است و برای خودرو ۴:۳ افقی لازم است.
 *
 * پس اینجا واترمارک *هرگز* اعمال نمی‌شود و هیچ تنظیم سراسری‌ای عوض نمی‌شود.
 *
 * نسبت تصویر دست نمی‌خورد: fit:'inside' یعنی هرگز کشیده یا بریده نمی‌شود.
 * قاب ۴:۳ در CSS ساخته می‌شود و object-fit:contain تصویر را کامل نگه می‌دارد.
 *
 * اجرا:  node scripts/build-vehicle-images.mjs <پوشهٔ-منبع>
 * ========================================================================= */
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const MAX_WIDTH = 800;
const WEBP_QUALITY = 82;
const JPEG_QUALITY = 84;

/* اسلاگ‌ها دقیقا برابر vehicles.slug در پایگاه داده‌اند. نام فایل = اسلاگ،
   همان قراردادی که برای نشان برندها هم به کار می‌رود (brandLogos.js). */
const VEHICLES = [
  { slug: 'پژو-508',    source: 'peugeot-508.png' },
  { slug: 'پژو-206',    source: 'peugeot-206.jpg' },
  { slug: 'سیتروئن-c3', source: 'citroen-c3.jpg'  },
  { slug: 'پژو-ds',     source: 'ds-7.jpg'        },
];

const srcDir = process.argv[2];
if (!srcDir) {
  console.error('usage: node scripts/build-vehicle-images.mjs <source-dir>');
  process.exit(1);
}
const outDir = path.join(process.cwd(), 'public', 'img', 'vehicles');

for (const v of VEHICLES) {
  const buf = await readFile(path.join(srcDir, v.source));
  const base = sharp(buf).resize(MAX_WIDTH, null, {
    fit: 'inside',             /* نسبت حفظ می‌شود */
    withoutEnlargement: true,
  });
  const webp = await base.clone().webp({ quality: WEBP_QUALITY }).toBuffer();
  const jpeg = await base.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
  await writeFile(path.join(outDir, `${v.slug}.webp`), webp);
  await writeFile(path.join(outDir, `${v.slug}.jpg`), jpeg);
  const m = await sharp(webp).metadata();
  console.log(`${v.slug.padEnd(12)} ${m.width}x${m.height}  webp ${webp.length.toLocaleString()} B  jpg ${jpeg.length.toLocaleString()} B`);
}
