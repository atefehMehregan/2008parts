/* ============================================================================
 * scripts/data/product-image-candidates.js — گزارش نامزدهای تصویر (فاز ۶)
 * ----------------------------------------------------------------------------
 * ⚠️  این فایل مانیفست وارد کردن *نیست* و واردکننده آن را نمی‌خواند.
 *     واردکننده فقط scripts/data/product-image-manifest.js را می‌خواند و نام
 *     صادراتی‌های اینجا (CANDIDATE_META / IMAGE_CANDIDATES) عمدا متفاوت است
 *     تا به‌اشتباه مصرف نشود.
 *
 * چه چیزی اینجاست؟
 *   برای هر چهل کد کالای کاتالوگ معتبر، نشانی تصویر *واقعیِ* صفحهٔ منبع —
 *   همان صفحه‌ای که کاتالوگ از قبل برای آن کد کالا ثبت کرده است. نشانی‌ها با
 *   بازرسی HTML صفحه‌ها به‌دست آمده‌اند (og:image). هیچ تصویری دانلود نشده.
 *
 * چرا هیچ‌کدام وارد نشده‌اند؟
 *   هر دو تارنمای منبع، حق استفاده را *صریحا* برای خودشان محفوظ کرده‌اند:
 *
 *     ashrafiparts.com  «تمامی حقوق … مطابق ماده ۱۲ فصل سوم قانون جرائم
 *                        رایانه‌ای هرگونه کپی برداری … پیگرد قانونی دارد.»
 *     servicetak.ir     «کلیه حقوق این وب سایت متعلق به سرویس تک می باشد.»
 *
 *   پس rightsStatus همه‌جا 'not_cleared' است و واردکننده — به‌درستی — آن‌ها
 *   را رد می‌کند. این فایل برای *گرفتن اجازه* است، نه برای دور زدن آن:
 *   وقتی تأمین‌کننده یا مالک تصویر اجازهٔ کتبی داد، همین ردیف‌ها با
 *   rightsStatus='owner_supplied' (یا 'licensed')، sourceRef (شمارهٔ ایمیل/
 *   فاکتور) و approvedAt به مانیفست واقعی منتقل می‌شوند.
 *
 * matchEvidence — شواهد تطبیق تصویر با کد کالا، بدون اغراق:
 *   page_primary           تصویرِ اصلیِ اعلام‌شدهٔ همان صفحهٔ منبعِ ثبت‌شده
 *   oem_in_filename        نام فایل شمارهٔ فنی را هم دارد (شاهد قوی‌تر)
 *   source_url_redirected  نشانی کاتالوگ ۳۰۱ می‌دهد؛ صفحهٔ مقصد استفاده شد
 *   name_mismatch          نام قطعه در صفحهٔ مقصد با کاتالوگ نمی‌خواند
 *
 * هیچ نام محصول، شماره فنی، برند یا تأییدی اینجا ساخته نشده است.
 * ==========================================================================*/

export const CANDIDATE_META = {
  version: 1,
  generatedAt: "2026-10-03",
  authoritativeSource: 'src/data/storefront-catalogue.js',
  totalSkus: 40,
  clearedForImport: 0,
  pendingPermission: 40,
  imagesDownloaded: 0,
  note: 'گزارش پژوهشی. هیچ تصویری دانلود، پردازش یا وارد نشده است.',
};

