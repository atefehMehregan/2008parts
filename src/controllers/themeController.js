/* ============================================================================
 * controllers/themeController.js — انتخاب پوستهٔ روشن/تاریک
 * ----------------------------------------------------------------------------
 * چرا کوکی و نه localStorage؟
 *
 *   این سایت هیچ جاوااسکریپتی در مرورگر اجرا نمی‌کند و CSP هم
 *   script-src 'self' است. localStorage فقط با اسکریپت خوانده می‌شود و
 *   سرور آن را نمی‌بیند؛ یعنی صفحه ناچار اول با پوستهٔ پیش‌فرض رندر
 *   می‌شود و بعد اسکریپت آن را عوض می‌کند — همان «پرشِ پوسته» که نباید
 *   بیفتد. تنها راهِ بی‌پرش، اسکریپتِ مسدودکنندهٔ درون‌خطی است که CSP
 *   اجازه‌اش را نمی‌دهد.
 *
 *   با کوکی، *سرور* پیش از ارسال اولین بایت می‌داند کاربر چه خواسته و
 *   همان را رندر می‌کند. پرش از نظر ساختاری ممکن نیست، و صفر بایت
 *   جاوااسکریپت اضافه می‌شود.
 *
 * سه حالت:
 *   auto   — کوکی ندارد؛ CSS با prefers-color-scheme از سیستم پیروی می‌کند
 *   light  — انتخاب صریح کاربر
 *   dark   — انتخاب صریح کاربر
 *
 * انتخاب صریح همیشه بر ترجیح سیستم مقدم است، چون روی <html> می‌نشیند و
 * قاعده‌های data-theme از قاعده‌های media تبعیت نمی‌کنند — ترتیب در
 * base.css طوری چیده شده که صریح برنده شود.
 * ==========================================================================*/
import { config, THEMES } from '../config/index.js';

const CHOOSABLE = ['light', 'dark', 'auto'];

function cookieOptions() {
  return {
    httpOnly: true,          /* هیچ اسکریپتی لازمش ندارد */
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
    maxAge: config.themeCookie.maxAgeDays * 24 * 60 * 60 * 1000,
  };
}

/**
 * پوستهٔ مؤثر برای این درخواست.
 * اولویت: کوکی کاربر → پیش‌فرض سایت (config.theme) → auto
 */
export function resolveTheme(req) {
  const raw = String(req.cookies?.[config.themeCookie.name] || '').trim().toLowerCase();
  if (CHOOSABLE.includes(raw)) return raw;
  return THEMES.includes(config.theme) ? config.theme : 'auto';
}

/** میان‌افزار: پوسته را روی res.locals می‌گذارد تا قالب بسازدش. */
export function themeLocals(req, res, next) {
  const theme = resolveTheme(req);
  res.locals.theme = theme;
  /* قالب برای صفت data-theme فقط انتخابِ صریح را می‌خواهد؛ در حالت auto
     هیچ صفتی نباید روی <html> بنشیند وگرنه قاعدهٔ
     :root:not([data-theme="light"]) هم می‌شکند. */
  res.locals.themeAttr = theme === 'auto' ? '' : theme;
  return next();
}

/**
 * POST /theme — { mode, returnTo }
 *
 * POST است و نه GET: حالت را عوض می‌کند، و یک پیوند GET را مرورگر یا
 * خزندهٔ موتور جست‌وجو ممکن است از پیش بارگیری کند و پوستهٔ کاربر را
 * بی‌اجازه برگرداند.
 */
export function setTheme(req, res) {
  const mode = String(req.body?.mode || '').trim().toLowerCase();

  if (mode === 'auto') {
    res.clearCookie(config.themeCookie.name, { path: '/' });
  } else if (mode === 'light' || mode === 'dark') {
    res.cookie(config.themeCookie.name, mode, cookieOptions());
  }
  /* هر مقدار دیگری بی‌صدا نادیده گرفته می‌شود؛ کوکی دست‌نخورده می‌ماند. */

  return res.redirect(303, safeReturnTo(req.body?.returnTo));
}

/**
 * مقصد بازگشت را از ورودی کاربر می‌گیرد ولی فقط مسیرِ داخلی می‌پذیرد.
 *
 * ⚠️ بدون این بررسی، فیلد returnTo یک open-redirect تمام‌عیار بود:
 * «//evil.example» و «https://evil.example» هر دو مرورگر را به بیرون
 * می‌بردند. فقط رشته‌ای که با یک اسلش شروع شود و دومی اسلش یا بک‌اسلش
 * نباشد قبول است.
 */
export function safeReturnTo(raw) {
  const v = String(raw || '');
  if (!v.startsWith('/')) return '/';
  if (v.startsWith('//') || v.startsWith('/\\')) return '/';
  if (v.includes('\n') || v.includes('\r')) return '/';
  return v;
}
