#!/usr/bin/env node
/* ============================================================================
 * scripts/import-product-images.js — وارد کردن تصویرهای تأییدشدهٔ محصول
 * ----------------------------------------------------------------------------
 * چهل تصویرِ *از پیش تأییدشده* را از دیسک محلی می‌خواند، از همان خط لولهٔ
 * موجود (sharp + واترمارک) می‌گذراند، و ردیف product_images را با منشأ و
 * وضعیت حقوقی ثبت می‌کند.
 *
 * اجرا:
 *   node scripts/import-product-images.js                 آزمایشی (پیش‌فرض)
 *   node scripts/import-product-images.js --apply         نوشتن واقعی
 *   node scripts/import-product-images.js --manifest <p>  مانیفست دیگر
 *
 * ---------------------------------------------------------------------------
 * آنچه این اسکریپت *نمی‌کند* — و هرگز نباید بکند
 *
 *   * هیچ چیزی دانلود نمی‌کند. نه http، نه https، نه fetch. مانیفست فقط
 *     مسیر فایل محلی می‌پذیرد و نشانی اینترنتی در فیلد file رد می‌شود.
 *   * خط لولهٔ تصویر دومی نمی‌سازد. processProductImage همان تابعی است که
 *     مسیر آپلود مدیر هم صدا می‌زند — یک پیاده‌سازی، یک رفتار.
 *   * اعتبارسنجی امنیتی را دور نمی‌زند. هر دو لایهٔ موجود اجرا می‌شوند:
 *     validateUploadedImage (بایت‌های ابتدایی و حجم) و inspectUploadedImage
 *     (ابعاد واقعی و سقف پیکسل).
 *   * شناسهٔ عددی محصول را به‌عنوان کلید تطبیق نمی‌پذیرد. فقط کد کالا.
 *   * تصویر موجود را جایگزین نمی‌کند و چیزی را پاک نمی‌کند.
 *   * مهاجرت اجرا نمی‌کند و رشتهٔ اتصال را چاپ نمی‌کند.
 *
 * ---------------------------------------------------------------------------
 * چرا کد کالا و نه شناسهٔ عددی؟
 *
 * شناسهٔ products به ترتیب درج بستگی دارد و بین پایگاه داده‌ها یکی نیست؛
 * یک مانیفست با شناسهٔ عددی روی پایگاه دادهٔ دیگر تصویر را به محصول
 * اشتباه می‌چسباند و هیچ خطایی هم نمی‌دهد. کد کالا (idx_products_sku
 * UNIQUE) هویت پایدار محصول است. همان تصمیمی که scripts/import-catalogue.js
 * گرفته است.
 *
 * ---------------------------------------------------------------------------
 * ترتیب «اول فایل، بعد ردیف» — و جبرانش
 *
 * بایت‌ها را نمی‌شود داخل تراکنش پایگاه داده گذاشت. پس:
 *
 *   ۱. همهٔ اعتبارسنجی‌ها پیش از هر نوشتنی انجام می‌شوند.
 *   ۲. فایل‌های هر چهل تصویر ساخته می‌شوند (اصل + هشت مشتق هرکدام).
 *   ۳. هر چهل ردیف داخل *یک* تراکنش درج می‌شوند.
 *   ۴. اگر تراکنش شکست بخورد، همهٔ فایل‌های تازه‌نوشته پاک می‌شوند.
 *
 * نتیجه: یا چهل تصویر کامل، یا هیچ — و هیچ فایل یتیمی نمی‌ماند. همان
 * منطق جبرانِ کنترلر، در مقیاس دسته‌ای.
 *
 * ---------------------------------------------------------------------------
 * بی‌اثرپذیری
 *
 * اگر *هر* کد کالایی از قبل تصویر داشته باشد، اسکریپت پیش از نوشتن متوقف
 * می‌شود و همان کدها را گزارش می‌دهد. پس اجرای دوباره هرگز تصویر تکراری
 * نمی‌سازد و هرگز تصویر موجود را بازنویسی نمی‌کند. حالت «نیمی وارد شده»
 * با تراکنش بالا ممکن نیست.
 * ==========================================================================*/
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getPool, closeDb, withTransaction } from '../src/db/index.js';
import { ROOT } from '../src/config/index.js';
import { buildStorefrontProducts } from '../src/data/storefront-catalogue.js';
import { validateUploadedImage } from '../src/middleware/security.js';
import { inspectUploadedImage, processProductImage } from '../src/services/images.js';
import { storage } from '../src/services/storage.js';
import {
  createProductImageRepository, CLEARED_RIGHTS_STATUSES, RIGHTS_STATUS,
} from '../src/db/repositories/productImages.js';
import { loadWatermark } from '../src/controllers/adminProductImagesController.js';

