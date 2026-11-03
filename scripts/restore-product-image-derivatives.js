#!/usr/bin/env node
/* ============================================================================
 * scripts/restore-product-image-derivatives.js — بازسازی مشتق‌های تصویر محصول
 *                                                 با حفظ شناسه‌های موجود
 * ----------------------------------------------------------------------------
 * مسئله‌ای که این اسکریپت حل می‌کند
 *
 * روی سرور تولید، نوزده فایل JPEG به‌صورت *لخت* داخل storage/products افتاده‌اند
 * و پوشه‌های UUID و مشتق‌هایشان وجود ندارند. ردیف‌های product_images در پایگاه
 * داده سالم‌اند و هر کدام یک image_id دارند، پس قالب‌ها نشانی
 *
 *     /media/products/<image_id>/card.jpg
 *
 * را می‌سازند (src/views/partials/product-card.njk خط ۸ و ۹) و چون آن پوشه
 * نیست، همه ۴۰۴ می‌شوند. فایل لخت خودش ۲۰۰ می‌دهد — چون express.static کل
 * محتوای products را سرو می‌کند (src/app.js خط ۲۰۰ تا ۲۰۴) — ولی هیچ قالبی آن
 * نشانی را نمی‌سازد.
 *
 * پس کار لازم فقط همین است: همان بایت‌ها را از خط لولهٔ موجود بگذران و خروجی را
 * زیر *همان* شناسه‌ای بنویس که از قبل در پایگاه داده ثبت است.
 *
 * ---------------------------------------------------------------------------
 * آنچه این اسکریپت *نمی‌کند* — و هرگز نباید بکند
 *
 *   * به پایگاه داده وصل نمی‌شود. هیچ import از src/db/ ندارد. هیچ SELECT،
 *     INSERT، UPDATE یا DELETE. ردیف‌ها، پرچم is_primary، sort_order،
 *     alt_text و همهٔ ستون‌های منشأ و حقوقی دست‌نخورده می‌مانند.
 *   * شناسهٔ تازه نمی‌سازد. شناسه‌ها از جدول MAPPING می‌آیند و با همان نوشته
 *     می‌شوند. ببینید بخش «آداپتور شناسهٔ ثابت» پایین‌تر.
 *   * خط لولهٔ تصویر دومی نمی‌سازد. processProductImage همان تابعی است که مسیر
 *     آپلود مدیر هم صدا می‌زند (src/controllers/adminProductImagesController.js
 *     خط ۱۸۳) — یک پیاده‌سازی، یک رفتار، یک واترمارک.
 *   * اعتبارسنجی را دور نمی‌زند. همان سه لایهٔ مسیر مدیر، به همان ترتیب.
 *   * فایل منبع را عوض نمی‌کند. نوزده JPEG لخت فقط *خوانده* می‌شوند.
 *   * هیچ چیزی پاک نمی‌کند و هیچ فایل موجودی را بازنویسی نمی‌کند.
 *   * فایل لخت را جابه‌جا یا قرنطینه نمی‌کند. آن یک تصمیم جداگانه است.
 *   * مقدار متغیر محیطی چاپ نمی‌کند. مسیرها فقط نسبی گزارش می‌شوند.
 *
 * ---------------------------------------------------------------------------
 * آداپتور شناسهٔ ثابت — چرا و چگونه
 *
 * processProductImage شناسه را *خودش* می‌سازد (src/services/images.js خط ۱۴۲)
 * و پارامتری برای دادن شناسه ندارد. سه راه داشتیم:
 *
 *   الف) تغییر دائمی processProductImage تا شناسه بپذیرد. کار می‌کند، ولی یک
 *        تغییر کد دائمی برای یک بازیابی یک‌بارمصرف است.
 *   ب) پردازش با شناسهٔ تصادفی و بعد rename کردن پوشه. کار می‌کند، ولی یک
 *        پنجرهٔ شکست وسط کار می‌سازد: اگر rename شکست بخورد، پوشه‌ای با
 *        شناسهٔ غلط و یک اصلِ یتیم می‌ماند.
 *   ج) *این راه* — processProductImage پارامتر storage می‌پذیرد و از آن دقیقا
 *        سه متد را صدا می‌زند: putOriginal (خط ۱۴۳)، putDerivative (خط ۱۶۱ و
 *        ۱۶۲) و publicUrl (خط ۱۶۶ و ۱۶۷). پس یک آداپتور سه‌متدی می‌دهیم که
 *        شناسهٔ تصادفیِ ورودی را نادیده می‌گیرد و شناسهٔ هدف را جای آن
 *        می‌گذارد، سپس به لایهٔ ذخیره‌سازی واقعی تحویل می‌دهد.
 *
 * نتیجهٔ (ج): بایت‌ها از همان ابتدا در مسیر درست می‌نشینند. نه تغییر کد دائمی،
 * نه مرحلهٔ rename، نه پنجرهٔ شکست. و assertImageId در خودِ putDerivative
 * (src/services/storage.js خط ۸۶) باز هم شکل UUID را می‌سنجد، پس شناسهٔ خراب
 * در جدول MAPPING همان‌جا گرفته می‌شود.
 *
 * ---------------------------------------------------------------------------
 * نقشهٔ فایل به شناسه — صریح، و با هش تأییدشدنی
 *
 * نام فایل‌ها فارسی و بلندند و بعضی‌شان نویسهٔ نامرئی دارند: ZWNJ داخل «پژ‌و»
 * در نام دیسک ترمز، و فاصلهٔ دوگانه در نام سوپاپ دود و مایع خنک‌کننده. یک
 * نویسهٔ جاافتاده در این فایل یعنی «فایل پیدا نشد» — یا بدتر، یعنی تطبیق با
 * فایل اشتباه.
 *
 * پس هر قلم *دو* کلید دارد: نام فایل و SHA-256 محتوا. هش از بلاب‌های شاخهٔ
 * setup/real-logo گرفته شده (مخزن خودمان، نه هیچ نسخهٔ پشتیبان دیگری) و
 * اسکریپت پیش از پردازش هر دو را می‌سنجد. اگر نام درست ولی محتوا متفاوت بود،
 * یا نام غلط بود، همان‌جا متوقف می‌شود.
 *
 * ---------------------------------------------------------------------------
 * دو قلم حل‌نشده — و چرا عمدا متوقف می‌کنند
 *
 * کد کالای P2008-015 («کمک فنر جلو») دو ردیف تصویر دارد: یکی primary و یکی
 * secondary. دو فایلِ باقی‌ماندهٔ نوزده‌تایی هم «کمک جلو راست پژو۲۰۰۸» و «کمک
 * جلو چپ پژو۲۰۰۸» هستند. پس *کدام* فایل primary است و کدام secondary؟
 *
 * این را نمی‌شود از نام فایل فهمید و حدس زدنش یعنی ممکن است تصویر اصلیِ
 * نمایش‌دادهٔ محصول عوض شود. تا وقتی مالک فروشگاه تعیین نکند، هر دو قلم
 * imageId: null دارند و اسکریپت *هیچ* تصویری را پردازش نمی‌کند — نه آن دو، نه
 * هفده قلم دیگر. یا نقشه کامل است یا کاری انجام نمی‌شود.
 *
 * ---------------------------------------------------------------------------
 * اجرا
 *
 *   node scripts/restore-product-image-derivatives.js             اعتبارسنجی (پیش‌فرض)
 *   node scripts/restore-product-image-derivatives.js --execute   نوشتن واقعی
 *
 * حالت پیش‌فرض هیچ بایتی نمی‌نویسد: فقط می‌خواند، می‌سنجد و گزارش می‌دهد.
 * ==========================================================================*/
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { config } from '../src/config/index.js';
import { validateUploadedImage } from '../src/middleware/security.js';
import { inspectUploadedImage, processProductImage } from '../src/services/images.js';
import { storage, assertImageId } from '../src/services/storage.js';
import { loadWatermark } from '../src/controllers/adminProductImagesController.js';

