/* ============================================================================
 * tests/cart.test.js — سبد خرید مهمان
 * ----------------------------------------------------------------------------
 * برنامهٔ واقعی Express روی PGlite، با کوکی دست‌به‌دست — همان چیزی که
 * مرورگر انجام می‌دهد.
 *
 * تمرکز روی قول‌هایی که این سبد می‌دهد:
 *   * قیمت هرگز از مرورگر نمی‌آید.
 *   * کد کالا و تعداد سمت سرور اعتبارسنجی می‌شوند.
 *   * تغییرها پشت CSRF هستند.
 *   * شمار هدر با خودِ سبد یکی است.
 *   * هیچ درگاه پرداختی وجود ندارد.
 * ==========================================================================*/
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createTestDb, insertCategory, insertBrand, insertProduct } =
  await import('./helpers/testDb.js');
const { createProductRepository } = await import('../src/db/repositories/products.js');
const { createCategoryRepository } = await import('../src/db/repositories/categories.js');
const { createBrandRepository } = await import('../src/db/repositories/brands.js');

let db, server, BASE, catId;

before(async () => {
  db = await createTestDb();
  const { createApp } = await import('../src/app.js');
  const app = createApp({
    repositories: {
      products: createProductRepository(db),
      categories: createCategoryRepository(db),
      brands: createBrandRepository(db),
    },
  });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  BASE = `http://127.0.0.1:${server.address().port}`;

  catId = await insertCategory(db, { name: 'ترمز', slug: 'brakes' });
  await insertProduct(db, {
    categoryId: catId, name: 'لنت ترمز جلو', slug: 'lent', sku: 'C-001',
    priceToman: 2000000, stockQty: 4,
  });
  await insertProduct(db, {
    categoryId: catId, name: 'دیسک ترمز', slug: 'disk', sku: 'C-002',
    priceToman: 5000000, stockQty: 10,
  });
  await insertProduct(db, {
    categoryId: catId, name: 'قطعهٔ بی‌قیمت', slug: 'noprice', sku: 'C-003',
    priceToman: 0, stockQty: 3,
  });
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (db) await db.close();
});

/* ------------------------------------------------- کوکی‌دانِ کوچکِ آزمون */

function makeJar() {
  const jar = new Map();
  return {
    header: () => [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    absorb(res) {
      for (const raw of (res.headers.getSetCookie?.() ?? [])) {
        const [pair] = raw.split(';');
        const i = pair.indexOf('=');
        const k = pair.slice(0, i).trim();
        const v = pair.slice(i + 1).trim();
        if (v === '') jar.delete(k); else jar.set(k, v);
      }
      return res;
    },
    get: (k) => jar.get(k),
  };
}

async function get(jar, path) {
  const res = await fetch(BASE + path, {
    headers: { cookie: jar.header() }, redirect: 'manual',
  });
  jar.absorb(res);
  return res;
}

async function post(jar, path, fields, { csrf = true } = {}) {
  const body = new URLSearchParams(fields);
  if (csrf) body.set('_csrf', decodeURIComponent(jar.get('2008parts_csrf') || ''));
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { cookie: jar.header(), 'content-type': 'application/x-www-form-urlencoded' },
    body, redirect: 'manual',
  });
  jar.absorb(res);
  return res;
}

/** سبدِ تازه با توکن CSRF گرفته‌شده. */
async function freshJar() {
  const jar = makeJar();
  await get(jar, '/');
  return jar;
}

const cartHtml = async (jar) => (await get(jar, '/cart')).text();

/* ═══════════════════════════════════════════════ ۱. پایه */

test('سبد خالی ۲۰۰ می‌دهد و می‌گوید خالی است', async () => {
  const jar = await freshJar();
  const res = await get(jar, '/cart');
  assert.equal(res.status, 200);
  assert.match(await res.text(), /سبد خرید خالی است/);
});

test('سبد خالی در هدر عددی نشان نمی‌دهد', async () => {
  const jar = await freshJar();
  const html = await (await get(jar, '/')).text();
  assert.match(html, /class="cart-link/);
  assert.ok(!html.includes('cart-link__count'), 'سبد خالی نباید عدد نشان دهد');
});

test('افزودن کالا کار می‌کند و با redirect برمی‌گردد (PRG)', async () => {
  const jar = await freshJar();
  const res = await post(jar, '/cart/add', { sku: 'C-001', qty: '2' });
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), '/cart');

  const html = await cartHtml(jar);
  assert.match(html, /لنت ترمز جلو/);
  assert.ok(html.includes('۴٬۰۰۰٬۰۰۰ تومان'), 'جمع خط = ۲ × ۲٬۰۰۰٬۰۰۰');
});

/* ═══════════════════════════════════════ ۲. قیمت از پایگاه داده */

