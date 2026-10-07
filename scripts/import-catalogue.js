#!/usr/bin/env node
/* ============================================================================
 * scripts/import-catalogue.js — بردن کاتالوگ ۴۰ محصولی به پایگاه داده
 * ----------------------------------------------------------------------------
 * منبع حقیقت: src/data/storefront-catalogue.js — همان چهل محصولی که در
 * commit b2aecd4 ثبت و آزموده شده‌اند. اینجا هیچ محصولی ساخته، حدس زده یا
 * تغییر داده نمی‌شود؛ فقط همان رکوردها درج می‌شوند.
 *
 * اجرا:
 *   node scripts/import-catalogue.js            اجرای آزمایشی (پیش‌فرض)
 *   node scripts/import-catalogue.js --apply    نوشتن واقعی
 *
 * پیش‌فرضْ *آزمایشی* است: بدون --apply هیچ چیز نوشته نمی‌شود. وارد کردن
 * داده کاری است که باید صریح خواسته شود، نه نتیجهٔ یک اشتباه تایپی.
 *
 * ---------------------------------------------------------------------------
 * بی‌اثرپذیری (idempotency) — چرا روی همین کلیدها
 *
 * کلیدها از قیدهای *واقعیِ* اسکیما آمده‌اند، نه از حدس:
 *
 *   products   idx_products_sku    UNIQUE (sku)    ← هویت پایدار محصول
 *   categories idx_categories_slug UNIQUE (slug)
 *   brands     idx_brands_slug     UNIQUE (slug)
 *
 * کد کالا (P2008-xxx) هویت محصول است، نه نامش. نام ممکن است ویرایش شود؛
 * کد کالا نه. پس تطبیق روی sku انجام می‌شود.
 *
 * چرا SELECT مستقیم و نه findBySlug مخزن؟ چون findBySlug عمدا
 * «AND is_active = TRUE» دارد — برای ویترین درست است، ولی برای وارد کردن
 * غلط: یک دستهٔ غیرفعال پیدا نمی‌شد، دوباره درج می‌شد، و قید یکتایی
 * می‌شکست. پس اینجا روی خودِ کلید یکتا و بدون فیلتر وضعیت می‌گردیم.
 *
 * چرا ON CONFLICT نه؟ چون «از قبل هست» و «تازه ساخته شد» باید در گزارش
 * از هم جدا باشند، و ON CONFLICT DO NOTHING این تفاوت را پنهان می‌کند.
 *
 * ---------------------------------------------------------------------------
 * یک تراکنش برای همه چیز
 *
 * دسته‌ها، برندها و محصول‌ها داخل *یک* تراکنش می‌روند. شکستِ محصول چهلم
 * یعنی هیچ‌کدام از سی‌ونه تای قبلی هم نمی‌مانند — کاتالوگ نیمه‌کاره بدتر
 * از کاتالوگ خالی است.
 *
 * ---------------------------------------------------------------------------
 * آنچه این اسکریپت *نمی‌کند*
 *
 *   * مهاجرت اجرا نمی‌کند.
 *   * حساب مدیر نمی‌سازد.
 *   * به جدول‌های مدیر، تصویر یا خودرو دست نمی‌زند.
 *   * هیچ ردیفی را حذف، خالی یا بازنویسی نمی‌کند — فقط INSERT.
 *   * رشتهٔ اتصال را چاپ نمی‌کند.
 * ==========================================================================*/
import { getPool, closeDb, withTransaction } from '../src/db/index.js';
import { createProductRepository } from '../src/db/repositories/products.js';
import {
  buildStorefrontProducts, buildStorefrontCategories, buildStorefrontBrands,
  toRepositoryRecord,
} from '../src/data/storefront-catalogue.js';
import { isValidSlug } from '../src/services/slug.js';

const APPLY = process.argv.includes('--apply');
const EXPECTED_PRODUCTS = 40;
const AVAILABILITY = new Set(['in_stock', 'out_of_stock', 'on_order', 'discontinued']);

