/* ============================================================================
 * public/js/hero-carousel.js — اسلایدشوی هیرو
 * ----------------------------------------------------------------------------
 * نخستین و تنها جاوااسکریپتِ سمت کاربرِ این سایت. تا پیش از این، فروشگاه
 * صفرْ بایت اسکریپت می‌فرستاد و این یک خصلتِ آگاهانه بود (کامیت 9dc99f3).
 * چرخشِ خودکار بدون جاوااسکریپت ممکن نیست، پس این فایل اضافه شد — و همان‌جا
 * متوقف می‌شود: بدون کتابخانه، بدون وابستگی، بدون اسکریپت درون‌خطی.
 *
 * قاعده‌های این فایل:
 *
 *   * تنزلِ آبرومند. اگر این فایل بار نشود، اسلاید اول با CSS سر جایش
 *     می‌ماند و دکمه‌ها و نقطه‌ها (که با hidden می‌آیند) هرگز دیده
 *     نمی‌شوند. کاربر یک عکسِ ثابت می‌بیند، نه یک کنترلِ مرده.
 *   * هیچ نشانی‌ای اینجا ساخته نمی‌شود. عکس‌ها از CSS می‌آیند، پس مسیر
 *     پایه هیچ دخالتی در این فایل ندارد.
 *   * prefers-reduced-motion فقط *چرخش خودکار* را خاموش می‌کند. دکمه‌ها
 *     و نقطه‌ها دست‌نخورده کار می‌کنند — انتخابِ کاربر حذف نمی‌شود.
 *   * RTL. فروشگاه همیشه dir="rtl" است، پس «بعدی» از نظر دیداری سمت چپ
 *     است: ArrowLeft جلو می‌برد و ArrowRight عقب. همان ترتیبی که
 *     جای دکمه‌ها در CSS نشان می‌دهد.
 * ==========================================================================*/
