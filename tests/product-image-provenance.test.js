/* ============================================================================
 * tests/product-image-provenance.test.js — منشأ و وضعیت حقوقی تصویر (فاز ۴A)
 * ----------------------------------------------------------------------------
 * سه چیز سنجیده می‌شود:
 *
 *   ۱. اسکیما — ستون‌ها و قیدهای مهاجرت ۰۰۴ روی PostgreSQL واقعی (PGlite)
 *   ۲. مخزن — add() منشأ را ذخیره می‌کند و رفتار قبلی را نمی‌شکند
 *   ۳. واردکننده — نگهبان‌های اعتبارسنجی، بدون پایگاه داده و بدون فایل
 *
 * هیچ تصویری اینجا ساخته، دانلود یا وارد نمی‌شود. بخش سوم فقط توابع خالص
 * را صدا می‌زند.
 * ==========================================================================*/
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { createTestDb, insertCategory, insertProduct } = await import('./helpers/testDb.js');
const {
  createProductImageRepository, RIGHTS_STATUS, CLEARED_RIGHTS_STATUSES,
} = await import('../src/db/repositories/productImages.js');

let db, repo, productId;

const uuid = (n) => `${String(n).repeat(8)}-1111-4222-8333-444444444444`.slice(0, 36);
const A = uuid(1), B = uuid(2);

/** یک تأیید سالم و کامل — پایهٔ آزمون‌هایی که فقط یک فیلد را خراب می‌کنند. */
const CLEARED = {
  sourceName: 'تأمین‌کنندهٔ آزمون',
  sourceRef: 'TEST-REF-1',
  rightsStatus: RIGHTS_STATUS.OWNER_SUPPLIED,
  rightsNote: 'برای آزمون — اجازهٔ ساختگی',
  approvedAt: new Date('2026-10-03T00:00:00Z'),
};

before(async () => {
  db = await createTestDb();
  repo = createProductImageRepository(db);
});

after(async () => { if (db) await db.close(); });

beforeEach(async () => {
  await db.exec('TRUNCATE product_images, products, categories RESTART IDENTITY CASCADE');
  const catId = await insertCategory(db);
  productId = await insertProduct(db, { categoryId: catId, slug: 'p-1', sku: 'S1' });
});

/* ═══════════════════════════════════════════════════ ۱. اسکیما (مهاجرت ۰۰۴) */

test('ستون‌های منشأ و حقوق به product_images اضافه شده‌اند', async () => {
  const res = await db.query(
    `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
      WHERE table_name = 'product_images' ORDER BY ordinal_position`);
  const byName = new Map(res.rows.map((r) => [r.column_name, r]));

  for (const name of ['source_name', 'source_url', 'source_ref', 'rights_note']) {
    assert.ok(byName.has(name), `ستون ${name} باید باشد`);
    assert.equal(byName.get(name).is_nullable, 'YES', `${name} باید nullable باشد`);
  }

  assert.ok(byName.has('rights_status'));
  assert.equal(byName.get('rights_status').is_nullable, 'NO');
  assert.match(byName.get('rights_status').column_default, /not_cleared/,
    'پیش‌فرض باید محافظه‌کارانه و «پاک‌سازی‌نشده» باشد');

  assert.ok(byName.has('approved_by'));
  assert.equal(byName.get('approved_by').is_nullable, 'YES');
  assert.ok(byName.has('approved_at'));
  assert.equal(byName.get('approved_at').is_nullable, 'YES');
});

