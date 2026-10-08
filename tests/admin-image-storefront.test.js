/* ============================================================================
 * tests/admin-image-storefront.test.js — از پنل مدیر تا ویترین
 * ----------------------------------------------------------------------------
 * tests/admin-product-images.test.js همهٔ مرزهای خودِ پنل را پوشش می‌دهد:
 * اجازهٔ دسترسی، CSRF، اعتبارسنجی آپلود، تصویر اصلی، ترتیب، متن جایگزین،
 * حذف، و پیمایش مسیر. آنچه آنجا سنجیده نمی‌شود، *حلقهٔ آخر* است:
 *
 *     مدیر تصویری آپلود می‌کند → آیا مشتری آن را می‌بیند؟
 *
 * این فایل دقیقا همان زنجیره را می‌رود، با همان برنامهٔ Express واقعی:
 *
 *   ورود مدیر → صفحهٔ تصویرها → آپلود → پردازش → ردیف پایگاه داده
 *   → دیده شدن در پنل → تعیین تصویر اصلی → صفحهٔ عمومی محصول
 *   → کارت محصول در فهرست و دسته و جست‌وجو
 *
 * و هم‌چنین دو چیزی که به‌سادگی بی‌صدا می‌شکنند:
 *   * تغییر تصویر اصلی، ویترین را هم عوض می‌کند.
 *   * حذف تصویر، آن را از ویترین برمی‌دارد بی‌آنکه صفحه بشکند.
 * ==========================================================================*/
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
const STORAGE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), '2008parts-storefront-'));
process.env.STORAGE_ROOT = STORAGE_ROOT;

const sharp = (await import('sharp')).default;
const { createTestDb, insertCategory, insertProduct } = await import('./helpers/testDb.js');
const { createProductRepository } = await import('../src/db/repositories/products.js');
const { createCategoryRepository } = await import('../src/db/repositories/categories.js');
const { createBrandRepository } = await import('../src/db/repositories/brands.js');
const { createProductImageRepository } = await import('../src/db/repositories/productImages.js');
const { hashPassword } = await import('../src/services/password.js');

const EMAIL = 'storefront@example.test';
const PASSWORD = 'correct-horse-9-battery';

let db, server, BASE, repo, adminUsers, productId, productSlug, catSlug;

/* دو تصویر با رنگ‌های متفاوت، تا بشود تشخیص داد کدام روی ویترین نشسته. */
const jpegOf = (r, g, b, w = 900, h = 700) => sharp({
  create: { width: w, height: h, channels: 3, background: { r, g, b } },
}).jpeg().toBuffer();

function parseCookies(res) {
  const out = {};
  for (const raw of res.headers.getSetCookie?.() || []) {
    const [pair] = raw.split(';');
    const i = pair.indexOf('=');
    out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  }
  return out;
}
const cookieHeader = (jar) => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');

async function login() {
  const page = await fetch(`${BASE}/admin/login`);
  const html = await page.text();
  const jar = { ...parseCookies(page) };
  const token = (html.match(/name="_csrf" value="([^"]*)"/) || [])[1] || '';
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader(jar) },
    body: new URLSearchParams({ _csrf: token, email: EMAIL, password: PASSWORD }),
    redirect: 'manual',
  });
  Object.assign(jar, parseCookies(res));
  return jar;
}

const managerHtml = async (jar, id = productId) =>
  (await fetch(`${BASE}/admin/catalogue/products/${id}/images`, { headers: { Cookie: cookieHeader(jar) } })).text();

async function adminCsrf(jar, id = productId) {
  return (await managerHtml(jar, id)).match(/name="_csrf" value="([^"]*)"/)?.[1] || '';
}

async function upload(jar, buf, { altText = '', id = productId } = {}) {
  const token = await adminCsrf(jar, id);
  const fd = new FormData();
  fd.append('_csrf', token);
  if (altText) fd.append('altText', altText);
  fd.append('images', new Blob([buf], { type: 'image/jpeg' }), 'photo.jpg');
  return fetch(`${BASE}/admin/catalogue/products/${id}/images`, {
    method: 'POST', headers: { Cookie: cookieHeader(jar) }, body: fd, redirect: 'manual',
  });
}