export const IMAGE_CANDIDATES = [
  {
    "sku": "P2008-001",
    "name": "فیلتر روغن",
    "oemNumber": "1109CL",
    "altText": "فیلتر روغن",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%D9%81%DB%8C%D9%84%D8%AA%D8%B1-%D8%B1%D9%88%D8%BA%D9%86-1109cl/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/1109CL.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary",
      "oem_in_filename"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-002",
    "name": "فیلتر هوا",
    "oemNumber": "1444TT",
    "altText": "فیلتر هوا",
    "sourceName": "ServiceTak",
    "sourceUrl": "https://www.servicetak.ir/%D9%81%DB%8C%D9%84%D8%AA%D8%B1-%D9%87%D9%88%D8%A7%DB%8C-%D9%BE%DA%98%D9%88-2008/",
    "candidateImageUrl": "https://www.servicetak.ir/wp-content/uploads/2019/01/پژو-2008.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «کلیه حقوق این وب سایت متعلق به سرویس تک می باشد.» — حقوق محفوظ، بدون اجازهٔ بازنشر.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-003",
    "name": "فیلتر اتاق",
    "oemNumber": null,
    "altText": "فیلتر اتاق",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%D9%81%DB%8C%D9%84%D8%AA%D8%B1-%D9%87%D9%88%D8%A7-%DA%A9%D8%A7%D8%A8%DB%8C%D9%86-%DA%A9%D8%B1%D8%A8%D9%86-%D8%A7%DA%A9%D8%AA%DB%8C%D9%88-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/Cabin-air-2008-C3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-006",
    "name": "لنت ترمز جلو",
    "oemNumber": "1617275680",
    "altText": "لنت ترمز جلو",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%D9%84%D9%86%D8%AA-%D8%AA%D8%B1%D9%85%D8%B2-%D8%AC%D9%84%D9%88-2008-eurorepar-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/12/Eurorepar-Brake-Pads.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-007",
    "name": "دیسک چرخ",
    "oemNumber": "4249J6",
    "altText": "دیسک چرخ",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/دیسک-ترمز-جلو-پژو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/peugeot-2008-disc.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary",
      "source_url_redirected"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-016",
    "name": "توپی سرکمک جلو",
    "oemNumber": "9811370580",
    "altText": "توپی سرکمک جلو",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/توپی-سر-کمک-پژو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/09/Suspension-Support.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary",
      "source_url_redirected"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-039",
    "name": "تسمه دینام",
    "oemNumber": "v760401480",
    "altText": "تسمه دینام",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%D8%AA%D8%B3%D9%85%D9%87-%D8%AF%DB%8C%D9%86%D8%A7%D9%85-%D9%BE%DA%98%D9%88-2008-508-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/V-Ribbed-Belt-2008-508-c3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-046",
    "name": "ترموستات",
    "oemNumber": "9808647180",
    "altText": "ترموستات",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/ترموستات-هوزینگ-آب-پژو-2008-508-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/EP6-Thermostat-Housing.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary",
      "source_url_redirected"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-072",
    "name": "پمپ برقی هوای توربوشارژ",
    "oemNumber": "V759327380",
    "altText": "پمپ برقی هوای توربوشارژ",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/شیر-برقی-هوای-توربوشارژ-پژو-2008-508-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/09/Turbo-Solenoid-Valve-2008-508-c3-Ashrafi-PSA.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary",
      "source_url_redirected",
      "name_mismatch"
    ],
    "matchWarning": "کاتالوگ «پمپ برقی هوای توربوشارژ» می‌گوید، ولی صفحهٔ مقصدِ ریدایرکت «شیر برقی هوای توربوشارژ» است و نام فایل تصویر Turbo-Solenoid-Valve. پمپ و شیر برقی یک قطعه نیستند؛ پیش از هر استفاده‌ای باید با تأمین‌کننده روشن شود.",
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-071",
    "name": "چراغ جلو",
    "oemNumber": "9825313680",
    "altText": "چراغ جلو",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%DA%86%D8%B1%D8%A7%D8%BA-%D8%AC%D9%84%D9%88-%D9%BE%DA%98%D9%88-2008/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2022/02/2008-front-right-light.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-004",
    "name": "فیلتر بنزین",
    "oemNumber": "1567C6",
    "altText": "فیلتر بنزین",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%d9%81%db%8c%d9%84%d8%aa%d8%b1-%d8%a8%d9%86%d8%b2%db%8c%d9%86-%d9%be%da%98%d9%88-%d8%b3%db%8c%d8%aa%d8%b1%d9%88%d8%a6%d9%86/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/1567C6.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary",
      "oem_in_filename"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-073",
    "name": "فیلتر هوا کابین ضد آلرژی",
    "oemNumber": "647990",
    "altText": "فیلتر هوا کابین ضد آلرژی",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/فیلتر-هوا-کابین-کربن-ضد-آلرژی-پژو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2023/07/PSA-cabin-filter-set-anti-allergic-647990.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary",
      "oem_in_filename"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-074",
    "name": "روغن گیربکس اتوماتیک JWS 3324",
    "oemNumber": "9734R7",
    "altText": "روغن گیربکس اتوماتیک JWS 3324",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/روغن-گیربکس-at6-aisin-jws3324-پژو-2008-508-سیتروئن-c3-ds/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2023/07/Peugeot-2008-508-C3-AT6-Fluid-Psa-9734R7.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary",
      "oem_in_filename"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-075",
    "name": "دیسک ترمز جلو یوروریپار",
    "oemNumber": "1686717080",
    "altText": "دیسک ترمز جلو یوروریپار",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%d8%af%db%8c%d8%b3%da%a9-%d8%aa%d8%b1%d9%85%d8%b2-%d8%ac%d9%84%d9%88-%d9%be%da%98%d9%88-2008-c3-%db%8c%d9%88%d8%b1%d9%88%d8%b1%db%8c%d9%be%d8%a7%d8%b1-eurorepar/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2023/11/2008-c3-front-brake-disc-eurorepar.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-076",
    "name": "سوئیچ پدال ترمز",
    "oemNumber": "1606480480",
    "altText": "سوئیچ پدال ترمز",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%d8%b3%d9%88%d8%a6%db%8c%da%86-%d9%be%d8%af%d8%a7%d9%84-%d8%aa%d8%b1%d9%85%d8%b2-%d9%be%da%98%d9%88-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/09/PSA-Brake-Pedal-Switch-453465.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-015",
    "name": "کمک فنر جلو",
    "oemNumber": "9820327880",
    "altText": "کمک فنر جلو",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/کمک-فنر-جلو-پژو-2008/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/09/Peugeot-2008-Shock-absorber-4.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-022",
    "name": "طبق",
    "oemNumber": "9822126880",
    "altText": "طبق",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/طبق-پژو-2008/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/09/triangle-control-arm-2008.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-023",
    "name": "سیبک طبق",
    "oemNumber": "364065",
    "altText": "سیبک طبق",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/سیبک-طبق-پژو-2008/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/09/peugeot-2008-control-arm-joint-3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-025",
    "name": "میل موجگیر جلو",
    "oemNumber": "508769",
    "altText": "میل موجگیر جلو",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/میل-رابط-موجگیر-جلو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2022/02/Left-Strut-Stabiliser-2008-c3-ashrafiparts-PSA.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-020",
    "name": "بلبرینگ چرخ جلو",
    "oemNumber": "1606623580",
    "altText": "بلبرینگ چرخ جلو",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/بلبرینگ-چرخ-جلو-پژو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/09/Front-Wheel-Bearing-2008-C3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-026",
    "name": "لاستیک چاکدار",
    "oemNumber": "5094C3",
    "altText": "لاستیک چاکدار",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/لاستیک-چاکدار-موجگیر-پژو-2008/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2022/02/Bearing-bush.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-077",
    "name": "کوئل موتور",
    "oemNumber": "597091",
    "altText": "کوئل موتور",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/کویل-موتور-ep6/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/PSA-Coil.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-078",
    "name": "شمع موتور بوش آلمان",
    "oemNumber": "0242145607",
    "altText": "شمع موتور بوش آلمان",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%d8%b4%d9%85%d8%b9-%d9%85%d9%88%d8%aa%d9%88%d8%b1-%d9%be%da%98%d9%88-2008-c3-508-%d8%a8%d9%88%d8%b4-%d8%a2%d9%84%d9%85%d8%a7%d9%86/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2024/07/peugeot-2008-bosch-iridium-spark-plug-ashrafi.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-079",
    "name": "شمع اورجینال پژو سیتروئن",
    "oemNumber": null,
    "altText": "شمع اورجینال پژو سیتروئن",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/شمع-پژو-2008-508-c3-موتور-ep6/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2022/01/PSA-NGK-Spak-Plug-5960L5.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-044",
    "name": "واتر پمپ",
    "oemNumber": "9801573380",
    "altText": "واتر پمپ",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%d9%88%d8%a7%d8%aa%d8%b1-%d9%be%d9%85%d9%be-%d8%a2%d8%a8-%d9%be%da%98%d9%88-2008-508-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2022/02/EP6-Waterpump.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-052",
    "name": "شیر برقی کنترل تایم",
    "oemNumber": null,
    "altText": "شیر برقی کنترل تایم",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%d8%b4%db%8c%d8%b1-%d8%a8%d8%b1%d9%82%db%8c-%d9%83%d9%86%d8%aa%d8%b1%d9%84-%d8%aa%d8%a7%d9%8a%d9%85-%d9%be%da%98%d9%88-2008-508-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2024/10/Variable-Valve-Timing-Control-Solenoid-2008-508-c3-ashrafi-PSA.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-080",
    "name": "سنسور موقعیت میل سوپاپ",
    "oemNumber": "1920LS",
    "altText": "سنسور موقعیت میل سوپاپ",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%d8%b3%d9%86%d8%b3%d9%88%d8%b1-%d9%85%d9%88%d9%82%d8%b9%db%8c%d8%aa-%d9%85%db%8c%d9%84-%d8%b3%d9%88%d9%be%d8%a7%d9%be-%d9%be%da%98%d9%88-2008-508-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2024/12/PSA-Camshaft-sensor-ashrafi-2008-508-c3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-081",
    "name": "سنسور فشار هوا",
    "oemNumber": "1922v7",
    "altText": "سنسور فشار هوا",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/سنسور-فشار-هوا-پژو-2008-508-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2024/05/Air-Pressure-Sensor-MAP-2008-508-c3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-067",
    "name": "دینام",
    "oemNumber": "9822230780",
    "altText": "دینام",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%d8%af%db%8c%d9%86%d8%a7%d9%85-%d9%be%da%98%d9%88-2008-508-c3-%d8%a7%d9%88%d8%b1%d8%ac%db%8c%d9%86%d8%a7%d9%84/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2024/11/alternator-psa-ashrafi-2008-508-c3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-082",
    "name": "پمپ بنزین داخل باک",
    "oemNumber": "9813573680",
    "altText": "پمپ بنزین داخل باک",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/پمپ-بنزین-پژو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2024/08/fuel-pump-PSA-ashrafi-parts-2008-c3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-057",
    "name": "رادیاتور بخاری",
    "oemNumber": "1608182480",
    "altText": "رادیاتور بخاری",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/رادیاتور-بخاری-پژو-2008-c3-سیتروئن/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2024/05/interior-heating-heat-exchanger-2008-c3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-058",
    "name": "رادیاتور کولر (کندانسور)",
    "oemNumber": "9828083680",
    "altText": "رادیاتور کولر (کندانسور)",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/رادیاتور-کولر-پژو-2008-c3-کندانسور/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2023/10/air-conditioning-condenser-new-original-2008-c3.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-061",
    "name": "منبع انبساط",
    "oemNumber": "9800777280",
    "altText": "منبع انبساط",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/منبع-انبساط-آب-رادیاتور-پژو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/12/PSA-Expansion-tank.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-083",
    "name": "یونیت فن",
    "oemNumber": "9827892380",
    "altText": "یونیت فن",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/یونیت-فن-پژو-2008-301/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2023/07/peugeot-2008-301-Fan-Rheostat-New.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-084",
    "name": "چراغ عقب روی درب صندوق",
    "oemNumber": "9814758480",
    "altText": "چراغ عقب روی درب صندوق",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/%da%86%d8%b1%d8%a7%d8%ba-%d8%b9%d9%82%d8%a8-%d8%b1%d9%88%db%8c-%d8%af%d8%b1%d8%a8-%d8%b5%d9%86%d8%af%d9%88%d9%82-%d9%be%da%98%d9%88-2008/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2022/07/peugeot-2008-tail-light.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-085",
    "name": "چراغ مه‌شکن عقب",
    "oemNumber": "4005L",
    "altText": "چراغ مه‌شکن عقب",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/مه-شکن-عقب-پژو-2008-تایوان/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2023/10/depo-rear-left-fog-light-peugeot-2008.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-086",
    "name": "چراغ پلاک LED",
    "oemNumber": "9815226680",
    "altText": "چراغ پلاک LED",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/چراغ-پلاک-led-پژو-2008-سیتروئن-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2023/02/Licence-plate-LED-light-PSA.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-087",
    "name": "تیغه برف‌پاک‌کن جلو",
    "oemNumber": "1642333880",
    "altText": "تیغه برف‌پاک‌کن جلو",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/تیغه-برف-پاک-کن-جلو-پژو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/Peugeot-2008-Wiper-blade.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-088",
    "name": "چشمی شیشه‌شوی جلو",
    "oemNumber": "9808301880",
    "altText": "چشمی شیشه‌شوی جلو",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/چشم-شیشه-شوی-پژو-2008-c3/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2022/07/windscreen-washer-jet-nozzle.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  },
  {
    "sku": "P2008-089",
    "name": "آینه بغل کامل",
    "oemNumber": "1611240680",
    "altText": "آینه بغل کامل",
    "sourceName": "Ashrafi Parts",
    "sourceUrl": "https://ashrafiparts.com/product/آینه-بغل-کامل-پژو-2008/",
    "candidateImageUrl": "https://ashrafiparts.com/wp-content/uploads/2021/08/Peugeot-2008-Right-Mirror.jpg",
    "rightsStatus": "not_cleared",
    "rightsNote": "پانویس تارنما: «تمامی حقوق برای این سایت محفوظ می باشد و مطابق ماده ۱۲ فصل سوم قانون جرائم رایانه‌ای هرگونه کپی برداری از طرح قالب و مطالب تارنمای Ashrafi Parts پیگرد قانونی دارد.» — منعِ صریح، نه سکوت.",
    "matchEvidence": [
      "page_primary"
    ],
    "matchWarning": null,
    "approvedAt": null,
    "approvedBy": null,
    "isPrimary": true
  }
];

export default { CANDIDATE_META, IMAGE_CANDIDATES };
