-- ============================================================================
-- 004_image_provenance.sql — منشأ و وضعیت حقوقی تصویر محصول
-- ----------------------------------------------------------------------------
-- چرا این مهاجرت لازم است؟
--
--   پیش از این، جدول product_images می‌توانست بگوید «این تصویر به این محصول
--   تعلق دارد» ولی نمی‌توانست به پرسشِ مهم‌تر پاسخ بدهد: «این تصویر از کجا
--   آمده و آیا اجازهٔ استفادهٔ تجاری از آن را داریم؟»
--
--   همهٔ سندهای پژوهش موجود (commercial-catalogue-manifest.js و
--   validated-catalogue-manifest.js) صریح می‌گویند imageReuseStatus همه‌جا
--   'not_cleared' است. آن اطلاع در *فایل داده* می‌ماند و هرگز به پایگاه
--   داده نمی‌رسد، چون toRepositoryRecord شیء meta را دور می‌ریزد. یعنی
--   لحظه‌ای که تصویری درج شود، منشأ آن برای همیشه گم می‌شود.
--
--   این مهاجرت همان شکاف را می‌بندد و نه چیزی بیشتر.
--
-- ---------------------------------------------------------------------------
-- افزایشی و بی‌خطر
--
--   * هیچ ستون، ایندکس یا قیدِ موجودی تغییر نمی‌کند.
--   * همهٔ ستون‌های تازه nullable‌اند، به‌جز rights_status که مقدار
--     پیش‌فرض دارد. پس INSERTهای موجود (مسیر آپلود مدیر) بدون تغییر
--     کار می‌کنند.
--   * product_images در زمان این مهاجرت خالی است، ولی حتی اگر نبود هم
--     ردیف‌های موجود مقدار پیش‌فرضِ محافظه‌کارانه می‌گرفتند.
--
-- ---------------------------------------------------------------------------
-- چرا پیش‌فرض 'not_cleared' است و نه NULL؟
--
--   چون NULL یعنی «نمی‌دانیم»، و دربارهٔ حق استفاده از تصویر، «نمی‌دانیم»
--   و «اجازه نداریم» باید یک رفتار داشته باشند. پیش‌فرضِ محافظه‌کارانه
--   تنها پیش‌فرضِ درست است: هر تصویری که کسی صریح وضعیتش را اعلام نکرده،
--   پاک‌سازی‌نشده حساب می‌شود.
--
-- ---------------------------------------------------------------------------
-- چرا approved_by با ON DELETE SET NULL؟
--
--   همان قاعدهٔ admin_audit_log: حذف حساب مدیر نباید تاریخچه را پاک کند.
--   تصویر و تاریخِ تأییدش می‌مانند؛ فقط نشانهٔ «کدام حساب» از بین می‌رود.
-- ============================================================================

-- --------------------------------------------------------- ستون‌های تازه
-- IF NOT EXISTS تا اجرای دوباره روی پایگاه دادهٔ نیم‌کاره خطا ندهد.
ALTER TABLE product_images
  ADD COLUMN IF NOT EXISTS source_name   TEXT,
  ADD COLUMN IF NOT EXISTS source_url    TEXT,
  ADD COLUMN IF NOT EXISTS source_ref    TEXT,
  ADD COLUMN IF NOT EXISTS rights_status TEXT NOT NULL DEFAULT 'not_cleared',
  ADD COLUMN IF NOT EXISTS rights_note   TEXT,
  ADD COLUMN IF NOT EXISTS approved_by   BIGINT,
  ADD COLUMN IF NOT EXISTS approved_at   TIMESTAMPTZ;

-- ------------------------------------------------------ کلید خارجی تأییدکننده
-- جدا از ADD COLUMN نوشته می‌شود چون ADD CONSTRAINT شکل IF NOT EXISTS ندارد
-- و باید با بررسی صریح بی‌اثرپذیر شود.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_images_approved_by_fkey'
  ) THEN
    ALTER TABLE product_images
      ADD CONSTRAINT product_images_approved_by_fkey
      FOREIGN KEY (approved_by) REFERENCES admin_users (id) ON DELETE SET NULL;
  END IF;
END $$;

