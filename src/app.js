/* ============================================================================
 * app.js — ساخت برنامه Express
 * ----------------------------------------------------------------------------
 * این فایل فقط برنامه را می‌سازد و برمی‌گرداند؛ به پورتی گوش نمی‌دهد.
 * راه‌اندازی در server.js است. این جدایی باعث می‌شود آزمون‌ها بتوانند
 * برنامه را بدون بالا آوردن سرور واقعی بسازند.
 * ==========================================================================*/
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import nunjucks from 'nunjucks';
import path from 'node:path';
import { config, ROOT } from './config/index.js';
import { extraSecurityHeaders, csrfToken, notFound, errorHandler } from './middleware/security.js';
import { cartCount } from './controllers/cartController.js';
import { generalLimiter, loginLimiter, uploadLimiter } from './middleware/rateLimit.js';
import { healthRouter } from './routes/health.js';
import { createPageRouter } from './routes/pages.js';
import { createCatalogRouter } from './routes/catalog.js';
import { createAdminRouter } from './routes/admin.js';
import { createAdminAuthService } from './services/adminAuth.js';
import { createAuditLog } from './services/audit.js';
import { createAdminUserRepository } from './db/repositories/adminUsers.js';
import { createAdminSessionRepository } from './db/repositories/adminSessions.js';
import { createLoginAttemptRepository } from './db/repositories/loginAttempts.js';
import * as productionRepositories from './db/repositories/index.js';
import * as productionDb from './db/index.js';
import { storage as defaultStorage } from './services/storage.js';
import { faDigits, formatToman, formatJalali } from './services/format.js';

/**
 * ساخت برنامه.
 *
 * @param {object} [options]
 * @param {object} [options.repositories] مخزن‌ها. پیش‌فرض، مخزن‌های
 *   سیم‌کشی‌شده به استخر اتصال تولید. آزمون‌ها اینجا یک مجموعهٔ
 *   PGlite تزریق می‌کنند — همان الگوی فاز ۱الف، تا لایهٔ اتصال
 *   تولید (src/db/index.js) دست‌نخورده بماند.
 */
