/* ============================================================================
 * tests/initial-catalogue.test.js — نگهبان کاتالوگ اولیه
 * ----------------------------------------------------------------------------
 * این آزمون دو کار می‌کند:
 *
 *   ۱. قاعده‌های *صداقت داده* را قفل می‌کند: قیمت، موجودی، برند، شماره
 *      فنی و تصویر نباید ساخته شده باشند. اگر کسی بعدا یک قیمت نمونه یا
 *      یک برند حدسی اضافه کند، اینجا می‌شکند.
 *
 *   ۲. ثابت می‌کند داده واقعا *قابل درج* است: همان رکوردها روی PGlite —
 *      یعنی PostgreSQL واقعی با همان مهاجرت‌ها — از راه همان مخزن‌های
 *      تولید درج می‌شوند. پس هر قید، کلید خارجی و ایندکس یکتا واقعا
 *      آزموده می‌شود، نه شبیه‌سازی.
 * ==========================================================================*/
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import {
  buildProducts, buildCategories, buildVehicle, buildSku,
  CATEGORIES, REJECTED, REJECTED_OEM, COMPATIBILITY_NOTE, SKU_PREFIX,
} from '../src/data/initial-catalogue.js';
import { slugify, isValidSlug, normalizeOem } from '../src/services/slug.js';
import { createTestDb } from './helpers/testDb.js';
import { createCategoryRepository } from '../src/db/repositories/categories.js';
import { createProductRepository } from '../src/db/repositories/products.js';
import { createVehicleRepository } from '../src/db/repositories/vehicles.js';

const products = buildProducts();
const categories = buildCategories();
const vehicle = buildVehicle();

/* شماره فنی‌هایی که اجازهٔ حضور دارند — و بس. */
const ALLOWED_OEM = new Map([
  ['فیلتر روغن', '1109CL'],
  ['فیلتر هوا', '1444TT'],
  ['پمپ آب کمکی توربو', '9806790780'],
]);

/* ═══════════════════════════════════════════════ ۱. شمارش رکوردها */

test('کاتالوگ دقیقا ۷۰ محصول دارد', () => {
  assert.equal(products.length, 70);
});

test('کاتالوگ دقیقا ۶ دسته دارد و همه استفاده می‌شوند', () => {
  assert.equal(categories.length, 6);

  const used = new Set(products.map((p) => p.categoryKey));
  assert.equal(used.size, 6, 'هر دسته باید دست‌کم یک محصول داشته باشد');

  for (const c of categories) {
    assert.ok(used.has(c.key), `دستهٔ «${c.name}» هیچ محصولی ندارد`);
  }
});

test('هر محصول به یک دستهٔ تعریف‌شده اشاره می‌کند', () => {
  const keys = new Set(CATEGORIES.map((c) => c.key));
  for (const p of products) {
    assert.ok(keys.has(p.categoryKey), `دستهٔ ناشناخته در «${p.name}»`);
  }
});

/* ═════════════════════════════════════════ ۲. یکتایی کد کالا و نشانی */

test('کد کالا یکتا و قطعی است', () => {
  const skus = products.map((p) => p.sku);
  assert.equal(new Set(skus).size, skus.length, 'کد کالای تکراری');

  /* قطعی بودن: ساختن دوباره باید همان نتیجه را بدهد. */
  assert.deepEqual(buildProducts().map((p) => p.sku), skus);
  assert.equal(skus[0], `${SKU_PREFIX}-001`);
  assert.equal(skus[69], `${SKU_PREFIX}-070`);
});

test('کد کالا شماره فنی سازنده نیست', () => {
  /* کد کالا کد *داخلی* فروشگاه است. اگر روزی کسی شماره فنی را داخل
     sku بگذارد، مشتری آن را با کد سازنده اشتباه می‌گیرد. */
  for (const p of products) {
    assert.match(p.sku, /^P2008-\d{3}$/);
    if (p.oemNumber) {
      assert.notEqual(normalizeOem(p.sku), normalizeOem(p.oemNumber));
    }
  }
});

test('نشانی یکتاست و با قاعدهٔ خودِ پروژه ساخته شده', () => {
  const slugs = products.map((p) => p.slug);
  assert.equal(new Set(slugs).size, slugs.length, 'نشانی تکراری');

  for (const p of products) {
    assert.equal(p.slug, slugify(p.name), 'نشانی باید از slugify پروژه بیاید');
    assert.ok(isValidSlug(p.slug), `نشانی نامعتبر: ${p.slug}`);
    assert.ok(p.slug.length <= 200);
  }
});

