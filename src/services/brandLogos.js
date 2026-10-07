/* ============================================================================
 * services/brandLogos.js — نشان برندها از روی فایل‌های روی دیسک
 * ----------------------------------------------------------------------------
 * بخش «برندها» در پایین صفحهٔ اصلی باید *نشان* نشان بدهد، نه متن. ولی
 * جدول brands ستون نشان ندارد و اضافه کردن یک ستون برای چیزی که یک
 * قرارداد نام‌گذاری حلش می‌کند، مهاجرت بی‌دلیل است.
 *
 * قرارداد: فایل داخل public/img/brands/ که نامش «اسلاگ برند» است.
 *   public/img/brands/بوش.svg  →  برندِ با اسلاگ «بوش»
 *
 * پوشه یک بار هنگام بالا آمدن خوانده می‌شود و در حافظه می‌ماند: این
 * تابع روی هر درخواست صدا زده می‌شود و خواندن دیسک به ازای هر بازدید
 * بهای بی‌دلیلی است. برای دیدن فایل تازه، سرور را دوباره راه بیندازید
 * (در حالت توسعه هر بار خوانده می‌شود، پس آنجا لازم نیست).
 *
 * ⚠️ این فایل هیچ نشانی نمی‌سازد و هیچ چیزی دانلود نمی‌کند. فقط آنچه
 *    صاحب سایت گذاشته را پیدا می‌کند. نشان خودروسازها علامت تجاری است.
 * ==========================================================================*/
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, config } from '../config/index.js';

const DIR = path.join(ROOT, 'public', 'img', 'brands');

/* ترتیب اولویت: برداری بهتر از پیکسلی، و webp سبک‌تر از png. */
const EXTENSIONS = ['.svg', '.webp', '.png', '.jpg', '.jpeg'];

let cache = null;

/** نگاشت «اسلاگ → نشانی عمومی فایل». هر خطای خواندن = نگاشت خالی. */
function readDir() {
  const map = new Map();
  let entries;
  try {
    entries = fs.readdirSync(DIR, { withFileTypes: true });
  } catch {
    return map;                 /* پوشه نیست — بخش برندها کاشی نام نشان می‌دهد */
  }

  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (!EXTENSIONS.includes(ext)) continue;        /* README.md و مانندش رد */
    const slug = path.basename(e.name, path.extname(e.name));
    const existing = map.get(slug);
    /* اگر هم svg و هم png بود، آن که در EXTENSIONS جلوتر است می‌برد. */
    if (existing && EXTENSIONS.indexOf(existing.ext) <= EXTENSIONS.indexOf(ext)) continue;
    map.set(slug, { ext, url: `/img/brands/${encodeURIComponent(e.name)}` });
  }
  return map;
}

function logoMap() {
  /* در توسعه هر بار می‌خوانیم تا فایل تازه بی‌راه‌اندازی دیده شود. */
  if (!config.isProd) return readDir();
  if (!cache) cache = readDir();
  return cache;
}

/**
 * به هر برند یک فیلد logoUrl می‌چسباند (یا null).
 *
 * ورودی را تغییر نمی‌دهد؛ آرایهٔ تازه برمی‌گرداند.
 */
export function withLogos(brands) {
  const map = logoMap();
  return (brands || []).map((b) => ({
    ...b,
    logoUrl: map.get(b.slug)?.url ?? null,
  }));
}

/** برای آزمون و تشخیص: چند نشان روی دیسک پیدا شد. */
export function logoCount() {
  return logoMap().size;
}
