/* ============================================================================
 * data/storefront-catalogue.js — کاتالوگ اولیهٔ قابل نمایش
 * ----------------------------------------------------------------------------
 * ده قطعه‌ای که در commercial-catalogue-manifest.js شواهد تجاریِ صفحه‌خوانده
 * دارند، به شکلی درمی‌آیند که مخزن محصول بتواند درجشان کند و ویترین
 * نشانشان بدهد.
 *
 * منبع داده فقط و فقط همان مانیفست است. هیچ نام، شماره فنی، برند، قیمت،
 * موجودی، مشخصه یا ادعای سازگاریِ تازه‌ای اینجا ساخته نمی‌شود.
 *
 * ---------------------------------------------------------------------------
 * چرا قیمت null است ولی در پایگاه داده صفر می‌نشیند
 *
 * ستون price_toman در اسکیما NOT NULL است و تغییر اسکیما در دامنهٔ این کار
 * نیست. پس:
 *
 *   * در *دادهٔ* این فایل، priceToman واقعا null است — یعنی «قیمتی نداریم».
 *   * هنگام تبدیل به ردیف پایگاه داده، صفر نوشته می‌شود، فقط چون ستون
 *     مقدار می‌خواهد.
 *   * قالب‌ها صفر را هرگز به‌عنوان قیمت رندر نمی‌کنند؛ به‌جایش
 *     «استعلام قیمت» نشان می‌دهند.
 *
 * پس هیچ‌جا «۰ تومان» به مشتری گفته نمی‌شود. صفر یک نشانهٔ داخلی است،
 * نه یک قیمت.
 *
 * ---------------------------------------------------------------------------
 * برند: فقط آنچه منبع صریح گفته است
 *
 * هر برندی که اینجا می‌آید روی صفحهٔ محصولِ خوانده‌شده *صریح* اعلام شده
 * است. قطعه‌ای که منبعش برندی نگفته، بدون برند می‌ماند (brandId = null)
 * و هیچ برندی برایش حدس زده نمی‌شود.
 *
 * یک تفکیک مهم: «برند» یعنی آن‌چه کالا زیر نامش فروخته می‌شود، نه
 * کارخانهٔ سازنده. قطعه‌ای که در بسته‌بندی پژو سیتروئن است ولی Valeo یا
 * KYB یا Delphi ساخته‌اند، برندش «پژو سیتروئن» است؛ نام سازنده فقط در
 * یادداشت پژوهشی می‌ماند و به جدول برندها نمی‌رود.
 *
 * ---------------------------------------------------------------------------
 * وضعیت موجودی — چرا out_of_stock و نه on_order
 *
 * قید اسکیما فقط چهار مقدار می‌پذیرد و هیچ‌کدام «نامعلوم» نیست؛ تغییر
 * اسکیما هم در دامنهٔ این کار نیست. پس بین همان چهار تا باید انتخاب کرد:
 *
 *   * on_order («قابل سفارش») ادعا می‌کند این قطعه *قابل تهیه* است.
 *     چنین چیزی تأیید نشده — نه تأمین‌کننده‌ای داریم و نه تعهدی.
 *   * out_of_stock دربارهٔ انبار *ما* حرف می‌زند و دقیقا راست است:
 *     موجودی ما صفر است (stock_qty = 0). هیچ قولی به مشتری نمی‌دهد.
 *
 * پس مقدار داخلی out_of_stock است، چون تنها گزارهٔ راست میان چهار گزینه
 * است. ولی «ناموجود» هم به مشتری گفته نمی‌شود، چون آن هم بیش از دانستهٔ
 * ماست: ما نمی‌دانیم قطعه تهیه‌شدنی هست یا نه.
 *
 * تصمیمِ نمایش روی همان نشانهٔ «قیمت نداریم» سوار است: هرجا price_toman
 * صفر باشد، قالب به‌جای هر وضعیتی «استعلام موجودی» نشان می‌دهد. پس این
 * محصول‌ها نه «موجود» می‌شوند، نه «قابل سفارش»، نه «ناموجود» — و بقیهٔ
 * محصولات فروشگاه دست‌نخورده می‌مانند.
 * ==========================================================================*/
import { slugify } from '../services/slug.js';
import { COMMERCIAL_PRODUCTS } from './commercial-catalogue-manifest.js';
import { VALIDATED_PRODUCTS } from './validated-catalogue-manifest.js';

/* --------------------------------------------------------------- دسته‌ها */
/* فقط دسته‌هایی که دست‌کم یک قطعه در آن می‌نشیند. نام‌ها همان‌هایی‌اند که
   initial-catalogue.js هم به کار می‌برد، تا سه سند یک زبان داشته باشند. */
