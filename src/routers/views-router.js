import express from 'express';
import path from 'path';

const viewsRouter = express.Router();

// 페이지별로 html, css, js 파일들을 라우팅함
// 아래와 같이 하면, http://localhost:5000/ 에서는 views/home/home.html 파일을,
// http://localhost:5000/register 에서는 views/register/register.html 파일을 화면에 띄움
viewsRouter.use('/', serveStatic('home'));
viewsRouter.use('/register', serveStatic('register'));
viewsRouter.use('/login', serveStatic('login'));
viewsRouter.use('/sellproduct', serveStatic('sellproduct'));
viewsRouter.use('/editprofile', serveStatic('editprofile'));
viewsRouter.use('/account', serveStatic('account'));
viewsRouter.use('/detail', serveStatic('detail'));
viewsRouter.use('/products', serveStatic('product'));
viewsRouter.use('/oauth', serveStatic('oauth'));
viewsRouter.use('/detail', serveStatic('detail'));
viewsRouter.use('/cart', serveStatic('cart'));
viewsRouter.use('/shippingpoint', serveStatic('shippingpoint'));
viewsRouter.use('/orders', serveStatic('orders'));
viewsRouter.use('/complete', serveStatic('complete'));
viewsRouter.use('/cart', serveStatic('cart'));
viewsRouter.use('/systemcode', serveStatic('systemcode'));
viewsRouter.use('/admin-userlist', serveStatic('admin-userlist'));
viewsRouter.use('/admin-product', serveStatic('admin-product'));
viewsRouter.use('/admin-order', serveStatic('admin-order'));

viewsRouter.use('/brand-info', serveStatic('brand-info'));
viewsRouter.use('/find-password', serveStatic('find-password'));

// views 폴더의 최상단 파일인 rabbit.png, api.js 등을 쓸 수 있게 함
viewsRouter.use('/', serveStatic(''));

// views폴더 내의 ${resource} 폴더 내의 모든 파일을 웹에 띄우며,
// 이 때 ${resource}.html 을 기본 파일로 설정함.
function serveStatic(resource) {
  const resourcePath = path.join(__dirname, `../views/${resource}`);
  const option = { index: `${resource}.html` };

  // express.static 은 express 가 기본으로 제공하는 함수임
  return express.static(resourcePath, option);
}

export { viewsRouter };