test('قیمتِ فرستاده‌شده از مرورگر نادیده گرفته می‌شود', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', {
    sku: 'C-002', qty: '1',
    /* همهٔ نام‌هایی که یک مهاجم ممکن است امتحان کند. */
    price: '1', unitPrice: '1', price_toman: '1', lineTotal: '1', total: '1',
  });
  const html = await cartHtml(jar);
  assert.ok(html.includes('۵٬۰۰۰٬۰۰۰ تومان'), 'قیمت باید از پایگاه داده بیاید');
  assert.ok(!html.includes('۱ تومان'), 'قیمتِ دست‌کاری‌شده نباید اثر کند');
});

test('کوکی سبد هیچ قیمتی در خود ندارد', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-002', qty: '3' });
  const cookie = decodeURIComponent(jar.get('2008parts_cart') || '');
  assert.match(cookie, /^\[\{"s":"C-002","q":3\}\]$/);
  assert.ok(!/price|toman|قیمت/i.test(cookie), 'کوکی نباید قیمت داشته باشد');
});

test('قطعهٔ بی‌قیمت وارد سبد می‌شود ولی در جمع کل نمی‌آید', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-003', qty: '2' });
  const html = await cartHtml(jar);
  assert.match(html, /استعلام قیمت/);
  assert.match(html, /در جمع کل نیامده است/);
});

/* ═══════════════════════════════════════════════ ۳. اعتبارسنجی */

test('کد کالای ناموجود وارد سبد نمی‌شود', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'NOPE-999', qty: '1' });
  assert.match(await cartHtml(jar), /سبد خرید خالی است/);
});

test('محصول غیرفعال وارد سبد نمی‌شود', async () => {
  const jar = await freshJar();
  await insertProduct(db, {
    categoryId: catId, name: 'بازنشسته', slug: 'retired-cart', sku: 'C-OFF',
    priceToman: 100000, isActive: false,
  });
  await post(jar, '/cart/add', { sku: 'C-OFF', qty: '1' });
  assert.match(await cartHtml(jar), /سبد خرید خالی است/);
});

test('کد کالای بدشکل رد می‌شود و به کوئری نمی‌رسد', async () => {
  const jar = await freshJar();
  for (const sku of ['', '../../etc/passwd', "' OR 1=1 --", 'a'.repeat(200), '<script>']) {
    const res = await post(jar, '/cart/add', { sku, qty: '1' });
    assert.equal(res.status, 303, `sku=${sku}`);
  }
  assert.match(await cartHtml(jar), /سبد خرید خالی است/);
});

test('تعداد بدشکل یا منفی به بازهٔ مجاز برده می‌شود', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-002', qty: 'abc' });
  let html = await cartHtml(jar);
  assert.ok(html.includes('۵٬۰۰۰٬۰۰۰ تومان'), 'تعداد بدشکل → ۱');

  await post(jar, '/cart/update', { sku: 'C-002', qty: '99999' });
  html = await cartHtml(jar);
  /* سقف ۹۹ است و موجودی ۱۰ — پس به ۱۰ می‌رسد. */
  assert.ok(html.includes('۵۰٬۰۰۰٬۰۰۰ تومان'), 'تعداد باید به موجودی محدود شود');
});

/* ═══════════════════════════════════════════════ ۴. CSRF */

test('تغییر سبد بدون توکن CSRF رد می‌شود', async () => {
  const jar = await freshJar();
  for (const path of ['/cart/add', '/cart/update', '/cart/remove']) {
    const res = await post(jar, path, { sku: 'C-001', qty: '1' }, { csrf: false });
    assert.equal(res.status, 403, path);
  }
  assert.match(await cartHtml(jar), /سبد خرید خالی است/);
});

/* ═══════════════════════════════════════ ۵. موجودی و شمارش */

test('تعداد بیش از موجودی کاهش می‌یابد و هشدار می‌دهد', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-001', qty: '9' });   /* موجودی ۴ */
  const html = await cartHtml(jar);
  assert.match(html, /موجودی این قطعه/);
  assert.ok(html.includes('۸٬۰۰۰٬۰۰۰ تومان'), 'جمع باید بر پایهٔ ۴ عدد باشد');
});

/* ⚠️ این آزمون برای خرابیِ واقعی نوشته شد: کاهشِ موجودی اول فقط در
   نمایش اعمال می‌شد و کوکی عدد اصلی را نگه می‌داشت، پس نشان هدر ۹ و
   صفحهٔ سبد ۴ نشان می‌داد. */
test('شمار هدر با شمار صفحهٔ سبد یکی است، حتی بعد از کاهش موجودی', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-001', qty: '9' });   /* موجودی ۴ */
  const html = await cartHtml(jar);

  const badge = html.match(/cart-link__count num"[^>]*>([^<]+)</)?.[1]?.trim();
  const inCart = html.match(/تعداد اقلام[\s\S]{0,120}?<span class="num">([^<]+)</)?.[1]?.trim();
  assert.equal(badge, inCart, `هدر «${badge}» و سبد «${inCart}» باید یکی باشند`);
  assert.equal(badge, '۴');

  /* و کوکی هم باید اصلاح شده باشد، نه فقط نمایش. */
  assert.match(decodeURIComponent(jar.get('2008parts_cart') || ''), /"q":4/);
});