export const STOREFRONT_CATEGORIES = [
  { key: 'filters',    name: 'فیلتر و سرویس',        sortOrder: 10 },
  { key: 'engine',     name: 'موتور و توربو',        sortOrder: 20 },
  { key: 'brakes',     name: 'ترمز',                 sortOrder: 30 },
  { key: 'suspension', name: 'تعلیق و فرمان',        sortOrder: 40 },
  { key: 'cooling',    name: 'خنک‌کاری و تهویه',     sortOrder: 50 },
  { key: 'electrical', name: 'برق و سنسورها',        sortOrder: 60 },
  { key: 'fuel',       name: 'سوخت‌رسانی',           sortOrder: 65 },
  { key: 'lighting',   name: 'روشنایی',              sortOrder: 70 },
  { key: 'wipers',     name: 'برف‌پاک‌کن و شیشه‌شویی', sortOrder: 75 },
  { key: 'body',       name: 'بدنه و بیرونی',        sortOrder: 80 },
];

/* چراغ جلو در مانیفست اول زیر «بدنه» ثبت شده بود، چون آن موقع دستهٔ
   روشنایی وجود نداشت. حالا که دارد، سر جای درستش می‌نشیند. */
const CATEGORY_OVERRIDES = { 'P2008-071': 'lighting' };

/* ------------------------------------------------- یادداشت سازگاری --- */
/*
 * دقیقا به اندازهٔ شواهد، نه یک کلمه بیشتر.
 *
 * آنچه *ثابت* شده این است: قطعه در منبع تجاری ایرانیِ بررسی‌شده، ذیل
 * «پژو ۲۰۰۸» فهرست شده است. همین.
 *
 * آنچه ثابت *نشده* و پیش‌تر اشتباه در همین جمله آمده بود: نسل A94،
 * موتور THP165 و گیربکس EAT6. هیچ منبعی این سه را دربارهٔ این قطعه‌ها
 * نگفته است؛ استنتاج ما از بافت بازار ایران بود، و استنتاج را نباید
 * به‌شکل ادعای منبع نوشت. پس برداشته شد.
 */
export const COMPATIBILITY_NOTE =
  'برای پژو ۲۰۰۸ بازار ایران در منابع تجاری بررسی‌شده مشاهده شده است. '
  + 'تطبیق دقیق با خودروی شما پیش از خرید باید با تأمین‌کننده تأیید شود.';

/* ---------------------------------------------------------- برندها --- */
/* فقط برندهایی که روی صفحهٔ محصول صریح اعلام شده‌اند.
   country همه‌جا null است: پژوهش کشورِ *برند* را ثابت نکرده — آنچه دیده
   شد کشور ساختِ یک قطعهٔ مشخص بود، که چیز دیگری است. */
export const STOREFRONT_BRANDS = [
  { key: 'psa',       name: 'پژو سیتروئن' },
  { key: 'eurorepar', name: 'یوروریپار' },
  { key: 'bosch',     name: 'بوش' },
  { key: 'mann',      name: 'مان' },
  { key: 'depo',      name: 'دپو' },
];

/** نام برندِ اعلامیِ منبع → کلید برند. هرچه اینجا نباشد، بی‌برند می‌ماند. */
const BRAND_KEY_BY_SOURCE_NAME = {
  PSA: 'psa',
  Eurorepar: 'eurorepar',
  Bosch: 'bosch',
  Mann: 'mann',
  DEPO: 'depo',
};

/* ------------------------------------------------- وضعیت‌های ثابت --- */

/**
 * وضعیت داخلیِ هر ده قطعه.
 *
 * out_of_stock تنها مقدارِ راست میان چهار گزینهٔ اسکیماست: انبار ما خالی
 * است. هیچ‌کدام «موجود» یا «قابل سفارش» اعلام نمی‌شود. دلیل کامل در
 * سرصفحهٔ همین فایل است.
 */
export const INITIAL_AVAILABILITY = 'out_of_stock';

/** نشانهٔ داخلیِ «قیمت ندارد» در ستونِ NOT NULL. قالب آن را قیمت نمی‌خواند. */
export const PRICE_ON_REQUEST_SENTINEL = 0;

/**
 * متنی که به‌جای هر وضعیتی به مشتری نشان داده می‌شود، هروقت دادهٔ تجاری
 * نداریم. قالب‌ها همین رشته را رندر می‌کنند؛ اینجا فقط برای آزمون و
 * مستندسازی نگه داشته شده است.
 */
export const AVAILABILITY_ON_ENQUIRY_LABEL = 'استعلام موجودی';

/** متن جایگزین قیمت، در همان شرایط. */
export const PRICE_ON_ENQUIRY_LABEL = 'استعلام قیمت';

/* ------------------------------------------------------------ ساخت --- */

/**
 * ده رکورد ویترین، ساخته‌شده از مانیفست.
 *
 * priceToman عمدا null است: در سطح داده، قیمتی وجود ندارد.
 * تبدیل به صفر فقط در toRepositoryRecord اتفاق می‌افتد و دلیلش قید
 * NOT NULL است، نه یک تصمیم تجاری.
 */
