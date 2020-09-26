const express = require('express');
const { addProduct, getProducts } = require('../controllers/product');
const { withAuth, withPrivilege } = require('../utils/middlewares');

const router = express.Router();

router.use(withAuth);
router.get('/', getProducts);

router.use(withPrivilege);

router.post(`/add`, addProduct);

module.exports = router;
