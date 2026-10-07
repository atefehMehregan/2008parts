/* ============================================================================
 * tests/pages.test.js — صفحه‌های اطلاعاتی (دربارهٔ ما، تماس با ما)
 * ----------------------------------------------------------------------------
 * همان الگوی home.test.js: برنامهٔ واقعی Express روی PGlite.
 *
 * تمرکز این فایل روی قولی است که این دو صفحه می‌دهند:
 *   * هیچ ادعای ساختگی دربارهٔ کسب‌وکار نمی‌سازند.
 *   * شمارهای «دربارهٔ ما» از پایگاه داده می‌آیند، نه از متن ثابت.
 *   * صفحهٔ تماس فقط کانال‌های *پرشده* را نشان می‌دهد و وقتی هیچ‌کدام
 *     مقدار ندارند، صادقانه همین را می‌گوید — نه شمارهٔ نمونه.
 * ==========================================================================*/
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createTestDb, insertCategory, insertBrand, insertProduct } =
  await import('./helpers/testDb.js');
const { createProductRepository } = await import('../src/db/repositories/products.js');
const { createCategoryRepository } = await import('../src/db/repositories/categories.js');
const { createBrandRepository } = await import('../src/db/repositories/brands.js');

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
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (db) await db.close();
});

const get = (p) => fetch(BASE + p);
const html = async (p) => (await get(p)).text();

/* ═══════════════════════════════════════════════ ۱. دربارهٔ ما */

test('GET /about دویست می‌دهد و یک h1 دارد', async () => {
  const res = await get('/about');
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.equal((body.match(/<h1/g) || []).length, 1);
  assert.match(body, /دربارهٔ ۲۰۰۸پارتس/);
});

test('شمارهای «دربارهٔ ما» از پایگاه داده می‌آیند، نه از متن ثابت', async () => {
  const catId = await insertCategory(db, { name: 'ترمز', slug: 'brakes' });
  await insertBrand(db, { name: 'بوش', slug: 'bosch' });
  await insertProduct(db, { categoryId: catId, slug: 'p-a', sku: 'A1' });
  await insertProduct(db, { categoryId: catId, slug: 'p-b', sku: 'A2' });

  const body = await html('/about');
  /* دو محصول، یک دسته، یک برند — با رقم فارسی. */
  assert.match(body, /class="fact-list"/);
  assert.ok(body.includes('۲'), 'شمار محصول باید با رقم فارسی بیاید');
  assert.ok(!body.includes('>2<'), 'رقم انگلیسی خام نباید بیاید');
});

test('«دربارهٔ ما» صریح می‌گوید سفارش آنلاین هنوز نیست', async () => {
  const body = await html('/about');
  assert.match(body, /سبد خرید/);
  assert.match(body, /پیاده‌سازی نشده/);
});

/* ⚠️ این آزمون روی *کلمه* قضاوت نمی‌کند، روی *ادعا*.
   صفحه کلمهٔ «گارانتی» را دارد، ولی در جمله‌ای که می‌گوید هنوز سیاستی
   برای گارانتی ثبت نشده است — یعنی دقیقا برعکسِ ادعا. آزمونِ اولِ این
   فایل روی حضور کلمه بود و همین جمله را مردود می‌کرد. */
test('«دربارهٔ ما» هیچ ادعای ساختگی دربارهٔ کسب‌وکار ندارد', async () => {
  const body = await html('/about');

  /* عبارت‌های ادعایی — نه موضوع‌ها. */
  for (const claim of ['ارسال رایگان', 'بهترین فروشگاه', 'معتبرترین',
                       'ضمانت اصالت', 'سال‌ها تجربه', 'هزاران مشتری']) {
    assert.ok(!body.includes(claim), `ادعای ساختگی «${claim}» نباید باشد`);
  }

  /* سال تأسیسِ ساختگی: چهار رقمِ شمسی یا میلادی کنار «تأسیس». */
  assert.ok(!/تأسیس\s*[:،]?\s*[۰-۹0-9]{4}/.test(body), 'سال تأسیس ساختگی نباید باشد');

  /* و برعکسش باید صریح گفته شده باشد. */
  assert.match(body, /گارانتی و بازگشت کالا هم چیزی ننوشته‌ایم/,
    'نبودِ سیاست گارانتی باید صریح گفته شود، نه اینکه سکوت شود');
});

/* ═══════════════════════════════════════════════ ۲. تماس با ما */

test('GET /contact دویست می‌دهد', async () => {
  const res = await get('/contact');
  assert.equal(res.status, 200);
  assert.match(await res.text(), /تماس با ما/);
});

test('بدون راه ارتباطیِ ثبت‌شده، صفحه صادقانه همین را می‌گوید', async () => {
  /* در محیط آزمون هیچ STORE_* تعریف نشده است. */
  const body = await html('/contact');
  assert.match(body, /هنوز در این صفحه ثبت نشده‌اند/);
  assert.match(body, /class="notice notice--quiet"/);
  assert.ok(!body.includes('class="contact-list"'), 'فهرست خالی نباید رندر شود');
});

test('هیچ شمارهٔ تماس یا نشانیِ نمونه‌ای روی صفحه نیست', async () => {
  const body = await html('/contact');
  /* یک رشتهٔ طولانیِ رقمی = شمارهٔ تلفنِ جاافتاده در قالب. */
  assert.ok(!/\b0\d{9,}\b/.test(body), 'شمارهٔ تلفن ساختگی نباید باشد');
  assert.ok(!/@\w+\.(com|ir|net)/.test(body), 'ایمیل ساختگی نباید باشد');
});

test('صفحهٔ تماس به جست‌وجو و فهرست قطعات راه می‌دهد', async () => {
  const body = await html('/contact');
  assert.match(body, /href="\/search"/);
  assert.match(body, /href="\/products"/);
});

/* ═══════════════════════════════════════════════ ۳. ناوبری */

test('هر دو صفحه در هدر و فوتر پیوند دارند', async () => {
  const body = await html('/');
  assert.match(body, /href="\/about"/);
  assert.match(body, /href="\/contact"/);
});

test('صفحهٔ جاری در ناوبری علامت می‌خورد', async () => {
  const body = await html('/about');
  assert.match(body, /href="\/about" aria-current="page"/);
});

test('«مقالات» هیچ‌جا پیوند نشده، چون چنین مسیری وجود ندارد', async () => {
  const body = await html('/');
  assert.ok(!body.includes('/articles'), 'پیوند به مسیر ناموجود نباید باشد');
  assert.ok(!body.includes('>مقالات<'), 'پیوند مرده نباید باشد');
});

test('هر دو صفحه پوستهٔ کامل فروشگاه را دارند', async () => {
  for (const p of ['/about', '/contact']) {
    const body = await html(p);
    assert.match(body, /class="site-header"/, p);
    assert.match(body, /class="site-footer"/, p);
    assert.match(body, /class="breadcrumb"/, p);
    assert.match(body, /<html lang="fa" dir="rtl">/, p);
  }
});
