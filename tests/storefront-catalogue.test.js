/* ============================================================================
 * tests/storefront-catalogue.test.js — نگهبان کاتالوگ قابل نمایش
 * ----------------------------------------------------------------------------
 * دو لایه:
 *
 *   ۱. *داده* — هیچ قیمت، موجودی، برند، شماره فنی، مشخصه یا تصویری ساخته
 *      نشده باشد، و سطح شواهدِ مانیفست بی‌سروصدا ارتقا پیدا نکرده باشد.
 *
 *   ۲. *نمایش* — ده قطعه با همان برنامهٔ واقعی Express رندر شوند و هیچ‌جا
 *      «۰ تومان» به مشتری گفته نشود. این مهم‌ترین آزمون این فایل است:
 *      قیمتِ صفر یک نشانهٔ داخلی است و هرگز نباید شبیه قیمت دیده شود.
 *
 * پایگاه داده PGlite است — همان الگوی بقیهٔ آزمون‌ها: PostgreSQL کامپایل‌شده
 * به WebAssembly، داخل همین پروسه، بدون هیچ سروری و بدون هیچ اتصال شبکه‌ای.
 * ==========================================================================*/
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

import { createTestDb } from './helpers/testDb.js';
import { createProductRepository } from '../src/db/repositories/products.js';
import { createCategoryRepository } from '../src/db/repositories/categories.js';
import { createBrandRepository } from '../src/db/repositories/brands.js';
import { createVehicleRepository } from '../src/db/repositories/vehicles.js';
import {
  buildStorefrontProducts, buildStorefrontCategories, buildStorefrontBrands,
  toRepositoryRecord, isPriceOnRequest, STOREFRONT_CATEGORIES, STOREFRONT_BRANDS,
  COMPATIBILITY_NOTE, INITIAL_AVAILABILITY, AVAILABILITY_ON_ENQUIRY_LABEL,
  PRICE_ON_ENQUIRY_LABEL,
} from '../src/data/storefront-catalogue.js';
import { COMMERCIAL_PRODUCTS } from '../src/data/commercial-catalogue-manifest.js';
import { VALIDATED_PRODUCTS, OPEN_ISSUES } from '../src/data/validated-catalogue-manifest.js';
import { slugify, isValidSlug } from '../src/services/slug.js';

const products = buildStorefrontProducts();
const categories = buildStorefrontCategories();
const brands = buildStorefrontBrands();

/* کاتالوگ ویترین از دو مانیفست ساخته می‌شود و از هیچ جای دیگری. */
const MANIFEST = [...COMMERCIAL_PRODUCTS, ...VALIDATED_PRODUCTS];

let db, server, BASE;

