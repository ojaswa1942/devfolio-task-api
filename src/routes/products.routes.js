const express = require('express');
const { addProduct, getProducts, getProduct } = require('../controllers/product');
const { withAuth, withPrivilege } = require('../utils/middlewares');

const router = express.Router();

router.use(withAuth);
router.get('/', getProducts);
router.get('/:id', getProduct);

router.use(withPrivilege);

router.post(`/add`, addProduct);

module.exports = router;
