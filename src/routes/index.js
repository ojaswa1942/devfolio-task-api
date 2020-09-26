const express = require('express');
const orderRoutes = require('./orders.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');

const routes = express.Router();

routes.use(`/order`, orderRoutes);
routes.use(`/user`, userRoutes);
routes.use(`/admin`, adminRoutes);

module.exports = routes;