/* ----------------------------------------------------------------- پرچم‌ها */
const ARGV = process.argv.slice(2);
const EXECUTE = ARGV.includes('--execute');

/** تنها پرچمی که این اسکریپت می‌شناسد. */
const KNOWN_FLAGS = new Set(['--execute']);

/**
 * پرچم ناشناخته را رد می‌کند.
 *
 * چرا لازم است: پیش از این هر چیزی جز --execute بی‌صدا نادیده گرفته می‌شد، پس
 * یک غلط تایپی مثل «--exec» یا «--dry-run» (که وجود ندارد) اسکریپت را در
 * حالت اعتبارسنجی می‌برد و کاربر خیال می‌کرد نوشتن انجام شده است. بی‌صدا
 * نادیده گرفتنِ پرچم، در اسکریپتی که قرار است چیزی بنویسد، خطای خاموش است.
 *
 * @returns {string[]} پرچم‌های ناشناخته
 */
export function unknownFlags(argv = ARGV) {
  return argv.filter((a) => !KNOWN_FLAGS.has(a));
}

/* ============================================================== نقشهٔ کار ===
 * هر قلم:
 *   sku      کد کالای کاتالوگ — فقط برای خوانایی گزارش
 *   label    نام فارسی محصول — فقط برای خوانایی گزارش
 *   file     نام فایل، دقیقا همان‌طور که روی دیسک است (نویسهٔ نامرئی هم)
 *   sha256   هش محتوای مورد انتظار، از بلاب شاخهٔ setup/real-logo
 *   bytes    حجم مورد انتظار
 *   imageId  شناسهٔ *موجود* در جدول product_images. null یعنی حل‌نشده.
 *   note     اگر حل‌نشده است، دلیلش
 * ==========================================================================*/
