/* ============================================================================
 * data/initial-catalogue.js — کاتالوگ اولیهٔ پژو ۲۰۰۸ ایران‌خودرو (ایکاپ)
 * ----------------------------------------------------------------------------
 * این فایل *داده* است، نه کد اجرایی. هیچ اتصالی به پایگاه داده ندارد و
 * چیزی را وارد نمی‌کند؛ فقط شکل تمیزِ آمادهٔ درج را می‌سازد تا هر
 * واردکننده‌ای بعدا همین را به مخزن‌های موجود بدهد.
 *
 * ---------------------------------------------------------------------------
 * منبع داده
 *
 * نام‌های فارسی مستقیما از فهرست ۳۰۳ قطعه‌ایِ PartsMall برای «ایران خودرو
 * پژو 2008 توربو» خوانده شده‌اند (هر ۱۳ صفحه). هیچ نامی ترجمه، حدس یا
 * ساخته نشده است. شمارهٔ صفحهٔ منبع در sourceRef هر قطعه می‌ماند.
 *
 * ---------------------------------------------------------------------------
 * قاعده‌های سخت‌گیرانهٔ این فایل
 *
 *   * قیمت ساخته نمی‌شود. ستون price_toman در اسکیما NOT NULL است، پس
 *     مقدار ۰ می‌نشیند و در عوض is_active = FALSE می‌ماند تا هیچ‌وقت
 *     «۰ تومان» به‌عنوان قیمت واقعی به مشتری نشان داده نشود.
 *   * موجودی ساخته نمی‌شود. stock_qty = 0 و وضعیت «قابل سفارش».
 *   * برند ساخته نمی‌شود. سازندگان قطعات جایگزین (MANN، BOSCH، …) برندِ
 *     *محصول ما* نیستند و اینجا نمی‌آیند.
 *   * شماره فنی فقط برای سه قطعه و با وضعیت «نامزد» — نه تأییدشده روی
 *     خودروی ایکاپ.
 *   * تصویر ساخته یا دانلود نمی‌شود. images همیشه خالی است تا قالبِ
 *     موجودِ media-placeholder کار کند.
 *   * مشخصات فنی (specs) خالی است: هیچ عددی تأیید نشده است.
 *
 * ---------------------------------------------------------------------------
 * سطح شواهد (از گزارش پژوهش)
 *
 *   A — سند فنی ایکاپ + شواهد قطعه/شماره فنی        → هیچ قطعه‌ای ندارد
 *   B — فهرست بازار ایران + شواهد فنی مستقل         → ۳ قطعه
 *   C — فقط فهرست بازار ایران                        → ۶۷ قطعه
 *   D — شواهد عمومی با سازگاری حل‌نشده               → وارد نمی‌شود
 * ==========================================================================*/
import { slugify } from '../services/slug.js';

/** تاریخ پژوهشی که این کاتالوگ از آن آمده است. */
export const CATALOGUE_SOURCE_DATE = '2026-09-27';

/** پیشوند کد کالای *داخلی و موقت*.
 *  این شمارهٔ فروشگاه خودمان است، نه شماره فنی سازنده. با رسیدن کد
 *  واقعی تأمین‌کننده باید جایگزین شود. */
export const SKU_PREFIX = 'P2008';

/* --------------------------------------------------------------- دسته‌ها */
/* فقط دسته‌هایی که واقعا قطعه دارند. دستهٔ خالی در نوار کناری با «۰»
   نشان داده می‌شود و کاتالوگ را بزرگ‌تر از آنچه هست جلوه می‌دهد. */
export const CATEGORIES = [
  { key: 'filters',    name: 'فیلتر و سرویس',      sortOrder: 10 },
  { key: 'engine',     name: 'موتور و توربو',      sortOrder: 20 },
  { key: 'brakes',     name: 'ترمز',               sortOrder: 30 },
  { key: 'suspension', name: 'تعلیق و فرمان',      sortOrder: 40 },
  { key: 'cooling',    name: 'خنک‌کاری و تهویه',   sortOrder: 50 },
  { key: 'electrical', name: 'برقی',               sortOrder: 60 },
];

