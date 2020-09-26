const express = require('express');
const orderRoutes = require('./orders.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const productsRoutes = require('./products.routes');
const deliveryRoutes = require('./delivery.routes');

const routes = express.Router();

routes.use(`/orders`, orderRoutes);
routes.use(`/delivery`, deliveryRoutes);
routes.use(`/user`, userRoutes);
routes.use(`/products`, productsRoutes);
routes.use(`/admin`, adminRoutes);

module.exports = routes;
