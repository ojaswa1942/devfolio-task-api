const express = require('express');
const { newOrder, getOrders } = require('../controllers/orders');
const { withAuth } = require('../utils/middlewares');

const router = express.Router();

router.use(withAuth);
router.post(`/new`, newOrder);
router.get(`/`, getOrders);

module.exports = router;