export const MAPPING = [
  {
    sku: 'P2008-004',
    label: 'فیلتر بنزین PSA',
    file: 'فیلتر بنزین پژو۲۰۰۸، سیتروئن سی۳، پژو۵۰۸، پژو۲۰۶، دی اس-Psa-اورجینال-ساخت تونس-موجود.jpg',
    sha256: '9d83351da64b03a7068bf2174985223b7d1d8e681b7e278974cdb94f721128b0',
    bytes: 306581,
    imageId: '46fa5685-ff4f-4bc8-8aa6-daaad9b71195',
  },
  {
    sku: 'P2008-007',
    label: 'دیسک چرخ',
    /* ⚠️ «پژ‌و» در این نام یک ZWNJ (U+200C) دارد. دست نزنید. */
    file: 'دیسک ترمز چرخ جلو پژ‌و۲۰۰۸، سیتروئن سی۳ اورجینال ساخت فرانسه موجود.jpg',
    sha256: 'f7bd3722626350064ffe194de1a01610ff15a95c921b4e2c91cbda8b925085e0',
    bytes: 507711,
    imageId: '41955e8b-0da7-4c2d-be01-4686964d6262',
  },
  /* ⚠️ دو قلم زیر — تطبیقِ *دستورِ کاربر*، نه شاهد مستقل.
     ------------------------------------------------------------------------
     نام فایل («کمک فنر جلو») چپ و راست را از هم جدا نمی‌کند، پس این دو را
     نمی‌شد از روی نام تعیین کرد. تطبیق زیر را مالک فروشگاه صریحا تعیین کرده
     است و بر پایهٔ نقشهٔ نامزدِ بررسیِ پیشین است:

         primary   50bda876-… ← «کمک جلو راست پژو۲۰۰۸ …»  (۴۲۲٬۴۸۶ بایت)
         secondary ff0111cc-… ← «کمک جلو چپ پژو۲۰۰۸ …»    (۳۳۵٬۳۱۶ بایت)

     هیچ‌کس این دو تصویر را باز نکرده و چشمی تأیید نکرده است. اگر معلوم شد
     جابه‌جا هستند، پیامدش فقط همین است که تصویر *اصلیِ* نمایش‌دادهٔ
     P2008-015 آن یکی می‌شود — هر دو فایل به هر حال به همین یک محصول
     تعلق دارند، پس هیچ تصویری به محصول اشتباه نمی‌چسبد.

     برای جابه‌جا کردن: فقط فیلدهای file/sha256/bytes این دو قلم را با هم
     عوض کنید. فیلد imageId هیچ‌کدام را دست نزنید. */
  {
    sku: 'P2008-015',
    label: 'کمک فنر جلو — تصویر اصلی (primary)',
    file: 'کمک جلو راست پژو۲۰۰۸ اورجینال ساخت اسپانیا موجود.jpg',
    sha256: 'f308d66a7a274a4d7df86189ce93b4154f8e2da6b7702e2a685a4c15f21e59c6',
    bytes: 422486,
    imageId: '50bda876-a831-4241-ab00-329b35d690ed',
    mappedBy: 'user-directed',
  },
  {
    sku: 'P2008-015',
    label: 'کمک فنر جلو — تصویر دوم (secondary)',
    file: 'کمک جلو چپ پژو۲۰۰۸ اورجینال ساخت اسپانیا موجود.jpg',
    sha256: '153af8017bce57df3f29b01c1a8bccab5895f40133666014d9032392ffc4e800',
    bytes: 335316,
    imageId: 'ff0111cc-9fce-4a86-aa53-b7c817725cb0',
    mappedBy: 'user-directed',
  },
  {
    sku: 'P2008-090',
    label: 'کفپوش صندوق عقب',
    file: 'کفپوش صندوق عقب پژو۲۰۰۸اورجینال-ساخت لهستان -موجود.jpg',
    sha256: 'e6a752afa04e4069e0b59faffde0047dbf2eff869e79940fd50da5d02c0385cc',
    bytes: 815122,
    imageId: '9da3dc75-d0ca-4520-8f7b-b413393a6c09',
  },
  {
    sku: 'P2008-091',
    label: 'درب منبع انبساط',
    file: 'درب منبع انبساط پژو۲۰۰۸، سیتروئن سی۳، پژو۵۰۸، پژو۲۰۶-اورجینال-ساخت فرانسه-موجود.jpg',
    sha256: '2d55a2d1cf162ce647bf31fc8f0178a4044470239c3343257db4bc2af0c64e78',
    bytes: 358922,
    imageId: 'fc4f82ee-134e-406a-97c0-7e0147b09b86',
  },
  {
    sku: 'P2008-092',
    label: 'روغن ترمز',
    file: 'روغن ترمز پژو۲۰۰۸، سیتروئن سی۳،پژو۵۰۸، دی اس نیم لیتری-اورجینالpsa-ساخت آلمان-موجود.jpg',
    sha256: 'a055ea1e773c8c3d51165972dc804a1964eb3ef7f328ffe72d84c9f2ab52973c',
    bytes: 302799,
    imageId: '9c114f45-9646-42c5-8a95-febf1c02ba77',
  },
  {
    sku: 'P2008-093',
    label: 'روغن موتور',
    file: 'روغن موتور توتال quartz ineo RCP 5W-30 ACEA C3 - API SN plus ۴لیتری فول سنتتیک PSA B71 2297 PSA B71 2290 STELLANTIS FPW9.5553503 ساخت ترکیه موجود.jpg',
    sha256: 'b15ada69191b0dbe65494ef97ba9ab66e186925c6ef803e32d9b25f19baf5d3d',
    bytes: 442877,
    imageId: '21dd1a37-5db7-47d4-9657-b6db04c8a56a',
  },
  {
    sku: 'P2008-094',
    label: 'سوپاپ دود',
    /* ⚠️ «سیتروئن  سی۳» در این نام فاصلهٔ دوگانه دارد. دست نزنید. */
    file: 'سوپاپ دود موتور پژو۲۰۰۸، سیتروئن  سی۳، پژو۵۰۸، دی اس اورجینال ساخت چین موجود.jpg',
    sha256: '7ef6dc8d791d68d13d005b6b1f3feef872ed257eefd69a6eaf61872b0a819658',
    bytes: 249784,
    imageId: '57d3abaa-1254-4686-bad2-6eeff11a8e72',
  },
  {
    sku: 'P2008-095',
    label: 'سوپاپ هوا',
    file: 'سوپاپ هوا موتور پژو۲۰۰۸، سیتروئن سی۳، پژو۵۰۸، دی اس اورجینال psaساخت چک-موجود.jpg',
    sha256: '3f76f9bb5ed83fee78b96748a7d510593c1a5161bd038adf6536541852896a9e',
    bytes: 232277,
    imageId: '10b7eb66-1cfc-4a1b-93f6-c06210da5273',
  },
  {
    sku: 'P2008-096',
    label: 'ضدیخ توتال',
    /* ⚠️ ZWNJ در «افزودنی‌های» و «خنک‌کننده». نام طولانی است و عمدا کامل نوشته شده. */
    file: 'ضدیخ و مایع خنک کننده غلیظ آبی توتال TotalEnergies GLACELF ECO BS 2F این محصول با فناوری OAT (افزودنی‌های آلی) و پایه مونو اتیلن گلیکول تولید شده و برای محافظت از سیستم خنک‌کننده موتور در برابر یخ‌زدگی، خوردگی،.jpg',
    sha256: '34dc16ef174747c4ba3a180c8f4b9c7f749a50535806b7bc4a4eca12d8977afd',
    bytes: 342530,
    imageId: '936c5a23-152a-471f-a7b1-de9eae1c2c1d',
  },
  {
    sku: 'P2008-097',
    label: 'فیلتر بنزین EUROREPAR',
    file: 'فیلتر بنزین پژو۲۰۰۸، سیتروئن سی۳، پژو۵۰۸، پژو۲۰۶، دی اس-یوروریپار-EUROREPAR-ساخت تونس-موجود.jpg',
    sha256: '0efa4b108cbfe430ae41081e56ae80cb22ba0db2564b63b08e34e0488b97fe04',
    bytes: 390232,
    imageId: 'f18d82cf-9b67-4012-9d36-4e6e109ff00f',
  },
  {
    sku: 'P2008-098',
    label: 'مایع خنک‌کننده',
    /* ⚠️ ZWNJ در «خنک‌کننده» و فاصلهٔ دوگانه پیش از «۲لیتری». دست نزنید. */
    file: 'مایع خنک‌کننده موتور(کولانت) پژو۲۰۰۸، سیتروئن سی۳، پژو۵۰۸، دی اس، پژو۲۰۶  ۲لیتری Psaاورجینال ساخت بلژیک موجود.jpg',
    sha256: '578d6680071fce1ba07d448b6c22d1403035cba76523fbbec7b444e5fe148f8f',
    bytes: 406906,
    imageId: 'e481778c-4cef-4dd9-a401-2ef210351c7f',
  },
  {
    sku: 'P2008-099',
    label: 'چرخ‌دنده میل سوپاپ',
    file: 'چرخ دنده میل سوپاپ پژو۲۰۰۸،سیتروئن سی ،پژو۵۰۸، دی اس دنده CVTاورجینالPSA ساخت لهستان موجود.jpg',
    sha256: '8de9714b08eff693fa1da16eb738b6fb6db535a85272568003f115b7145a96d9',
    bytes: 372394,
    imageId: '9a35e485-2c97-480d-a32b-4e130d947708',
  },
  {
    sku: 'P2008-100',
    label: 'کفپوش کابین',
    file: 'کفپوش کابین پژو۲۰۰۸-کف پایی لاستیکی ۴تکه-Psaاورجینال-ساخت چک-موجود.jpg',
    sha256: 'c8b65148bf0f537e099fcd9ec48f896652d33512f8fc50e7d52a35c04d83abb6',
    bytes: 520435,
    imageId: '53fc7bdc-84e5-42b0-a17e-6c3e2f56f0cd',
  },
  {
    sku: 'P2008-101',
    label: 'کمک جلو راست سیتروئن C3',
    file: 'کمک جلو راست سیتروئن سی۳اورجینال ساخت لهستان موجود.jpg',
    sha256: '73969e5813bfd654604a397ae43ab8e916d24fb13bf0b392291e2004a0dd9b15',
    bytes: 364120,
    imageId: '9c65ce90-6641-405d-a364-1ef04f0c6f2d',
  },
  {
    sku: 'P2008-102',
    label: 'کمک جلو چپ سیتروئن C3',
    file: 'کمک جلو چپ سیتروئن سی۳اورجینال ساخت لهستان موجود.jpg',
    sha256: 'fc77db30cebde551140f58b4c2c65d02f8346083b2915b67934d28dc825e1c7c',
    bytes: 327286,
    imageId: 'abef5504-31a7-4f04-819c-61affea73371',
  },
  {
    sku: 'P2008-103',
    label: 'کمک عقب سیتروئن C3',
    file: 'کمک عقب سیتروئن سی۳ اورجینال ساخت لهستان موجود.jpg',
    sha256: 'f3c56fb649b8b4a6e47e2129dbd3b6402c5e74c629f885b8d782d72abe8dcaef',
    bytes: 304546,
    imageId: 'b662c3a7-5e0c-4ef7-a42a-0de18e3cf115',
  },
  {
    sku: 'P2008-104',
    label: 'کمک عقب پژو 2008',
    file: 'کمک عقب پژو۲۰۰۸ اورجینال ساخت اسپانیا موجود.jpg',
    sha256: '28746488ecfc66fc34292f275aa8fa2d55264f6371c96b6aac1c229067b0bcab',
    bytes: 340917,
    imageId: '1bc60cb2-2d03-448e-90a6-03968d772503',
  },
];