-- -------------------------------------------------- فهرست سفید وضعیت حقوقی
-- چهار مقدار و نه بیشتر. رشتهٔ آزاد یعنی فردا کسی 'ok' یا 'cleared?'
-- می‌نویسد و هیچ گزارشی قابل اعتماد نمی‌ماند.
--
--   not_cleared     هیچ اجازه‌ای نداریم. پیش‌فرض.
--   owner_supplied  خودِ تأمین‌کننده/مالک کالا تصویر را داده است.
--   licensed        پروانهٔ صریح داریم (خرید، قرارداد، یا پروانهٔ باز).
--   own_photo       خودمان عکس گرفته‌ایم.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_images_rights_status_known'
  ) THEN
    ALTER TABLE product_images
      ADD CONSTRAINT product_images_rights_status_known
      CHECK (rights_status IN ('not_cleared', 'owner_supplied', 'licensed', 'own_photo'));
  END IF;
END $$;

-- --------------------------------------------- سازگاری تأیید با وضعیت حقوقی
-- دو حالت و نه بیشتر:
--
--   not_cleared   → هیچ تأییدی ثبت نشده باشد. تصویری که اجازه‌اش را نداریم
--                   نمی‌تواند «تأییدشده» باشد؛ این ترکیب یعنی داده خراب.
--   هر چیز دیگر   → تاریخ تأیید باید باشد. بدون تاریخ، «پاک‌سازی‌شده» یک
--                   ادعای بی‌سند است.
--
-- approved_by عمدا اجباری *نیست*: واردکنندهٔ خط فرمان نشست مدیر ندارد، و
-- جعل یک شناسهٔ مدیر برای پر کردن ستون بدتر از خالی گذاشتنش است.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_images_rights_approval_consistent'
  ) THEN
    ALTER TABLE product_images
      ADD CONSTRAINT product_images_rights_approval_consistent
      CHECK (
        (rights_status =  'not_cleared' AND approved_at IS NULL AND approved_by IS NULL)
        OR
        (rights_status <> 'not_cleared' AND approved_at IS NOT NULL)
      );
  END IF;
END $$;

-- ------------------------------------------- منشأ، برای تصویرِ پاک‌سازی‌شده
-- تصویری که ادعا می‌کنیم اجازه‌اش را داریم، باید بگوید از کجا آمده: نامِ
-- منبع، به‌اضافهٔ دست‌کم یکی از نشانی یا ارجاع (شمارهٔ فاکتور، ایمیل
-- تأمین‌کننده، بستهٔ تحویلی). «اجازه داریم ولی نمی‌دانیم از کجا آمده»
-- ترکیبی است که هیچ‌وقت نباید در جدول بنشیند.
--
-- برای not_cleared هیچ الزامی نیست: مسیر آپلود مدیر فقط فایل می‌گیرد و
-- این مهاجرت نباید آن را بشکند.
--
-- ⚠️ COALESCE اینجا تزئینی نیست و حذفش قید را بی‌اثر می‌کند:
--
--   در SQL، قیدِ CHECK وقتی NULL برگرداند «برآورده» حساب می‌شود، نه
--   «شکسته». شکل بدون COALESCE —
--       length(btrim(source_name)) > 0
--   — برای source_name = NULL مقدار NULL می‌دهد، پس دقیقا همان حالتی که
--   باید جلویش گرفته شود (منشأِ خالی) بی‌صدا می‌گذشت. همین تله برای
--   OR نشانی/ارجاع هم برقرار بود: NULL OR NULL برابر NULL است.
--
--   این با آزمون «تصویر پاک‌سازی‌شده بدون منشأ پذیرفته نمی‌شود» در
--   tests/product-image-provenance.test.js پوشش داده شده است.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'product_images_cleared_has_source'
  ) THEN
    ALTER TABLE product_images
      ADD CONSTRAINT product_images_cleared_has_source
      CHECK (
        rights_status = 'not_cleared'
        OR (
          length(btrim(COALESCE(source_name, ''))) > 0
          AND (
            length(btrim(COALESCE(source_url, ''))) > 0
            OR length(btrim(COALESCE(source_ref, ''))) > 0
          )
        )
      );
  END IF;
END $$;
