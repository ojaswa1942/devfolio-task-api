const ProductService = require('../../lib/ProductService');

const getProducts = async (req, res) => {
  try {
    let productId = parseInt(req.params.id, 10);
    const serviceRes = await ProductService.getProduct({ productId }, req.context);
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling /product/:id controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = getProducts;