test('نشانی دسته‌ها و خودرو هم از همان قاعده می‌آید', () => {
  for (const c of categories) {
    assert.equal(c.slug, slugify(c.name));
    assert.ok(isValidSlug(c.slug));
  }
  assert.equal(new Set(categories.map((c) => c.slug)).size, categories.length);
  assert.equal(vehicle.slug, slugify(vehicle.displayName));
  assert.ok(isValidSlug(vehicle.slug));
});

/* ═══════════════════════════════════════════════════ ۳. نام فارسی */

test('نام هر محصول فارسی و تمیز است', () => {
  const persian = /[؀-ۿ]/;
  for (const p of products) {
    assert.ok(persian.test(p.name), `نام فارسی نیست: ${p.name}`);
    assert.equal(p.name, p.name.trim(), `فاصلهٔ اضافه در «${p.name}»`);
    assert.ok(p.name.length >= 2 && p.name.length <= 200);
    /* نام نباید نشانی اینترنتی یا ارجاع منبع داشته باشد. */
    assert.doesNotMatch(p.name, /https?:|www\./i, 'نشانی در نام محصول');
  }
});

test('نام دسته‌ها فارسی است', () => {
  const persian = /[؀-ۿ]/;
  for (const c of categories) assert.ok(persian.test(c.name));
});

test('نام محصول‌ها تکراری نیست', () => {
  const names = products.map((p) => p.name);
  assert.equal(new Set(names).size, names.length);
});

/* ═════════════════════════════════ ۴. هیچ داده‌ای ساخته نشده است */

test('هیچ قیمتی ساخته نشده است', () => {
  for (const p of products) {
    assert.equal(p.priceToman, 0, `قیمت ساختگی در «${p.name}»`);
    assert.equal(p.salePriceToman, null, `قیمت حراج ساختگی در «${p.name}»`);
  }
});

test('هیچ موجودی‌ای ساخته نشده است', () => {
  for (const p of products) {
    assert.equal(p.stockQty, 0, `موجودی ساختگی در «${p.name}»`);
    assert.equal(p.availability, 'on_order',
      `وضعیت «${p.name}» باید «قابل سفارش» باشد تا ادعای موجودی نشود`);
  }
});

test('هیچ برندی ساخته نشده است', () => {
  /* سازندگان قطعات جایگزین برندِ محصول ما نیستند. */
  for (const p of products) {
    assert.equal(p.brandId, null, `برند ساختگی در «${p.name}»`);
    assert.ok(!('brandName' in p), 'نام برند نباید اصلا در رکورد باشد');
  }
});

test('فقط سه شماره فنی، و همه با وضعیت «نامزد»', () => {
  const withOem = products.filter((p) => p.oemNumber);
  assert.equal(withOem.length, 3);

  for (const p of withOem) {
    assert.equal(p.oemNumber, ALLOWED_OEM.get(p.name),
      `شماره فنی غیرمجاز روی «${p.name}»`);
    assert.equal(p.meta.oemStatus, 'candidate',
      'شماره فنی نباید تأییدشده اعلام شود');
    assert.equal(p.meta.evidence, 'B');
  }

  /* بقیه باید کاملا خالی باشند. */
  for (const p of products) {
    if (!ALLOWED_OEM.has(p.name)) {
      assert.equal(p.oemNumber, null, `شماره فنی ساختگی روی «${p.name}»`);
    }
  }
});

test('شماره فنی‌های رد شده وارد کاتالوگ نشده‌اند', () => {
  const used = products.map((p) => normalizeOem(p.oemNumber)).filter(Boolean);
  for (const bad of ['1617282980', '1906C0', '6447XG', '5960L5', '5960G4', '596092']) {
    assert.ok(!used.includes(normalizeOem(bad)),
      `شماره فنی رد شده «${bad}» دوباره اضافه شده است`);
  }
  assert.ok(REJECTED_OEM.length >= 4, 'دلیل رد شدن باید مستند بماند');
  for (const r of REJECTED_OEM) assert.ok(r.reason.length > 20);
});