export function createApp({
  repositories = productionRepositories, db = null, storage = defaultStorage,
} = {}) {
  const app = express();

  /* پشت پراکسی (IIS/ARR یا Nginx) آی‌پی واقعی در X-Forwarded-For است. */
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  /* ---------------------------------------------------------- قالب‌ها */
  /* Nunjucks به‌جای EJS انتخاب شده است: وراثت قالب (extends/block) برای
     یک فروشگاه چندصفحه‌ای تمیزتر از کنار هم چیدن partial است، و
     autoescape به‌صورت پیش‌فرض روشن است که یک لایه دفاع در برابر XSS
     می‌دهد بدون اینکه به یادآوری برنامه‌نویس وابسته باشد. */
  const viewsDir = path.join(ROOT, 'src', 'views');
  const njk = nunjucks.configure(viewsDir, {
    autoescape: true,
    express: app,
    /* watch به chokidar نیاز دارد و برای ما ارزشی ندارد: noCache در حالت
       توسعه خودش باعث می‌شود تغییر قالب بلافاصله دیده شود. یک وابستگی کمتر. */
    noCache: !config.isProd,
  });
  app.set('view engine', 'njk');

  /* کمک‌کننده‌های نمایش فارسی — مقدار خام در پایگاه داده می‌ماند و
     تبدیل فقط در لحظه نمایش انجام می‌شود. */
  njk.addFilter('faDigits', faDigits);
  njk.addFilter('toman', formatToman);
  /* Nunjucks آرگومان فیلتر را موضعی می‌دهد، نه به‌صورت شیء گزینه‌ها،
     پس «toman(false)» به formatToman یک boolean می‌رساند و بی‌اثر می‌ماند.
     یک فیلتر جداگانه صریح‌تر از هوشمندبازی در خود تابع است. */
  njk.addFilter('tomanPlain', (value) => formatToman(value, { withUnit: false }));
  njk.addFilter('jalali', formatJalali);
  /* و به همان دلیل: «jalali(true)» یک boolean به formatJalali می‌رساند
     که شیء گزینه‌ها می‌خواهد، پس بی‌اثر می‌ماند و ساعت هرگز نمایش داده
     نمی‌شد. */
  njk.addFilter('jalaliTime', (value) => formatJalali(value, { withTime: true }));

  /* ------------------------------------------------------- میان‌افزارها */
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],   // بازبینی شود وقتی CSS نهایی آمد
        imgSrc: ["'self'", 'data:'],
        fontSrc: ["'self'"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    /* HSTS فقط در تولید و پشت HTTPS معنا دارد. */
    hsts: config.isProd ? { maxAge: 15_552_000, includeSubDomains: true } : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(extraSecurityHeaders);

  app.use(express.json({ limit: '64kb' }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  app.use(cookieParser());
  app.use(generalLimiter);

  /* آی‌پی یک بار حساب می‌شود تا همه‌جا یکسان باشد. */
  app.use((req, res, next) => {
    req.clientIp = req.ip || req.socket?.remoteAddress || 'unknown';
    next();
  });

  app.use(csrfToken);

  /* شمار سبد برای هدر. فقط کوکی را می‌شمارد و به پایگاه داده نمی‌زند. */
  app.use(cartCount);

  /* راه‌های ارتباطی برای دکمه‌های شناور و فوتر. مقدارهای عمومی‌اند و از
     پیکربندی می‌آیند، نه از متن ثابت داخل قالب‌ها. */
  app.use((req, res, next) => {
    res.locals.contact = config.contact;
    next();
  });

  /* متغیرهای مشترک همه قالب‌ها. */
  app.use((req, res, next) => {
    /* نام برند یک شکل دارد و فقط همین: 2008parts. پیش از این دو خط بود
       (نام فارسی + نام لاتین) و همان ساختار دو ادعای برندی می‌ساخت.
       اکنون نام لاتین خالی است تا برند دقیقا یک بار دیده شود؛ قالب‌ها
       دست‌نخورده‌اند و span خالی چیزی رندر نمی‌کند. */
    res.locals.storeName = '2008parts';
    res.locals.storeNameLatin = '';
    /* پوسته از پیکربندی می‌آید، نه از درخواست: انتخاب رنگ یک تصمیم
       استقرار است، نه ترجیح کاربر. قالب فقط همین را می‌خواند. */
    res.locals.theme = config.theme;
    res.locals.currentPath = req.path;
    res.locals.year = new Date().getFullYear();
    next();
  });

  /* دسته‌ها برای منوی هدر — روی *همهٔ* صفحه‌ها لازم است، نه فقط صفحهٔ
     اصلی. عمدا شکست‌پذیرِ نرم است: اگر پایگاه داده در دسترس نباشد منو
     خالی می‌ماند ولی صفحه بالا می‌آید. سرویس باید بدون پایگاه داده هم
     بالا بیاید (همان قاعده‌ای که /health روی آن بنا شده). */
  app.use(async (req, res, next) => {
    res.locals.navCategories = [];
    res.locals.navBrands = [];
    /* فایل‌های استاتیک و بخش مدیر به این منو نیازی ندارند. */
    if (req.path.startsWith('/admin') || req.path.startsWith('/media')) return next();
    try {
      /* ‎listWithCounts و نه listActive: منوی هدر کنار نام هر دسته شمار
         محصول را هم نشان می‌دهد، و listActive آن ستون را برنمی‌گرداند —
         نتیجه‌اش یازده قرصِ خالی در منو بود. اگر مخزنِ تزریق‌شده این
         متد را نداشت، به listActive برمی‌گردیم و منو بدون شمار می‌آید؛
         خالی ماندنِ کل منو بدتر از نبودِ عدد است. */
      const cats = repositories?.categories;
      if (cats?.listWithCounts) res.locals.navCategories = await cats.listWithCounts();
      else if (cats?.listActive) res.locals.navCategories = await cats.listActive();

      const brands = repositories?.brands;
      if (brands?.listWithCounts) res.locals.navBrands = await brands.listWithCounts();
      else if (brands?.listActive) res.locals.navBrands = await brands.listActive();
    } catch (err) {
      console.error('[nav] خواندن منوی ناوبری شکست خورد:', err.code || err.message);
    }
    return next();
  });

  /* --------------------------------------------------- فایل‌های استاتیک */
  app.use(express.static(path.join(ROOT, 'public'), {
    maxAge: config.isProd ? '7d' : 0,
    etag: true,
  }));

  /* مشتقات تصویر محصول عمدا عمومی‌اند (واترمارک‌خورده).
     originals و receipts هرگز اینجا سرو نمی‌شوند. */
  app.use('/media/products', express.static(config.storage.products, {
    maxAge: config.isProd ? '30d' : 0,
    index: false,
    dotfiles: 'deny',
  }));

  /* ------------------------------------------------------------ مسیرها */
  app.use('/', healthRouter);
  app.use('/', createPageRouter(repositories));
  app.use('/', createCatalogRouter(repositories));

  /* بخش مدیر. مخزن‌های احراز هویت از همان اجراکنندهٔ پایگاه داده ساخته
     می‌شوند که مخزن‌های کاتالوگ — در تولید استخر pg، در آزمون PGlite. */
  const adminDb = db || repositories.db || productionDb;
  const adminAudit = createAuditLog(adminDb);
  const adminAuthService = createAdminAuthService({
    adminUsers: createAdminUserRepository(adminDb),
    adminSessions: createAdminSessionRepository(adminDb),
    loginAttempts: createLoginAttemptRepository(adminDb),
    audit: adminAudit,
  });
  app.use('/admin', createAdminRouter({
    authService: adminAuthService,
    audit: adminAudit,
    loginLimiter,
    uploadLimiter,
    /* لایهٔ ذخیره‌سازی تصویر. پیش‌فرض، پیاده‌سازی فایل‌سیستم محلی
       (توسعه/پیش‌نمایش). جایگزینی‌اش فقط همان ماژول را عوض می‌کند. */
    storage,
    /* همان مخزن‌هایی که کاتالوگ عمومی استفاده می‌کند — از همان مسیر
       تزریق. بخش مدیر لایهٔ دسترسی به دادهٔ جداگانه‌ای نمی‌سازد. */
    repositories,
  }));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

export default createApp;
