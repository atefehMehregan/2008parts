/* ============================================================================
 * data/commercial-catalogue-manifest.js — مانیفست پژوهش تجاری
 * ----------------------------------------------------------------------------
 * این فایل *سند پژوهش* است، نه کاتالوگ فروش و نه داده‌ای برای درج مستقیم.
 * هیچ چیزی از اینجا مستقیم به ویترین نمی‌رود.
 *
 * کاتالوگ واقعی همچنان src/data/initial-catalogue.js است. این مانیفست فقط
 * می‌گوید «برای کدام قطعه، چه شواهد تجاریِ واقعی‌ای پیدا شد» تا بعدا
 * بتوان با تأمین‌کننده دربارهٔ همان‌ها تصمیم گرفت.
 *
 * ---------------------------------------------------------------------------
 * چه چیزی اینجا آمده و چه چیزی نیامده
 *
 * فقط قطعه‌هایی که *صفحهٔ محصولشان واقعا خوانده شده* — نه آن‌هایی که صرفا
 * در خلاصهٔ نتیجهٔ جست‌وجو دیده شده‌اند. یک عدد در خلاصهٔ موتور جست‌وجو
 * شاهد نیست.
 *
 * ---------------------------------------------------------------------------
 * سه قاعدهٔ سخت
 *
 *   ۱. قیمتِ فروشندهٔ دیگر، قیمتِ ما نیست.
 *      priceToman همیشه null است. عددِ پژوهش‌شده در
 *      researchedSellerPriceToman می‌نشیند و هرگز به ویترین نمی‌رود.
 *
 *   ۲. ادعای سازگاریِ فروشنده، تأیید فنی نیست.
 *      compatibilityClaim یعنی «فروشنده این را گفته»، نه «درست است».
 *      compatibilityVerified همه‌جا false است.
 *
 *   ۳. هیچ تصویری پاک‌سازی حقوقی نشده است.
 *      imageReuseStatus همه‌جا 'not_cleared' است. هیچ تصویری دانلود
 *      نشده و هیچ نشانی تصویری اینجا ذخیره نشده است.
 * ==========================================================================*/

/* --------------------------------------------------------------- فراداده */
export const MANIFEST_META = {
  /* تاریخ پژوهش تجاری. */
  researchDate: '2026-09-27',

  /* منبع: گزارش پژوهش تجاریِ ۳۰ قطعه. هیچ منبع تازه‌ای اضافه نشده است. */
  sourceReport: 'گزارش پژوهش تجاری ۳۰ محصول — ۱۴۰۵/۰۷/۰۵',

  disclaimers: {
    compatibility:
      'ادعای سازگاری فروشنده تأیید فنی مستقل نیست. هیچ سند ایکاپ یا '
      + 'کاتالوگ رسمی PSA این تطبیق‌ها را تأیید نکرده است.',
    images:
      'هیچ‌کدام از تصویرهای شخص ثالث برای استفادهٔ تجاری پاک‌سازی حقوقی '
      + 'نشده‌اند. هیچ تصویری دانلود نشده و هیچ نشانی تصویری در این فایل نیست.',
    prices:
      'قیمت‌ها قیمتِ اعلامیِ فروشندگان دیگر در تاریخ پژوهش‌اند — مرجع '
      + 'پژوهشی، نه قیمت فروش parts2008 و نه قیمت خرید ما.',
    stock:
      'وضعیت موجودی، موجودیِ *فروشندهٔ دیگر* است. هیچ ربطی به موجودی '
      + 'انبار ما ندارد و هرگز نباید به آن تبدیل شود.',
    sku:
      'کد کالا، کد داخلیِ فروشگاه خودمان است (قاعدهٔ P2008-xxx در '
      + 'initial-catalogue.js) — نه شماره فنی سازنده و نه کد تأمین‌کننده.',
    engineCode:
      'زیرکد خانوادهٔ EP6 همچنان حل‌نشده است و این مانیفست آن را حل '
      + 'نمی‌کند. هیچ ادعای بازارگاهی برای تعیین آن به کار نرفته است.',
  },
};

/* ---------------------------------------------------- مقدارهای مجاز ---- */

