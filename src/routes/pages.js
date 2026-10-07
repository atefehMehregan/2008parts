/* ============================================================================
 * routes/pages.js — صفحه‌های عمومی غیرکاتالوگی
 * ----------------------------------------------------------------------------
 * فعلا فقط صفحهٔ اصلی. مثل مسیریاب کاتالوگ، مخزن‌ها از بیرون تزریق
 * می‌شوند تا آزمون بتواند PGlite بدهد.
 *
 * همه GET و همه عمومی؛ هیچ مسیر تغییردهنده‌ای اینجا نیست.
 * ==========================================================================*/
import express from 'express';
import { createHomeController } from '../controllers/homeController.js';
import { createPageController } from '../controllers/pageController.js';

export function createPageRouter(repositories) {
  const router = express.Router();
  const c = createHomeController(repositories);
  const p = createPageController(repositories);

  router.get('/', c.home);

  /* صفحه‌های اطلاعاتی. هر دو فقط GET و عمومی‌اند.
     «مقالات» عمدا اینجا نیست: هنوز هیچ مقاله‌ای وجود ندارد و نه جدولی
     برای نگه‌داشتنش. پیوند به صفحهٔ خالی بدتر از نبودِ پیوند است. */
  router.get('/about', p.about);
  router.get('/contact', p.contact);

  return router;
}