/* ----------------------------------------------------- اعتبارسنجی پیش از نوشتن */
/**
 * همهٔ بررسی‌ها *پیش از* باز کردن تراکنش انجام می‌شوند. اگر چیزی ایراد
 * داشته باشد، پایگاه داده اصلا لمس نمی‌شود.
 *
 * @returns {string[]} فهرست ایرادها؛ خالی یعنی سالم
 */
function validate(products, categories, brands) {
  const problems = [];
  const add = (m) => problems.push(m);

  if (products.length !== EXPECTED_PRODUCTS) {
    add(`شمار محصول‌ها ${products.length} است، نه ${EXPECTED_PRODUCTS}`);
  }

  /* یکتایی کلیدهایی که پایگاه داده روی آن‌ها قید دارد. */
  for (const [field, label] of [['sku', 'کد کالا'], ['slug', 'نشانی']]) {
    const seen = new Map();
    for (const p of products) {
      if (seen.has(p[field])) add(`${label} تکراری: ${p[field]} (${seen.get(p[field])} و ${p.sku})`);
      seen.set(p[field], p.sku);
    }
  }
  for (const [list, label] of [[categories, 'دسته'], [brands, 'برند']]) {
    const seen = new Set();
    for (const x of list) {
      if (seen.has(x.slug)) add(`نشانی ${label} تکراری: ${x.slug}`);
      seen.add(x.slug);
    }
  }

  /* فیلدهای الزامیِ خودِ اسکیما (NOT NULL) و فهرست‌های سفید. */
  const categoryKeys = new Set(categories.map((c) => c.key));
  const brandKeys = new Set(brands.map((b) => b.key));

  for (const p of products) {
    const at = `«${p.name}» (${p.sku})`;
    if (!p.name || !String(p.name).trim()) add(`نام خالی در ${at}`);
    if (!p.sku) add(`کد کالا خالی در ${at}`);
    if (!p.slug || !isValidSlug(p.slug)) add(`نشانی نامعتبر در ${at}`);

    if (!categoryKeys.has(p.categoryKey)) add(`دستهٔ حل‌نشدنی «${p.categoryKey}» در ${at}`);
    if (p.brandKey !== null && !brandKeys.has(p.brandKey)) {
      add(`برند حل‌نشدنی «${p.brandKey}» در ${at}`);
    }

    /* قیمت: ستون NOT NULL است و صفرِ نشانه‌ای مجاز است، ولی منفی نه. */
    const row = toRepositoryRecord(p, 1, null);
    if (!Number.isInteger(row.priceToman) || row.priceToman < 0) {
      add(`قیمت نامعتبر در ${at}`);
    }
    if (row.salePriceToman !== null
        && !(Number.isInteger(row.salePriceToman) && row.salePriceToman < row.priceToman)) {
      add(`قیمت حراج نامعتبر در ${at}`);
    }
    if (!Number.isInteger(row.stockQty) || row.stockQty < 0) add(`موجودی نامعتبر در ${at}`);
    if (!AVAILABILITY.has(row.availability)) add(`وضعیت ناشناخته «${row.availability}» در ${at}`);
  }

  for (const c of categories) {
    if (!c.name?.trim()) add(`نام دستهٔ خالی: ${c.key}`);
    if (!isValidSlug(c.slug)) add(`نشانی دستهٔ نامعتبر: ${c.slug}`);
  }
  for (const b of brands) {
    if (!b.name?.trim()) add(`نام برند خالی: ${b.key}`);
    if (!isValidSlug(b.slug)) add(`نشانی برند نامعتبر: ${b.slug}`);
  }

  return problems;
}

/* ------------------------------------------------------------- کمکی‌های درج */

/** شناسهٔ ردیف موجود بر اساس کلید یکتا — بدون فیلتر وضعیت. */
async function findIdBy(client, table, column, value) {
  const res = await client.query(
    `SELECT id FROM ${table} WHERE ${column} = $1 LIMIT 1`, [value]);
  return res.rows[0]?.id ?? null;
}

/* ----------------------------------------------------------------- اجرا */