/* ----------------------------------------------------------------- پرچم‌ها */
const ARGV = process.argv.slice(2);
const APPLY = ARGV.includes('--apply');

/** چند تصویر برای هر کد کالا، در این مرحله. قالب مانیفست بیشتر را
    پشتیبانی می‌کند؛ این یک قاعدهٔ اعتبارسنجی است. */
export const IMAGES_PER_SKU = 1;

/** مانیفست پیش‌فرض. فایل نمونه عمدا *نام دیگری* دارد. */
const DEFAULT_MANIFEST = path.join(ROOT, 'scripts', 'data', 'product-image-manifest.js');

function manifestPath() {
  const i = ARGV.indexOf('--manifest');
  if (i === -1) return DEFAULT_MANIFEST;
  const given = ARGV[i + 1];
  if (!given || given.startsWith('--')) {
    throw new Error('پرچم --manifest به مسیر فایل نیاز دارد.');
  }
  return path.isAbsolute(given) ? given : path.join(ROOT, given);
}

/* ------------------------------------------------------- کمک‌های کوچک */

const isHttpish = (v) => /^[a-z][a-z0-9+.-]*:\/\//i.test(String(v || ''));
const trimmed = (v) => (v ?? '').toString().trim();

/** تاریخ ISO معتبر؟ برمی‌گرداند Date یا null. */
function parseDate(value) {
  const s = trimmed(value);
  if (s === '') return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/* ============================================================ اعتبارسنجی
 * همهٔ بررسی‌ها پیش از هر نوشتنی. اگر چیزی ایراد داشته باشد، نه فایلی
 * ساخته می‌شود و نه پایگاه داده لمس می‌شود.
 *
 * فهرست ایرادها برگردانده می‌شود، نه اولین ایراد: کسی که مانیفست چهل
 * قلمی را آماده می‌کند باید همهٔ مشکل‌ها را یک‌جا ببیند.
 * ========================================================================*/

/**
 * ۱. شکل مانیفست — بدون خواندن فایل و بدون زدن به پایگاه داده.
 *
 * صادر می‌شود تا آزمون بتواند قاعده‌ها را بدون پایگاه داده و بدون فایل
 * تصویر بسنجد. همین تابع است که نگهبانِ فایل نمونه را اعمال می‌کند، پس
 * باید آزمون‌پذیر باشد.
 */
export function validateManifestShape(manifest, authoritativeSkus) {
  const problems = [];
  const add = (m) => problems.push(m);

  const meta = manifest?.MANIFEST_META ?? null;
  const entries = manifest?.IMAGE_ENTRIES ?? null;

  if (!meta || typeof meta !== 'object') add('MANIFEST_META در مانیفست نیست.');
  if (!Array.isArray(entries)) {
    add('IMAGE_ENTRIES باید یک آرایه باشد.');
    return { problems, entries: [] };
  }

  /* ⚠️ نگهبان فایل نمونه. پیش از هر بررسی دیگری، و در هر دو حالت. */
  if (meta?.exampleOnly === true) {
    add('این مانیفست با exampleOnly: true علامت خورده است — فایل نمونه هرگز '
      + 'وارد نمی‌شود. یک کپی بسازید و آن کلید را بردارید.');
  }

  if (meta && meta.version !== 1) {
    add(`نسخهٔ مانیفست ${meta.version} شناخته نیست؛ این واردکننده نسخهٔ ۱ را می‌فهمد.`);
  }

  /* شمار قلم‌ها باید دقیقا با کاتالوگ معتبر بخواند. */
  if (entries.length !== authoritativeSkus.size) {
    add(`شمار قلم‌های مانیفست ${entries.length} است، نه ${authoritativeSkus.size}. `
      + 'واردکننده فقط مجموعهٔ کاملِ کاتالوگ را می‌پذیرد.');
  }

  const seen = new Map();
  entries.forEach((entry, i) => {
    const where = `قلم ${i + 1}`;
    const sku = trimmed(entry?.sku);

    if (sku === '') { add(`${where}: sku خالی است.`); return; }
    if (!authoritativeSkus.has(sku)) {
      add(`${where} (${sku}): این کد کالا در کاتالوگ معتبر نیست.`);
    }
    if (seen.has(sku)) {
      add(`${where} (${sku}): کد کالای تکراری — قلم ${seen.get(sku) + 1} هم همین است.`);
      return;
    }
    seen.set(sku, i);

    const images = entry?.images;
    if (!Array.isArray(images)) {
      add(`${where} (${sku}): images باید آرایه باشد.`);
      return;
    }
    if (images.length !== IMAGES_PER_SKU) {
      add(`${where} (${sku}): ${images.length} تصویر دارد، نه ${IMAGES_PER_SKU}. `
        + 'قالب مانیفست چند تصویر را پشتیبانی می‌کند ولی این مرحله دقیقا یکی می‌خواهد.');
      return;
    }

    images.forEach((img, j) => {
      const w = `${where} (${sku}) تصویر ${j + 1}`;

      /* --- فایل: فقط مسیر محلی --- */
      const file = trimmed(img?.file);
      if (file === '') add(`${w}: file خالی است.`);
      else if (isHttpish(file)) {
        add(`${w}: file نشانی اینترنتی است. این واردکننده هیچ چیزی دانلود نمی‌کند؛ `
          + 'فقط مسیر فایل محلی می‌پذیرد.');
      }

      /* --- متن جایگزین: اجباری، چون تنها راه دسترس‌پذیری تصویر است --- */
      if (trimmed(img?.altText) === '') add(`${w}: altText اجباری است.`);
      else if (trimmed(img.altText).length > 300) add(`${w}: altText بیش از ۳۰۰ نویسه است.`);

      /* --- منشأ --- */
      if (trimmed(img?.sourceName) === '') add(`${w}: sourceName اجباری است.`);
      if (trimmed(img?.sourceUrl) === '' && trimmed(img?.sourceRef) === '') {
        add(`${w}: دست‌کم یکی از sourceUrl یا sourceRef لازم است.`);
      }

      /* --- وضعیت حقوقی --- */
      const rights = trimmed(img?.rightsStatus);
      const known = Object.values(RIGHTS_STATUS);
      if (!known.includes(rights)) {
        add(`${w}: rightsStatus «${rights}» شناخته نیست. مقدارهای مجاز: ${known.join(', ')}`);
      } else if (!CLEARED_RIGHTS_STATUSES.includes(rights)) {
        /* not_cleared در آزمایشی هم ایراد است: مانیفستی که تصویر
           پاک‌سازی‌نشده دارد آمادهٔ وارد شدن نیست و بهتر است همین حالا
           معلوم شود، نه در لحظهٔ --apply. */
        add(`${w}: rightsStatus برابر «${rights}» است. تصویر پاک‌سازی‌نشده وارد نمی‌شود؛ `
          + `یکی از ${CLEARED_RIGHTS_STATUSES.join(', ')} لازم است.`);
      }

      /* --- تأیید: باید با وضعیت حقوقی بخواند (همان قید مهاجرت ۰۰۴) --- */
      if (CLEARED_RIGHTS_STATUSES.includes(rights)) {
        if (parseDate(img?.approvedAt) === null) {
          add(`${w}: approvedAt برای تصویر پاک‌سازی‌شده اجباری و باید تاریخ معتبر باشد.`);
        }
      } else if (trimmed(img?.approvedAt) !== '' || img?.approvedBy != null) {
        add(`${w}: تصویر پاک‌سازی‌نشده نمی‌تواند approvedAt یا approvedBy داشته باشد.`);
      }

      if (img?.approvedBy != null && !/^\d{1,15}$/.test(String(img.approvedBy))) {
        add(`${w}: approvedBy باید شناسهٔ عددی admin_users یا null باشد.`);
      }

      if (img?.isPrimary !== true && IMAGES_PER_SKU === 1) {
        add(`${w}: در مجموعهٔ تک‌تصویری، isPrimary باید true باشد.`);
      }
    });
  });

  /* کد کالاهایی که در کاتالوگ هستند ولی در مانیفست نیستند. */
  for (const sku of authoritativeSkus) {
    if (!seen.has(sku)) add(`کد کالای ${sku} در مانیفست نیست.`);
  }

  return { problems, entries };
}

/** ۲. فایل‌ها — وجود، خوانا بودن، و هر دو لایهٔ اعتبارسنجی موجود. */
async function validateFiles(entries) {
  const problems = [];
  const prepared = [];

  for (const entry of entries) {
    for (const [j, img] of (entry.images ?? []).entries()) {
      const w = `${entry.sku} تصویر ${j + 1}`;
      const file = trimmed(img?.file);
      if (file === '' || isHttpish(file)) continue;   // در لایهٔ شکل گزارش شد

      const abs = path.isAbsolute(file) ? file : path.join(ROOT, file);

      let buffer;
      try {
        const st = await fs.stat(abs);
        if (!st.isFile()) { problems.push(`${w}: «${file}» فایل نیست.`); continue; }
        buffer = await fs.readFile(abs);
      } catch (err) {
        problems.push(`${w}: «${file}» خوانده نشد (${err.code || err.message}).`);
        continue;
      }

      /* لایهٔ ۱ — حجم و بایت‌های ابتدایی. همان تابع مسیر آپلود مدیر. */
      const basic = validateUploadedImage(buffer);
      if (!basic.ok) { problems.push(`${w}: ${basic.message}`); continue; }

      /* لایهٔ ۲ — ابعاد واقعی و سقف پیکسل. */
      const inspected = await inspectUploadedImage(buffer);
      if (!inspected.ok) { problems.push(`${w}: ${inspected.message}`); continue; }

      prepared.push({
        sku: entry.sku,
        absolutePath: abs,
        relativePath: file,
        bytes: buffer.length,
        mime: basic.mime,
        meta: inspected.meta,
        /* بافر نگه داشته نمی‌شود: چهل تصویر ۵ مگابایتی در حافظه بی‌دلیل
           است. در گام نوشتن دوباره از دیسک خوانده می‌شود. */
        image: {
          altText: trimmed(img.altText),
          sourceName: trimmed(img.sourceName),
          sourceUrl: trimmed(img.sourceUrl) || null,
          sourceRef: trimmed(img.sourceRef) || null,
          rightsStatus: trimmed(img.rightsStatus),
          rightsNote: trimmed(img.rightsNote) || null,
          approvedAt: parseDate(img.approvedAt),
          approvedBy: img.approvedBy == null ? null : Number(img.approvedBy),
          isPrimary: img.isPrimary === true,
        },
      });
    }
  }

  return { problems, prepared };
}

/** ۳. پایگاه داده — کد کالا باید باشد، و نباید از قبل تصویر داشته باشد. */
async function validateAgainstDatabase(prepared) {
  const problems = [];
  const resolved = [];
  const pool = getPool();

  for (const item of prepared) {
    /* بدون فیلتر is_active: محصول غیرفعال هم محصول است و تصویرش باید
       بتواند وارد شود. همان دلیلی که import-catalogue.js دارد. */
    const found = await pool.query(
      'SELECT id, name FROM products WHERE sku = $1 LIMIT 1', [item.sku]);
    if (found.rows.length === 0) {
      problems.push(`${item.sku}: محصولی با این کد کالا در پایگاه داده نیست.`);
      continue;
    }
    const product = found.rows[0];

    const existing = await pool.query(
      'SELECT COUNT(*)::int AS n FROM product_images WHERE product_id = $1', [product.id]);
    if (existing.rows[0].n > 0) {
      problems.push(`${item.sku}: از قبل ${existing.rows[0].n} تصویر دارد. `
        + 'واردکننده تصویر موجود را جایگزین نمی‌کند — یا مانیفست را کوتاه کنید '
        + 'یا تصویر موجود را از پنل مدیر حذف کنید.');
      continue;
    }

    /* تأییدکننده، اگر اعلام شده، باید واقعا وجود داشته باشد. */
    if (item.image.approvedBy !== null) {
      const admin = await pool.query(
        'SELECT 1 FROM admin_users WHERE id = $1 LIMIT 1', [item.image.approvedBy]);
      if (admin.rows.length === 0) {
        problems.push(`${item.sku}: approvedBy = ${item.image.approvedBy} در admin_users نیست.`);
        continue;
      }
    }

    resolved.push({ ...item, productId: product.id, productName: product.name });
  }

  return { problems, resolved };
}

/* ================================================================ نوشتن */

/**
 * گام نوشتن: اول فایل‌ها، بعد یک تراکنش برای همهٔ ردیف‌ها.
 * اگر تراکنش شکست بخورد، فایل‌های تازه پاک می‌شوند.
 */
async function applyImport(resolved) {
  const watermark = await loadWatermark();
  const written = [];

  try {
    /* --- گام ۱: بایت‌ها. همان خط لولهٔ موجود، بدون هیچ تغییری. --- */
    for (const item of resolved) {
      const buffer = await fs.readFile(item.absolutePath);
      const processed = await processProductImage(buffer, { watermark, storage });
      written.push({ ...item, imageId: processed.id, derivatives: processed.derivatives.length });
      console.log(`  پردازش شد: ${item.sku} → ${processed.id} (${processed.derivatives.length} اندازه)`);
    }

    /* --- گام ۲: ردیف‌ها، همه در یک تراکنش. --- */
    await withTransaction(async (client) => {
      const repo = createProductImageRepository(client);
      for (const item of written) {
        await repo.add({
          productId: item.productId,
          imageId: item.imageId,
          altText: item.image.altText,
          width: item.meta.width,
          height: item.meta.height,
          sortOrder: 0,
          isPrimary: item.image.isPrimary,
          sourceName: item.image.sourceName,
          sourceUrl: item.image.sourceUrl,
          sourceRef: item.image.sourceRef,
          rightsStatus: item.image.rightsStatus,
          rightsNote: item.image.rightsNote,
          approvedBy: item.image.approvedBy,
          approvedAt: item.image.approvedAt,
        });
      }
    });

    return written;
  } catch (err) {
    /* جبران: هر فایلی که در این اجرا نوشته شده پاک می‌شود. فقط همین‌ها —
       هیچ نظافت فراگیری روی پوشهٔ storage انجام نمی‌شود. */
    console.error(`\n  شکست: ${err.message}`);
    if (written.length) {
      console.error(`  پاک کردن ${written.length} تصویرِ نیمه‌کاره…`);
      for (const item of written) {
        await storage.removeImage(item.imageId).catch((e) =>
          console.error(`    فایل یتیم ماند: ${item.imageId} (${e.message})`));
      }
    }
    throw err;
  }
}

/* ----------------------------------------------------------------- اجرا */

async function main() {
  const authoritative = buildStorefrontProducts();
  const authoritativeSkus = new Set(authoritative.map((p) => p.sku));

  console.log('=== کاتالوگ معتبر ===');
  console.log(`  منبع: src/data/storefront-catalogue.js`);
  console.log(`  کد کالا: ${authoritativeSkus.size}`);

  const mPath = manifestPath();
  console.log('\n=== مانیفست ===');
  console.log(`  فایل: ${path.relative(ROOT, mPath)}`);

  let manifest;
  try {
    manifest = await import(pathToFileURL(mPath).href);
  } catch (err) {
    console.error(`  مانیفست بار نشد: ${err.code === 'ERR_MODULE_NOT_FOUND' ? 'فایل نیست' : err.message}`);
    console.error('\n  مانیفست واقعی وجود ندارد. برای ساختنش:');
    console.error('    cp scripts/data/product-image-manifest.example.js \\');
    console.error('       scripts/data/product-image-manifest.js');
    console.error('  سپس exampleOnly را بردارید و چهل قلم واقعی را بنویسید.');
    console.error('\n  هیچ چیز نوشته نشد.');
    process.exitCode = 1;
    return;
  }

  const problems = [];

  /* --- لایهٔ ۱: شکل --- */
  const shape = validateManifestShape(manifest, authoritativeSkus);
  problems.push(...shape.problems);
  console.log(`  قلم‌ها: ${Array.isArray(shape.entries) ? shape.entries.length : 0}`);

  /* --- لایهٔ ۲: فایل‌ها. حتی اگر شکل ایراد دارد اجرا می‌شود تا گزارش
         کامل باشد؛ فقط قلم‌های بی‌مسیر رد می‌شوند. --- */
  console.log('\n=== اعتبارسنجی فایل‌ها ===');
  const files = await validateFiles(shape.entries);
  problems.push(...files.problems);
  console.log(`  فایل سالم: ${files.prepared.length}`);

  /* --- لایهٔ ۳: پایگاه داده. فقط خواندن. --- */
  console.log('\n=== بررسی پایگاه داده (فقط خواندن) ===');
  let resolved = [];
  if (files.prepared.length) {
    const dbCheck = await validateAgainstDatabase(files.prepared);
    problems.push(...dbCheck.problems);
    resolved = dbCheck.resolved;
    console.log(`  محصول آمادهٔ وارد شدن: ${resolved.length}`);
  } else {
    console.log('  رد شد: هیچ فایل سالمی برای بررسی نیست.');
  }

  /* --- داوری --- */
  console.log('\n=== نتیجهٔ اعتبارسنجی ===');
  if (problems.length) {
    console.error(`  ${problems.length} ایراد:`);
    problems.forEach((p) => console.error('    • ' + p));
  } else {
    console.log('  همهٔ بررسی‌ها سالم');
  }

  const complete = resolved.length === authoritativeSkus.size;
  if (!complete) {
    console.error(`\n  مجموعه کامل نیست: ${resolved.length} از ${authoritativeSkus.size}.`);
  }

  if (problems.length || !complete) {
    console.error('\n=== متوقف شد ===');
    console.error('  هیچ ردیفی درج نشد و هیچ فایلی ساخته نشد.');
    if (APPLY) console.error('  --apply فقط با مجموعهٔ کاملِ چهل تصویرِ تأییدشده اجرا می‌شود.');
    process.exitCode = 1;
    return;
  }

  if (!APPLY) {
    console.log('\n=== اجرای آزمایشی ===');
    console.log(`  ${resolved.length} تصویر آمادهٔ وارد شدن است.`);
    for (const item of resolved) {
      const mb = (item.bytes / (1024 * 1024)).toFixed(2);
      console.log(`    ${item.sku} ← ${item.relativePath} `
        + `(${item.meta.width}×${item.meta.height}، ${mb}MB، ${item.image.rightsStatus})`);
    }
    console.log('\n  هیچ چیز نوشته نشد. برای نوشتن واقعی:');
    console.log('    node scripts/import-product-images.js --apply');
    return;
  }

  console.log('\n=== وارد کردن ===');
  const written = await applyImport(resolved);
  console.log(`\n  ${written.length} تصویر وارد شد.`);
  console.log('  هیچ تصویر موجودی جایگزین یا پاک نشد.');
}

/* همان نگهبان اجرای مستقیمِ src/db/migrate.js: مقایسه روی نشانی فایل، نه
   مسیر سیستم‌عامل — تا روی ویندوز هم درست کار کند. */
const isDirectRun = Boolean(process.argv[1])
  && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  try {
    await main();
  } catch (err) {
    console.error('[import-product-images] خطا:', err.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}
