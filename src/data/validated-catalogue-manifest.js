/* ============================================================================
 * data/validated-catalogue-manifest.js — مانیفست ۳۰ قطعهٔ اعتبارسنجی‌شده
 * ----------------------------------------------------------------------------
 * ادامهٔ commercial-catalogue-manifest.js (ده قطعهٔ اول). این فایل سی قطعهٔ
 * بعدی را نگه می‌دارد که هر کدام روی *صفحهٔ محصول واقعی* بررسی شده‌اند —
 * نه از روی خلاصهٔ نتیجهٔ جست‌وجو.
 *
 * سند پژوهش است، نه قیمت‌نامه. هیچ عددی از اینجا قیمت فروش نمی‌شود.
 *
 * ---------------------------------------------------------------------------
 * مرزهای شواهد، بدون استثنا
 *
 *   * هیچ شماره فنی «verified» نیست. هر شماره‌ای که فروشنده گفته است
 *     «candidate» می‌ماند. دو شماره‌ای که با هم نمی‌خوانند «conflicting»
 *     می‌شوند و هیچ‌کدام انتخاب نمی‌شود.
 *   * هیچ منبعی نگفته «A94» یا «THP165». پس a94Fitment همه‌جا
 *     'supported' است (از بافتِ بازار ایران، که تنها ۲۰۰۸ موجودش همان
 *     خودروی ایکاپ بوده) و هرگز 'verified' نیست.
 *   * «EP6» فقط خانوادهٔ موتور را ثابت می‌کند، نه زیرکد و نه THP165.
 *     زیرکد EP6 همچنان حل‌نشده است و اینجا حدس زده نمی‌شود.
 *   * قیمت و موجودی، قیمت و موجودیِ *فروشندهٔ دیگر* در تاریخ پژوهش است.
 *   * هیچ تصویری از نظر حقوقی پاک‌سازی نشده است.
 * ==========================================================================*/

export const VALIDATION_META = {
  researchDate: '2026-09-27',
  sourceReport: 'گزارش اعتبارسنجی ۳۰ محصول — صفحه‌به‌صفحه',
  primarySource: 'Ashrafi Parts (فروشندهٔ ایرانی قطعات اورجینال پژو ۲۰۰۸ / ۵۰۸ / C3)',
  disclaimers: {
    oem: 'هیچ شماره فنی‌ای مستقل تأیید نشده است. همه ادعای فروشنده‌اند.',
    a94: 'هیچ منبعی صریح «A94» نگفته است؛ استنتاج از بافت بازار ایران است.',
    thp165: 'هیچ منبعی صریح «THP165» نگفته است. «EP6» فقط خانواده است.',
    engineCode: 'زیرکد EP6 حل‌نشده باقی می‌ماند و اینجا انتخاب نمی‌شود.',
    prices: 'قیمت‌ها مرجع پژوهشی‌اند، نه قیمت فروش parts2008.',
    stock: 'موجودی، موجودیِ فروشندهٔ دیگر است، نه انبار ما.',
    images: 'هیچ تصویری برای استفادهٔ تجاری پاک‌سازی نشده و دانلود نشده است.',
  },
};

/** وضعیت‌های مجاز شماره فنی. «verified» عمدا استفاده نمی‌شود. */
export const OEM_STATUS = {
  CANDIDATE: 'candidate',
  CONFLICTING: 'conflicting',
  NOT_FOUND: 'not_found',
};

/** وضعیت‌های مجاز تطبیق. */
export const FITMENT = {
  VERIFIED: 'verified',
  SUPPORTED: 'supported',
  UNCERTAIN: 'uncertain',
  NOT_FOUND: 'not_found',
};

const S = 'Ashrafi Parts';
const U = 'https://ashrafiparts.com/product/';

/* الگوی مشترک: ایران تأییدشده، A94 پشتیبانی‌شده، تصویر پاک‌سازی‌نشده. */
const base = {
  sourceName: S,
  iranianMarketFitment: FITMENT.VERIFIED,
  a94Fitment: FITMENT.SUPPORTED,
  thp165Fitment: FITMENT.NOT_FOUND,
  eat6Relevance: FITMENT.NOT_FOUND,
  compatibilityVerified: false,
  imageAvailable: true,
  imageReuseStatus: 'not_cleared',
};