test('هیچ مشخصهٔ فنی ساختگی‌ای نیست', () => {
  for (const p of products) {
    assert.deepEqual(p.specs, {}, `مشخصات ساختگی در «${p.name}»`);
    assert.equal(p.weightGrams, null, `وزن ساختگی در «${p.name}»`);
    assert.equal(p.description, null);
    assert.equal(p.shortDescription, null);
  }
});

test('یادداشت سازگاری ادعای بیش از حد نمی‌کند', () => {
  /* باید بگوید «فهرست شده» و «تأیید تأمین‌کننده»، نه «سازگار است». */
  assert.match(COMPATIBILITY_NOTE, /فهرست شده/);
  assert.match(COMPATIBILITY_NOTE, /تأمین‌کننده/);
  for (const p of products) {
    assert.equal(p.compatibilityNote, COMPATIBILITY_NOTE);
  }
});

test('زیرکد موتور ساخته نشده است', () => {
  assert.equal(vehicle.engineCode, null, 'زیرکد EP6 تأیید نشده و نباید نوشته شود');
  const blob = JSON.stringify({ vehicle, products });
  for (const guess of ['EP6DT', 'EP6FDT', 'EP6FDTM', 'EP6TDTM']) {
    assert.ok(!blob.includes(guess), `زیرکد حدسی «${guess}» در داده است`);
  }
  /* آنچه تأیید شده، مجاز است. */
  assert.match(vehicle.engineLabel, /THP165/);
});

/* ══════════════════════════════════ ۵. قطعه‌های رد شده غایب‌اند */

test('قطعه‌های گیربکس دستی در کاتالوگ نیستند', () => {
  const names = new Set(products.map((p) => p.name));
  for (const bad of ['دیسک کلاچ', 'صفحه کلاچ', 'بلبرینگ کلاچ', 'کیت کلاچ',
    'دو شاخه کلاچ', 'پمپ کلاچ بالا', 'پمپ کلاچ پایین', 'دنده برنجی', 'ماهک دنده']) {
    assert.ok(!names.has(bad), `قطعهٔ گیربکس دستی «${bad}» نباید باشد`);
  }
  /* هیچ نامی نباید اصلا واژهٔ «کلاچ» داشته باشد. */
  for (const p of products) {
    assert.doesNotMatch(p.name, /کلاچ/, `«${p.name}» به گیربکس دستی اشاره دارد`);
  }
});

test('ایربگ و لوازم جانبی در کاتالوگ نیستند', () => {
  for (const p of products) {
    assert.doesNotMatch(p.name, /ایربگ/, `قطعهٔ پیروتکنیک: ${p.name}`);
  }
  const names = new Set(products.map((p) => p.name));
  for (const bad of ['ضبط', 'مانیتور', 'بلندگو', 'ریموت', 'روکش صندلی',
    'باربند', 'داشبورد', 'کنسول وسط']) {
    assert.ok(!names.has(bad), `لوازم جانبی «${bad}» نباید باشد`);
  }
});

test('هر قطعهٔ رد شده دلیل مکتوب دارد و در کاتالوگ نیست', () => {
  const names = new Set(products.map((p) => p.name));
  assert.ok(REJECTED.length > 0);
  for (const r of REJECTED) {
    assert.ok(r.reason && r.reason.length > 10, `دلیل ناکافی برای «${r.name}»`);
    assert.ok(!names.has(r.name), `«${r.name}» رد شده ولی در کاتالوگ است`);
  }
});

/* ═════════════════════════════════ ۶. هیچ محصولی منتشر نشده است */

test('همهٔ محصول‌ها غیرفعال‌اند تا دادهٔ تجاری واقعی برسد', () => {
  for (const p of products) {
    assert.equal(p.isActive, false, `«${p.name}» نباید منتشر شده باشد`);
    assert.equal(p.isFeatured, false);
    assert.equal(p.isNew, false);
  }
});

/* ═════════════════════════════════════════ ۷. هیچ تصویر جعلی نیست */

test('هیچ محصولی به تصویری ارجاع نمی‌دهد', () => {
  for (const p of products) {
    assert.deepEqual(p.images, [], `ارجاع تصویر در «${p.name}»`);
  }
});

