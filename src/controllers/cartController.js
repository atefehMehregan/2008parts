/* ============================================================================
 * controllers/cartController.js — سبد خرید مهمان
 * ----------------------------------------------------------------------------
 * الگوی بقیهٔ کنترلرها: مخزن‌ها از بیرون تزریق می‌شوند.
 *
 * قاعده‌های امنیتی این فایل:
 *
 *   * قیمت هرگز از مرورگر خوانده نمی‌شود. هر بار از پایگاه داده
 *     (findManyBySkus) می‌آید.
 *   * کد کالا و تعداد سمت سرور اعتبارسنجی می‌شوند؛ هر چیز بدشکل رد یا
 *     اصلاح می‌شود، نه اینکه به کوئری برود.
 *   * همهٔ مسیرهای تغییردهنده POST‌اند و پشت requireCsrf می‌نشینند.
 *   * بعد از هر POST یک redirect می‌آید (الگوی PRG)، پس تازه‌کردن صفحه
 *     دوباره همان کار را انجام نمی‌دهد.
 *   * مقصد redirect ثابت است و از ورودی کاربر ساخته نمی‌شود، پس
 *     open-redirect ممکن نیست.
 * ==========================================================================*/
import {
  readCart, writeCart, addLine, setLineQty, removeLine,
  normalizeSku, normalizeQty, priceCart, countItems,
} from '../services/cart.js';
import { config } from '../config/index.js';

export function createCartController({ products }) {
  /** خطوط سبد را با دادهٔ واقعی پایگاه داده می‌آمیزد. */
  async function load(req) {
    const raw = readCart(req);
    if (raw.length === 0) return { raw, lines: [], dropped: [], total: 0 };
    const rows = await products.findManyBySkus(raw.map((l) => l.sku));
    return { raw, ...priceCart(raw, rows) };
  }

  /** GET /cart */
  async function index(req, res, next) {
    try {
      const { raw, lines, dropped, total } = await load(req);

      /* کوکی با حقیقتِ پایگاه داده همگام می‌شود:
       *
       *   * کالایی که دیگر در کاتالوگ نیست حذف می‌شود، وگرنه هر بار
       *     دوباره پیام «برداشته شد» نشان داده می‌شود.
       *   * تعدادی که از موجودی بیشتر بوده، به موجودی کاهش می‌یابد.
       *
       * بند دوم فقط زیبایی‌شناسی نیست: پیش از این کاهش فقط در *نمایش*
       * اعمال می‌شد و کوکی عدد اصلی را نگه می‌داشت، پس نشان سبد در هدر
       * (که کوکی را می‌شمارد) عددی بزرگ‌تر از خودِ صفحهٔ سبد نشان
       * می‌داد — ۹ در برابر ۵. حالا هر دو یک عدد را می‌گویند. */
      const corrected = lines.map((l) => ({ sku: l.sku, qty: l.qty }));
      const changed = dropped.length > 0
        || corrected.length !== raw.length
        || corrected.some((c, i) => raw[i]?.sku !== c.sku || raw[i]?.qty !== c.qty);
      if (changed) {
        writeCart(res, corrected);
        /* هدر در همین پاسخ رندر می‌شود، پس شمارش هم باید همین‌جا
           اصلاح شود — نه در درخواست بعدی. */
        res.locals.cartCount = corrected.reduce((sum, l) => sum + l.qty, 0);
      }

      res.render('pages/cart', {
        title: 'سبد خرید',
        metaDescription: 'سبد خرید ۲۰۰۸پارتس.',
        lines,
        dropped,
        total,
        itemCount: lines.reduce((s, l) => s + l.qty, 0),
        isEmpty: lines.length === 0,
        seller: {
          mobile: config.contact.mobile,
          mobileTel: config.contact.mobileTel,
          phone: config.contact.phone,
          phoneTel: config.contact.phoneTel,
          whatsapp: config.contact.whatsapp,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /** POST /cart/add — { sku, qty } */
  async function add(req, res, next) {
    try {
      const sku = normalizeSku(req.body?.sku);
      if (!sku) return res.redirect(303, '/cart');

      /* وجود و فعال بودن کالا سمت سرور بررسی می‌شود. کد کالای ساختگی
         هیچ‌وقت وارد سبد نمی‌شود. */
      const rows = await products.findManyBySkus([sku]);
      if (rows.length === 0) return res.redirect(303, '/cart');

      const qty = normalizeQty(req.body?.qty ?? 1);
      writeCart(res, addLine(readCart(req), sku, qty));
      return res.redirect(303, '/cart');
    } catch (err) {
      next(err);
    }
  }

  /** POST /cart/update — { sku, qty } */
  async function update(req, res, next) {
    try {
      const sku = normalizeSku(req.body?.sku);
      if (!sku) return res.redirect(303, '/cart');

      const qty = normalizeQty(req.body?.qty);
      /* تعداد صفر یعنی حذف — همان رفتاری که کاربر انتظار دارد. */
      const raw = Number.parseInt(String(req.body?.qty ?? '').trim(), 10);
      const lines = (Number.isInteger(raw) && raw <= 0)
        ? removeLine(readCart(req), sku)
        : setLineQty(readCart(req), sku, qty);

      writeCart(res, lines);
      return res.redirect(303, '/cart');
    } catch (err) {
      next(err);
    }
  }

  /** POST /cart/remove — { sku } */
  async function remove(req, res, next) {
    try {
      const sku = normalizeSku(req.body?.sku);
      if (sku) writeCart(res, removeLine(readCart(req), sku));
      return res.redirect(303, '/cart');
    } catch (err) {
      next(err);
    }
  }

  return { index, add, update, remove };
}

/**
 * شمار سبد برای هدر — روی همهٔ صفحه‌ها لازم است.
 *
 * عمدا به پایگاه داده نمی‌زند: فقط کوکی را می‌شمارد. هدر روی هر درخواست
 * رندر می‌شود و یک کوئری اضافه به ازای هر صفحه بهای سنگینی برای یک عدد
 * است. عددِ دقیقِ معتبر در خودِ صفحهٔ سبد محاسبه می‌شود، جایی که
 * کالاهای حذف‌شده از کاتالوگ هم کنار گذاشته می‌شوند.
 */
export function cartCount(req, res, next) {
  try {
    res.locals.cartCount = countItems(readCart(req));
  } catch {
    res.locals.cartCount = 0;
  }
  next();
}
