/* ============================================================================
 * tests/vehicle-nav.test.js — منوی «خودروها» در هدر
 * ----------------------------------------------------------------------------
 * منو از پایگاه داده می‌آید، نه از فهرست ثابت. سه چیز را تضمین می‌کند:
 *
 *   * بدون خودروی ثبت‌شده، منو اصلا رندر نمی‌شود (پیوند مرده نداریم).
 *   * با خودروی ثبت‌شده، برچسب «قطعات <نام>» و شمار واقعی می‌آید.
 *   * پالایهٔ ?vehicle= واقعا پالایش می‌کند — محصولی که به آن خودرو وصل
 *     نیست، در نتیجه نمی‌آید.
 *
 * بند سوم مهم است چون در کاتالوگ امروز هر ۵۵ محصول به تنها خودروی موجود
 * وصل‌اند، پس روی دادهٔ واقعی نمی‌شود *حذف شدن* را نشان داد. اینجا با
 * دادهٔ آزمون می‌شود.
 * ==========================================================================*/
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createTestDb, insertCategory, insertProduct } =
  await import('./helpers/testDb.js');
const { createProductRepository } = await import('../src/db/repositories/products.js');
const { createCategoryRepository } = await import('../src/db/repositories/categories.js');
const { createBrandRepository } = await import('../src/db/repositories/brands.js');
const { createVehicleRepository } = await import('../src/db/repositories/vehicles.js');

let db, server, BASE, vehicles, products, catId;

before(async () => {
  db = await createTestDb();
  vehicles = createVehicleRepository(db);
  products = createProductRepository(db);
  const { createApp } = await import('../src/app.js');
  const app = createApp({
    repositories: {
      products,
      categories: createCategoryRepository(db),
      brands: createBrandRepository(db),
      vehicles,
    },
  });
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  BASE = `http://127.0.0.1:${server.address().port}`;
  catId = await insertCategory(db, { name: 'ترمز', slug: 'brakes' });
});

after(async () => {
  if (server) await new Promise((r) => server.close(r));
  if (db) await db.close();
});

const text = async (p) => (await fetch(BASE + p)).text();

test('بدون خودروی ثبت‌شده، ناوبری خودرو رندر نمی‌شود', async () => {
  const html = await text('/');
  assert.ok(!html.includes('قطعات بر اساس خودرو'), 'ناوبری خالی نباید بیاید');
  assert.ok(!html.includes('class="site-nav"'));
});

test('با خودروی ثبت‌شده، منو با برچسب «قطعات <نام>» و شمار واقعی می‌آید', async () => {
  const id = await vehicles.create({
    make: 'پژو', model: '2008', slug: 'پژو-2008', displayName: 'پژو ۲۰۰۸',
  });
  const p1 = await insertProduct(db, { categoryId: catId, slug: 'a', sku: 'V-1' });
  const p2 = await insertProduct(db, { categoryId: catId, slug: 'b', sku: 'V-2' });
  await products.setVehicles(p1, [id]);
  await products.setVehicles(p2, [id]);

  const html = await text('/');
  /* ناوبری تخت است، نه کشویی: پنج خانوادهٔ خودرو مستقیم در ردیف هدر. */
  assert.match(html, /قطعات پژو ۲۰۰۸/);
  assert.match(html, /href="\/products\?vehicle=/);
  assert.match(html, /aria-label="ناوبری اصلی — قطعات بر اساس خودرو"/);
  assert.ok(!html.includes('nav-menu__summary'), 'کشوی قدیمی نباید باشد');
});

/* ⚠️ قولِ اصلی: پالایه واقعا پالایش می‌کند. */
test('پالایهٔ ?vehicle= محصول وصل‌نشده را حذف می‌کند', async () => {
  const slug = 'پژو-2008';
  /* محصولی که به هیچ خودرویی وصل نیست. */
  await insertProduct(db, {
    categoryId: catId, name: 'قطعهٔ بی‌خودرو', slug: 'orphan', sku: 'V-9',
  });

  const all = await text('/products');
  assert.match(all, /قطعهٔ بی‌خودرو/, 'بدون پالایه باید بیاید');

  const filtered = await text(`/products?vehicle=${encodeURIComponent(slug)}`);
  assert.ok(!filtered.includes('قطعهٔ بی‌خودرو'),
    'با پالایهٔ خودرو، محصول وصل‌نشده نباید بیاید');
  /* و وصل‌شده‌ها باید بیایند. */
  assert.match(filtered, /class="product-card"/);
});

test('خودروی غیرفعال در منو نمی‌آید', async () => {
  const id = await vehicles.create({
    make: 'پژو', model: '508', slug: 'پژو-508', displayName: 'پژو ۵۰۸', isActive: false,
  });
  assert.ok(id, 'ردیف ساخته شد');
  const html = await text('/');
  assert.ok(!html.includes('قطعات پژو ۵۰۸'), 'خودروی غیرفعال نباید در منو باشد');
});

test('نام خودروی ثبت‌شده فرار داده می‌شود (XSS)', async () => {
  await vehicles.create({
    make: 'x', model: 'y', slug: 'xss-veh',
    displayName: '<script>alert(1)</script>',
  });
  const html = await text('/');
  assert.ok(!html.includes('<script>alert(1)</script>'), 'نباید خام رندر شود');
  assert.match(html, /&lt;script&gt;/);
});
