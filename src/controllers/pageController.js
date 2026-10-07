/* ============================================================================
 * controllers/pageController.js — صفحه‌های اطلاعاتی
 * ----------------------------------------------------------------------------
 * «دربارهٔ ما» و «تماس با ما». همان الگوی بقیهٔ کنترلرها: مخزن‌ها از
 * بیرون تزریق می‌شوند تا آزمون بتواند PGlite بدهد.
 *
 * قاعدهٔ محتوا — همان قاعده‌ای که در کل این فروشگاه رعایت شده:
 *
 *   هیچ ادعایی دربارهٔ کسب‌وکار ساخته نمی‌شود. نه سال تأسیس، نه تعداد
 *   مشتری، نه گارانتی، نه زمان ارسال، نه «بهترین» و «معتبرترین».
 *   هرچه روی این دو صفحه می‌آید یا از پایگاه داده می‌آید (شمار واقعی
 *   محصول و دسته و برند) یا از پیکربندی (راه‌های ارتباطیِ واقعی).
 *
 *   «دربارهٔ ما» عمدا می‌گوید که سفارش و پرداخت آنلاین هنوز پیاده نشده
 *   است. این صفحه نباید به بازدیدکننده بفهماند که می‌تواند خرید کند،
 *   چون امروز نمی‌تواند.
 * ==========================================================================*/

export function createPageController({ products, categories, brands }) {
  /**
   * GET /about
   *
   * شمارها زنده‌اند، نه عددِ دستیِ داخل قالب: اگر کاتالوگ بزرگ یا کوچک
   * شود، متن صفحه خودش درست می‌ماند و کسی یادش نمی‌رود به‌روزش کند.
   */
  async function about(req, res, next) {
    try {
      const [latest, categoryList, brandList] = await Promise.all([
        products.list({ page: 1, perPage: 1 }),
        categories.listWithCounts(),
        brands.listWithCounts(),
      ]);

      res.render('pages/about', {
        title: 'دربارهٔ ما',
        metaDescription:
          '۲۰۰۸پارتس — کاتالوگ تخصصی قطعات یدکی و لوازم جانبی پژو ۲۰۰۸. '
          + 'جست‌وجو بر اساس نام فارسی قطعه، کد کالا یا شماره فنی.',
        totalProducts: latest.total,
        totalCategories: categoryList.length,
        totalBrands: brandList.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /contact
   *
   * هیچ داده‌ای از پایگاه داده لازم ندارد. آنچه نشان داده می‌شود از
   * config.contact می‌آید و همه‌اش اختیاری است؛ قالب فقط کانال‌هایی را
   * رندر می‌کند که واقعا مقدار دارند.
   */
  async function contact(req, res, next) {
    try {
      const { config } = await import('../config/index.js');
      const c = config.contact;

      /* فهرست کانال‌های *پرشده*. قالب روی همین حلقه می‌زند، پس یک خانهٔ
         خالی هرگز به صفحه نمی‌رسد.

         href برای تلفن و ایمیل ساخته می‌شود تا روی موبایل قابل زدن باشد؛
         برای نشانی و ساعت کاری href معنا ندارد و null می‌ماند. */
      const channels = [
        c.phone     && { key: 'phone',     label: 'تلفن ثابت',    value: c.phone,     href: `tel:${c.phone.replace(/\s+/g, '')}`,      isNum: true },
        c.mobile    && { key: 'mobile',    label: 'همراه',        value: c.mobile,    href: `tel:${c.mobile.replace(/\s+/g, '')}`,     isNum: true },
        c.whatsapp  && { key: 'whatsapp',  label: 'واتس‌اپ',      value: c.whatsapp,  href: `https://wa.me/${c.whatsapp.replace(/[^0-9]/g, '')}`, isNum: true },
        c.telegram  && { key: 'telegram',  label: 'تلگرام',       value: c.telegram,  href: `https://t.me/${c.telegram.replace(/^@/, '')}` },
        c.instagram && { key: 'instagram', label: 'اینستاگرام',   value: c.instagram, href: `https://instagram.com/${c.instagram.replace(/^@/, '')}` },
        c.email     && { key: 'email',     label: 'ایمیل',        value: c.email,     href: `mailto:${c.email}` },
        c.address   && { key: 'address',   label: 'نشانی',        value: c.address,   href: null },
        c.hours     && { key: 'hours',     label: 'ساعت کاری',    value: c.hours,     href: null },
      ].filter(Boolean);

      res.render('pages/contact', {
        title: 'تماس با ما',
        metaDescription: 'راه‌های ارتباط با فروشگاه ۲۰۰۸پارتس.',
        channels,
        hasAnyChannel: channels.length > 0,
      });
    } catch (err) {
      next(err);
    }
  }

  return { about, contact };
}