test('ستون‌ها و قیدهای قبلی دست‌نخورده مانده‌اند', async () => {
  /* مهاجرت افزایشی است: چیزی از فاز قبل نباید عوض شده باشد. */
  const cols = await db.query(
    `SELECT column_name, is_nullable FROM information_schema.columns
      WHERE table_name = 'product_images'`);
  const byName = new Map(cols.rows.map((r) => [r.column_name, r.is_nullable]));
  assert.equal(byName.get('image_id'), 'NO');
  assert.equal(byName.get('product_id'), 'NO');
  assert.equal(byName.get('sort_order'), 'NO');
  assert.equal(byName.get('is_primary'), 'NO');
  assert.equal(byName.get('alt_text'), 'YES');

  const idx = await db.query(
    `SELECT indexname FROM pg_indexes WHERE tablename = 'product_images'`);
  const names = idx.rows.map((r) => r.indexname);
  for (const want of ['product_images_pkey', 'idx_product_images_product',
    'idx_product_images_one_primary']) {
    assert.ok(names.includes(want), `ایندکس ${want} باید بماند — موجود: ${names.join(', ')}`);
  }
});

test('rights_status فقط چهار مقدار را می‌پذیرد', async () => {
  for (const ok of Object.values(RIGHTS_STATUS)) {
    const extra = ok === RIGHTS_STATUS.NOT_CLEARED
      ? {}
      : { source_name: 'م', source_ref: 'r', approved_at: new Date() };
    await db.query(
      `INSERT INTO product_images
         (product_id, image_id, rights_status, source_name, source_ref, approved_at)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [productId, `${ok}-id`, ok, extra.source_name ?? null,
        extra.source_ref ?? null, extra.approved_at ?? null]);
  }
  assert.equal(await repo.countForProduct(productId), 4);

  await assert.rejects(
    () => db.query(
      `INSERT INTO product_images (product_id, image_id, rights_status)
       VALUES ($1,$2,'cleared?')`, [productId, A]),
    /check constraint|violates/i,
    'رشتهٔ آزاد نباید پذیرفته شود');
});

test('تصویر پاک‌سازی‌نشده نمی‌تواند تأیید داشته باشد', async () => {
  await assert.rejects(
    () => db.query(
      `INSERT INTO product_images (product_id, image_id, rights_status, approved_at)
       VALUES ($1,$2,'not_cleared', now())`, [productId, A]),
    /check constraint|violates/i,
    'not_cleared + approved_at یعنی دادهٔ خراب');
});

test('تصویر پاک‌سازی‌شده بدون تاریخ تأیید پذیرفته نمی‌شود', async () => {
  await assert.rejects(
    () => db.query(
      `INSERT INTO product_images
         (product_id, image_id, rights_status, source_name, source_ref)
       VALUES ($1,$2,'licensed','م','r')`, [productId, A]),
    /check constraint|violates/i,
    '«اجازه داریم» بدون تاریخ، ادعای بی‌سند است');
});

test('تصویر پاک‌سازی‌شده بدون منشأ پذیرفته نمی‌شود', async () => {
  /* بدون نام منبع */
  await assert.rejects(
    () => db.query(
      `INSERT INTO product_images
         (product_id, image_id, rights_status, source_ref, approved_at)
       VALUES ($1,$2,'licensed','r', now())`, [productId, A]),
    /check constraint|violates/i,
    'sourceName لازم است');

  /* نام منبع هست، ولی نه نشانی و نه ارجاع */
  await assert.rejects(
    () => db.query(
      `INSERT INTO product_images
         (product_id, image_id, rights_status, source_name, approved_at)
       VALUES ($1,$2,'licensed','م', now())`, [productId, A]),
    /check constraint|violates/i,
    'دست‌کم یکی از sourceUrl یا sourceRef لازم است');
});

test('تصویر پاک‌سازی‌نشده هیچ منشأی لازم ندارد — مسیر آپلود مدیر نمی‌شکند', async () => {
  const row = await repo.add({ productId, imageId: A });
  assert.equal(row.rights_status, RIGHTS_STATUS.NOT_CLEARED);
  assert.equal(row.source_name, null);
  assert.equal(row.approved_at, null);
});

/* ═══════════════════════════════════════════════════════════════ ۲. مخزن */

test('add() بدون فیلدهای تازه، دقیقا مثل قبل رفتار می‌کند', async () => {
  const row = await repo.add({ productId, imageId: A, width: 800, height: 600 });
  assert.equal(row.sort_order, 0);
  assert.equal(row.is_primary, false);
  assert.equal(row.width, 800);
  assert.equal(row.alt_text, null);
  /* پیش‌فرض محافظه‌کارانه، بدون اینکه فراخوان چیزی بداند. */
  assert.equal(row.rights_status, RIGHTS_STATUS.NOT_CLEARED);
  assert.equal(row.rights_note, null);
  assert.equal(row.approved_by, null);
});

test('add() منشأ و وضعیت حقوقی را ذخیره می‌کند', async () => {
  const row = await repo.add({
    productId, imageId: A, altText: 'فیلتر روغن', width: 1200, height: 1200,
    isPrimary: true,
    sourceName: CLEARED.sourceName,
    sourceUrl: 'https://example.invalid/part',
    sourceRef: CLEARED.sourceRef,
    rightsStatus: RIGHTS_STATUS.LICENSED,
    rightsNote: CLEARED.rightsNote,
    approvedAt: CLEARED.approvedAt,
  });

  assert.equal(row.alt_text, 'فیلتر روغن');
  assert.equal(row.source_name, CLEARED.sourceName);
  assert.equal(row.source_url, 'https://example.invalid/part');
  assert.equal(row.source_ref, CLEARED.sourceRef);
  assert.equal(row.rights_status, RIGHTS_STATUS.LICENSED);
  assert.equal(row.rights_note, CLEARED.rightsNote);
  assert.ok(row.approved_at instanceof Date, 'تاریخ تأیید باید برگردد');
  assert.equal(row.is_primary, true);
});

test('add() رشتهٔ خالی را NULL می‌کند، نه رشتهٔ خالی', async () => {
  const row = await repo.add({
    productId, imageId: A, altText: '   ', sourceName: '', rightsNote: '  ',
  });
  assert.equal(row.alt_text, null, 'فاصله یعنی خالی، مثل updateAlt');
  assert.equal(row.source_name, null);
  assert.equal(row.rights_note, null);
});

test('add() قید پایگاه داده را تقلید نمی‌کند — خرابی به SQL می‌رسد', async () => {
  /* لایهٔ مخزن عمدا سازگاری حقوق را بررسی نمی‌کند؛ مرجع همان قید است. */
  await assert.rejects(
    () => repo.add({
      productId, imageId: A,
      rightsStatus: RIGHTS_STATUS.LICENSED,
      sourceName: 'م', sourceRef: 'r',
      /* approvedAt عمدا نیست */
    }),
    /check constraint|violates/i);
});

test('listForProduct ستون‌های تازه را هم برمی‌گرداند', async () => {
  await repo.add({
    productId, imageId: A, isPrimary: true,
    sourceName: CLEARED.sourceName, sourceRef: CLEARED.sourceRef,
    rightsStatus: RIGHTS_STATUS.OWN_PHOTO, approvedAt: CLEARED.approvedAt,
  });
  const [row] = await repo.listForProduct(productId);
  assert.equal(row.rights_status, RIGHTS_STATUS.OWN_PHOTO);
  assert.equal(row.source_ref, CLEARED.sourceRef);
});

test('approved_by به admin_users ارجاع می‌دهد و شناسهٔ ناموجود را رد می‌کند', async () => {
  await assert.rejects(
    () => repo.add({
      productId, imageId: A,
      sourceName: 'م', sourceRef: 'r',
      rightsStatus: RIGHTS_STATUS.LICENSED,
      approvedAt: CLEARED.approvedAt,
      approvedBy: 999999,
    }),
    /foreign key|violates/i);
});

test('CLEARED_RIGHTS_STATUSES شامل not_cleared نیست', () => {
  assert.ok(!CLEARED_RIGHTS_STATUSES.includes(RIGHTS_STATUS.NOT_CLEARED));
  assert.equal(CLEARED_RIGHTS_STATUSES.length, 3);
  assert.equal(Object.values(RIGHTS_STATUS).length, 4);
});

/* ══════════════════════════════════ ۳. نگهبان‌های اعتبارسنجیِ واردکننده */

const { validateManifestShape, IMAGES_PER_SKU } =
  await import('../scripts/import-product-images.js');

/** یک مانیفست سالم برای مجموعهٔ کوچکِ آزمون. */
function goodEntry(sku) {
  return {
    sku,
    images: [{
      file: 'tests/fixtures/not-used-by-shape-validation.jpg',
      altText: 'متن جایگزین آزمون',
      sourceName: 'تأمین‌کنندهٔ آزمون',
      sourceUrl: null,
      sourceRef: 'TEST-REF',
      rightsStatus: RIGHTS_STATUS.OWNER_SUPPLIED,
      rightsNote: 'آزمون',
      approvedAt: '2026-10-03',
      approvedBy: null,
      isPrimary: true,
    }],
  };
}

const SKUS = new Set(['X-1', 'X-2']);
const meta = { version: 1 };

test('مانیفست سالم هیچ ایرادی ندارد', () => {
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [goodEntry('X-1'), goodEntry('X-2')] }, SKUS);
  assert.deepEqual(problems, []);
});

test('فایل نمونه با exampleOnly رد می‌شود', async () => {
  const example = await import('../scripts/data/product-image-manifest.example.js');
  assert.equal(example.MANIFEST_META.exampleOnly, true,
    'فایل نمونه باید علامت‌خورده بماند');

  const { problems } = validateManifestShape(example, SKUS);
  assert.ok(problems.some((p) => /exampleOnly/.test(p)),
    `نگهبان نمونه باید فعال شود — ایرادها: ${problems.join(' | ')}`);
});

test('نمونه حتی با مجموعهٔ کد کالای درست هم رد می‌شود', async () => {
  /* دفاع در عمق: اگر روزی کسی کد کالاهای نمونه را واقعی کند، پرچم
     exampleOnly همچنان جلویش را می‌گیرد. */
  const example = await import('../scripts/data/product-image-manifest.example.js');
  const skus = new Set(example.IMAGE_ENTRIES.map((e) => e.sku));
  const { problems } = validateManifestShape(example, skus);
  assert.ok(problems.some((p) => /exampleOnly/.test(p)));
});

test('کد کالای تکراری رد می‌شود', () => {
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [goodEntry('X-1'), goodEntry('X-1')] }, SKUS);
  assert.ok(problems.some((p) => /تکراری/.test(p)));
});

test('کد کالای بیرون از کاتالوگ معتبر رد می‌شود', () => {
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [goodEntry('X-1'), goodEntry('NOPE')] }, SKUS);
  assert.ok(problems.some((p) => /NOPE/.test(p) && /کاتالوگ معتبر نیست/.test(p)));
});

test('کد کالای جاافتاده گزارش می‌شود', () => {
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [goodEntry('X-1')] }, SKUS);
  assert.ok(problems.some((p) => /X-2/.test(p) && /در مانیفست نیست/.test(p)));
  assert.ok(problems.some((p) => /شمار قلم‌های مانیفست/.test(p)));
});

test('نشانی اینترنتی در فیلد file رد می‌شود', () => {
  const entry = goodEntry('X-1');
  entry.images[0].file = 'https://example.invalid/image.jpg';
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [entry, goodEntry('X-2')] }, SKUS);
  assert.ok(problems.some((p) => /دانلود/.test(p)),
    'واردکننده هرگز نباید نشانی اینترنتی بپذیرد');
});

test('rights_status برابر not_cleared رد می‌شود', () => {
  const entry = goodEntry('X-1');
  entry.images[0].rightsStatus = RIGHTS_STATUS.NOT_CLEARED;
  entry.images[0].approvedAt = null;
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [entry, goodEntry('X-2')] }, SKUS);
  assert.ok(problems.some((p) => /پاک‌سازی‌نشده وارد نمی‌شود/.test(p)));
});

test('وضعیت حقوقی ناشناخته رد می‌شود', () => {
  const entry = goodEntry('X-1');
  entry.images[0].rightsStatus = 'probably_fine';
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [entry, goodEntry('X-2')] }, SKUS);
  assert.ok(problems.some((p) => /probably_fine/.test(p)));
});

test('تصویر پاک‌سازی‌شده بدون approvedAt رد می‌شود', () => {
  const entry = goodEntry('X-1');
  entry.images[0].approvedAt = null;
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [entry, goodEntry('X-2')] }, SKUS);
  assert.ok(problems.some((p) => /approvedAt/.test(p)));
});

test('متن جایگزین اجباری است', () => {
  const entry = goodEntry('X-1');
  entry.images[0].altText = '   ';
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [entry, goodEntry('X-2')] }, SKUS);
  assert.ok(problems.some((p) => /altText/.test(p)));
});

test('منشأ بدون نشانی و بدون ارجاع رد می‌شود', () => {
  const entry = goodEntry('X-1');
  entry.images[0].sourceUrl = null;
  entry.images[0].sourceRef = null;
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [entry, goodEntry('X-2')] }, SKUS);
  assert.ok(problems.some((p) => /sourceUrl/.test(p) && /sourceRef/.test(p)));
});

test('بیش از یک تصویر برای هر کد کالا در این مرحله رد می‌شود', () => {
  const entry = goodEntry('X-1');
  entry.images.push({ ...entry.images[0], isPrimary: false });
  const { problems } = validateManifestShape(
    { MANIFEST_META: meta, IMAGE_ENTRIES: [entry, goodEntry('X-2')] }, SKUS);
  assert.equal(IMAGES_PER_SKU, 1);
  assert.ok(problems.some((p) => /دقیقا یکی/.test(p)));
});

test('نسخهٔ ناشناختهٔ مانیفست رد می‌شود', () => {
  const { problems } = validateManifestShape(
    { MANIFEST_META: { version: 99 }, IMAGE_ENTRIES: [goodEntry('X-1'), goodEntry('X-2')] },
    SKUS);
  assert.ok(problems.some((p) => /نسخهٔ مانیفست/.test(p)));
});

test('import کردن واردکننده هیچ اتصالی به پایگاه داده نمی‌سازد', async () => {
  /* همان قاعدهٔ migrate.js: ماژول باید بی‌عارضه قابل import باشد. */
  const dbMod = await import('../src/db/index.js');
  assert.equal(dbMod.isPoolCreated(), false,
    'import کردن اسکریپت نباید استخر اتصال بسازد');
});

test('مانیفست واقعی هرگز در Git ردگیری نمی‌شود', async () => {
  /* شکل نخستِ این آزمون نبودِ *فایل روی دیسک* را می‌سنجید. ولی چیزی که
     باید محافظت شود این نیست: مانیفست واقعی عمدا به‌صورت محلی ساخته
     می‌شود (مسیر فایل‌های تأمین‌کننده، شمارهٔ فاکتور، شرط‌های حقوقی) و
     فقط نباید به مخزن برود. پس سنجه، خودِ Git است نه فایل‌سیستم — و این
     شکل سخت‌گیرانه‌تر است: اگر روزی کسی فایل را commit کند، این آزمون
     می‌شکند، در حالی که existsSync هرگز آن را نمی‌گرفت. */
  const { execFileSync } = await import('node:child_process');
  const ROOT = new URL('..', import.meta.url).pathname;
  const tracked = execFileSync('git', ['ls-files', 'scripts/data/product-image-manifest.js'],
    { cwd: ROOT, encoding: 'utf8' }).trim();
  assert.equal(tracked, '',
    'مانیفست واقعی باید بیرون از Git و دستِ آماده‌کنندهٔ مجموعه بماند');

  /* و باید در .gitignore هم پوشیده باشد، تا «git add -A» تصادفی آن را نبرد. */
  let ignored = true;
  try {
    execFileSync('git', ['check-ignore', '-q', 'scripts/data/product-image-manifest.js'],
      { cwd: ROOT });
  } catch { ignored = false; }
  assert.ok(ignored, 'مسیر مانیفست واقعی باید در .gitignore باشد');
});