before(async () => {
  db = await createTestDb();

  /* دسته‌ها، سپس ده قطعه — از راه همان مخزن‌های تولید. */
  const categoryRepo = createCategoryRepository(db);
  const productRepo = createProductRepository(db);
  const brandRepo = createBrandRepository(db);
  const ids = new Map();
  const brandIds = new Map();
  for (const c of categories) ids.set(c.key, await categoryRepo.create(c));
  for (const b of brands) brandIds.set(b.key, await brandRepo.create(b));
  for (const p of products) {
    await productRepo.create(toRepositoryRecord(
      p, ids.get(p.categoryKey), p.brandKey ? brandIds.get(p.brandKey) : null));
  }

  const { createApp } = await import('../src/app.js');
  const app = createApp({
    repositories: {
      products: productRepo,
      categories: categoryRepo,
      brands: brandRepo,
      vehicles: createVehicleRepository(db),
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

const text = async (path) => (await fetch(BASE + path)).text();

/* ═══════════════════════════════════════════ ۱. شمارش و ریشهٔ داده */

test('کاتالوگ ویترین دقیقا چهل قطعه دارد', () => {
  assert.equal(products.length, 40);
  assert.equal(products.length, MANIFEST.length);
  assert.equal(COMMERCIAL_PRODUCTS.length, 10, 'مانیفست اول باید ده قطعه بماند');
  assert.equal(VALIDATED_PRODUCTS.length, 30, 'مانیفست دوم باید سی قطعه باشد');
});

test('هر قطعه دقیقا از یکی از دو مانیفست آمده است — نه جای دیگر', () => {
  const bySku = new Map(MANIFEST.map((m) => [m.sku, m]));
  assert.equal(bySku.size, 40, 'کد کالای تکراری بین دو مانیفست');

  for (const p of products) {
    const m = bySku.get(p.sku);
    assert.ok(m, `کد کالای بیگانه: ${p.sku}`);
    assert.equal(p.name, m.name, `نام با مانیفست نمی‌خواند: ${p.sku}`);
    assert.equal(p.oemNumber, m.oemNumber ?? null, `شماره فنی عوض شده: ${p.sku}`);
  }
});

test('ده دسته، و همه استفاده می‌شوند', () => {
  assert.equal(categories.length, 10);
  const used = new Set(products.map((p) => p.categoryKey));
  assert.equal(used.size, 10);
  for (const c of STOREFRONT_CATEGORIES) {
    assert.ok(used.has(c.key), `دستهٔ «${c.name}» خالی است`);
  }
});

test('نشانی‌ها با قاعدهٔ خودِ پروژه ساخته شده‌اند و یکتا هستند', () => {
  for (const p of products) {
    assert.equal(p.slug, slugify(p.name));
    assert.ok(isValidSlug(p.slug));
  }
  assert.equal(new Set(products.map((p) => p.slug)).size, 40);
  assert.equal(new Set(products.map((p) => p.sku)).size, 40);
  assert.equal(new Set(products.map((p) => p.name)).size, 40, 'نام تکراری');
  for (const c of categories) assert.equal(c.slug, slugify(c.name));
});

test('هر قطعه فیلدهای الزامی را دارد', () => {
  const availabilities = new Set(['in_stock', 'out_of_stock', 'on_order', 'discontinued']);
  for (const p of products) {
    for (const f of ['name', 'sku', 'slug', 'categoryKey', 'availability', 'compatibilityNote']) {
      assert.ok(p[f], `فیلد الزامی «${f}» در «${p.name}» خالی است`);
    }
    assert.ok(availabilities.has(p.availability), `وضعیت نامعتبر: ${p.availability}`);
    assert.equal(typeof p.priceOnRequest, 'boolean');
    assert.ok(Array.isArray(p.images));
    assert.ok(p.meta && typeof p.meta === 'object');
  }
});

test('نام هر قطعه و هر دسته فارسی و تمیز است', () => {
  const persian = /[\u0600-\u06FF]/;
  for (const p of products) {
    assert.ok(persian.test(p.name), `نام فارسی نیست: ${p.name}`);
    assert.equal(p.name, p.name.trim(), `فاصلهٔ اضافه در «${p.name}»`);
    assert.ok(p.name.length >= 2 && p.name.length <= 200);
    assert.doesNotMatch(p.name, /https?:|www\./i, 'نشانی در نام محصول');
  }
  for (const c of categories) assert.ok(persian.test(c.name));
  for (const b of brands) assert.ok(persian.test(b.name), `نام برند فارسی نیست: ${b.name}`);
});

/* ═══════════════════════════════ ۲. هیچ دادهٔ تجاری‌ای ساخته نشده */

test('هیچ قیمتی ساخته نشده است', () => {
  for (const p of products) {
    assert.equal(p.priceToman, null, `قیمت ساختگی در «${p.name}»`);
    assert.equal(p.priceOnRequest, true);
    assert.equal(p.salePriceToman, null, `قیمت حراج ساختگی در «${p.name}»`);
  }
});

test('قیمتِ پژوهش‌شدهٔ فروشنده به قیمت فروشگاه تبدیل نشده است', () => {
  /* مهم‌ترین مرز این کار: عددِ فروشندهٔ دیگر نباید قیمت ما شود. */
  const sellerPrices = MANIFEST
    .map((m) => m.researchedSellerPriceToman).filter(Boolean);
  assert.ok(sellerPrices.length >= 35, 'مانیفست‌ها باید قیمت پژوهشی داشته باشند');

  for (const p of products) {
    const row = toRepositoryRecord(p, 1);
    assert.equal(row.priceToman, 0, 'فقط صفرِ نشانه‌ای مجاز است');
    assert.ok(!sellerPrices.includes(row.priceToman));
    assert.equal(p.meta.researchedSellerPriceToman,
      MANIFEST.find((m) => m.sku === p.sku).researchedSellerPriceToman ?? null,
      'قیمت پژوهشی فقط در فراداده می‌ماند');
  }
});

test('هیچ قیمت پژوهشی‌ای به HTML ویترین راه پیدا نمی‌کند', async () => {
  /* اگر روزی کسی researchedSellerPriceToman را به قالب وصل کند، اینجا
     می‌شکند: قیمت فروشندهٔ دیگر هرگز نباید به مشتری نشان داده شود. */
  const html = await text('/products');
  for (const m of MANIFEST) {
    if (!m.researchedSellerPriceToman) continue;
    const grouped = m.researchedSellerPriceToman.toLocaleString('en-US');
    assert.ok(!html.includes(String(m.researchedSellerPriceToman)),
      `قیمت خام ${m.researchedSellerPriceToman} در ویترین`);
    assert.ok(!html.includes(grouped), `قیمت قالب‌بندی‌شده ${grouped} در ویترین`);
  }
});

test('هیچ موجودی و وضعیت ساختگی‌ای نیست', () => {
  for (const p of products) {
    assert.equal(p.stockQty, null, `موجودی ساختگی در «${p.name}»`);
    assert.equal(p.availability, INITIAL_AVAILABILITY);
    /* out_of_stock: تنها گزارهٔ راست — انبار ما خالی است.
       on_order ممنوع است چون ادعای «قابل تهیه بودن» می‌کند. */
    assert.equal(p.availability, 'out_of_stock');
    assert.notEqual(p.availability, 'on_order', 'نباید ادعای قابل سفارش بودن شود');
    assert.notEqual(p.availability, 'in_stock');
    assert.equal(toRepositoryRecord(p, 1).stockQty, 0);
  }
});

test('برند فقط از روی اعلام صریح منبع می‌آید', () => {
  const allowed = new Set(STOREFRONT_BRANDS.map((b) => b.key));
  for (const p of products) {
    if (p.brandKey === null) {
      assert.equal(p.meta.sellerStatedBrand, null,
        `«${p.name}» برند منبع دارد ولی به برند وصل نشده`);
      continue;
    }
    assert.ok(allowed.has(p.brandKey), `کلید برند ناشناخته: ${p.brandKey}`);
    assert.ok(p.meta.sellerStatedBrand,
      `«${p.name}» برند دارد ولی منبع برندی اعلام نکرده — یعنی ساختگی است`);
  }
  /* قطعه‌ای که منبعش برند نگفته باید بی‌برند بماند. */
  const unbranded = products.filter((p) => p.brandKey === null);
  assert.equal(unbranded.length, 1);
  assert.equal(unbranded[0].name, 'فیلتر هوا');
});

test('برندها همان‌هایی‌اند که منبع نام برده و کشورشان حدس زده نشده', () => {
  assert.equal(brands.length, 5);
  assert.deepEqual(brands.map((b) => b.key).sort(),
    ['bosch', 'depo', 'eurorepar', 'mann', 'psa']);
  for (const b of brands) {
    assert.equal(b.country, null, 'کشور برند ثابت نشده و نباید نوشته شود');
    assert.equal(b.slug, slugify(b.name));
    assert.ok(isValidSlug(b.slug));
  }
  assert.equal(new Set(brands.map((b) => b.slug)).size, 5);
});

test('سازندهٔ قطعه با برند کالا اشتباه نشده است', () => {
  /* Valeo، KYB، Delphi، NGK، Omron و … سازنده‌اند، نه برندی که کالا
     زیر نامش فروخته می‌شود. نباید به جدول برندها راه پیدا کنند. */
  const brandNames = brands.map((b) => b.name);
  for (const maker of ['Valeo', 'KYB', 'Delphi', 'NGK', 'Omron', 'Pierburg']) {
    assert.ok(!brandNames.includes(maker), `${maker} سازنده است، نه برند کالا`);
  }
});

test('سطح شواهد شماره فنی بی‌سروصدا ارتقا نیافته است', () => {
  const allowed = new Set(['verified_candidate', 'candidate', 'conflicting', 'not_found', null]);
  for (const p of products) {
    assert.ok(allowed.has(p.meta.oemStatus), `وضعیت ناشناخته: ${p.meta.oemStatus}`);
    assert.notEqual(p.meta.oemStatus, 'verified', 'هیچ‌چیز «verified» نمی‌شود');
    const m = MANIFEST.find((x) => x.sku === p.sku);
    assert.equal(p.meta.oemStatus, m.oemStatus ?? null, `وضعیت عوض شده: ${p.sku}`);
  }
  /* فقط همان شماره‌های مستقلا ارجاع‌شده اجازهٔ verified_candidate دارند. */
  const vc = products.filter((p) => p.meta.oemStatus === 'verified_candidate');
  assert.equal(vc.length, 2);
  for (const p of vc) assert.ok(['1109CL', '1444TT', '9806790780'].includes(p.oemNumber));
});

test('شماره فنیِ ناسازگار یا پیدانشده به محصول نمی‌چسبد', () => {
  /* اگر منابع با هم نخوانند، هیچ عددی نشان داده نمی‌شود — نه اینکه
     یکی‌شان انتخاب شود. */
  for (const p of products) {
    if (p.meta.oemStatus === 'conflicting' || p.meta.oemStatus === 'not_found') {
      assert.equal(p.oemNumber, null, `«${p.name}» نباید شماره فنی نشان بدهد`);
    }
  }
  const conflicting = products.filter((p) => p.meta.oemStatus === 'conflicting');
  assert.equal(conflicting.length, 1);
  assert.equal(conflicting[0].name, 'شمع اورجینال پژو سیتروئن');

  /* اعداد ناسازگار نباید هیچ‌جای دادهٔ محصول باشند. */
  const blob = JSON.stringify(products);
  for (const bad of ['5960L5', '5960G4', '596092']) {
    assert.ok(!blob.includes(bad), `شمارهٔ ناسازگار «${bad}» در داده است`);
  }
});

test('هیچ تطبیق A94 یا THP165 تأییدشده اعلام نشده است', () => {
  for (const p of products) {
    assert.notEqual(p.meta.a94Fitment, 'verified', `${p.sku}: A94 نباید verified باشد`);
    assert.notEqual(p.meta.thp165Fitment, 'verified', `${p.sku}: THP165 نباید verified باشد`);
  }
  /* زیرکد EP6 هنوز حل نشده و نباید در داده باشد. */
  const blob = JSON.stringify(products);
  for (const guess of ['EP6DT', 'EP6FDT', 'EP6FDTM', 'EP6TDTM']) {
    assert.ok(!blob.includes(guess), `زیرکد حدسی «${guess}» در داده است`);
  }
});

test('مسائل باز مستند مانده‌اند', () => {
  assert.ok(OPEN_ISSUES.length >= 10, 'مسائل باز باید ثبت شده باشند');
  const skus = new Set(products.map((p) => p.sku));
  for (const i of OPEN_ISSUES) {
    assert.ok(i.id && i.issue && i.issue.length > 20, `مسئلهٔ ناقص: ${i.id}`);
    for (const s of i.affects) {
      if (s !== '*') assert.ok(skus.has(s), `مسئله به کد ناشناخته اشاره دارد: ${s}`);
    }
  }
});

test('جفت‌های گونه‌ای علامت خورده‌اند', () => {
  const variants = products.filter((p) => p.meta.variantOf);
  assert.equal(variants.length, 3);
  const skus = new Set(products.map((p) => p.sku));
  for (const v of variants) {
    assert.ok(skus.has(v.meta.variantOf), `گونهٔ ${v.sku} به کد ناموجود اشاره دارد`);
    assert.notEqual(v.meta.variantOf, v.sku);
  }
});

test('هیچ مشخصه، توضیح یا ادعای سازگاریِ ساختگی نیست', () => {
  for (const p of products) {
    assert.deepEqual(p.specs, {});
    assert.equal(p.weightGrams, null);
    assert.equal(p.description, null);
    assert.equal(p.shortDescription, null);
    assert.equal(p.compatibilityNote, COMPATIBILITY_NOTE);
    assert.equal(p.meta.compatibilityVerified, false);
  }
  /* جمله باید دقیقا اندازهٔ شواهد باشد: «در منابع تجاری بررسی‌شده
     مشاهده شده»، و نه ادعای نسل/موتور/گیربکس. */
  assert.match(COMPATIBILITY_NOTE, /منابع تجاری بررسی‌شده/);
  assert.match(COMPATIBILITY_NOTE, /تأمین‌کننده/);
  for (const claim of ['A94', 'THP165', 'EAT6', 'ایکاپ', 'ایران‌خودرو']) {
    assert.ok(!COMPATIBILITY_NOTE.includes(claim),
      `یادداشت سازگاری ادعای تأییدنشدهٔ «${claim}» دارد`);
  }
});

test('هیچ تصویری ارجاع داده نشده و وضعیت حقوقی دست‌نخورده است', () => {
  for (const p of products) {
    assert.deepEqual(p.images, []);
    assert.equal(p.meta.imageReuseStatus, 'not_cleared');
  }
  const blob = JSON.stringify(products);
  assert.doesNotMatch(blob, /\.(jpe?g|png|webp|svg|gif|avif)\b/i);
  assert.doesNotMatch(blob, /\/media\/products/);
});

/* ══════════════════════════════════ ۳. نمایش: هرگز «۰ تومان» */

/* اندازهٔ صفحهٔ ویترین ثابت است (PER_PAGE = ۱۲) و perPage پارامتر
   پذیرفته‌شده‌ای نیست، پس چهل قطعه روی چهار صفحه پخش می‌شوند. */
const LISTING_PAGES = 4;
const allListingHtml = async (base) => {
  const out = [];
  for (let i = 1; i <= LISTING_PAGES; i++) {
    out.push(await text(`${base}${base.includes('?') ? '&' : '?'}page=${i}`));
  }
  return out;
};

test('فهرست محصولات، در چهار صفحه، همهٔ چهل قطعه را نشان می‌دهد', async () => {
  const pages = await allListingHtml('/products');
  const joined = pages.join('\n');
  for (const p of products) {
    assert.ok(joined.includes(p.name), `«${p.name}» در هیچ صفحه‌ای نیست`);
  }
  assert.doesNotMatch(joined, /هنوز محصولی ثبت نشده است/);
  assert.ok(!joined.includes('۰ تومان'), 'هیچ صفحه‌ای نباید «۰ تومان» بدهد');
});

test('کارت محصول «استعلام قیمت» می‌دهد، نه «۰ تومان»', async () => {
  const html = await text('/products');
  assert.match(html, /استعلام قیمت/);
  assert.ok(!html.includes('۰ تومان'), 'هرگز نباید «۰ تومان» رندر شود');
  assert.ok(!html.includes('0 تومان'));
});

/* نشانِ موجودیِ *کارت محصول*. عمدا فقط همین span‌ها سنجیده می‌شوند و نه
   کل صفحه: نوار پالایش (listing-toolbar) یک select دارد که هر چهار وضعیت
   سامانه را به‌عنوان *گزینهٔ فیلتر* فهرست می‌کند. آن ادعایی دربارهٔ هیچ
   محصولی نیست و بخشی از قابلیت موجود فهرست است. */
const stockChips = (html) =>
  [...html.matchAll(/<span class="stock[^"]*">\s*([^<]*?)\s*<\/span>/g)].map((m) => m[1]);

const availabilityChips = (html) =>
  [...html.matchAll(/<span class="availability[^"]*">\s*([^<]*?)\s*<\/span>/g)].map((m) => m[1]);

test('نشان موجودیِ هر کارت دقیقا «استعلام موجودی» است', async () => {
  const pages = await allListingHtml('/products');
  let total = 0;
  for (const html of pages) {
    const chips = stockChips(html);
    total += chips.length;
    for (const c of chips) {
      assert.equal(c, AVAILABILITY_ON_ENQUIRY_LABEL, `نشان نادرست: «${c}»`);
    }
    assert.doesNotMatch(html, /stock--in/, 'هیچ نشانِ سبزِ «موجود» نباید باشد');
  }
  assert.equal(total, 40, 'روی هم باید چهل نشان موجودی باشد');
});

test('هیچ کارت محصولی در هیچ فهرستی ادعای موجودی نمی‌کند', async () => {
  const cat = categories.find((c) => c.key === 'filters');
  const paths = ['/', '/products', `/category/${encodeURIComponent(cat.slug)}`,
    '/search?q=%D9%81%DB%8C%D9%84%D8%AA%D8%B1'];
  for (const path of paths) {
    const chips = stockChips(await text(path));
    assert.ok(chips.length > 0, `هیچ کارتی در ${path} نیست`);
    for (const c of chips) {
      assert.equal(c, AVAILABILITY_ON_ENQUIRY_LABEL, `«${c}» در ${path}`);
      assert.notEqual(c, 'موجود');
      assert.notEqual(c, 'قابل سفارش');
      assert.notEqual(c, 'ناموجود');
    }
  }
  assert.equal(AVAILABILITY_ON_ENQUIRY_LABEL, 'استعلام موجودی');
  assert.equal(PRICE_ON_ENQUIRY_LABEL, 'استعلام قیمت');
});

test('نشان موجودی صفحهٔ محصول هم «استعلام موجودی» است', async () => {
  for (const p of products) {
    const html = await text(`/product/${encodeURIComponent(p.slug)}`);
    const chips = availabilityChips(html);
    assert.equal(chips.length, 1, `«${p.name}» باید یک نشان وضعیت داشته باشد`);
    assert.equal(chips[0], AVAILABILITY_ON_ENQUIRY_LABEL, `«${p.name}»: ${chips[0]}`);
  }
});

test('صفحهٔ هر محصول قیمت جعلی نمی‌دهد و استعلام را صریح می‌گوید', async () => {
  for (const p of products) {
    const html = await text(`/product/${encodeURIComponent(p.slug)}`);
    assert.ok(html.includes(p.name), `صفحهٔ «${p.name}» باز نشد`);
    assert.match(html, /استعلام قیمت/, `«${p.name}» قیمت استعلامی نشان نمی‌دهد`);
    assert.ok(!html.includes('۰ تومان'), `«${p.name}» صفر را قیمت نشان داد`);
    /* وضعیت هم باید استعلامی باشد — هم در کادر خرید، هم در جدول مشخصات. */
    assert.match(html, /استعلام موجودی/, `«${p.name}» وضعیت استعلامی ندارد`);
    assert.doesNotMatch(html, /قابل سفارش/, `«${p.name}» ادعای قابل سفارش کرد`);
    assert.doesNotMatch(html, /ناموجود/, `«${p.name}» ادعای ناموجود کرد`);
    assert.match(html, /قیمت و موجودی این قطعه هنوز نهایی نشده/);
    /* سازگاری باید با همان مرز شواهد گفته شود. */
    assert.match(html, /تأیید شود/);
  }
});

test('صفحهٔ اصلی و جست‌وجو هم «۰ تومان» نشان نمی‌دهند', async () => {
  for (const path of ['/', '/search?q=%D9%81%DB%8C%D9%84%D8%AA%D8%B1']) {
    const html = await text(path);
    assert.ok(!html.includes('۰ تومان'), `«۰ تومان» در ${path}`);
  }
});

test('صفحهٔ دسته هم قطعه‌ها را با استعلام قیمت نشان می‌دهد', async () => {
  const cat = categories.find((c) => c.key === 'filters');
  const html = await text(`/category/${encodeURIComponent(cat.slug)}`);
  assert.match(html, /استعلام قیمت/);
  assert.ok(!html.includes('۰ تومان'));
  assert.ok(html.includes('فیلتر روغن'));
});

test('دکمهٔ «افزودن به سبد» اضافه نشده است', async () => {
  const p = products[0];
  const html = await text(`/product/${encodeURIComponent(p.slug)}`);
  assert.doesNotMatch(html, /افزودن به سبد/);
  assert.doesNotMatch(html, /add-to-cart/);
});

/* ══════════════════════════════════════ ۴. آنچه در پایگاه داده نشست */

test('چهل ردیف با صفرِ نشانه‌ای، برندِ اعلام‌شده و بدون تصویر درج شده‌اند', async () => {
  const rows = await db.query(
    'SELECT sku, price_toman, sale_price_toman, stock_qty, availability,'
    + ' is_active, is_featured, is_new, brand_id FROM products ORDER BY sku');
  assert.equal(rows.rows.length, 40);
  for (const r of rows.rows) {
    assert.equal(Number(r.price_toman), 0);
    assert.equal(r.sale_price_toman, null);
    assert.equal(r.stock_qty, 0);
    /* موجودی صفر و out_of_stock با هم سازگارند — stockWarning هم هشدار نمی‌دهد. */
    assert.equal(r.availability, 'out_of_stock');
    assert.equal(r.is_active, true, 'باید در ویترین دیده شوند');
    assert.equal(r.is_featured, false);
    assert.equal(r.is_new, false);
    assert.ok(isPriceOnRequest(r), 'باید «استعلام قیمت» بشمارد');
  }

  const brandRows = await db.queryOne('SELECT COUNT(*)::int AS n FROM brands');
  assert.equal(brandRows.n, 5, 'فقط پنج برندِ اعلام‌شده');
  const branded = await db.queryOne(
    'SELECT COUNT(*)::int AS n FROM products WHERE brand_id IS NOT NULL');
  assert.equal(branded.n, 39, 'سی‌ونه قطعه برند اعلام‌شده دارند');
  const images = await db.queryOne('SELECT COUNT(*)::int AS n FROM product_images');
  assert.equal(images.n, 0);
  /* نُه قطعه شماره فنی دارند؛ تنها «فیلتر اتاق» در مانیفست بدون شماره است. */
  const oem = await db.queryOne(
    'SELECT COUNT(*)::int AS n FROM products WHERE oem_number IS NOT NULL');
  assert.equal(oem.n, 37);
  assert.deepEqual(products.filter((p) => !p.oemNumber).map((p) => p.sku).sort(),
    ['P2008-003', 'P2008-052', 'P2008-079']);
});

test('isPriceOnRequest فقط نبودِ قیمت را می‌گیرد', () => {
  assert.equal(isPriceOnRequest({ price_toman: 0 }), true);
  assert.equal(isPriceOnRequest({ price_toman: null }), true);
  assert.equal(isPriceOnRequest({}), true);
  assert.equal(isPriceOnRequest({ price_toman: 1 }), false);
  assert.equal(isPriceOnRequest({ price_toman: 2500000 }), false);
});