/* --------------------------------------------------------------- خودرو */
/* engineCode عمدا null است.
 *
 * زیرکدِ خانوادهٔ EP6 (EP6DT / EP6FDT / EP6FDTM) با هیچ سند ایکاپی تأیید
 * نشد و منبع‌ها با هم اختلاف دارند. نوشتن یکی از آن‌ها یعنی ساختن داده.
 * آنچه *تأیید* شده در engineLabel می‌آید: نام تجاری THP165، حجم ۱۶۰۰
 * سی‌سی، توربو — و خانوادهٔ EP6 در یادداشت سازگاری.
 *
 * سال‌ها میلادی‌اند چون قید اعتبارسنجی پروژه (YEAR_MIN 1900) میلادی است؛
 * ۱۳۹۶–۱۳۹۹ شمسی همان ۲۰۱۷–۲۰۲۰ است. */
export const VEHICLE = {
  make: 'پژو',
  model: '۲۰۰۸',
  generation: 'نسل اول (A94)',
  yearFrom: 2017,
  yearTo: 2020,
  engineCode: null,
  engineLabel: 'THP165 — ۱۶۰۰ سی‌سی توربو',
  displayName: 'پژو ۲۰۰۸ ایران‌خودرو (ایکاپ) — THP165 اتوماتیک',
  sortOrder: 0,
  isActive: true,
};

/* ------------------------------------------------- یادداشت سازگاری */
/* یک جملهٔ یکسان برای همهٔ قطعه‌ها. چیزی بیش از آنچه ثابت شده ادعا
   نمی‌کند: قطعه برای همین خودرو در بازار ایران فهرست شده، و تطبیق
   دقیق باید با تأمین‌کننده تأیید شود. */
export const COMPATIBILITY_NOTE =
  'برای پژو ۲۰۰۸ ایران‌خودرو (ایکاپ) با موتور THP165 و گیربکس اتوماتیک '
  + 'شش‌سرعته فهرست شده است. تطبیق دقیق پیش از خرید باید با تأمین‌کننده '
  + 'تأیید شود.';

/* ------------------------------------------------------------- قطعه‌ها */
/* ترتیب همان ترتیب جدول گزارش پژوهش است تا ردیابی ساده بماند.
 *
 *   name          نام فارسی، دقیقا همان‌طور که در منبع آمده
 *   english       معادل انگلیسی، فقط برای مستندسازی داخلی
 *   category      کلید یکی از CATEGORIES
 *   oem           شماره فنی — فقط سه قطعه، بقیه null
 *   oemStatus     'candidate' یعنی شماره واقعی PSA است ولی روی خودروی
 *                 ایکاپ تأیید نشده؛ null یعنی اصلا شماره‌ای نداریم
 *   evidence      'B' یا 'C'
 *   sourceRef     صفحهٔ منبع
 *   sourceCategory دستهٔ خودِ PartsMall، برای ردیابی
 */
