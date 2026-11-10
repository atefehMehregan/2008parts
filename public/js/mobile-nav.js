/* ============================================================================
 * mobile-nav.js — منوی همبرگری هدر
 * ----------------------------------------------------------------------------
 * چرا اصلا جاوااسکریپت؟
 *
 *   <details>/<summary> بومی است و جای دیگرِ همین پروژه (نوار پالایش) از
 *   آن استفاده می‌شود، ولی سه چیزِ خواسته‌شده را نمی‌دهد: بستن با Escape،
 *   بستن با لمسِ بیرون، و aria-expanded. پس اینجا یک دکمهٔ واقعی با
 *   وضعیت صریح نوشته شده، نه تقلیدِ ناقصِ <details>.
 *
 * قرارداد پیشرفتِ تدریجی:
 *
 *   تا وقتی این فایل اجرا نشده، <html> نشانهٔ data-nav-js ندارد؛ CSS هم
 *   همهٔ قاعده‌های همبرگر را پشت همان نشانه گذاشته. یعنی بدون
 *   جاوااسکریپت هدر همان سه‌ردیفهٔ قبلی است و هر پنج پیوند خودرو باز
 *   می‌مانند. ناوبری هرگز به اجرای این فایل گره نمی‌خورد.
 *
 * یک فهرست، نه دو تا:
 *
 *   این اسکریپت هیچ نسخهٔ دومی از ناوبری نمی‌سازد. همان <nav> که روی
 *   دسکتاپ یک ردیف است، روی موبایل پنل می‌شود. پس «ناوبری تکراری» ممکن
 *   نیست و هیچ مقصدی جا نمی‌ماند.
 *
 * CSP: فایل جداست و با <script src> بار می‌شود، چون سیاست سایت
 * script-src 'self' است و inline اجازه ندارد.
 * ========================================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  var toggle = document.querySelector('.nav-toggle');
  var panel = document.getElementById('site-nav-panel');

  /* هدری بدون ناوبری (مثلا وقتی هیچ خودرویی ثبت نشده) کاری لازم ندارد. */
  if (!toggle || !panel) return;

  var LABEL_OPEN = 'باز کردن منوی ناوبری';
  var LABEL_CLOSE = 'بستن منوی ناوبری';

  /* تنها از اینجا به بعد CSS اجازهٔ همبرگر شدن دارد. */
  root.setAttribute('data-nav-js', '');

  /* نقطهٔ شکست باید *دقیقا* همان ۶۴۰ پیکسلِ base.css باشد. اگر این دو از
     هم جدا بیفتند، بازه‌ای پیدا می‌شود که دکمه دیده می‌شود ولی CSS پنل
     نمی‌سازد — یا برعکس. */
  var mq = window.matchMedia('(max-width: 640px)');

  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  function setOpen(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? LABEL_CLOSE : LABEL_OPEN);
    /* hidden به‌جای کلاس: هم از چیدمان بیرون می‌رود و هم از درخت
       دسترسی، پس پیوندهای بسته با Tab قابل رسیدن نیستند. */
    panel.hidden = !open;
  }

  /* روی دسکتاپ پنل هرگز نباید hidden بماند: همان <nav> ردیفِ همیشگی
     است. این تابع وضعیت را با عرض صفحه هماهنگ می‌کند. */
  function syncToViewport() {
    if (mq.matches) {
      if (!isOpen()) panel.hidden = true;
    } else {
      panel.hidden = false;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', LABEL_OPEN);
    }
  }

  function close(returnFocus) {
    if (!isOpen()) return;
    setOpen(false);
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener('click', function (event) {
    /* دکمه داخل هدر است و کنارِ یک <form>؛ جلوگیری از رفتار پیش‌فرض
       مانع هر ناوبری یا submit تصادفی می‌شود. */
    event.preventDefault();
    if (isOpen()) {
      close(false);
    } else {
      setOpen(true);
      /* اولین پیوند پنل فوکوس می‌گیرد تا با صفحه‌کلید بلافاصله قابل
         پیمایش باشد. */
      var first = panel.querySelector('a[href]');
      if (first) first.focus();
    }
  });

  /* لمس/کلیک بیرون. pointerdown و نه click: روی موبایل زودتر و
     قابل‌اتکاتر است، و پیش از آنکه فوکوس جابه‌جا شود عمل می‌کند. */
  document.addEventListener('pointerdown', function (event) {
    if (!isOpen()) return;
    if (panel.contains(event.target) || toggle.contains(event.target)) return;
    close(false);
  });

  /* Escape: فوکوس به دکمه برمی‌گردد — جایی که کاربر رهایش کرده بود. */
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen()) close(true);
  });

  /* اگر فوکوس با Tab از پنل بیرون رفت، منو بسته می‌شود؛ وگرنه کاربرِ
     صفحه‌کلید پشت سرش یک منوی بازِ نامرئی جا می‌گذارد. */
  document.addEventListener('focusin', function (event) {
    if (!isOpen()) return;
    if (panel.contains(event.target) || toggle.contains(event.target)) return;
    close(false);
  });

  /* رفتن به مقصد یعنی کار منو تمام است. */
  panel.addEventListener('click', function (event) {
    if (event.target.closest('a[href]')) close(false);
  });

  /* چرخش دستگاه یا تغییر عرض: وضعیت باید با نقطهٔ شکست هماهنگ بماند. */
  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', syncToViewport);
  } else if (typeof mq.addListener === 'function') {
    mq.addListener(syncToViewport);          /* مرورگرهای قدیمی‌تر */
  }

  syncToViewport();
})();