(function () {
  'use strict';

  var root = document.querySelector('[data-hero-carousel]');
  if (!root) return;

  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('[data-hero-dot]'));
  var prevBtn = root.querySelector('[data-hero-prev]');
  var nextBtn = root.querySelector('[data-hero-next]');
  var dotsWrap = root.querySelector('[data-hero-dots]');

  /* کمتر از دو اسلاید، اسلایدشو نیست. کنترل‌ها پنهان می‌مانند. */
  if (slides.length < 2) return;

  var INTERVAL = 3000;
  var index = slides.findIndex(function (s) {
    return s.classList.contains('is-active');
  });
  if (index < 0) index = 0;

  var timer = null;
  var paused = false;

  /* کوئری یک بار ساخته می‌شود و به تغییرِ زندهٔ تنظیمِ سیستم هم گوش
     می‌دهد: اگر کاربر وسطِ کار «حرکت کمتر» را روشن کند، چرخش می‌ایستد. */
  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false, addEventListener: null };

  /* ------------------------------------------------------------ نمایش */

  function show(next) {
    index = (next + slides.length) % slides.length;

    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === index);
    });

    dots.forEach(function (dot, i) {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function next() { show(index + 1); }
  function prev() { show(index - 1); }

  /* --------------------------------------------------- چرخش خودکار */

  function stop() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function start() {
    stop();
    if (paused || reduceMotion.matches) return;
    timer = window.setInterval(next, INTERVAL);
  }

  /* هر کنشِ دستی تایمر را از نو می‌چیند، تا اسلایدِ تازه‌انتخاب‌شده
     بلافاصله عوض نشود. */
  function manual(fn) {
    return function (event) {
      if (event) event.preventDefault();
      fn();
      start();
    };
  }

  function pause() { paused = true; stop(); }
  function resume() { paused = false; start(); }

  /* -------------------------------------------------------- سیم‌کشی */

  if (prevBtn) {
    prevBtn.hidden = false;
    prevBtn.addEventListener('click', manual(prev));
  }
  if (nextBtn) {
    nextBtn.hidden = false;
    nextBtn.addEventListener('click', manual(next));
  }
  if (dotsWrap) dotsWrap.hidden = false;

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', manual(function () { show(i); }));
  });

  /* اشاره‌گر روی اسلایدشو → توقف. فوکوسِ صفحه‌کلید هم همین کار را
     می‌کند، وگرنه کاربری که با Tab روی نقطه‌ها می‌رود زیر پایش عکس
     عوض می‌شد. */
  root.addEventListener('mouseenter', pause);
  root.addEventListener('mouseleave', resume);
  root.addEventListener('focusin', pause);
  root.addEventListener('focusout', function (event) {
    if (!root.contains(event.relatedTarget)) resume();
  });

  /* تبِ پنهان نباید در پس‌زمینه بچرخد. */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  /* صفحه‌کلید. RTL: چپ جلو، راست عقب. */
  root.addEventListener('keydown', function (event) {
    switch (event.key) {
      case 'ArrowLeft':  manual(next)(event); break;
      case 'ArrowRight': manual(prev)(event); break;
      case 'Home':       manual(function () { show(0); })(event); break;
      case 'End':        manual(function () { show(slides.length - 1); })(event); break;
      default: break;
    }
  });

  /* ------------------------------------------------------------ کشیدن
     کشیدن افقی با انگشت یا اشاره‌گر. چند تصمیم آگاهانه:

       * Pointer Events و نه touch: یک جفت رویداد، هم لمس هم قلم هم
         کشیدنِ ماوس. کد کمتر، پوشش بیشتر.
       * هیچ pointermove‌ای گوش داده نمی‌شود و هیچ preventDefault وسط
         کشیدن صدا زده نمی‌شود — همین است که پیمایشِ عمودیِ صفحه را
         دست‌نخورده نگه می‌دارد. جهت در pointerup تصمیم گرفته می‌شود.
       * اگر جابه‌جاییِ عمودی از افقی بیشتر باشد، کاربر داشت صفحه را
         پیمایش می‌کرد نه اسلاید را عوض می‌کرد؛ کاری نمی‌کنیم.
       * روی دکمه‌ها و نقطه‌ها اثر نمی‌گذارد: اگر کشیدن از روی یک
         button شروع شود نادیده گرفته می‌شود، تا کلیکِ عادی همان کلیک
         بماند.
       * RTL: مثل صفحه‌کلید، کشیدن به چپ جلو می‌برد.
       * manual() دوباره استفاده می‌شود، پس تایمر دقیقا مثل فشردن دکمه
         از نو چیده می‌شود. ترجیحِ «حرکت کمتر» هم خودبه‌خود رعایت
         می‌شود، چون start() در آن حالت زود برمی‌گردد: کشیدنِ دستی کار
         می‌کند ولی چرخشِ خودکار روشن نمی‌شود. */
  var SWIPE_MIN = 40;        /* پیکسل. کمتر از این، لرزشِ انگشت است نه کشیدن. */
  var swipeX = null;
  var swipeY = null;

  root.addEventListener('pointerdown', function (event) {
    /* فقط دکمهٔ اصلی/لمس، و نه وقتی کشیدن از روی یک کنترل شروع شده.
       ‎'button, a' و نه فقط 'button': دکمهٔ «محصولات» روی تصویر
       یک <a> است. بدون این، کشیدن از روی آن هم اسلاید را عوض می‌کرد و
       هم پیوند را باز می‌کرد. */
    if (event.button !== 0 || event.target.closest('button, a')) return;
    swipeX = event.clientX;
    swipeY = event.clientY;
    pause();
  });

  root.addEventListener('pointerup', function (event) {
    if (swipeX === null) return;
    var dx = event.clientX - swipeX;
    var dy = event.clientY - swipeY;
    swipeX = null;
    swipeY = null;

    /* عمودی بیشتر از افقی → پیمایش بود، نه کشیدن. */
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      /* چپ (dx منفی) جلو، مثل ArrowLeft. */
      manual(dx < 0 ? next : prev)(event);
    }
    resume();
  });

  /* انگشت که از قاب بیرون برود یا رویداد لغو شود، حالت پاک شود. */
  root.addEventListener('pointercancel', function () {
    swipeX = null;
    swipeY = null;
    resume();
  });

  if (reduceMotion.addEventListener) {
    reduceMotion.addEventListener('change', start);
  }

  show(index);
  start();
})();
