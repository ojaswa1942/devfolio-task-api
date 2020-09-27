const express = require('express');
const { newOrder, getOrders, getOrder, updateOrderStatus } = require('../controllers/orders');
const { withAuth } = require('../utils/middlewares');

const router = express.Router();

router.use(withAuth);
router.get(`/`, getOrders);
router.post(`/new`, newOrder);
router.get(`/:id`, getOrder);
router.post(`/:id/update`, updateOrderStatus);

module.exports = router;