/** وضعیت شماره فنی. هرگز از «candidate» بالاتر نمی‌رود مگر با شاهد مستقل. */
export const OEM_STATUS = {
  /** در پایگاه دادهٔ مستقل OE (Spareto) به‌عنوان شماره واقعی PSA تأیید شده،
   *  ولی تطبیقش با خودروی ایکاپ هنوز تأیید نشده است. */
  VERIFIED_CANDIDATE: 'verified_candidate',
  /** فقط فروشنده گفته است. هیچ پایگاه OE مستقلی بررسی‌اش نکرده. */
  CANDIDATE: 'candidate',
};

/** وضعیت قیمت *ما*. تا وقتی قیمت واقعی نداریم، همین می‌ماند. */
export const PRICE_STATUS = { NOT_SET: 'not_set' };

/** وضعیت موجودیِ فروشندهٔ پژوهش‌شده — نه موجودی ما. */
export const STOCK_STATUS = {
  SELLER_IN_STOCK: 'seller_in_stock',
  SELLER_OUT_OF_STOCK: 'seller_out_of_stock',
  SELLER_ON_REQUEST: 'seller_price_on_request',
};

/** وضعیت حقوقی تصویر. فعلا فقط یک مقدار وجود دارد. */
export const IMAGE_REUSE_STATUS = { NOT_CLEARED: 'not_cleared' };

/* ------------------------------------------------------------ محصول‌ها */
/*
 * sku — اگر قطعه در initial-catalogue.js باشد، *همان* کد کالا تکرار
 *       می‌شود تا دو سند به هم گره بخورند. قطعه‌ای که آنجا نیست، کد
 *       موقت تازه از ادامهٔ همان دنباله می‌گیرد (۰۷۱ به بعد) و با
 *       catalogueRef = 'new_provisional' علامت می‌خورد.
 */
