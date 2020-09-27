const {
  location: { store: storeLocation },
  constraints,
} = require('../utils/config');
const { accessControl, CREATE_ORDER } = require('../utils/accessControl');
const { calculateETA } = require('../utils/helpers');
// const UserService = require('./UserService');
const DeliveryService = require('./DeliveryService');
const ProductService = require('./ProductService');

class OrderService {
  static newOrder = async (args, context) => {
    const { address, items } = args;
    const { db, logger, accountType, userEmail } = context;

    if (!(await accessControl(CREATE_ORDER, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    let destinationETA = await calculateETA(storeLocation, address);
    if (destinationETA > constraints.allowedDestinationETA)
      return { success: false, error: `Address out of serviceable area` };

    let orderDetails = {
      items: [],
    };

    try {
      await db.transaction(async (trx) => {
        // Add order id later
        const itemListToInsert = [];
        // eslint-disable-next-line
        for( let item of items ) {
          let product = await ProductService.getProduct(
            { productId: item.id },
            { ...context, db: trx }
          );
          if (!product.success) throw new Error(product.error);
          product = product.body.product;

          const itemBody = {
            productid: product.pid,
            price: product.price,
            quantity: item.quantity,
            total: product.price * item.quantity,
          };
          itemListToInsert.push({ ...itemBody });
          orderDetails.items.push({ ...itemBody, name: product.name });
        }

        let deliveryGuy = await DeliveryService.findAvailableDeliveryGuy(
          { destination: address },
          { ...context, db: trx }
        );
        console.log(deliveryGuy);
        if (!deliveryGuy.success) throw new Error(deliveryGuy.error);
        deliveryGuy = deliveryGuy.body.deliveryGuy;
        console.log(deliveryGuy);
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }

    return {
      success: true,
      body: {
        message: `Successfully created new order`,
        order: orderDetails,
      },
    };
  };
}

module.exports = OrderService;