async function main() {
  const products = buildStorefrontProducts();
  const categories = buildStorefrontCategories();
  const brands = buildStorefrontBrands();

  console.log('=== منبع ===');
  console.log(`  محصول: ${products.length} | دسته: ${categories.length} | برند: ${brands.length}`);
  console.log('  فایل: src/data/storefront-catalogue.js');

  console.log('\n=== اعتبارسنجی پیش از نوشتن ===');
  const problems = validate(products, categories, brands);
  if (problems.length) {
    console.error(`  ${problems.length} ایراد — هیچ چیز نوشته نشد:`);
    problems.forEach((p) => console.error('    • ' + p));
    process.exitCode = 1;
    return;
  }
  console.log('  همهٔ بررسی‌ها سالم');

  if (!APPLY) {
    console.log('\n=== اجرای آزمایشی ===');
    console.log('  هیچ چیز نوشته نشد. برای نوشتن واقعی: node scripts/import-catalogue.js --apply');
    return;
  }

  const summary = {
    categories: { created: 0, existing: 0 },
    brands: { created: 0, existing: 0 },
    products: { created: 0, existing: 0 },
    createdSkus: [], existingSkus: [],
  };

  await withTransaction(async (client) => {
    const productRepo = createProductRepository(client);

    /* ۱. دسته‌ها — کلید یکتا: slug */
    const categoryIds = new Map();
    for (const c of categories) {
      let id = await findIdBy(client, 'categories', 'slug', c.slug);
      if (id === null) {
        const res = await client.query(
          `INSERT INTO categories (name, slug, parent_id, description, sort_order, is_active)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [c.name, c.slug, c.parentId ?? null, c.description ?? null, c.sortOrder ?? 0, c.isActive !== false]);
        id = res.rows[0].id;
        summary.categories.created += 1;
      } else {
        summary.categories.existing += 1;
      }
      categoryIds.set(c.key, id);
    }

    /* ۲. برندها — کلید یکتا: slug */
    const brandIds = new Map();
    for (const b of brands) {
      let id = await findIdBy(client, 'brands', 'slug', b.slug);
      if (id === null) {
        const res = await client.query(
          `INSERT INTO brands (name, slug, country, is_active)
           VALUES ($1,$2,$3,$4) RETURNING id`,
          [b.name, b.slug, b.country ?? null, b.isActive !== false]);
        id = res.rows[0].id;
        summary.brands.created += 1;
      } else {
        summary.brands.existing += 1;
      }
      brandIds.set(b.key, id);
    }

    /* ۳. محصول‌ها — کلید یکتا: sku.
       درج از راه مخزن تولید انجام می‌شود تا search_text و شکل نرمال‌شدهٔ
       شماره فنی دقیقا مثل بقیهٔ برنامه ساخته شوند. */
    for (const p of products) {
      const existing = await findIdBy(client, 'products', 'sku', p.sku);
      if (existing !== null) {
        summary.products.existing += 1;
        summary.existingSkus.push(p.sku);
        continue;
      }
      const record = toRepositoryRecord(
        p,
        categoryIds.get(p.categoryKey),
        p.brandKey ? brandIds.get(p.brandKey) : null,
      );
      await productRepo.create(record);
      summary.products.created += 1;
      summary.createdSkus.push(p.sku);
    }
  });

  console.log('\n=== نتیجه ===');
  console.log(`  دسته‌ها : ${summary.categories.created} تازه، ${summary.categories.existing} از قبل`);
  console.log(`  برندها  : ${summary.brands.created} تازه، ${summary.brands.existing} از قبل`);
  console.log(`  محصول‌ها: ${summary.products.created} تازه، ${summary.products.existing} از قبل`);
  if (summary.createdSkus.length) {
    console.log('  درج‌شده : ' + summary.createdSkus.join(', '));
  }
  if (summary.existingSkus.length) {
    console.log('  رد شده  : ' + summary.existingSkus.join(', '));
  }
}

try {
  getPool();
  await main();
} catch (err) {
  console.error('\n[import] شکست خورد:', err.code || '', err.message);
  console.error('  تراکنش برگشت خورد — هیچ تغییر نیم‌بندی نماند.');
  process.exitCode = 1;
} finally {
  await closeDb();
}