/* فایل‌هایی که به هیچ قلمی بسته نشده‌اند.
   هر نوزده فایل الان تطبیق دارند، پس این فهرست خالی است. اگر روزی قلمی
   حل‌نشده شد، نامزدهایش را اینجا بگذارید تا گزارشِ توقف آن‌ها را نشان دهد. */
export const UNASSIGNED_CANDIDATES = [];

/* ------------------------------------------------------- کمک‌های کوچک */

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

/** فقط نام فایل، هرگز مسیر کامل — تا مقدار STORAGE_ROOT در گزارش نیفتد. */
const shown = (name) => `products/${name}`;

/** پوشهٔ مشتق‌های یک شناسه، و فایل اصلش. */
const derivativeDir = (imageId) => path.join(config.storage.products, imageId);

/** آیا این مسیر وجود دارد؟ */
async function exists(target) {
  try { await fs.stat(target); return true; } catch { return false; }
}

/** فایل اصل با هر پسوندی که باشد. */
async function findOriginal(imageId) {
  const entries = await fs.readdir(config.storage.originals).catch(() => []);
  return entries.filter((n) => n.startsWith(`${imageId}.`));
}

/**
 * آداپتور شناسهٔ ثابت.
 *
 * processProductImage شناسهٔ تصادفی خودش را به این سه متد می‌دهد؛ ما آن را
 * نادیده می‌گیریم و شناسهٔ هدف را جایش می‌گذاریم. لایهٔ ذخیره‌سازی واقعی
 * دست‌نخورده می‌ماند و assertImageId آن هنوز شکل UUID را می‌سنجد.
 */