test('شمار بعد از جابه‌جایی بین صفحه‌ها و تازه‌کردن درست می‌ماند', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-002', qty: '3' });
  for (const path of ['/', '/products', '/about', '/contact', '/cart', '/']) {
    const html = await (await get(jar, path)).text();
    const badge = html.match(/cart-link__count num"[^>]*>([^<]+)</)?.[1]?.trim();
    assert.equal(badge, '۳', `شمار روی ${path}`);
  }
});

/* ═══════════════════════════════════════ ۶. حذف و تغییر تعداد */

test('تغییر تعداد جمع را درست عوض می‌کند', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-002', qty: '1' });
  await post(jar, '/cart/update', { sku: 'C-002', qty: '4' });
  assert.ok((await cartHtml(jar)).includes('۲۰٬۰۰۰٬۰۰۰ تومان'));
});

test('تعداد صفر یعنی حذف', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-002', qty: '2' });
  await post(jar, '/cart/update', { sku: 'C-002', qty: '0' });
  assert.match(await cartHtml(jar), /سبد خرید خالی است/);
});

test('حذف قلم کار می‌کند و کوکی پاک می‌شود', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-001', qty: '1' });
  await post(jar, '/cart/remove', { sku: 'C-001' });
  assert.match(await cartHtml(jar), /سبد خرید خالی است/);
  assert.ok(!jar.get('2008parts_cart'), 'کوکی سبد باید پاک شود');
});

/* ═══════════════════════════════════ ۷. تماس، نه پرداخت */

test('سبد شمارهٔ فروشنده را قابل کلیک نشان می‌دهد', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-001', qty: '1' });
  const html = await cartHtml(jar);
  assert.match(html, /href="tel:\+989355292911"/);
  assert.match(html, /href="tel:\+982133333502"/);
  assert.match(html, /href="https:\/\/wa\.me\/989355292911"/);
});

test('سبد هیچ درگاه پرداختی ندارد', async () => {
  const jar = await freshJar();
  await post(jar, '/cart/add', { sku: 'C-001', qty: '1' });
  const html = await cartHtml(jar);
  for (const word of ['پرداخت آنلاین', 'درگاه پرداخت', 'زرین‌پال', 'checkout', 'payment']) {
    assert.ok(!html.includes(word), `«${word}» نباید در سبد باشد`);
  }
});

/* ═══════════════════════════════════ ۸. دکمه‌های شناور */

test('سه دکمهٔ شناور روی همهٔ صفحه‌ها با نشانی درست می‌آیند', async () => {
  const jar = await freshJar();
  for (const path of ['/', '/products', '/cart', '/about']) {
    const html = await (await get(jar, path)).text();
    assert.match(html, /class="float-contact"/, path);
    assert.match(html, /instagram\.com\/2008parts\.ir\?stkn=/, path);
    assert.match(html, /href="https:\/\/wa\.me\/989355292911"/, path);
    assert.match(html, /href="tel:\+989355292911"/, path);
    /* پیوند بیرونی باید ایمن باز شود. */
    assert.match(html, /rel="noopener noreferrer"/, path);
  }
});

test('هر سه دکمهٔ شناور برچسب دسترس‌پذیر دارند', async () => {
  const jar = await freshJar();
  const html = await (await get(jar, '/')).text();
  for (const label of ['اینستاگرام ۲۰۰۸پارتس', 'ارتباط در واتساپ', 'تماس با فروشنده']) {
    assert.ok(html.includes(`aria-label="${label}"`), `aria-label «${label}»`);
  }
});

/* ═══════════════════════════════════ ۹. صفحهٔ تماس */

/* ⚠️ مقدارها از پیکربندی خوانده می‌شوند، نه از رشتهٔ ثابتِ داخل آزمون.
   نسخهٔ اول ایمیل را عینا نوشته بود و با عوض شدن ایمیلِ فروشگاه شکست —
   در حالی که صفحه درست بود. آزمون باید بگوید «همان چیزی که پیکربندی
   می‌گوید نشان داده می‌شود»، نه «این رشتهٔ بخصوص». */
test('صفحهٔ تماس هر سه راه ارتباطی واقعی را نشان می‌دهد', async () => {
  const { config } = await import('../src/config/index.js');
  const c = config.contact;
  const jar = await freshJar();
  const html = await (await get(jar, '/contact')).text();

  for (const v of [c.phone, c.mobile, c.email]) {
    assert.ok(html.includes(v), `مقدار «${v}» باید نشان داده شود`);
  }
  assert.ok(html.includes(`href="tel:${c.phoneTel}"`));
  assert.ok(html.includes(`href="tel:${c.mobileTel}"`));
  assert.ok(html.includes(`href="mailto:${c.email}"`));
  /* دیگر نباید بگوید «ثبت نشده». */
  assert.ok(!html.includes('هنوز در این صفحه ثبت نشده‌اند'));
});
