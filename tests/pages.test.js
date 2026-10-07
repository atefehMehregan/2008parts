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

/* حقیقت عوض شد: سبد خرید اضافه شده. آنچه *نیست* پرداخت آنلاین است و
   صفحه باید همان را صریح بگوید — نه اینکه سکوت کند. */
test('«دربارهٔ ما» سبد را معرفی می‌کند و نبودِ پرداخت آنلاین را صریح می‌گوید', async () => {
  const body = await html('/about');
  assert.match(body, /href="\/cart"/, 'باید به سبد پیوند بدهد');
  /* ⚠️ بدون \s+ نمی‌شود: جمله در قالب روی دو خط شکسته و الگوی تک‌فاصله
     مردود می‌شد. متنِ صفحه درست بود، آزمون شکننده بود. */
  assert.match(body, /پرداخت اینترنتی روی این سایت وجود ندارد/);
  assert.match(body, /درگاه\s+پرداختی\s+در\s+کار\s+نیست/);
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

/* حقیقت عوض شد: صاحب فروشگاه راه‌های ارتباطی واقعی را داد و در
   پیکربندی نشستند. پس آزمونِ «هیچ کانالی ثبت نشده» منسوخ است و جایش را
   آزمونِ «همان مقدارهای واقعی نشان داده می‌شوند» می‌گیرد.

   قاعدهٔ اصلی عوض نشده: هیچ مقدارِ *ساختگی* نباید روی صفحه باشد. حالا
   این را با مقایسهٔ صفحه و پیکربندی می‌سنجیم، نه با نبودِ هر رقم. */
test('صفحهٔ تماس همان مقدارهای پیکربندی را نشان می‌دهد', async () => {
  const { config } = await import('../src/config/index.js');
  const body = await html('/contact');

  assert.match(body, /class="contact-list"/);
  assert.ok(!body.includes('هنوز در این صفحه ثبت نشده‌اند'),
    'وقتی کانال ثبت شده، پیام «ثبت نشده» نباید بیاید');

  for (const v of [config.contact.phone, config.contact.mobile, config.contact.email]) {
    assert.ok(body.includes(v), `مقدار «${v}» باید نشان داده شود`);
  }
  assert.ok(body.includes(`href="tel:${config.contact.phoneTel}"`), 'پیوند تلفن ثابت');
  assert.ok(body.includes(`href="tel:${config.contact.mobileTel}"`), 'پیوند همراه');
  assert.ok(body.includes(`href="mailto:${config.contact.email}"`), 'پیوند ایمیل');
});

test('هیچ شمارهٔ تماسی جز مقدارهای پیکربندی روی صفحه نیست', async () => {
  const { config } = await import('../src/config/index.js');
  const body = await html('/contact');
  const known = new Set([
    config.contact.phone.replace(/\D/g, ''),
    config.contact.mobile.replace(/\D/g, ''),
    config.contact.phoneTel.replace(/\D/g, ''),
    config.contact.mobileTel.replace(/\D/g, ''),
    config.contact.whatsapp.replace(/\D/g, ''),
  ]);
  for (const m of body.match(/\b\d{9,}\b/g) || []) {
    assert.ok(known.has(m), `شمارهٔ ناشناخته روی صفحه: ${m}`);
  }
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