function pinnedStorage(targetId) {
  assertImageId(targetId);
  return {
    putOriginal:   (_ignored, buffer, format)    => storage.putOriginal(targetId, buffer, format),
    putDerivative: (_ignored, name, ext, buffer) => storage.putDerivative(targetId, name, ext, buffer),
    publicUrl:     (_ignored, name, ext)         => storage.publicUrl(targetId, name, ext),
    driver: 'pinned-local',
  };
}

/* ========================================================= مرحله ۱ — نقشه ===
 * شکل خودِ جدول MAPPING را می‌سنجد، پیش از اینکه به دیسک نگاه کنیم.
 * ==========================================================================*/
export function validateMappingShape(mapping = MAPPING) {
  const problems = [];
  const unresolved = [];

  if (mapping.length !== 19) {
    problems.push(`جدول نقشه ${mapping.length} قلم دارد، نه ۱۹.`);
  }

  const seenFiles = new Map();
  const seenIds = new Map();

  for (const [i, entry] of mapping.entries()) {
    const where = `قلم ${i + 1} (${entry.sku ?? '?'})`;

    if (!entry.imageId) {
      problems.push(`${where}: شناسهٔ تصویر ندارد.`);
      continue;
    }
    try {
      assertImageId(entry.imageId);
    } catch {
      problems.push(`${where}: شناسهٔ «${entry.imageId}» شکل UUID ندارد.`);
    }

    if (seenIds.has(entry.imageId)) {
      problems.push(`${where}: شناسه تکراری است — قلم ${seenIds.get(entry.imageId) + 1} هم همین را دارد.`);
    } else {
      seenIds.set(entry.imageId, i);
    }

    /* قلم حل‌نشده: شناسه دارد ولی فایلی به آن بسته نشده. */
    if (!entry.file) {
      unresolved.push({ ...entry, index: i });
      continue;
    }

    if (seenFiles.has(entry.file)) {
      problems.push(`${where}: نام فایل تکراری است — قلم ${seenFiles.get(entry.file) + 1} هم همین را دارد.`);
    } else {
      seenFiles.set(entry.file, i);
    }

    if (!/^[0-9a-f]{64}$/.test(entry.sha256 || '')) {
      problems.push(`${where}: هش SHA-256 معتبر نیست.`);
    }
    if (!Number.isInteger(entry.bytes) || entry.bytes <= 0) {
      problems.push(`${where}: حجم مورد انتظار عدد صحیح مثبت نیست.`);
    }
  }

  return { problems, unresolved, resolved: mapping.filter((e) => e.file && e.imageId) };
}

