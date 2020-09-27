'use strict;';

const newOrder = require('./newOrder');
const getOrders = require('./getOrders');
const getOrder = require('./getOrder');
const updateOrderStatus = require('./updateOrderStatus');

module.exports = {
  newOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
};