const post = async (jar, url, body = {}) => fetch(`${BASE}${url}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader(jar) },
  body: new URLSearchParams({ _csrf: await adminCsrf(jar), ...body }),
  redirect: 'manual',
});

const publicHtml = async (p) => (await fetch(`${BASE}${p}`)).text();

before(async () => {
  db = await createTestDb();
  repo = createProductImageRepository(db);
  const { createAdminUserRepository } = await import('../src/db/repositories/adminUsers.js');
  adminUsers = createAdminUserRepository(db);
  const { createApp } = await import('../src/app.js');
  const app = createApp({
    db,
    repositories: {
      products: createProductRepository(db),
      categories: createCategoryRepository(db),
      brands: createBrandRepository(db),
      productImages: repo,
    },
  });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  BASE = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (db) await db.close();
  await fsp.rm(STORAGE_ROOT, { recursive: true, force: true });
});

beforeEach(async () => {
  await db.exec(`TRUNCATE product_images, products, categories, admin_audit_log,
                 admin_sessions, login_attempts, admin_users RESTART IDENTITY CASCADE`);
  await adminUsers.create({ email: EMAIL, passwordHash: await hashPassword(PASSWORD) });
  catSlug = 'brakes';
  const catId = await insertCategory(db, { name: 'ترمز', slug: catSlug });
  productSlug = 'lent-tormoz';
  productId = await insertProduct(db, {
    categoryId: catId, name: 'لنت ترمز جلو', slug: productSlug, sku: 'SF-1',
    priceToman: 2500000, stockQty: 4,
  });
  await fsp.rm(STORAGE_ROOT, { recursive: true, force: true });
  await fsp.mkdir(path.join(STORAGE_ROOT, 'products'), { recursive: true });
  await fsp.mkdir(path.join(STORAGE_ROOT, 'originals'), { recursive: true });
});

/* ═════════════════════════════════ ۱. زنجیرهٔ کامل */

test('آپلود از پنل تا دیده شدن روی صفحهٔ عمومی محصول', async () => {
  /* پیش از آپلود، صفحهٔ محصول جای‌نگهدار نشان می‌دهد. */
  const before = await publicHtml(`/product/${encodeURIComponent(productSlug)}`);
  assert.match(before, /class="ph"/, 'بدون تصویر باید جای‌نگهدار باشد');
  assert.ok(!before.includes('/media/products/'), 'هنوز نباید تصویری باشد');

  const jar = await login();
  const res = await upload(jar, await jpegOf(200, 60, 60), { altText: 'لنت ترمز جلو پژو ۲۰۰۸' });
  assert.equal(res.status, 303, 'آپلود باید با redirect تمام شود');

  /* ردیف پایگاه داده ساخته شد و به همین محصول چسبید. */
  const rows = await repo.listForProduct(productId);
  assert.equal(rows.length, 1);
  const imageId = rows[0].image_id;
  assert.equal(rows[0].is_primary, true, 'اولین تصویر خودبه‌خود اصلی است');

  /* در پنل دیده می‌شود. */
  assert.match(await managerHtml(jar), new RegExp(imageId), 'باید در پنل بیاید');

  /* و روی صفحهٔ عمومی. */
  const after = await publicHtml(`/product/${encodeURIComponent(productSlug)}`);
  assert.ok(after.includes(`/media/products/${imageId}/`), 'تصویر باید روی صفحهٔ محصول بیاید');
  assert.match(after, /لنت ترمز جلو پژو ۲۰۰۸/, 'متن جایگزین باید استفاده شود');

  /* و فایلِ مشتق واقعا سرو می‌شود. */
  const file = await fetch(`${BASE}/media/products/${imageId}/card.jpg`);
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'image/jpeg');
});

test('تصویر آپلودشده در کارت محصول، فهرست، دسته و جست‌وجو می‌آید', async () => {
  const jar = await login();
  await upload(jar, await jpegOf(30, 140, 90));
  const imageId = (await repo.listForProduct(productId))[0].image_id;

  for (const [label, p] of [
    ['صفحهٔ اصلی', '/'],
    ['فهرست محصول', '/products'],
    ['صفحهٔ دسته', `/category/${encodeURIComponent(catSlug)}`],
    ['جست‌وجو', `/search?q=${encodeURIComponent('لنت')}`],
  ]) {
    const html = await publicHtml(p);
    assert.ok(html.includes(`/media/products/${imageId}/card`), `${label} باید تصویر را نشان دهد`);
  }
});

/* ═════════════════════════════════ ۲. تصویر اصلی روی ویترین */

test('تغییر تصویر اصلی در پنل، تصویر ویترین را هم عوض می‌کند', async () => {
  const jar = await login();
  await upload(jar, await jpegOf(220, 30, 30));   /* اولی → اصلی */
  await upload(jar, await jpegOf(30, 30, 220));   /* دومی */

  const rows = await repo.listForProduct(productId);
  assert.equal(rows.length, 2);
  const first = rows.find((r) => r.is_primary);
  const second = rows.find((r) => !r.is_primary);
  assert.ok(first && second);

  /* ویترین اولی را نشان می‌دهد. */
  let card = await publicHtml('/products');
  assert.ok(card.includes(`/media/products/${first.image_id}/card`), 'ابتدا تصویر اول');
  assert.ok(!card.includes(`/media/products/${second.image_id}/card`), 'دومی نباید کارت باشد');

  /* دومی را اصلی کن. */
  const res = await post(jar, `/admin/catalogue/products/${productId}/images/${second.image_id}/primary`);
  assert.equal(res.status, 303);

  /* دقیقا یکی اصلی مانده — قید یکتاییِ پایگاه داده. */
  const after = await repo.listForProduct(productId);
  assert.equal(after.filter((r) => r.is_primary).length, 1);
  assert.equal(after.find((r) => r.is_primary).image_id, second.image_id);

  /* و ویترین دنبالش رفته. */
  card = await publicHtml('/products');
  assert.ok(card.includes(`/media/products/${second.image_id}/card`), 'حالا باید تصویر دوم باشد');
  assert.ok(!card.includes(`/media/products/${first.image_id}/card`), 'اولی دیگر کارت نیست');
});

/* ═════════════════════════════════ ۳. حذف و ویترین */

test('حذف تصویر، آن را از ویترین برمی‌دارد و صفحه نمی‌شکند', async () => {
  const jar = await login();
  await upload(jar, await jpegOf(10, 10, 10));
  const imageId = (await repo.listForProduct(productId))[0].image_id;

  assert.ok((await publicHtml('/products')).includes(`/media/products/${imageId}/card`));

  const res = await post(jar, `/admin/catalogue/products/${productId}/images/${imageId}/delete`);
  assert.equal(res.status, 303);

  /* صفحهٔ محصول باید سالم بماند و به جای‌نگهدار برگردد. */
  const detail = await fetch(`${BASE}/product/${encodeURIComponent(productSlug)}`);
  assert.equal(detail.status, 200, 'صفحهٔ محصول نباید بشکند');
  const html = await detail.text();
  assert.ok(!html.includes(`/media/products/${imageId}/`), 'تصویر حذف‌شده نباید بماند');
  assert.match(html, /class="ph"/, 'باید به جای‌نگهدار برگردد');

  /* و فهرست هم. */
  const list = await publicHtml('/products');
  assert.ok(!list.includes(`/media/products/${imageId}/card`));
  assert.match(list, /class="product-card"/, 'محصول باید هنوز فهرست شود');
});

test('حذف تصویر اصلی وقتی تصویر دیگری هست، ویترین را به جانشین می‌برد', async () => {
  const jar = await login();
  await upload(jar, await jpegOf(200, 10, 10));
  await upload(jar, await jpegOf(10, 200, 10));
  const rows = await repo.listForProduct(productId);
  const primary = rows.find((r) => r.is_primary);
  const other = rows.find((r) => !r.is_primary);

  await post(jar, `/admin/catalogue/products/${productId}/images/${primary.image_id}/delete`);

  const after = await repo.listForProduct(productId);
  assert.equal(after.length, 1);
  assert.equal(after[0].is_primary, true, 'جانشین باید اصلی شود');
  assert.equal(after[0].image_id, other.image_id);

  const list = await publicHtml('/products');
  assert.ok(list.includes(`/media/products/${other.image_id}/card`), 'ویترین باید جانشین را نشان دهد');
});

/* ═════════════════════════════════ ۴. تصویرهای موجود نمی‌شکنند */

test('تصویرهای از پیش موجود بعد از آپلود تازه هم کار می‌کنند', async () => {
  const jar = await login();
  await upload(jar, await jpegOf(99, 99, 99));            /* «موجود» */
  const existing = (await repo.listForProduct(productId))[0].image_id;

  /* محصول دوم با تصویر خودش. */
  const catId = (await db.query('select id from categories limit 1')).rows[0].id;
  const p2 = await insertProduct(db, {
    categoryId: catId, name: 'دیسک ترمز', slug: 'disk-tormoz', sku: 'SF-2', priceToman: 4000000,
  });
  await upload(jar, await jpegOf(11, 22, 33), { id: p2 });
  const other = (await repo.listForProduct(p2))[0].image_id;

  assert.notEqual(existing, other, 'هر محصول تصویر خودش را دارد');

  const list = await publicHtml('/products');
  assert.ok(list.includes(`/media/products/${existing}/card`), 'تصویر قبلی باید بماند');
  assert.ok(list.includes(`/media/products/${other}/card`), 'تصویر تازه هم باید بیاید');

  /* و هیچ‌کدام روی صفحهٔ آن یکی نمی‌افتد. */
  const d1 = await publicHtml(`/product/${encodeURIComponent(productSlug)}`);
  assert.ok(d1.includes(existing) && !d1.includes(other), 'تصویر محصول دیگر نباید اینجا بیاید');
});

/* ═════════════════════════════════ ۵. متن جایگزین روی ویترین */

test('متن جایگزینِ ویرایش‌شده در پنل، روی ویترین دیده می‌شود', async () => {
  const jar = await login();
  await upload(jar, await jpegOf(60, 60, 60), { altText: 'متن اول' });
  const imageId = (await repo.listForProduct(productId))[0].image_id;
  assert.match(await publicHtml(`/product/${encodeURIComponent(productSlug)}`), /متن اول/);

  await post(jar, `/admin/catalogue/products/${productId}/images/${imageId}/alt`,
    { altText: 'لنت ترمز جلو — نمای جعبه' });

  const html = await publicHtml(`/product/${encodeURIComponent(productSlug)}`);
  assert.match(html, /لنت ترمز جلو — نمای جعبه/);
  assert.ok(!html.includes('متن اول'), 'متن قبلی نباید بماند');
});

/* ═════════════════════════════════ ۶. آپلود ناموفق، ویترین دست‌نخورده */

test('آپلود رد‌شده هیچ اثری روی ویترین نمی‌گذارد', async () => {
  const jar = await login();
  await upload(jar, await jpegOf(120, 120, 120));          /* یک تصویر سالم */
  const good = (await repo.listForProduct(productId))[0].image_id;

  /* فایلی که تصویر نیست، با نام jpg. */
  const token = await adminCsrf(jar);
  const fd = new FormData();
  fd.append('_csrf', token);
  fd.append('images', new Blob([Buffer.from('MZ\x90\x00 not an image')], { type: 'image/jpeg' }), 'evil.jpg');
  await fetch(`${BASE}/admin/catalogue/products/${productId}/images`, {
    method: 'POST', headers: { Cookie: cookieHeader(jar) }, body: fd, redirect: 'manual',
  });

  assert.equal((await repo.listForProduct(productId)).length, 1, 'ردیف تازه‌ای نباید ساخته شود');
  const list = await publicHtml('/products');
  assert.ok(list.includes(`/media/products/${good}/card`), 'تصویر سالم باید سر جایش باشد');
});
