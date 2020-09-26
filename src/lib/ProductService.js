/* eslint-disable camelcase */
const { accessControl, ADD_PRODUCT, VIEW_PRODUCTS } = require('../utils/accessControl');

class ProductService {
  static getProducts = async (_, context) => {
    const { db, accountType, userEmail } = context;
    if (!(await accessControl(VIEW_PRODUCTS, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const products = await db(`products`).select();
    return {
      success: true,
      body: {
        total: products.length,
        message: `Products fetched successfully`,
        products,
      },
    };
  };

  static addProduct = async (args, context) => {
    const { name, description, price, quantity_available, category = `GENERIC` } = args;
    const { db, logger, accountType, userEmail } = context;

    if (!(await accessControl(ADD_PRODUCT, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    let pid = null;

    try {
      [pid] = await db.transaction(async (trx) => {
        return trx
          .insert({ name, description, price, quantity_available, category })
          .into(`products`)
          .returning(`pid`);
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }
    return {
      success: true,
      body: {
        message: `New product '${name}' successfully added!`,
        product_id: pid,
      },
    };
  };
}

module.exports = ProductService;