export const VALIDATED_PRODUCTS = [
  /* ------------------------------------------- فیلتر و سرویس (۳) */
  { ...base, sku: 'P2008-004', name: 'فیلتر بنزین', category: 'filters',
    brand: 'PSA', oemNumber: '1567C6', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}%d9%81%db%8c%d9%84%d8%aa%d8%b1-%d8%a8%d9%86%d8%b2%db%8c%d9%86-%d9%be%da%98%d9%88-%d8%b3%db%8c%d8%aa%d8%b1%d9%88%d8%a6%d9%86/`,
    researchedSellerPriceToman: 1600000, researchedSellerStock: 'in_stock',
    imageCount: 3, variantOf: null,
    notes: 'بنزینی بودن صریح است. عنوان آگهی عمومی است ولی متن، «پژو ۲۰۰۸» را نام می‌برد.' },

  { ...base, sku: 'P2008-073', name: 'فیلتر هوا کابین ضد آلرژی', category: 'filters',
    brand: 'PSA', oemNumber: '647990', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}فیلتر-هوا-کابین-کربن-ضد-آلرژی-پژو-2008-c3/`,
    researchedSellerPriceToman: 2500000, researchedSellerStock: 'out_of_stock',
    imageCount: 3, variantOf: 'P2008-003',
    notes: 'گونهٔ دیگرِ فیلتر کابین در کنار نوع کربن‌اکتیو (P2008-003)، با شماره فنی متفاوت.' },

  { ...base, sku: 'P2008-074', name: 'روغن گیربکس اتوماتیک JWS 3324', category: 'filters',
    brand: 'PSA', oemNumber: '9734R7', oemStatus: OEM_STATUS.CANDIDATE,
    eat6Relevance: FITMENT.VERIFIED,
    sourceUrl: `${U}روغن-گیربکس-at6-aisin-jws3324-پژو-2008-508-سیتروئن-c3-ds/`,
    researchedSellerPriceToman: 13000000, researchedSellerStock: 'out_of_stock',
    imageCount: 2, variantOf: null,
    notes: 'تنها قلمی که ارتباطش با گیربکس EAT6 صریح است: صفحه «AT6-Aisin AW TF» را نام می‌برد. قوطی ۲ لیتری از ظرفیت ۷ لیتر.' },

  /* ------------------------------------------------------ ترمز (۲) */
  { ...base, sku: 'P2008-075', name: 'دیسک ترمز جلو یوروریپار', category: 'brakes',
    brand: 'Eurorepar', oemNumber: '1686717080', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}%d8%af%db%8c%d8%b3%da%a9-%d8%aa%d8%b1%d9%85%d8%b2-%d8%ac%d9%84%d9%88-%d9%be%da%98%d9%88-2008-c3-%db%8c%d9%88%d8%b1%d9%88%d8%b1%db%8c%d9%be%d8%a7%d8%b1-eurorepar/`,
    researchedSellerPriceToman: 23000000, researchedSellerStock: 'out_of_stock',
    imageCount: 2, variantOf: 'P2008-007',
    notes: 'محور جلو صریح، قیمت برای *جفت*، قطر ۲۸۳. گونهٔ برندِ دیگرِ دیسک PSA (P2008-007).' },

  { ...base, sku: 'P2008-076', name: 'سوئیچ پدال ترمز', category: 'brakes',
    brand: 'PSA', oemNumber: '1606480480', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['453465'], eat6Relevance: FITMENT.SUPPORTED,
    sourceUrl: `${U}%d8%b3%d9%88%d8%a6%db%8c%da%86-%d9%be%d8%af%d8%a7%d9%84-%d8%aa%d8%b1%d9%85%d8%b2-%d9%be%da%98%d9%88-2008-c3/`,
    researchedSellerPriceToman: 2900000, researchedSellerStock: 'in_stock',
    imageCount: 8, variantOf: null,
    notes: 'میکروسوئیچ استپ ترمز. صفحه می‌گوید روی قفل گیربکس اتوماتیک، ESP و کروز هم اثر دارد — همین ارتباطش با EAT6 است.' },

  /* --------------------------------------------- تعلیق و فرمان (۶) */
  { ...base, sku: 'P2008-015', name: 'کمک فنر جلو', category: 'suspension',
    brand: 'PSA', oemNumber: '9820327880', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['9820327780'],
    sourceUrl: `${U}کمک-فنر-جلو-پژو-2008/`,
    researchedSellerPriceToman: 25000000, researchedSellerStock: 'in_stock',
    imageCount: 5, variantOf: null,
    notes: 'ساخت KYB. انتخاب چپ/راست دارد و فروش فقط جفتی است. کدام شماره برای کدام سمت است، اعلام نشده.' },

  { ...base, sku: 'P2008-022', name: 'طبق', category: 'suspension',
    brand: 'PSA', oemNumber: '9822126880', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['9822126980'],
    sourceUrl: `${U}طبق-پژو-2008/`,
    researchedSellerPriceToman: 30000000, researchedSellerStock: 'in_stock',
    imageCount: 1, variantOf: null,
    notes: 'بازویی مثلثی چرخ جلو، چپ/راست. سیبک جدا فروخته می‌شود. نگاشت شماره به سمت اعلام نشده.' },

  { ...base, sku: 'P2008-023', name: 'سیبک طبق', category: 'suspension',
    brand: 'PSA', oemNumber: '364065', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}سیبک-طبق-پژو-2008/`,
    researchedSellerPriceToman: 7500000, researchedSellerStock: 'in_stock',
    imageCount: 5, variantOf: null,
    notes: 'صفحه صریح می‌گوید جهت‌دار نیست و هر دو سمت یکی است.' },

  { ...base, sku: 'P2008-025', name: 'میل موجگیر جلو', category: 'suspension',
    brand: 'PSA', oemNumber: '508769', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['508768'],
    sourceUrl: `${U}میل-رابط-موجگیر-جلو-2008-c3/`,
    researchedSellerPriceToman: 5500000, researchedSellerStock: 'unknown',
    imageCount: 4, variantOf: null,
    notes: 'برخلاف سیبک طبق، این یکی *جهت‌دار* است و دو سمت فرق دارند. موجودی روی صفحه اعلام نشده بود.' },

  { ...base, sku: 'P2008-020', name: 'بلبرینگ چرخ جلو', category: 'suspension',
    brand: 'PSA', oemNumber: '1606623580', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}بلبرینگ-چرخ-جلو-پژو-2008-c3/`,
    researchedSellerPriceToman: 27000000, researchedSellerStock: 'in_stock',
    imageCount: 4, variantOf: null,
    notes: 'محور جلو صریح. اینکه توپی همراهش هست یا نه، و اینکه رینگ ABS دارد یا نه، اعلام نشده.' },

  { ...base, sku: 'P2008-026', name: 'لاستیک چاکدار', category: 'suspension',
    brand: 'PSA', oemNumber: '5094C3', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['9819962580'],
    sourceUrl: `${U}لاستیک-چاکدار-موجگیر-پژو-2008/`,
    researchedSellerPriceToman: 3300000, researchedSellerStock: 'out_of_stock',
    imageCount: 3, variantOf: null,
    notes: 'بوش میل تعادل، قطر ۲۲ میلی‌متر، جهت‌دار نیست، قیمت برای یک عدد.' },

  /* --------------------------------------------- موتور و توربو (۵) */
  { ...base, sku: 'P2008-077', name: 'کوئل موتور', category: 'engine',
    brand: 'PSA', oemNumber: '597091', oemStatus: OEM_STATUS.CANDIDATE,
    thp165Fitment: FITMENT.SUPPORTED,
    sourceUrl: `${U}کویل-موتور-ep6/`,
    researchedSellerPriceToman: 11290000, researchedSellerStock: 'in_stock',
    imageCount: 6, variantOf: null,
    notes: 'ساخت Delphi پرتغال. صفحه «EP6» را نام می‌برد — خانوادهٔ موتور، نه زیرکد و نه THP165.' },

  { ...base, sku: 'P2008-078', name: 'شمع موتور بوش آلمان', category: 'engine',
    brand: 'Bosch', oemNumber: '0242145607', oemStatus: OEM_STATUS.CANDIDATE,
    thp165Fitment: FITMENT.SUPPORTED,
    sourceUrl: `${U}%d8%b4%d9%85%d8%b9-%d9%85%d9%88%d8%aa%d9%88%d8%b1-%d9%be%da%98%d9%88-2008-c3-508-%d8%a8%d9%88%d8%b4-%d8%a2%d9%84%d9%85%d8%a7%d9%86/`,
    researchedSellerPriceToman: 3100000, researchedSellerStock: 'out_of_stock',
    imageCount: 3, variantOf: null,
    notes: 'ایریدیوم، یک دست چهارتایی. صفحه می‌گوید «کد فنی موتور توربو، دقیقا مناسب موتور EP6 پژو ۲۰۰۸». شمارهٔ ۰۲۴۲۱۴۵۶۰۷ شمارهٔ *بوش* است، نه شماره فنی PSA.' },

  { ...base, sku: 'P2008-079', name: 'شمع اورجینال پژو سیتروئن', category: 'engine',
    brand: 'PSA', oemNumber: null, oemStatus: OEM_STATUS.CONFLICTING,
    oemConflict: {
      values: ['5960L5', '5960G4', '596092'],
      sources: [
        '5960L5 — Ashrafi Parts، صفحهٔ محصول، صریح برای EP6 توربوی ۲۰۰۸',
        '5960G4 و 596092 — فقط بازارگاه‌های عمومی در پژوهش پیشین',
      ],
      resolution: 'هیچ‌کدام انتخاب نشد. شماره فنی از رکورد محصول برداشته شد تا عدد احتمالا نادرست به مشتری نرسد.',
    },
    thp165Fitment: FITMENT.SUPPORTED,
    sourceUrl: `${U}شمع-پژو-2008-508-c3-موتور-ep6/`,
    researchedSellerPriceToman: 14500000, researchedSellerStock: 'out_of_stock',
    imageCount: 3, variantOf: 'P2008-078',
    notes: 'ساخت NGK، ایریدیوم، یک دست چهارتایی، EP6 توربو. همان قطعهٔ کارکردیِ شمع بوش با برند دیگر.' },

  { ...base, sku: 'P2008-044', name: 'واتر پمپ', category: 'engine',
    brand: 'PSA', oemNumber: '9801573380', oemStatus: OEM_STATUS.CANDIDATE,
    thp165Fitment: FITMENT.SUPPORTED,
    sourceUrl: `${U}%d9%88%d8%a7%d8%aa%d8%b1-%d9%be%d9%85%d9%be-%d8%a2%d8%a8-%d9%be%da%98%d9%88-2008-508-c3/`,
    researchedSellerPriceToman: 25500000, researchedSellerStock: 'in_stock',
    imageCount: 3, variantOf: null,
    notes: 'پمپ آب *مکانیکی* موتور EP6. خودِ صفحه آن را از پمپ برقی توربو جدا می‌کند و می‌گوید خودرو هر دو را دارد.' },

  { ...base, sku: 'P2008-052', name: 'شیر برقی کنترل تایم', category: 'engine',
    brand: 'PSA', oemNumber: null, oemStatus: OEM_STATUS.NOT_FOUND,
    thp165Fitment: FITMENT.UNCERTAIN,
    sourceUrl: `${U}%d8%b4%db%8c%d8%b1-%d8%a8%d8%b1%d9%82%db%8c-%d9%83%d9%86%d8%aa%d8%b1%d9%84-%d8%aa%d8%a7%d9%8a%d9%85-%d9%be%da%98%d9%88-2008-508-c3/`,
    researchedSellerPriceToman: 28800000, researchedSellerStock: 'in_stock',
    imageCount: 4, variantOf: null,
    notes: 'شیر برقی کنترل زمان‌بندی سوپاپ (OCV)، ساخت لهستان. صفحه هیچ شماره فنی‌ای اعلام نکرده و سمت هوا/دود را هم مشخص نکرده است.' },

  /* ---------------------------------------------- برق و سنسور (۳) */
  { ...base, sku: 'P2008-080', name: 'سنسور موقعیت میل سوپاپ', category: 'electrical',
    brand: 'PSA', oemNumber: '1920LS', oemStatus: OEM_STATUS.CANDIDATE,
    thp165Fitment: FITMENT.UNCERTAIN,
    sourceUrl: `${U}%d8%b3%d9%86%d8%b3%d9%88%d8%b1-%d9%85%d9%88%d9%82%d8%b9%db%8c%d8%aa-%d9%85%db%8c%d9%84-%d8%b3%d9%88%d9%be%d8%a7%d9%be-%d9%be%da%98%d9%88-2008-508-c3/`,
    researchedSellerPriceToman: 6475000, researchedSellerStock: 'out_of_stock',
    imageCount: 3, variantOf: null,
    notes: 'ساخت رومانی. صفحه نه کد موتور را گفته و نه اینکه سنسور سمت هوا است یا دود — و EP6 می‌تواند بیش از یکی داشته باشد.' },

  { ...base, sku: 'P2008-081', name: 'سنسور فشار هوا', category: 'electrical',
    brand: 'PSA', oemNumber: '1922v7', oemStatus: OEM_STATUS.CANDIDATE,
    thp165Fitment: FITMENT.SUPPORTED,
    sourceUrl: `${U}سنسور-فشار-هوا-پژو-2008-508-c3/`,
    researchedSellerPriceToman: 28800000, researchedSellerStock: 'in_stock',
    imageCount: 4, variantOf: null,
    notes: 'ساخت بوش. صفحه می‌گوید روی لوله اینترکولر به منیفولد است و «فشار هوای ورودی و بوست توربو» را کنترل می‌کند — روشن‌ترین شاهد توربو در این مجموعه.' },

  { ...base, sku: 'P2008-067', name: 'دینام', category: 'electrical',
    brand: 'PSA', oemNumber: '9822230780', oemStatus: OEM_STATUS.CANDIDATE,
    thp165Fitment: FITMENT.SUPPORTED,
    sourceUrl: `${U}%d8%af%db%8c%d9%86%d8%a7%d9%85-%d9%be%da%98%d9%88-2008-508-c3-%d8%a7%d9%88%d8%b1%d8%ac%db%8c%d9%86%d8%a7%d9%84/`,
    researchedSellerPriceToman: 130000000, researchedSellerStock: 'in_stock',
    imageCount: 2, variantOf: null,
    notes: 'ساخت Valeo فرانسه، ۱۵۰ آمپر، صفحه موتور EP6 را نام می‌برد.' },

  /* ------------------------------------------------ سوخت‌رسانی (۱) */
  { ...base, sku: 'P2008-082', name: 'پمپ بنزین داخل باک', category: 'fuel',
    brand: 'PSA', oemNumber: '9813573680', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}پمپ-بنزین-پژو-2008-c3/`,
    researchedSellerPriceToman: 96700000, researchedSellerStock: 'in_stock',
    imageCount: 1, variantOf: null,
    notes: 'پمپ کم‌فشارِ داخل باک همراه گیج. خودِ صفحه تأکید می‌کند خودرو یک پمپ *فشار قوی* جداگانه در محفظهٔ موتور هم دارد؛ آن قطعهٔ دیگری است و اینجا نیامده.' },

  /* ------------------------------------------ خنک‌کاری و تهویه (۴) */
  { ...base, sku: 'P2008-057', name: 'رادیاتور بخاری', category: 'cooling',
    brand: 'PSA', oemNumber: '1608182480', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}رادیاتور-بخاری-پژو-2008-c3-سیتروئن/`,
    researchedSellerPriceToman: 46000000, researchedSellerStock: 'in_stock',
    imageCount: 3, variantOf: null,
    notes: 'ساخت Valeo فرانسه. بسته‌بندی دو اورینگ و پیچ‌های مربوط را همراه دارد.' },

  { ...base, sku: 'P2008-058', name: 'رادیاتور کولر (کندانسور)', category: 'cooling',
    brand: 'PSA', oemNumber: '9828083680', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}رادیاتور-کولر-پژو-2008-c3-کندانسور/`,
    researchedSellerPriceToman: 59500000, researchedSellerStock: 'in_stock',
    imageCount: 6, variantOf: null,
    notes: 'ضخامت ۱۶ میلی‌متر، ساخت برزیل. تنها قلمی که صفحه‌اش بسته‌بندی ایران‌خودرو/ایساکو را نام می‌برد — نزدیک‌ترین شاهد مستقیم به ایکاپ در این مجموعه.' },

  { ...base, sku: 'P2008-061', name: 'منبع انبساط', category: 'cooling',
    brand: 'PSA', oemNumber: '9800777280', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}منبع-انبساط-آب-رادیاتور-پژو-2008-c3/`,
    researchedSellerPriceToman: 8500000, researchedSellerStock: 'in_stock',
    imageCount: 2, variantOf: null,
    notes: 'ساخت فرانسه. صفحه صریح می‌گوید درب قمقمه همراهش نیست و باید جدا تهیه شود.' },

  { ...base, sku: 'P2008-083', name: 'یونیت فن', category: 'cooling',
    brand: 'PSA', oemNumber: '9827892380', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}یونیت-فن-پژو-2008-301/`,
    researchedSellerPriceToman: 11500000, researchedSellerStock: 'out_of_stock',
    imageCount: 3, variantOf: null,
    notes: 'یونیت کنترل فن دوسرعته، ساخت Omron ایتالیا. صفحه تارا را هم در فهرست سازگاری آورده — خودروی ایران‌خودرو.' },

  /* ------------------------------------------------- روشنایی (۳) */
  { ...base, sku: 'P2008-084', name: 'چراغ عقب روی درب صندوق', category: 'lighting',
    brand: 'PSA', oemNumber: '9814758480', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['9814757280'],
    sourceUrl: `${U}%da%86%d8%b1%d8%a7%d8%ba-%d8%b9%d9%82%d8%a8-%d8%b1%d9%88%db%8c-%d8%af%d8%b1%d8%a8-%d8%b5%d9%86%d8%af%d9%88%d9%82-%d9%be%da%98%d9%88-2008/`,
    researchedSellerPriceToman: 11490000, researchedSellerStock: 'in_stock',
    imageCount: 1, variantOf: null,
    notes: 'روی درب صندوق — با چراغ عقبِ روی گلگیر یکی نیست. چپ/راست، LED یکپارچه و لامپش تعویض نمی‌شود. نگاشت شماره به سمت اعلام نشده.' },

  { ...base, sku: 'P2008-085', name: 'چراغ مه‌شکن عقب', category: 'lighting',
    brand: 'DEPO', oemNumber: '4005L', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['1306R'],
    sourceUrl: `${U}مه-شکن-عقب-پژو-2008-تایوان/`,
    researchedSellerPriceToman: 4500000, researchedSellerStock: 'in_stock',
    imageCount: 5, variantOf: null,
    notes: 'قطعهٔ بازار آزاد (DEPO)، نه PSA. مه‌شکن + دنده‌عقب + شبرنگ داخل سپر، چپ/راست. ناسازگاری در خودِ آگهی: عنوان «تایوان» و متن «ساخت چین».' },

  { ...base, sku: 'P2008-086', name: 'چراغ پلاک LED', category: 'lighting',
    brand: 'PSA', oemNumber: '9815226680', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}چراغ-پلاک-led-پژو-2008-سیتروئن-c3/`,
    researchedSellerPriceToman: 1660000, researchedSellerStock: 'out_of_stock',
    imageCount: 3, variantOf: null,
    notes: 'ساخت فرانسه، LED یکپارچه، جهت‌دار نیست، قیمت برای یک عدد.' },

  /* ------------------------------ برف‌پاک‌کن و شیشه‌شویی (۲) */
  { ...base, sku: 'P2008-087', name: 'تیغه برف‌پاک‌کن جلو', category: 'wipers',
    brand: 'PSA', oemNumber: '1642333880', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['1642334480'],
    sourceUrl: `${U}تیغه-برف-پاک-کن-جلو-پژو-2008-c3/`,
    researchedSellerPriceToman: 7000000, researchedSellerStock: 'in_stock',
    imageCount: 7, variantOf: null,
    notes: 'جفت چپ و راست، ساخت فرانسه. طول تیغه‌ها روی صفحه اعلام نشده است.' },

  { ...base, sku: 'P2008-088', name: 'چشمی شیشه‌شوی جلو', category: 'wipers',
    brand: 'PSA', oemNumber: '9808301880', oemStatus: OEM_STATUS.CANDIDATE,
    sourceUrl: `${U}چشم-شیشه-شوی-پژو-2008-c3/`,
    researchedSellerPriceToman: 4400000, researchedSellerStock: 'in_stock',
    imageCount: 1, variantOf: null,
    notes: 'هویت قطعه روشن شد: «چشمی آب شیشه شوی شیشه جلو» — نازل شیشهٔ جلو است، نه شست‌وشوی چراغ. یک عدد، ساخت چک.' },

  /* --------------------------------------------- بدنه و بیرونی (۱) */
  { ...base, sku: 'P2008-089', name: 'آینه بغل کامل', category: 'body',
    brand: 'PSA', oemNumber: '1611240680', oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['1611240780'],
    sourceUrl: `${U}آینه-بغل-کامل-پژو-2008/`,
    researchedSellerPriceToman: 32500000, researchedSellerStock: 'in_stock',
    imageCount: 5, variantOf: null,
    notes: 'مجموعهٔ کامل: پایه، قاب، سیم و سوکت، موتور تنظیم، راهنما و سنسور دما (فقط سمت راست). صفحه صریح می‌گوید هیتردار، برقی، تاشو و راهنمادار است. قاب کروم جدا فروخته می‌شود. نگاشت شماره به سمت اعلام نشده.' },
];

/* ------------------------------------------- مسائل باز، مستند --- */
/* اینجا می‌مانند تا کسی فکر نکند حل شده‌اند. */
export const OPEN_ISSUES = [
  { id: 'spark-plug-oem', affects: ['P2008-079', 'P2008-078'],
    issue: 'سه شماره فنی ناسازگار برای شمع: 5960L5، 5960G4، 596092. هیچ‌کدام انتخاب نشد و شماره از رکورد محصول برداشته شد.' },
  { id: 'turbo-pump-oem', affects: ['P2008-072'],
    issue: 'برای پمپ آب کمکی توربو دو شماره در گردش است: 9806790880 (فروشندهٔ ایرانی) و 9806790780 (پایگاه OE). یک رقم اختلاف، همان کارکرد. هیچ‌کدام انتخاب نشد.' },
  { id: 'turbo-item-identity', affects: ['P2008-072'],
    issue: 'P2008-072 شیر/پمپ برقی هواست، نه پمپ آب کمکی توربو. این دو نباید یکی شوند و شمارهٔ 9806790780 نباید به P2008-072 بچسبد.' },
  { id: 'cam-sensor-position', affects: ['P2008-080'],
    issue: 'سمت هوا یا دود بودن سنسور موقعیت میل سوپاپ اعلام نشده است.' },
  { id: 'ocv-no-oem', affects: ['P2008-052'],
    issue: 'شیر برقی کنترل تایم هیچ شماره فنی اعلام‌شده‌ای ندارد.' },
  { id: 'side-mapping', affects: ['P2008-015', 'P2008-022', 'P2008-025', 'P2008-084', 'P2008-087', 'P2008-089'],
    issue: 'این قلم‌ها دو شماره و انتخاب چپ/راست دارند، ولی کدام شماره برای کدام سمت است منتشر نشده.' },
  { id: 'wheel-bearing-scope', affects: ['P2008-020'],
    issue: 'همراه بودن توپی و وجود رینگ ABS در بلبرینگ چرخ جلو اعلام نشده است.' },
  { id: 'fog-lamp-origin', affects: ['P2008-085'],
    issue: 'آگهی با خودش ناسازگار است: عنوان «تایوان»، متن «ساخت چین». شماره‌ها هم DEPO‌اند، نه PSA.' },
  { id: 'variant-pairs', affects: ['P2008-073', 'P2008-075', 'P2008-078', 'P2008-079'],
    issue: 'سه جفت گونه‌ای که باید دربارهٔ نگه‌داشتن یا ادغامشان تصمیم گرفته شود.' },
  { id: 'a94-thp165-unconfirmed', affects: ['*'],
    issue: 'هیچ منبعی A94 یا THP165 را صریح نگفته است. زیرکد EP6 حل‌نشده مانده.' },
];

export default { VALIDATION_META, VALIDATED_PRODUCTS, OPEN_ISSUES };