test('هیچ نشانی تصویر یا فایل بیرونی در داده نیست', () => {
  const blob = JSON.stringify(products);
  assert.doesNotMatch(blob, /https?:\/\//, 'نشانی اینترنتی در دادهٔ محصول');
  assert.doesNotMatch(blob, /\.(jpe?g|png|webp|svg|gif|avif)\b/i, 'نام فایل تصویر در داده');
  assert.doesNotMatch(blob, /\/media\/products/, 'ارجاع به مسیر تصویر');
});

/* ══════════════════════════ ۸. داده واقعا روی اسکیما درج می‌شود */

test('کل کاتالوگ روی PostgreSQL واقعی درج می‌شود', async (t) => {
  const db = await createTestDb();
  t.after(() => db.close());

  const categoryRepo = createCategoryRepository(db);
  const productRepo = createProductRepository(db);
  const vehicleRepo = createVehicleRepository(db);

  /* دسته‌ها */
  const categoryIds = new Map();
  for (const c of categories) {
    categoryIds.set(c.key, await categoryRepo.create(c));
  }
  assert.equal(categoryIds.size, 6);

  /* خودرو */
  const vehicleId = await vehicleRepo.create(vehicle);
  assert.ok(vehicleId);

  /* محصول‌ها — از راه همان مخزن تولید، پس search_text و شکل نرمال‌شدهٔ
     شمارهٔ فنی هم همان‌طور ساخته می‌شوند که در تولید. */
  const ids = [];
  for (const p of products) {
    ids.push(await productRepo.create({ ...p, categoryId: categoryIds.get(p.categoryKey) }));
  }
  assert.equal(ids.length, 70);
  assert.equal(new Set(ids).size, 70);

  /* سازگاری خودرو */
  for (const id of ids) {
    assert.equal(await productRepo.setVehicles(id, [vehicleId]), 1);
  }

  /* هیچ‌کدام در ویترین دیده نمی‌شوند، چون همه غیرفعال‌اند. */
  const shopfront = await productRepo.list({ page: 1, perPage: 60 });
  assert.equal(shopfront.total, 0, 'کاتالوگ غیرفعال نباید در ویترین بیاید');

  /* ولی در پنل مدیر همه هستند. */
  const adminView = await productRepo.adminList({ page: 1, perPage: 100 });
  assert.equal(adminView.total, 70);

  /* شمارهٔ فنی نرمال‌شده را مخزن ساخته است. */
  const row = await db.queryOne(
    'SELECT oem_number, oem_number_normalized, price_toman, stock_qty, availability,'
    + ' is_active, brand_id FROM products WHERE sku = $1', ['P2008-001']);
  assert.equal(row.oem_number, '1109CL');
  assert.equal(row.oem_number_normalized, '1109CL');
  assert.equal(Number(row.price_toman), 0);
  assert.equal(row.stock_qty, 0);
  assert.equal(row.availability, 'on_order');
  assert.equal(row.is_active, false);
  assert.equal(row.brand_id, null);

  /* هیچ برندی و هیچ تصویری در پایگاه داده ساخته نشده است. */
  const brandCount = await db.queryOne('SELECT COUNT(*)::int AS n FROM brands');
  assert.equal(brandCount.n, 0);
  const imageCount = await db.queryOne('SELECT COUNT(*)::int AS n FROM product_images');
  assert.equal(imageCount.n, 0);

  /* دقیقا سه محصول شماره فنی دارند. */
  const oemCount = await db.queryOne(
    'SELECT COUNT(*)::int AS n FROM products WHERE oem_number IS NOT NULL');
  assert.equal(oemCount.n, 3);
});

test('درج دوباره به‌خاطر یکتایی کد کالا شکست می‌خورد، نه اینکه تکراری بسازد', async (t) => {
  const db = await createTestDb();
  t.after(() => db.close());

  const categoryRepo = createCategoryRepository(db);
  const productRepo = createProductRepository(db);
  const categoryId = await categoryRepo.create(categories[0]);

  const first = products[0];
  await productRepo.create({ ...first, categoryId });
  await assert.rejects(
    () => productRepo.create({ ...first, categoryId }),
    (err) => err.code === 'duplicate',
    'کد کالای تکراری باید رد شود'
  );
});

test('buildSku قطعی و صفر-پرشده است', () => {
  assert.equal(buildSku(0), 'P2008-001');
  assert.equal(buildSku(9), 'P2008-010');
  assert.equal(buildSku(69), 'P2008-070');
});