/* ====================================================== مرحله ۲ — فایل‌ها ===
 * هر فایل منبع: وجود، حجم، هش، بایت‌های ابتدایی، ابعاد واقعی.
 * هیچ بایتی نوشته نمی‌شود.
 * ==========================================================================*/
async function validateSources(resolved) {
  const problems = [];
  const ready = [];

  for (const entry of resolved) {
    const where = `${entry.sku} «${entry.label}»`;
    const abs = path.join(config.storage.products, entry.file);

    let buffer;
    try {
      buffer = await fs.readFile(abs);
    } catch (err) {
      problems.push(`${where}: فایل خوانده نشد (${err.code || err.message}) — ${shown(entry.file)}`);
      continue;
    }

    if (buffer.length !== entry.bytes) {
      problems.push(`${where}: حجم ${buffer.length} است، نه ${entry.bytes}.`);
      continue;
    }

    const got = sha256(buffer);
    if (got !== entry.sha256) {
      problems.push(`${where}: هش محتوا نمی‌خواند. انتظار ${entry.sha256.slice(0, 16)}…، دریافت ${got.slice(0, 16)}…`);
      continue;
    }

    /* لایهٔ ۱ — حجم و بایت‌های ابتدایی. همان تابع مسیر مدیر. */
    const basic = validateUploadedImage(buffer);
    if (!basic.ok) { problems.push(`${where}: ${basic.message}`); continue; }
    if (basic.mime !== 'image/jpeg') {
      problems.push(`${where}: نوع فایل ${basic.mime} است، نه image/jpeg.`);
      continue;
    }

    /* لایهٔ ۲ — ابعاد واقعی. رمزگشایی لازم دارد ولی چیزی نمی‌نویسد. */
    const inspected = await inspectUploadedImage(buffer);
    if (!inspected.ok) { problems.push(`${where}: ${inspected.message}`); continue; }

    ready.push({ ...entry, buffer, meta: inspected.meta });
  }

  return { problems, ready };
}

/* ==================================================== مرحله ۳ — برخوردها ===
 * هیچ فایل موجودی بازنویسی نمی‌شود. اگر پوشهٔ شناسه یا فایل اصل از قبل
 * هست، همان‌جا متوقف می‌شویم و گزارش می‌دهیم.
 * ==========================================================================*/
async function checkCollisions(ready) {
  const problems = [];

  for (const entry of ready) {
    const dir = derivativeDir(entry.imageId);
    if (await exists(dir)) {
      const inside = await fs.readdir(dir).catch(() => []);
      problems.push(`${entry.sku}: پوشهٔ ${entry.imageId} از قبل وجود دارد (${inside.length} فایل). `
        + 'بازنویسی نمی‌شود.');
    }
    const originals = await findOriginal(entry.imageId);
    if (originals.length) {
      problems.push(`${entry.sku}: فایل اصل از قبل وجود دارد (${originals.join(', ')}). بازنویسی نمی‌شود.`);
    }
  }

  return problems;
}

/* ======================================================= مرحله ۵ — نوشتن ===
 * فقط با --execute. واترمارک از مرحله ۴ تحویل داده می‌شود — اینجا دوباره بار
 * نمی‌شود، تا شکستِ بارگذاری پیش از هر نوشتنی گرفته شده باشد.
 * هر تصویر مستقل است: شکست یکی بقیه را متوقف نمی‌کند، ولی
 * در گزارش پایانی صریح می‌آید و کد خروج ۱ می‌شود.
 * ==========================================================================*/
async function writeDerivatives(ready, watermark) {
  const done = [];
  const failed = [];

  for (const entry of ready) {
    const label = `${entry.sku} «${entry.label}»`;
    try {
      const processed = await processProductImage(entry.buffer, {
        watermark,
        storage: pinnedStorage(entry.imageId),
      });
      /* processed.id شناسهٔ تصادفیِ داخلی است و استفاده نمی‌شود؛ بایت‌ها به
         لطف آداپتور زیر entry.imageId نشسته‌اند. این را صریح می‌سنجیم. */
      const dir = derivativeDir(entry.imageId);
      const written = await fs.readdir(dir).catch(() => []);
      if (written.length !== 8) {
        failed.push({ entry, reason: `${written.length} فایل مشتق ساخته شد، نه ۸.` });
        continue;
      }
      done.push({ entry, derivatives: processed.derivatives.length, files: written.length });
      console.log(`  ✓ ${label} → ${entry.imageId} (${written.length} مشتق)`);
    } catch (err) {
      failed.push({ entry, reason: err.message });
      console.error(`  ✗ ${label}: ${err.message}`);
    }
  }

  return { done, failed };
}

