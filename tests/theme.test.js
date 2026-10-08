/* ============================================================================
 * tests/theme.test.js — انتخاب پوستهٔ روشن/تاریک
 * ----------------------------------------------------------------------------
 * قول‌هایی که این سامانه می‌دهد:
 *
 *   * سه حالت: auto (پیروی از سیستم)، light، dark.
 *   * انتخاب کاربر در کوکی می‌نشیند و سرور آن را *پیش از* فرستادن
 *     نخستین بایت می‌خواند — پس «پرشِ پوسته» از نظر ساختاری ممکن نیست.
 *   * انتخاب بین صفحه‌ها می‌ماند.
 *   * تغییر پوسته POST است و پشت CSRF.
 *   * returnTo فقط مسیر داخلی می‌پذیرد (open-redirect بسته است).
 *   * هیچ جاوااسکریپتی اضافه نمی‌شود.
 * ==========================================================================*/
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createTestDb, insertCategory } = await import('./helpers/testDb.js');
const { createProductRepository } = await import('../src/db/repositories/products.js');
const { createCategoryRepository } = await import('../src/db/repositories/categories.js');
const { createBrandRepository } = await import('../src/db/repositories/brands.js');
const { safeReturnTo } = await import('../src/controllers/themeController.js');

let db, server, BASE;

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
  await insertCategory(db, { name: 'ترمز', slug: 'brakes' });
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (db) await db.close();
});