export function buildStorefrontProducts() {
  /* دو مانیفست، یک قاعده. هیچ قلمی از جای سومی نمی‌آید. */
  return [...COMMERCIAL_PRODUCTS, ...VALIDATED_PRODUCTS].map((m) => ({
    /* شناسایی — همان مقدارهای مانیفست، دست‌نخورده */
    name: m.name,
    slug: slugify(m.name),
    sku: m.sku,
    oemNumber: m.oemNumber ?? null,

    /* ارجاع دسته؛ واردکننده آن را به شناسهٔ واقعی تبدیل می‌کند */
    categoryKey: CATEGORY_OVERRIDES[m.sku] ?? m.category,

    /* کلید برند؛ واردکننده آن را به شناسهٔ واقعی تبدیل می‌کند.
       null یعنی منبع برندی اعلام نکرده است. */
    brandKey: BRAND_KEY_BY_SOURCE_NAME[m.brand] ?? null,

    /* داده‌های تجاری: هیچ‌کدام ساخته نشده است */
    priceToman: null,
    priceOnRequest: true,
    salePriceToman: null,
    stockQty: null,
    availability: INITIAL_AVAILABILITY,

    /* متن: فقط یادداشت سازگاریِ محافظه‌کار. توضیح محصول ساخته نمی‌شود. */
    shortDescription: null,
    description: null,
    compatibilityNote: COMPATIBILITY_NOTE,
    specs: {},
    weightGrams: null,

    /* انتشار: دیده می‌شوند، ولی نه به‌عنوان کالای قیمت‌خورده و موجود */
    isActive: true,
    isFeatured: false,
    isNew: false,

    /* تصویر: هیچ. قالبِ media-placeholder جای آن را پر می‌کند. */
    images: [],

    /* فراداده — برای درج نیست، برای ردیابی و بازبینی است */
    meta: {
      oemStatus: m.oemStatus ?? null,
      sellerStatedBrand: m.brand ?? null,
      sourceName: m.sourceName,
      sourceUrl: m.sourceUrl,
      researchedSellerPriceToman: m.researchedSellerPriceToman ?? null,
      compatibilityVerified: m.compatibilityVerified,
      imageReuseStatus: m.imageReuseStatus,
      /* فقط در مانیفست دوم پر می‌شوند؛ در اولی undefined می‌مانند. */
      a94Fitment: m.a94Fitment ?? null,
      thp165Fitment: m.thp165Fitment ?? null,
      eat6Relevance: m.eat6Relevance ?? null,
      variantOf: m.variantOf ?? null,
    },
  }));
}

/** دسته‌ها با نشانیِ ساخته‌شده از همان slugify پروژه. */
export function buildStorefrontCategories() {
  return STOREFRONT_CATEGORIES.map((c) => ({
    key: c.key,
    name: c.name,
    slug: slugify(c.name),
    description: null,
    parentId: null,
    sortOrder: c.sortOrder,
    isActive: true,
  }));
}

/** برندها با نشانیِ ساخته‌شده از همان slugify پروژه. */
export function buildStorefrontBrands() {
  return STOREFRONT_BRANDS.map((b) => ({
    key: b.key,
    name: b.name,
    slug: slugify(b.name),
    country: null,
    isActive: true,
  }));
}

/**
 * رکورد ویترین → شکلی که products.create() می‌پذیرد.
 *
 * تنها جایی که null به صفر تبدیل می‌شود، و فقط به این دلیل که ستون‌های
 * price_toman و stock_qty قید NOT NULL دارند.
 *
 * @param {object} product خروجی buildStorefrontProducts
 * @param {number|string} categoryId شناسهٔ دستهٔ ساخته‌شده
 * @param {number|string|null} [brandId] شناسهٔ برند، یا null اگر منبع
 *        برندی اعلام نکرده باشد
 */
export function toRepositoryRecord(product, categoryId, brandId = null) {
  return {
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    oemNumber: product.oemNumber,
    categoryId,
    brandId,

    /* صفر = «قیمت ندارد». قالب هرگز آن را قیمت نمی‌خواند. */
    priceToman: product.priceToman ?? PRICE_ON_REQUEST_SENTINEL,
    salePriceToman: null,
    stockQty: product.stockQty ?? 0,
    availability: product.availability,

    shortDescription: product.shortDescription,
    description: product.description,
    specs: product.specs,
    compatibilityNote: product.compatibilityNote,
    weightGrams: product.weightGrams,

    isFeatured: product.isFeatured,
    isNew: product.isNew,
    isActive: product.isActive,
  };
}

/** آیا این ردیف باید «استعلام قیمت» نشان بدهد؟ همان شرطی که قالب دارد. */
export function isPriceOnRequest(row) {
  return !row?.price_toman;
}

export default {
  STOREFRONT_CATEGORIES,
  STOREFRONT_BRANDS,
  buildStorefrontProducts,
  buildStorefrontCategories,
  buildStorefrontBrands,
  toRepositoryRecord,
};