/* ============================================================== گردانندهٔ کار */
async function main() {
  /* پرچم ناشناخته، پیش از هر کار دیگری. */
  const bad = unknownFlags();
  if (bad.length) {
    console.error(`\n  آرگومان ناشناخته: ${bad.join('، ')}`);
    console.error('  این اسکریپت فقط --execute را می‌شناسد.\n');
    console.error('  اجرا:');
    console.error('    node scripts/restore-product-image-derivatives.js             اعتبارسنجی');
    console.error('    node scripts/restore-product-image-derivatives.js --execute   نوشتن واقعی');
    process.exitCode = 1;
    return;
  }

  console.log('\n=== بازسازی مشتق‌های تصویر محصول ===');
  console.log(`  حالت: ${EXECUTE ? 'نوشتن واقعی (--execute)' : 'اعتبارسنجی (پیش‌فرض، هیچ نوشتنی)'}`);
  console.log('  ریشهٔ ذخیره‌سازی: از STORAGE_ROOT خوانده شد (چاپ نمی‌شود)');
  console.log(`  اندازه‌های مشتق: ${config.images.sizes.map((s) => s.name).join('، ')} × jpg و webp`);
  console.log(`  واترمارک: ${config.images.watermarkEnabled ? 'روشن' : 'خاموش'}`);

  /* --- مرحله ۱ --- */
  console.log('\n--- ۱. شکل نقشه ---');
  const shape = validateMappingShape();
  console.log(`  قلم‌ها: ${MAPPING.length} · حل‌شده: ${shape.resolved.length} · حل‌نشده: ${shape.unresolved.length}`);

  if (shape.problems.length) {
    console.error('\n  ایرادهای نقشه:');
    for (const p of shape.problems) console.error(`    • ${p}`);
  }

  if (shape.unresolved.length) {
    console.error('\n  === قلم‌های حل‌نشده — اسکریپت اجرا نمی‌شود ===');
    for (const u of shape.unresolved) {
      console.error(`    • ${u.sku} «${u.label}»`);
      console.error(`      شناسهٔ موجود: ${u.imageId}`);
      console.error(`      ${u.note}`);
    }
    console.error('\n  فایل‌های بسته‌نشده:');
    for (const c of UNASSIGNED_CANDIDATES) {
      console.error(`    • ${shown(c.file)}  (${c.bytes} بایت)`);
    }
    console.error('\n  برای ادامه: در جدول MAPPING همین فایل، فیلدهای file/sha256/bytes');
    console.error('  آن دو قلم را پر کنید. حدس زدن ممنوع — تصویر اصلیِ محصول عوض می‌شود.');
    process.exitCode = 1;
    return;
  }

  if (shape.problems.length) {
    console.error('\n  === متوقف شد: نقشه ایراد دارد. هیچ چیزی نوشته نشد. ===');
    process.exitCode = 1;
    return;
  }

  /* --- مرحله ۲ --- */
  console.log('\n--- ۲. فایل‌های منبع ---');
  const { problems: srcProblems, ready } = await validateSources(shape.resolved);
  console.log(`  آماده: ${ready.length} از ${shape.resolved.length}`);
  if (srcProblems.length) {
    console.error('\n  ایرادها:');
    for (const p of srcProblems) console.error(`    • ${p}`);
    console.error('\n  === متوقف شد. هیچ چیزی نوشته نشد. ===');
    process.exitCode = 1;
    return;
  }

  /* --- مرحله ۳ --- */
  console.log('\n--- ۳. بررسی برخورد با فایل‌های موجود ---');
  const collisions = await checkCollisions(ready);
  if (collisions.length) {
    console.error('  فایل یا پوشهٔ غیرمنتظره پیدا شد:');
    for (const c of collisions) console.error(`    • ${c}`);
    console.error('\n  === متوقف شد. هیچ فایل موجودی بازنویسی نشد. ===');
    process.exitCode = 1;
    return;
  }
  console.log('  هیچ برخوردی نیست — هر ۱۹ پوشهٔ شناسه خالی‌اند.');

  /* --- مرحله ۴ — واترمارک، با شکستِ بسته (fail closed) ---
     loadWatermark در دو حالتِ *کاملا متفاوت* null برمی‌گرداند:
       الف) واترمارک عمدا خاموش است (adminProductImagesController.js خط ۵۱)
            — null درست و منتظره است.
       ب) روشن است ولی فایل خوانده نشد (خط ۵۵ تا ۵۸) — آنجا null یک
            شکستِ بی‌صداست، چون برای مسیر آپلودِ مدیر «نبودِ واترمارک نباید
            جلوی آپلود را بگیرد».
     برای یک بازیابیِ دسته‌ای این قاعده درست نیست: نوزده تصویرِ عمومی بدون
     واترمارک نوشته می‌شود و برگرداندنش یعنی پاک کردن و ساختن دوباره. پس
     حالت (ب) اینجا کشنده است و پیش از هر پردازش و هر نوشتنی متوقف می‌کنیم.
     حالت (الف) عبور می‌کند. */
  console.log('\n--- ۴. واترمارک ---');
  const watermark = await loadWatermark();
  if (!config.images.watermarkEnabled) {
    console.log('  WATERMARK_ENABLED خاموش است — مشتق‌ها عمدا بدون واترمارک ساخته می‌شوند.');
  } else if (!watermark) {
    console.error('  ✗ واترمارک روشن است ولی بار نشد.');
    console.error('    فایلِ واترمارک از پیکربندی خوانده می‌شود (مسیرش چاپ نمی‌شود).');
    console.error('    دلیلِ دقیق در پیام «[images] واترمارک بار نشد» بالاتر آمده است.');
    console.error('\n  === متوقف شد. هیچ تصویری پردازش و هیچ فایلی نوشته نشد. ===');
    console.error('  اگر *عمدا* واترمارک نمی‌خواهید، WATERMARK_ENABLED را خاموش کنید');
    console.error('  و دوباره اجرا کنید — تا بی‌واترمارک بودن یک تصمیم صریح باشد.');
    process.exitCode = 1;
    return;
  } else {
    console.log('  واترمارک بار شد.');
  }

  /* --- گزارش حالت آزمایشی --- */
  if (!EXECUTE) {
    const perImage = config.images.sizes.length * 2;
    console.log('\n--- خلاصهٔ نوشتن برنامه‌ریزی‌شده (انجام *نشد*) ---');
    for (const e of ready) {
      const flag = e.mappedBy === 'user-directed' ? '  ⚠️ تطبیق دستوری' : '';
      console.log(`  ${e.sku.padEnd(10)} ${e.imageId}  ${e.meta.width}×${e.meta.height}${flag}`);
      console.log(`             ← ${shown(e.file)}`);
    }
    const directed = ready.filter((e) => e.mappedBy === 'user-directed');
    if (directed.length) {
      console.log(`\n  ⚠️ ${directed.length} قلم با تطبیق *دستوریِ* کاربر — نه شاهد مستقل:`);
      for (const d of directed) console.log(`     ${d.sku} ${d.imageId} ← ${shown(d.file)}`);
      console.log('     پیش از --execute این دو را تأیید کنید.');
    }
    console.log(`\n  تصویرها: ${ready.length}`);
    console.log(`  مشتق‌ها: ${ready.length} × ${perImage} = ${ready.length * perImage} فایل`);
    console.log(`  اصل‌ها:  ${ready.length} فایل`);
    console.log(`  جمع:     ${ready.length * (perImage + 1)} فایل`);
    console.log('\n  هیچ بایتی نوشته نشد. برای نوشتن واقعی:');
    console.log('    node scripts/restore-product-image-derivatives.js --execute');
    return;
  }

  /* --- مرحله ۴ --- */
  console.log('\n--- ۵. نوشتن ---');
  const { done, failed } = await writeDerivatives(ready, watermark);

  console.log('\n=== نتیجه ===');
  console.log(`  موفق: ${done.length} از ${ready.length}`);
  if (failed.length) {
    console.error(`  ناموفق: ${failed.length}`);
    for (const f of failed) {
      console.error(`    • ${f.entry.sku} (${f.entry.imageId}): ${f.reason}`);
    }
    console.error('\n  ⚠️  بازیابی *ناقص* است. هیچ فایل منبعی پاک نشد و هیچ ردیفی');
    console.error('      در پایگاه داده عوض نشد. قلم‌های ناموفق را بررسی کنید و');
    console.error('      دوباره اجرا کنید — قلم‌های موفق به‌خاطر بررسی برخورد');
    console.error('      دوباره نوشته نمی‌شوند.');
    process.exitCode = 1;
    return;
  }

  console.log('  هیچ ردیفی در پایگاه داده خوانده یا عوض نشد.');
  console.log('  نوزده JPEG لخت دست‌نخورده‌اند (قرنطینه‌شان یک تصمیم جداگانه است).');
  console.log('\n  بررسی: GET /media/products/<image_id>/card.jpg باید ۲۰۰ بدهد.');
}

/* همان نگهبان اجرای مستقیمِ src/db/migrate.js: مقایسه روی نشانی فایل، نه
   مسیر سیستم‌عامل — تا روی ویندوز هم درست کار کند. */
const isDirectRun = Boolean(process.argv[1])
  && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectRun) {
  try {
    await main();
  } catch (err) {
    console.error('[restore-product-image-derivatives] خطا:', err.message);
    process.exitCode = 1;
  }
}
