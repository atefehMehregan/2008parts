/* ============================================================================
 * services/cart.js — سبد خرید مهمان
 * ----------------------------------------------------------------------------
 * سبد در یک کوکی ساده نگه داشته می‌شود. نه حساب کاربری لازم است، نه
 * جدول تازه، نه میان‌افزار نشست، نه وابستگی تازه.
 *
 * ⚠️ قاعدهٔ اصلی این فایل:
 *
 *     در کوکی فقط «کد کالا» و «تعداد» ذخیره می‌شود. هرگز قیمت.
 *
 * قیمت در هر رندر و در هر ثبت، از پایگاه داده خوانده می‌شود. پس حتی اگر
 * کسی کوکی‌اش را دست‌کاری کند، فقط می‌تواند تعیین کند «چه چیزی و چند
 * تا» — نه «به چه قیمتی». همین‌طور افزودن کد کالای ناموجود یا غیرفعال
 * بی‌اثر است، چون تطبیق با پایگاه داده انجام می‌شود.
 *
 * کوکی امضا نمی‌شود و لازم هم نیست: محتوایش محرمانه نیست و دست‌کاری‌اش
 * فقط سبدِ خودِ همان کاربر را عوض می‌کند. امضا امنیتِ کاذب می‌داد بدون
 * اینکه چیزی اضافه کند.
 * ==========================================================================*/
import { config } from '../config/index.js';

const SKU_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** تعداد را به عدد صحیحِ داخل بازه می‌برد. هر چیز بدشکل → ۱. */
export function normalizeQty(raw) {
  const n = Number.parseInt(String(raw ?? '').trim(), 10);
  if (!Number.isInteger(n) || n < 1) return 1;
  return Math.min(n, config.cart.maxQty);
}

/** کد کالا را اعتبارسنجی می‌کند. هر چیز بدشکل → null. */
export function normalizeSku(raw) {
  const s = String(raw ?? '').trim();
  return SKU_RE.test(s) ? s : null;
}

/**
 * کوکی را به آرایهٔ [{ sku, qty }] تبدیل می‌کند.
 *
 * عمدا هیچ‌وقت پرتاب نمی‌کند: یک کوکیِ خراب نباید کل فروشگاه را برای
 * بازدیدکننده بشکند. نتیجهٔ بدشکل یعنی «سبد خالی».
 */
export function parseCartCookie(raw) {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const seen = new Set();
  const lines = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const sku = normalizeSku(item.s);
    if (!sku || seen.has(sku)) continue;       /* تکراری نادیده گرفته می‌شود */
    seen.add(sku);
    lines.push({ sku, qty: normalizeQty(item.q) });
    if (lines.length >= config.cart.maxLines) break;
  }
  return lines;
}

/** آرایه را به رشتهٔ کوکی برمی‌گرداند. کلیدها کوتاه‌اند تا کوکی کوچک بماند. */
export function serializeCart(lines) {
  return JSON.stringify(lines.map((l) => ({ s: l.sku, q: l.qty })));
}

/* ------------------------------------------------------------- عملیات سبد */

export function addLine(lines, sku, qty) {
  const next = lines.map((l) => ({ ...l }));
  const found = next.find((l) => l.sku === sku);
  if (found) {
    found.qty = normalizeQty(found.qty + qty);
    return next;
  }
  if (next.length >= config.cart.maxLines) return next;  /* سقف؛ بی‌صدا رد */
  next.push({ sku, qty: normalizeQty(qty) });
  return next;
}

export function setLineQty(lines, sku, qty) {
  const n = normalizeQty(qty);
  return lines.map((l) => (l.sku === sku ? { ...l, qty: n } : { ...l }));
}

export function removeLine(lines, sku) {
  return lines.filter((l) => l.sku !== sku).map((l) => ({ ...l }));
}

export function countItems(lines) {
  return lines.reduce((sum, l) => sum + l.qty, 0);
}

/* ------------------------------------------------------- کوکی روی پاسخ */

export function cartCookieOptions() {
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
    maxAge: config.cart.maxAgeDays * 24 * 60 * 60 * 1000,
  };
}

export function writeCart(res, lines) {
  if (lines.length === 0) {
    res.clearCookie(config.cart.cookieName, { path: '/' });
    return;
  }
  res.cookie(config.cart.cookieName, serializeCart(lines), cartCookieOptions());
}

export function readCart(req) {
  return parseCartCookie(req.cookies?.[config.cart.cookieName]);
}

/**
 * خطوط سبد را با دادهٔ *واقعی* پایگاه داده می‌آمیزد.
 *
 * این تنها جایی است که قیمت تعیین می‌شود، و منبعش همیشه پایگاه داده است.
 *
 * برمی‌گرداند:
 *   lines   — خطوط معتبر، با نام و قیمت و موجودیِ واقعی
 *   dropped — کد کالاهایی که دیگر وجود ندارند یا غیرفعال شده‌اند
 *   total   — جمع کل به تومان (فقط خطوطی که قیمت دارند)
 */
export function priceCart(cartLines, dbRows) {
  const bySku = new Map(dbRows.map((r) => [r.sku, r]));
  const lines = [];
  const dropped = [];
  let total = 0;

  for (const line of cartLines) {
    const p = bySku.get(line.sku);
    if (!p) { dropped.push(line.sku); continue; }

    /* قیمت واحد: اگر حراج واقعی ثبت شده باشد همان، وگرنه قیمت اصلی.
       همان قاعده‌ای که کارت محصول هم استفاده می‌کند. */
    const unit = (p.sale_price_toman && p.price_toman && p.sale_price_toman < p.price_toman)
      ? p.sale_price_toman
      : p.price_toman;

    /* تعداد نمی‌تواند از موجودی بیشتر باشد وقتی موجودی ردگیری می‌شود.
       قاعدهٔ موجودی عوض نمی‌شود؛ فقط همان‌که هست رعایت می‌شود. */
    const tracked = Number.isInteger(p.stock_qty) && p.stock_qty > 0;
    const qty = tracked ? Math.min(line.qty, p.stock_qty) : line.qty;
    const clamped = tracked && line.qty > p.stock_qty;

    const lineTotal = unit ? unit * qty : null;
    if (lineTotal) total += lineTotal;

    lines.push({
      sku: p.sku,
      slug: p.slug,
      name: p.name,
      brandName: p.brand_name ?? null,
      imageId: p.primary_image_id ?? null,
      unitPrice: unit ?? null,
      hasPrice: Boolean(unit),
      qty,
      requestedQty: line.qty,
      clamped,
      stockQty: p.stock_qty,
      availability: p.availability,
      lineTotal,
    });
  }

  return { lines, dropped, total };
}