export const COMMERCIAL_PRODUCTS = [
  {
    name: 'فیلتر روغن',
    sku: 'P2008-001',
    catalogueRef: 'initial-catalogue',
    category: 'filters',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 385000,
    researchedSellerPriceNote: 'قیمت اعلامی اشرفی‌پارتس در تاریخ پژوهش.',

    stockStatus: STOCK_STATUS.SELLER_OUT_OF_STOCK,

    brand: 'Mann',
    brandNote: 'برند را خودِ فروشنده اعلام کرده است («فیلتر روغن مان 1109CL»).',

    oemNumber: '1109CL',
    oemStatus: OEM_STATUS.VERIFIED_CANDIDATE,

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%D9%81%DB%8C%D9%84%D8%AA%D8%B1-%D8%B1%D9%88%D8%BA%D9%86-1109cl/',

    compatibilityClaim: 'فروشنده می‌گوید مناسب پژو ۲۰۰۸ / ۵۰۸ / سیتروئن C3 است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: 3,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      '۱۱۰۹CL در پایگاه مستقل OE به‌عنوان فیلتر روغن واقعی PSA تأیید شده '
      + 'بود؛ این فهرست تجاری آن را تکرار می‌کند ولی همچنان تطبیق با '
      + 'خودروی ایکاپ تأیید نشده است. فروشندهٔ دیگری (ServiceTak) برای '
      + 'همین قطعه کد MANN HU711-51x را اعلام کرده که با ارجاع متقابلِ '
      + 'همان پایگاه هم‌خوان است. قیمت ۶,۹۶۰,۰۰۰ تومانِ فروشندهٔ سوم '
      + 'عمدا ثبت نشده است: با همین ردهٔ کالا حدود ۱۸ برابر اختلاف دارد '
      + 'و پیش از استفاده باید دستی بررسی شود.',
  },

  {
    name: 'فیلتر هوا',
    sku: 'P2008-002',
    catalogueRef: 'initial-catalogue',
    category: 'filters',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: null,
    researchedSellerPriceNote:
      'قیمت روی صفحه نیست؛ فروشنده خرید را به تماس تلفنی ارجاع می‌دهد.',

    stockStatus: STOCK_STATUS.SELLER_ON_REQUEST,

    brand: null,
    brandNote: 'فروشنده برندی اعلام نکرده است.',

    oemNumber: '1444TT',
    oemStatus: OEM_STATUS.VERIFIED_CANDIDATE,

    sourceName: 'ServiceTak',
    sourceUrl: 'https://www.servicetak.ir/%D9%81%DB%8C%D9%84%D8%AA%D8%B1-%D9%87%D9%88%D8%A7%DB%8C-%D9%BE%DA%98%D9%88-2008/',

    compatibilityClaim: 'فروشنده صریح می‌گوید فیلتر هوای پژو ۲۰۰۸ است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: null,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'اعلام مستقلِ ۱۴۴۴TT از سوی این فروشنده با نامزدِ پیشینِ ما هم‌خوان '
      + 'است، ولی چون شاهدِ فروشنده است، وضعیت شماره فنی بالا نمی‌رود. '
      + 'فروشندهٔ دیگری عدد ۲,۱۵۰,۰۰۰ تومان را نشان داده بود، ولی فقط در '
      + 'خلاصهٔ جست‌وجو و بدون خواندن صفحهٔ محصول — پس ثبت نشد.',
  },

  {
    name: 'فیلتر اتاق',
    sku: 'P2008-003',
    catalogueRef: 'initial-catalogue',
    category: 'filters',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 4000000,
    researchedSellerPriceNote: 'قیمت اعلامی اشرفی‌پارتس در تاریخ پژوهش.',

    stockStatus: STOCK_STATUS.SELLER_OUT_OF_STOCK,

    brand: 'PSA',
    brandNote: 'فروشنده برند را «پژو سیتروئن | PSA» اعلام کرده است.',

    oemNumber: null,
    oemStatus: null,

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%D9%81%DB%8C%D9%84%D8%AA%D8%B1-%D9%87%D9%88%D8%A7-%DA%A9%D8%A7%D8%A8%DB%8C%D9%86-%DA%A9%D8%B1%D8%A8%D9%86-%D8%A7%DA%A9%D8%AA%DB%8C%D9%88-2008-c3/',

    compatibilityClaim:
      'فروشنده می‌گوید فیلتر کربن‌اکتیو هوای ورودی کابین پژو ۲۰۰۸ / C3 است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: 3,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'این صفحه شماره فنی اعلام نکرده است. فروشندهٔ دیگری کد 6447VY را '
      + 'گفته بود؛ چون فقط ادعای فروشنده است و با کد ۶۴۴۷XG — که پیش‌تر '
      + 'به‌دلیل عمومی بودن رد شد — یکی نیست، هیچ شماره‌ای اینجا ثبت نشد.',
  },

  {
    name: 'لنت ترمز جلو',
    sku: 'P2008-006',
    catalogueRef: 'initial-catalogue',
    category: 'brakes',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 10500000,
    researchedSellerPriceNote:
      'قیمت اعلامی اشرفی‌پارتس در تاریخ پژوهش (از ۱۱,۳۵۰,۰۰۰ تومان کاهش یافته).',

    stockStatus: STOCK_STATUS.SELLER_IN_STOCK,

    brand: 'Eurorepar',
    brandNote: 'فروشنده برند را «یوروریپار | Eurorepar» اعلام کرده است.',

    oemNumber: '1617275680',
    oemStatus: OEM_STATUS.CANDIDATE,

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%D9%84%D9%86%D8%AA-%D8%AA%D8%B1%D9%85%D8%B2-%D8%AC%D9%84%D9%88-2008-eurorepar-c3/',

    compatibilityClaim: 'فروشنده می‌گوید لنت جلو پژو ۲۰۰۸ و سیتروئن C3 است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: null,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'هشدار اختلاف منابع: برای لنت جلوی ۲۰۰۸ سه شمارهٔ متفاوت دیده شده '
      + 'است — ۱۶۱۷۲۷۵۶۸۰ (همین فروشنده)، ۱۶۴۷۸۶۳۵۸۰ (بازارگاه ترب) و '
      + '۱۶۱۷۲۸۲۹۸۰ که پیش‌تر رد شد چون فهرست تطبیقش هیچ بنزینیِ توربو '
      + 'ندارد. هیچ‌کدام انتخاب نهایی نیست و اختلاف عمدا ثبت شده است.',
  },

  {
    name: 'دیسک چرخ',
    sku: 'P2008-007',
    catalogueRef: 'initial-catalogue',
    category: 'brakes',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 18000000,
    researchedSellerPriceNote:
      'قیمت اعلامی اشرفی‌پارتس برای *جفت* دیسک، نه یک عدد.',

    stockStatus: STOCK_STATUS.SELLER_OUT_OF_STOCK,

    brand: 'PSA',
    brandNote: 'فروشنده برند را «پژو سیتروئن | PSA» اعلام کرده است.',

    oemNumber: '4249J6',
    oemStatus: OEM_STATUS.CANDIDATE,

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%D8%AF%DB%8C%D8%B3%DA%A9-%D8%AA%D8%B1%D9%85%D8%B2-%D8%AC%D9%84%D9%88-2008-c3/',

    compatibilityClaim:
      'فروشنده «نوع خودرو: پژو ۲۰۰۸» را صریح نوشته است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: 4,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'فروشنده در کنار کد، مشخصهٔ «DIAM 283 EP26» را هم نوشته است؛ آن '
      + 'یک اندازه/تیپ است، نه شماره فنی، پس در oemNumber نرفت. قیمت '
      + 'برای جفت است و هنگام قیمت‌گذاری نباید با قیمت تکی اشتباه شود.',
  },

  {
    name: 'توپی سرکمک جلو',
    sku: 'P2008-016',
    catalogueRef: 'initial-catalogue',
    category: 'suspension',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 4500000,
    researchedSellerPriceNote: 'قیمت اعلامی اشرفی‌پارتس در تاریخ پژوهش.',

    stockStatus: STOCK_STATUS.SELLER_IN_STOCK,

    brand: 'PSA',
    brandNote: 'فروشنده برند را «پژو سیتروئن | PSA» اعلام کرده است.',

    oemNumber: '9811370580',
    oemStatus: OEM_STATUS.CANDIDATE,

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%D8%AA%D9%88%D9%BE%DB%8C-%D8%B3%D8%B1-%DA%A9%D9%85%DA%A9-2008-c3/',

    compatibilityClaim:
      'فروشنده می‌گوید توپی (براکت لاستیکی) سر کمک‌فنر جلوی پژو ۲۰۰۸ و C3 است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: 3,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'برای خودِ «کمک فنر جلو» (P2008-015) هیچ آگهی محصولِ مخصوص ۲۰۰۸ '
      + 'پیدا نشد؛ این قطعه فقط توپی سر کمک است و جای کمک‌فنر را نمی‌گیرد.',
  },

  {
    name: 'تسمه دینام',
    sku: 'P2008-039',
    catalogueRef: 'initial-catalogue',
    category: 'engine',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 6000000,
    researchedSellerPriceNote: 'قیمت اعلامی اشرفی‌پارتس در تاریخ پژوهش.',

    stockStatus: STOCK_STATUS.SELLER_IN_STOCK,

    brand: 'PSA',
    brandNote:
      'فروشنده برند را «پژو سیتروئن | PSA» و سازنده را Dayco (ایتالیا) اعلام کرده است.',

    oemNumber: 'v760401480',
    oemStatus: OEM_STATUS.CANDIDATE,

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%D8%AA%D8%B3%D9%85%D9%87-%D8%AF%DB%8C%D9%86%D8%A7%D9%85-%D9%BE%DA%98%D9%88-2008-508-c3/',

    compatibilityClaim:
      'فروشنده می‌گوید تسمه دینام پژو ۲۰۰۸ / ۵۰۸ / سیتروئن C3 است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: 2,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'فروشنده مشخصات فیزیکی هم داده است (۶ شیار، طول ۸۹۴ میلی‌متر، جنس '
      + 'EPDM). این‌ها ادعای فروشنده‌اند و تا تأیید نشوند وارد مشخصات فنی '
      + 'محصول نمی‌شوند.',
  },

  {
    name: 'ترموستات',
    sku: 'P2008-046',
    catalogueRef: 'initial-catalogue',
    category: 'engine',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 39600000,
    researchedSellerPriceNote: 'قیمت اعلامی اشرفی‌پارتس در تاریخ پژوهش.',

    stockStatus: STOCK_STATUS.SELLER_IN_STOCK,

    brand: 'PSA',
    brandNote: 'فروشنده برند را «پژو سیتروئن | PSA» اعلام کرده است.',

    oemNumber: '9808647180',
    oemStatus: OEM_STATUS.CANDIDATE,

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%D9%85%D8%AC%D9%85%D9%88%D8%B9%D9%87-%D9%BE%D9%88%D8%B3%D8%AA%D9%87-%D8%AE%D8%B1%D9%88%D8%AC%DB%8C-%D8%A2%D8%A8-%D8%AA%D8%B1%D9%85%D9%88%D8%B3%D8%AA%D8%A7%D8%AA/',

    compatibilityClaim:
      'فروشنده می‌گوید ترموستات (هوزینگ آب) پژو ۲۰۰۸ / ۵۰۸ / C3 است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: 5,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'فروشنده آن را مجموعهٔ کاملِ ترموستات برقی با پوسته، هیتر داخلی، '
      + 'سنسور و واشرها توصیف می‌کند. پس ممکن است در عمل به قلم '
      + '«هوزینگ ترموستات» (P2008-047) هم بخورد. تصمیم دربارهٔ اینکه این '
      + 'یک قلم است یا دو قلم، به تأیید تأمین‌کننده سپرده می‌شود.',
  },

  {
    name: 'پمپ برقی هوای توربوشارژ',
    sku: 'P2008-072',
    catalogueRef: 'new_provisional',
    category: 'engine',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 32700000,
    researchedSellerPriceNote: 'قیمت اعلامی اشرفی‌پارتس در تاریخ پژوهش.',

    stockStatus: STOCK_STATUS.SELLER_OUT_OF_STOCK,

    brand: 'PSA',
    brandNote: 'فروشنده برند را «پژو سیتروئن | PSA» اعلام کرده است.',

    oemNumber: 'V759327380',
    oemStatus: OEM_STATUS.CANDIDATE,

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%D9%BE%D9%85%D9%BE-%D8%A8%D8%B1%D9%82%DB%8C-%D9%87%D9%88%D8%A7%DB%8C-%D8%AA%D9%88%D8%B1%D8%A8%D9%88%D8%B4%D8%A7%D8%B1%DA%98/',

    compatibilityClaim:
      'فروشنده می‌گوید برای پژو ۲۰۰۸ / ۵۰۸ / سیتروئن C3 است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: 4,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'هشدار مهم — این قطعه «پمپ آب کمکی توربو» (P2008-045 با شمارهٔ '
      + '۹۸۰۶۷۹۰۷۸۰) نیست و هرگز نباید با آن یکی شود. خودِ صفحهٔ فروشنده '
      + 'آن را «شیر برقی توربو» توصیف می‌کند، یعنی قطعه‌ای متفاوت. به '
      + 'همین دلیل کد موقت تازه گرفت و در initial-catalogue.js وجود ندارد.',
  },

  {
    name: 'چراغ جلو',
    sku: 'P2008-071',
    catalogueRef: 'new_provisional',
    category: 'body',

    priceToman: null,
    priceStatus: PRICE_STATUS.NOT_SET,
    researchedSellerPriceToman: 17000000,
    researchedSellerPriceNote: 'قیمت اعلامی اشرفی‌پارتس در تاریخ پژوهش.',

    stockStatus: STOCK_STATUS.SELLER_OUT_OF_STOCK,

    brand: 'PSA',
    brandNote:
      'فروشنده برند را «پژو سیتروئن | PSA» و سازنده را Valeo (ایتالیا) اعلام کرده است.',

    oemNumber: '9825313680',
    oemStatus: OEM_STATUS.CANDIDATE,
    oemAlternates: ['9825313980'],

    sourceName: 'Ashrafi Parts',
    sourceUrl: 'https://ashrafiparts.com/product/%DA%86%D8%B1%D8%A7%D8%BA-%D8%AC%D9%84%D9%88-%D9%BE%DA%98%D9%88-2008/',

    compatibilityClaim:
      'فروشنده «نوع خودرو: پژو ۲۰۰۸» را صریح نوشته است.',
    compatibilityVerified: false,

    imageAvailable: true,
    imageCount: 8,
    imageReuseStatus: IMAGE_REUSE_STATUS.NOT_CLEARED,

    isActive: false,
    isFeatured: false,
    isNew: false,

    notes:
      'دو شماره اعلام شده که احتمالا چپ و راست‌اند؛ هر دو ادعای فروشنده‌اند '
      + 'و تفکیکشان تأیید نشده است. این قلم در کاتالوگ اولیه نیست، چون '
      + 'دستهٔ «بدنه و بیرونی» هنوز ساخته نشده — پس کد موقت تازه گرفت. '
      + 'نکتهٔ هشدار: فروشندهٔ دیگری همین چراغ را با «کدفنی 620737700R» '
      + 'عرضه می‌کند که قالبِ شمارهٔ رنو است، نه PSA — نمونهٔ روشنِ اینکه '
      + 'شمارهٔ فنیِ فروشنده بدون تأیید پایگاه OE قابل اتکا نیست.',
  },
];

/* -------------------------------------------- قلم‌های کنار گذاشته‌شده */
/* دلیلِ *نبودن* هم بخشی از سند است، وگرنه دفعهٔ بعد همین‌ها دوباره
   «پیدا» می‌شوند. */
export const EXCLUDED_FROM_MANIFEST = [
  {
    item: 'فیلتر روغن اورجینال — ۶,۹۶۰,۰۰۰ تومان',
    reason: 'قیمت مشکوک؛ حدود ۱۸ برابرِ همان ردهٔ کالا. نیاز به بررسی دستی.',
  },
  {
    item: 'پمپ آب کمکی توربو با شمارهٔ ۹۸۰۶۷۹۰۷۸۰',
    reason:
      'هیچ آگهی تجاری ایرانی برای آن پیدا نشد. قلمِ توربوی اشرفی‌پارتس '
      + 'قطعهٔ دیگری است (شیر برقی) و با آن یکی نشد.',
  },
  {
    item: 'قاب آینه بغل کروم — ۲,۵۰۰,۰۰۰ تومان',
    reason: 'فقط قاب است، نه مجموعهٔ آینه؛ به‌جای «آینه بغل» ثبت نمی‌شود.',
  },
  {
    item: 'کویل و شمع',
    reason:
      'قیمت و کد فقط در خلاصهٔ نتیجهٔ جست‌وجو دیده شد؛ صفحهٔ محصول خوانده '
      + 'نشد. برای شمع هنوز سه شمارهٔ ناسازگار در گردش است.',
  },
  {
    item: 'واتر پمپ، کمپرسور کولر، تیغه برف‌پاک‌کن، چراغ عقب، سنسور اکسیژن',
    reason:
      'فقط در خلاصهٔ نتیجهٔ جست‌وجو دیده شدند؛ صفحهٔ محصولشان خوانده نشد.',
  },
  {
    item:
      'کمک فنر جلو، سفت‌کن دینام، هرزگرد دینام، دریچه گاز، رادیاتور آب، '
      + 'مجموعه فن رادیاتور، سنسور موقعیت میل‌لنگ، دینام، استارت، '
      + 'پمپ بنزین، شیشه آینه بغل، موتور آینه بغل',
    reason: 'هیچ آگهی مخصوص پژو ۲۰۰۸ برایشان پیدا نشد.',
  },
];

/* ------------------------------------------------------------- کمکی --- */

/** شمار قلم‌های مانیفست. */
export function manifestSize() {
  return COMMERCIAL_PRODUCTS.length;
}

/** قلم‌هایی که در initial-catalogue.js کد کالای متناظر دارند. */
export function linkedToInitialCatalogue() {
  return COMMERCIAL_PRODUCTS.filter((p) => p.catalogueRef === 'initial-catalogue');
}

export default { MANIFEST_META, COMMERCIAL_PRODUCTS, EXCLUDED_FROM_MANIFEST };