function makeJar() {
  const jar = new Map();
  return {
    header: () => [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
    absorb(res) {
      for (const raw of (res.headers.getSetCookie?.() ?? [])) {
        const [pair] = raw.split(';');
        const i = pair.indexOf('=');
        const k = pair.slice(0, i).trim(), v = pair.slice(i + 1).trim();
        if (v === '') jar.delete(k); else jar.set(k, v);
      }
      return res;
    },
    get: (k) => jar.get(k),
  };
}
const get = async (jar, p) => jar.absorb(await fetch(BASE + p, { headers: { cookie: jar.header() }, redirect: 'manual' }));
async function post(jar, p, fields, { csrf = true } = {}) {
  const body = new URLSearchParams(fields);
  if (csrf) body.set('_csrf', decodeURIComponent(jar.get('2008parts_csrf') || ''));
  return jar.absorb(await fetch(BASE + p, {
    method: 'POST', redirect: 'manual',
    headers: { cookie: jar.header(), 'content-type': 'application/x-www-form-urlencoded' },
    body,
  }));
}
async function freshJar() { const j = makeJar(); await get(j, '/'); return j; }
const htmlOf = async (jar, p) => (await get(jar, p)).text();

/* ═══════════════════════════════════════════════ ۱. حالت auto */

test('بازدیدکنندهٔ تازه در حالت auto است: بدون صفت، و شیوه‌نامه با media', async () => {
  const jar = await freshJar();
  const html = await htmlOf(jar, '/');
  assert.doesNotMatch(html, /<html[^>]*data-theme/, 'در auto نباید صفتی روی html باشد');
  assert.match(html, /theme-dark\.css" media="\(prefers-color-scheme: dark\)"/);
  /* هر دو theme-color برای اینکه مرورگر خودش انتخاب کند. */
  assert.match(html, /name="theme-color" media="\(prefers-color-scheme: light\)"/);
  assert.match(html, /name="theme-color" media="\(prefers-color-scheme: dark\)"/);
});

/* ═══════════════════════════════════ ۲. انتخاب صریح و ماندگاری */

test('انتخاب تاریک روی html می‌نشیند و شیوه‌نامه بی‌قید بار می‌شود', async () => {
  const jar = await freshJar();
  const res = await post(jar, '/theme', { mode: 'dark', returnTo: '/' });
  assert.equal(res.status, 303);
  assert.equal(jar.get('2008parts_theme'), 'dark');

  const html = await htmlOf(jar, '/');
  assert.match(html, /<html[^>]*data-theme="dark"/);
  assert.match(html, /<link rel="stylesheet" href="\/css\/theme-dark\.css" \/>/);
  assert.match(html, /name="theme-color" content="#0a1a2f"/);
});

test('انتخاب روشن، شیوه‌نامهٔ تیره را اصلا بار نمی‌کند', async () => {
  const jar = await freshJar();
  await post(jar, '/theme', { mode: 'light', returnTo: '/' });
  const html = await htmlOf(jar, '/');
  assert.match(html, /<html[^>]*data-theme="light"/);
  assert.ok(!html.includes('theme-dark.css'), 'در پوستهٔ روشن نباید بار شود');
});

test('انتخاب بین صفحه‌ها می‌ماند', async () => {
  const jar = await freshJar();
  await post(jar, '/theme', { mode: 'dark', returnTo: '/' });
  for (const p of ['/', '/products', '/cart', '/about', '/contact']) {
    assert.match(await htmlOf(jar, p), /data-theme="dark"/, `پوسته روی ${p}`);
  }
});

test('بازگشت به auto کوکی را پاک می‌کند', async () => {
  const jar = await freshJar();
  await post(jar, '/theme', { mode: 'dark', returnTo: '/' });
  assert.equal(jar.get('2008parts_theme'), 'dark');
  await post(jar, '/theme', { mode: 'auto', returnTo: '/' });
  assert.equal(jar.get('2008parts_theme'), undefined, 'کوکی باید پاک شود');
  assert.doesNotMatch(await htmlOf(jar, '/'), /data-theme/);
});

/* ═══════════════════════════════════════════════ ۳. بدون پرش */

/* ⚠️ قولِ «بدون پرش» با همین یک ادعا سنجیده می‌شود: پوسته در خودِ
   HTMLِ نخستین پاسخ تعیین شده است، نه با اسکریپتی که بعدا اجرا شود. */
test('پوسته در نخستین پاسخ تعیین شده و هیچ اسکریپتی لازم ندارد', async () => {
  const jar = await freshJar();
  await post(jar, '/theme', { mode: 'dark', returnTo: '/' });
  const html = await htmlOf(jar, '/');

  const headEnd = html.indexOf('</head>');
  assert.ok(html.slice(0, headEnd).includes('data-theme="dark"')
    || html.indexOf('data-theme="dark"') < headEnd, 'پوسته باید پیش از پایان head معلوم باشد');
  assert.ok(!html.includes('<script'), 'سایت نباید هیچ اسکریپتی داشته باشد');
  assert.ok(!html.includes('localStorage'), 'نباید به localStorage وابسته باشد');
});

/* ═══════════════════════════════════════════════ ۴. امنیت */

test('تغییر پوسته بدون CSRF رد می‌شود', async () => {
  const jar = await freshJar();
  const res = await post(jar, '/theme', { mode: 'dark' }, { csrf: false });
  assert.equal(res.status, 403);
  assert.equal(jar.get('2008parts_theme'), undefined);
});

test('returnTo فقط مسیر داخلی می‌پذیرد', () => {
  for (const bad of ['//evil.example', 'https://evil.example', '/\\evil.example',
                     'javascript:alert(1)', 'evil', '', null, undefined, '/a\nb']) {
    assert.equal(safeReturnTo(bad), '/', `باید رد شود: ${JSON.stringify(bad)}`);
  }
  assert.equal(safeReturnTo('/products?page=2&sort=name'), '/products?page=2&sort=name');
  assert.equal(safeReturnTo('/cart'), '/cart');
});

test('حالت نامعتبر کوکی را دست نمی‌زند', async () => {
  const jar = await freshJar();
  await post(jar, '/theme', { mode: 'dark', returnTo: '/' });
  await post(jar, '/theme', { mode: 'rainbow', returnTo: '/' });
  assert.equal(jar.get('2008parts_theme'), 'dark', 'کوکی نباید عوض شود');
});

test('کوکیِ دست‌کاری‌شده بی‌خطر به auto برمی‌گردد', async () => {
  for (const v of ['<script>alert(1)</script>', 'purple', '../../etc/passwd', '']) {
    const res = await fetch(BASE + '/', { headers: { cookie: `2008parts_theme=${encodeURIComponent(v)}` } });
    const html = await res.text();
    assert.doesNotMatch(html, /data-theme="(?!light|dark)/, `مقدار ${v}`);
    assert.ok(!html.includes('<script>alert'), 'نباید خام رندر شود');
  }
});

/* ═══════════════════════════════════════════════ ۵. رابط کاربری */

test('کلید پوسته در هدر هست و دسترس‌پذیر است', async () => {
  const jar = await freshJar();
  const html = await htmlOf(jar, '/');
  assert.match(html, /class="theme-switch"/);
  assert.match(html, /action="\/theme" method="post"/);
  assert.match(html, /aria-label="انتخاب پوستهٔ نمایش"/);
  assert.match(html, /aria-label="نمایش با پوستهٔ روشن"/);
  assert.match(html, /aria-label="نمایش با پوستهٔ تاریک"/);
  /* معنا فقط با نماد منتقل نمی‌شود. */
  assert.match(html, /<span class="sr-only">روشن<\/span>/);
  assert.match(html, /<span class="sr-only">تاریک<\/span>/);
});

test('کلید پوسته کاربر را به همان صفحه برمی‌گرداند', async () => {
  const jar = await freshJar();
  await get(jar, '/products?page=1&sort=name');
  const html = await htmlOf(jar, '/products?page=1&sort=name');
  assert.match(html, /name="returnTo" value="\/products\?page=1&amp;sort=name"/);
});
