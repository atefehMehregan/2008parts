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
import { createCartController } from '../controllers/cartController.js';
import { requireCsrf } from '../middleware/security.js';

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

  /* سبد خرید مهمان. خواندن آزاد است؛ هر تغییری POST است و پشت CSRF.
     همان requireCsrf موجود استفاده می‌شود (double-submit)، نه یک
     پیاده‌سازی دوم. */
  const cart = createCartController(repositories);
  router.get('/cart', cart.index);
  router.post('/cart/add', requireCsrf, cart.add);
  router.post('/cart/update', requireCsrf, cart.update);
  router.post('/cart/remove', requireCsrf, cart.remove);

  return router;
}