const PARTS = [
  /* ------------------------------------------------ فیلتر و سرویس (۵) */
  { name: 'فیلتر روغن', english: 'Oil filter', category: 'filters', oem: '1109CL', oemStatus: 'candidate', evidence: 'B', sourceRef: 'PartsMall p13 + Spareto OE 1109CL', sourceCategory: 'فیلترجات' },
  { name: 'فیلتر هوا', english: 'Air filter', category: 'filters', oem: '1444TT', oemStatus: 'candidate', evidence: 'B', sourceRef: 'PartsMall p7 + Spareto OE 1444TT', sourceCategory: 'فیلترجات' },
  { name: 'فیلتر اتاق', english: 'Cabin filter', category: 'filters', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p4', sourceCategory: 'فیلترجات' },
  { name: 'فیلتر بنزین', english: 'Fuel filter', category: 'filters', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'فیلترجات' },
  { name: 'فیلتر گیربکس', english: 'Transmission filter', category: 'filters', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p4، p9', sourceCategory: 'فیلترجات' },

  /* --------------------------------------------------------- ترمز (۹) */
  { name: 'لنت ترمز جلو', english: 'Front brake pad', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p13', sourceCategory: 'لنت ترمزی' },
  { name: 'دیسک چرخ', english: 'Brake disc', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p9', sourceCategory: 'ترمز' },
  { name: 'کالیپر ترمز', english: 'Brake caliper', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p12', sourceCategory: 'جلوبندی' },
  { name: 'پمپ ترمز', english: 'Brake master cylinder', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p5', sourceCategory: 'لوازم سیستم ترمز' },
  { name: 'بوستر ترمز', english: 'Brake booster', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p5', sourceCategory: 'لوازم سیستم ترمز' },
  { name: 'شیلنگ ترمز', english: 'Brake hose', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p12', sourceCategory: 'لوازم سیستم ترمز' },
  { name: 'مخزن پمپ ترمز', english: 'Master cylinder reservoir', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p12', sourceCategory: 'لوازم سیستم ترمز' },
  { name: 'لنت ترمز دستی', english: 'Parking brake shoes', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'لنت ترمزی' },
  { name: 'سیم ترمز دستی', english: 'Parking brake cable', category: 'brakes', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p12', sourceCategory: 'لوازم سیستم ترمز' },

  /* ------------------------------------------------ تعلیق و فرمان (۲۳) */
  { name: 'کمک فنر جلو', english: 'Front shock absorber', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'جلوبندی' },
  { name: 'توپی سرکمک جلو', english: 'Front strut top mount', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'جلوبندی' },
  { name: 'فنر لول', english: 'Coil spring', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p9', sourceCategory: 'جلوبندی' },
  { name: 'گردگیر کمک فنر', english: 'Strut dust cover', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p9', sourceCategory: 'جلوبندی' },
  { name: 'ضربه گیر کمک فنر', english: 'Strut bump stop', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p9', sourceCategory: 'جلوبندی' },
  { name: 'بلبرینگ چرخ', english: 'Wheel bearing', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'جلوبندی' },
  { name: 'توپی چرخ', english: 'Wheel hub', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'جلوبندی' },
  { name: 'طبق', english: 'Control arm', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'جلوبندی' },
  { name: 'سیبک طبق', english: 'Ball joint', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'جلوبندی' },
  { name: 'بوش طبق', english: 'Control arm bush', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'جلوبندی' },
  { name: 'میل موجگیر جلو', english: 'Front stabilizer link', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'جلوبندی' },
  { name: 'لاستیک چاکدار', english: 'Stabilizer bar bush', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'جلوبندی' },
  { name: 'میل تعادل', english: 'Stabilizer bar', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p9', sourceCategory: 'جلوبندی' },
  { name: 'میل موجگیر عقب', english: 'Rear stabilizer link', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p9', sourceCategory: 'جلوبندی' },
  { name: 'سگ دست', english: 'Steering knuckle', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p9', sourceCategory: 'جلوبندی' },
  { name: 'بوش سگ دست', english: 'Knuckle bushing', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p9', sourceCategory: 'جلوبندی' },
  { name: 'اکسل عقب', english: 'Rear torsion axle', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p12', sourceCategory: 'جلوبندی' },
  { name: 'بوش اکسل عقب', english: 'Rear axle bush', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p11', sourceCategory: 'جلوبندی' },
  { name: 'سیبک فرمان', english: 'Tie rod end', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'جلوبندی' },
  { name: 'قرقری فرمان', english: 'Inner ball joint', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p4', sourceCategory: 'جلوبندی' },
  { name: 'جعبه فرمان', english: 'Steering rack', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p3', sourceCategory: 'هیدرولیک' },
  { name: 'پمپ هیدرولیک فرمان', english: 'Power steering pump', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'هیدرولیک' },
  { name: 'گردگیر جعبه فرمان', english: 'Steering rack boot', category: 'suspension', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p12', sourceCategory: 'جلوبندی' },

  /* ------------------------------------------------- موتور و توربو (۱۸) */
  { name: 'تسمه تایم', english: 'Timing belt', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p13', sourceCategory: 'تسمه جات' },
  { name: 'تسمه دینام', english: 'Ribbed accessory belt', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'تسمه جات' },
  { name: 'سفت کن تایم', english: 'Timing tensioner', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p6', sourceCategory: 'موتوری' },
  { name: 'هرزگرد تایم', english: 'Timing idler pulley', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p6', sourceCategory: 'موتوری' },
  { name: 'سفت کن دینام', english: 'Accessory belt tensioner', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p6', sourceCategory: 'موتوری' },
  { name: 'هرزگرد دینام', english: 'Accessory belt idler', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p6', sourceCategory: 'موتوری' },
  { name: 'واتر پمپ', english: 'Water pump', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'موتوری' },
  { name: 'پمپ آب کمکی توربو', english: 'Auxiliary turbo coolant pump', category: 'engine', oem: '9806790780', oemStatus: 'candidate', evidence: 'B', sourceRef: 'Spareto OE 9806790780', sourceCategory: '—' },
  { name: 'ترموستات', english: 'Thermostat', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p13', sourceCategory: 'موتوری' },
  { name: 'هوزینگ ترموستات', english: 'Thermostat housing', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p5', sourceCategory: 'موتوری' },
  { name: 'کارتل روغن', english: 'Engine oil pan', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p4', sourceCategory: 'موتوری' },
  { name: 'اویل پمپ', english: 'Oil pump', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'موتوری' },
  { name: 'خنک کن روغن', english: 'Engine oil cooler', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'موتوری' },
  { name: 'واشر درب سوپاپ', english: 'Valve cover gasket', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'موتوری' },
  { name: 'شیر OCV', english: 'Oil control valve', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p4', sourceCategory: 'برقی' },
  { name: 'دریچه گاز', english: 'Throttle body', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p13', sourceCategory: 'برقی' },
  { name: 'خرطومی هواکش', english: 'Air intake hose', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p5', sourceCategory: 'بدنه' },
  { name: 'مخزن هواکش', english: 'Air filter housing', category: 'engine', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'بدنه' },

  /* ----------------------------------------------- خنک‌کاری و تهویه (۶) */
  { name: 'رادیاتور آب', english: 'Water radiator', category: 'cooling', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p13', sourceCategory: 'کولری و رادیاتوری' },
  { name: 'رادیاتور بخاری', english: 'Heater radiator', category: 'cooling', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p13', sourceCategory: 'کولری و رادیاتوری' },
  { name: 'رادیاتور کولر', english: 'AC condenser', category: 'cooling', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p8', sourceCategory: 'کولری و رادیاتوری' },
  { name: 'کمپرسور کولر', english: 'AC compressor', category: 'cooling', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p13', sourceCategory: 'کولری و رادیاتوری' },
  { name: 'مجموعه فن رادیاتور', english: 'Radiator fan assembly', category: 'cooling', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p6', sourceCategory: 'کولری و رادیاتوری' },
  { name: 'منبع انبساط', english: 'Coolant expansion tank', category: 'cooling', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p5', sourceCategory: 'کولری و رادیاتوری' },

  /* -------------------------------------------------------- برقی (۹) */
  { name: 'یونیت ABS', english: 'ABS control unit', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p12', sourceCategory: 'برقی' },
  { name: 'سنسور ABS', english: 'ABS sensor', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p12', sourceCategory: 'برقی' },
  { name: 'استپ ترمز', english: 'Brake light switch', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p5', sourceCategory: 'برقی' },
  { name: 'کویل', english: 'Ignition coil', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p13', sourceCategory: 'برقی' },
  { name: 'سوزن انژکتور', english: 'Fuel injector', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p4', sourceCategory: 'برقی' },
  { name: 'دینام', english: 'Alternator', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p3', sourceCategory: 'برقی' },
  { name: 'استارت', english: 'Starter motor', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p3', sourceCategory: 'برقی' },
  { name: 'سنسور اکسیژن', english: 'Oxygen sensor', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p4', sourceCategory: 'برقی' },
  { name: 'سنسور موقعیت میل لنگ', english: 'Crankshaft position sensor', category: 'electrical', oem: null, oemStatus: null, evidence: 'C', sourceRef: 'PartsMall p7', sourceCategory: 'برقی' },
];

/* ------------------------------------------------- قطعه‌های رد شده --- */
/* اینجا می‌مانند تا دلیل *نبودنشان* هم بخشی از سند باشد. هرگز وارد
   نمی‌شوند؛ آزمون همین را تضمین می‌کند. */
export const REJECTED = [
  { name: 'دیسک کلاچ', reason: 'قطعهٔ گیربکس دستی — این خودرو اتوماتیک EAT6 است.' },
  { name: 'صفحه کلاچ', reason: 'قطعهٔ گیربکس دستی — این خودرو اتوماتیک EAT6 است.' },
  { name: 'بلبرینگ کلاچ', reason: 'قطعهٔ گیربکس دستی — این خودرو اتوماتیک EAT6 است.' },
  { name: 'دو شاخه کلاچ', reason: 'قطعهٔ گیربکس دستی — این خودرو اتوماتیک EAT6 است.' },
  { name: 'پمپ کلاچ بالا', reason: 'قطعهٔ گیربکس دستی — این خودرو اتوماتیک EAT6 است.' },
  { name: 'پمپ کلاچ پایین', reason: 'قطعهٔ گیربکس دستی — این خودرو اتوماتیک EAT6 است.' },
  { name: 'کیت کلاچ', reason: 'قطعهٔ گیربکس دستی — این خودرو اتوماتیک EAT6 است.' },
  { name: 'دنده برنجی', reason: 'داخل گیربکس دستی.' },
  { name: 'ماهک دنده', reason: 'داخل گیربکس دستی.' },
  { name: 'فلایویل', reason: 'روی اتوماتیک صفحهٔ کنورتور است؛ نیاز به تأیید تأمین‌کننده.' },
  { name: 'ایربگ فرمان', reason: 'قطعهٔ پیروتکنیک — حمل و فروش آنلاین مناسب این فاز نیست.' },
  { name: 'ایربگ شاگرد', reason: 'قطعهٔ پیروتکنیک — حمل و فروش آنلاین مناسب این فاز نیست.' },
  { name: 'ایربگ پرده ای', reason: 'قطعهٔ پیروتکنیک — حمل و فروش آنلاین مناسب این فاز نیست.' },
  { name: 'یونیت ایربگ', reason: 'قطعهٔ پیروتکنیک — حمل و فروش آنلاین مناسب این فاز نیست.' },
  { name: 'ضبط', reason: 'لوازم جانبی، نه قطعهٔ یدکی.' },
  { name: 'مانیتور', reason: 'لوازم جانبی، نه قطعهٔ یدکی.' },
  { name: 'بلندگو', reason: 'لوازم جانبی، نه قطعهٔ یدکی.' },
  { name: 'ریموت', reason: 'لوازم جانبی، نه قطعهٔ یدکی.' },
  { name: 'روکش صندلی', reason: 'لوازم جانبی، نه قطعهٔ یدکی.' },
  { name: 'باربند', reason: 'لوازم جانبی، نه قطعهٔ یدکی.' },
  { name: 'داشبورد', reason: 'تزئینات داخلی، نه قطعهٔ یدکی.' },
  { name: 'کنسول وسط', reason: 'تزئینات داخلی، نه قطعهٔ یدکی.' },
  { name: 'بلوک سیلندر', reason: 'مجموعهٔ بزرگ موتور — خارج از دامنهٔ کاتالوگ اول.' },
  { name: 'سر سیلندر', reason: 'مجموعهٔ بزرگ موتور — خارج از دامنهٔ کاتالوگ اول.' },
  { name: 'میللنگ', reason: 'مجموعهٔ بزرگ موتور — خارج از دامنهٔ کاتالوگ اول.' },
  { name: 'گیربکس', reason: 'مجموعهٔ بزرگ — خارج از دامنهٔ کاتالوگ اول.' },
];

/* ------------------------------------------- شماره فنی‌های رد شده --- */
/* شماره‌هایی که واقعی‌اند ولی به این خودرو نمی‌خورند. ثبت می‌شوند تا
   دوباره کسی آن‌ها را «پیدا» و اضافه نکند. */
export const REJECTED_OEM = [
  {
    oem: '1617282980',
    part: 'لنت ترمز جلو',
    reason: 'شماره فنی واقعی PSA است، ولی فهرست تطبیق آن فقط دیزل‌ها و '
      + 'بنزینی ۱.۲ را دارد و هیچ بنزینیِ توربو در آن نیست.',
  },
  {
    oem: '1906C0',
    part: 'فیلتر بنزین',
    reason: 'فیلتر سوخت دیزل است؛ این خودرو بنزینیِ پاشش مستقیم است.',
  },
  {
    oem: '6447XG',
    part: 'فیلتر اتاق',
    reason: 'روی فیات، جنرال موتورز و فولکس هم فهرست شده — بیش از آن '
      + 'عمومی است که به A94 گره بخورد.',
  },
  {
    oem: '5960.L5 / 5960G4 / 596092',
    part: 'شمع',
    reason: 'سه شمارهٔ ناسازگار، همه از بازارگاه‌های فروش. اختلاف ثبت شد '
      + 'و هیچ‌کدام انتخاب نشد.',
  },
];

/* ---------------------------------------------------------- سازنده --- */

/** کد کالای داخلی و قطعی: P2008-001 … P2008-070. */
export function buildSku(index) {
  return `${SKU_PREFIX}-${String(index + 1).padStart(3, '0')}`;
}

/**
 * رکوردهای آمادهٔ درج.
 *
 * نشانی با همان slugify پروژه ساخته می‌شود — نه یک قاعدهٔ تازه — پس
 * «فیلتر روغن» همان «فیلتر-روغن» می‌شود که بقیهٔ پروژه انتظار دارد.
 *
 * هیچ قیمتی، موجودی‌ای، برندی یا تصویری ساخته نمی‌شود.
 */
export function buildProducts() {
  return PARTS.map((part, i) => ({
    /* شناسایی */
    name: part.name,
    slug: slugify(part.name),
    sku: buildSku(i),
    oemNumber: part.oem,

    /* ارجاع‌ها — واردکننده این‌ها را به شناسهٔ واقعی تبدیل می‌کند */
    categoryKey: part.category,
    brandId: null,

    /* داده‌های تجاری: هیچ‌کدام ساخته نشده‌اند */
    priceToman: 0,
    salePriceToman: null,
    stockQty: 0,
    availability: 'on_order',

    /* متن */
    shortDescription: null,
    description: null,
    compatibilityNote: COMPATIBILITY_NOTE,
    specs: {},
    weightGrams: null,

    /* انتشار: تا رسیدن قیمت و موجودی واقعی، خاموش */
    isActive: false,
    isFeatured: false,
    isNew: false,

    /* تصویر: هیچ. قالبِ media-placeholder جای آن را پر می‌کند */
    images: [],

    /* فراداده — برای درج نیست، برای ردیابی است */
    meta: {
      english: part.english,
      evidence: part.evidence,
      oemStatus: part.oemStatus,
      sourceRef: part.sourceRef,
      sourceCategory: part.sourceCategory,
    },
  }));
}

/** دسته‌ها با نشانی ساخته‌شده از همان قاعدهٔ پروژه. */
export function buildCategories() {
  return CATEGORIES.map((c) => ({
    key: c.key,
    name: c.name,
    slug: slugify(c.name),
    description: null,
    parentId: null,
    sortOrder: c.sortOrder,
    isActive: true,
  }));
}

/** خودرو با نشانی ساخته‌شده از نام نمایشی — همان قاعدهٔ فرم مدیر. */
export function buildVehicle() {
  return { ...VEHICLE, slug: slugify(VEHICLE.displayName) };
}

export default { buildCategories, buildProducts, buildVehicle };
