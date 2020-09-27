const {
  location: { store: storeLocation },
  constraints,
} = require('../utils/config');
const {
  accessControl,
  CREATE_ORDER,
  VIEW_DELIVERING_ORDERS,
  VIEW_ALL_ORDERS,
} = require('../utils/accessControl');
const { calculateETA } = require('../utils/helpers');
const UserService = require('./UserService');
const DeliveryService = require('./DeliveryService');
const ProductService = require('./ProductService');

class OrderService {
  static getAllOrders = async (_, context) => {
    const { db, accountType, userEmail } = context;
    if (!(await accessControl(VIEW_ALL_ORDERS, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const allOrders = await db('orders').select().orderBy('timestamp', 'desc');
    return {
      success: true,
      body: {
        message: 'All users fetched successfully',
        allOrders,
      },
    };
  };

  static getDeliveryOrders = async (args, context) => {
    const { email } = args;
    const { accountType, userEmail } = context;
    if (!(await accessControl(VIEW_DELIVERING_ORDERS, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const userDetails = await UserService.getDeliveryMember({ email }, context);
    if (!userDetails.success) return { success: false, error: userDetails.error };
    const orders = await DeliveryService.getActiveOrders(
      { did: userDetails.body.user.did },
      context
    );
    return {
      success: true,
      body: { message: 'Active orders fetched successfully', activeOrders: orders },
    };
  };

  static getCustomerOrders = async (args, context) => {
    const { email } = args;
    const { db } = context;
    const orders = await db('orders')
      .select()
      .where({ customer_email: email })
      .orderBy('timestamp', 'desc');
    return {
      success: true,
      body: {
        message: 'Orders fetched successfully',
        orders,
      },
    };
  };

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
        let itemListToInsert = [];
        let totaPrice = 0;
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
          totaPrice += itemBody.total;
          itemListToInsert.push({ ...itemBody });
          orderDetails.items.push({ ...itemBody, name: product.name });
        }

        let deliveryGuy = await DeliveryService.findAvailableDeliveryGuy(
          { destination: address },
          context
        );
        if (!deliveryGuy.success) throw new Error(deliveryGuy.error);
        deliveryGuy = deliveryGuy.body;

        let totalETA = parseInt(deliveryGuy.storeETA, 10) + parseInt(destinationETA, 10);

        let orderDetailsInsert = {
          customer_email: userEmail,
          price: totaPrice,
          destination: address,
          timestamp: parseInt(Date.now() / 1000, 10),
          status: `PROCESSING`,
          carrier: deliveryGuy.id,
          ETA: totalETA,
        };
        orderDetails = { ...orderDetails, ...orderDetailsInsert };

        const [orderId] = await trx('orders').insert(orderDetailsInsert).returning('orderid');
        orderDetails.orderId = orderId;
        // eslint-disable-next-line
        itemListToInsert.forEach(x => {x.orderid = orderId});

        await trx('order_details').insert(itemListToInsert);
        return trx('deliveryteam').update({ status: `ASSIGNED` });
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
