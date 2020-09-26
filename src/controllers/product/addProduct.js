/* eslint-disable camelcase */
const ProductService = require('../../lib/ProductService');
const { stripScriptTags } = require('../../utils/helpers');

const addProduct = async (req, res) => {
  try {
    let { name, description, price, quantity_available, category } = req.body;
    [name, description, price, quantity_available, category] = stripScriptTags(
      name,
      description,
      price,
      quantity_available,
      category
    );

    if (!name || !price) {
      return res.status(400).json('Name and price are required');
    }

    const serviceRes = await ProductService.addProduct(
      { name, description, price, quantity_available, category },
      req.context
    );
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling /products/add controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = addProduct;
