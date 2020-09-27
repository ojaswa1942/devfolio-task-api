const {
  location: { store: storeLocation },
  constraints,
} = require('../utils/config');
const {
  accessControl,
  CREATE_ORDER,
  VIEW_DELIVERING_ORDERS,
  VIEW_ALL_ORDERS,
  VIEW_ORDER,
  MODIFY_ORDER_STATUS,
} = require('../utils/accessControl');
const { calculateETA, orderStatusPrecedence } = require('../utils/helpers');
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

  static getOrder = async (args, context) => {
    const { id } = args;
    const { db, accountType, userEmail } = context;
    if (!(await accessControl(VIEW_ORDER, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    // access validation
    let orderCheck = null;
    switch (accountType) {
      case `DELIVERY`:
        // eslint-disable-next-line
        const carrierDetails = await UserService.getDeliveryMember({ email: userEmail }, context);
        orderCheck = await db('orders')
          .select('orderid')
          .where({ orderid: id, carrier: carrierDetails.body.user.did });
        if (!orderCheck.length) return { success: false, error: 'Not authorized' };
        break;
      case `CUSTOMER`:
        orderCheck = await db('orders')
          .select('orderid')
          .where({ customer_email: userEmail, orderid: id });
        if (!orderCheck.length) return { success: false, error: 'Not authorized' };
        break;
      default:
        break;
    }

    let order = await db('orders').select().where({ orderid: id });
    if (!order.length) return { success: false, error: 'Invalid order id' };

    const items = await db('order_details').select().where({ orderid: id });

    return {
      success: true,
      body: {
        message: 'Successfully fetched order details',
        orderDetails: {
          ...order[0],
          items,
        },
      },
    };
  };

  static updateOrderStatus = async (args, context) => {
    const { id, status } = args;
    const { db, accountType, userEmail, logger } = context;

    if (!(await accessControl(MODIFY_ORDER_STATUS, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const order = await db('orders').select().where({ orderid: id });
    if (!order.length) return { success: false, error: 'Not authorized' };

    const carrierDetails = await db('deliveryteam').select().where({ did: order[0].carrier });
    if (accountType === `DELIVERY` && carrierDetails[0].email !== userEmail)
      return { success: false, error: 'Not authorized' };

    if (orderStatusPrecedence(status) - orderStatusPrecedence(order[0].status) !== 1)
      return { success: false, error: 'Incorrect updation order, cannot proceed' };
    try {
      await db.transaction(async (trx) => {
        if (status === `PICKED`) {
          const orderETA = await calculateETA(storeLocation, order[0].destination);
          await trx('orders')
            .update({ status, ETA: orderETA })
            .where({ orderid: order[0].orderid });
          await trx('deliveryteam')
            .update({
              location: storeLocation,
              storeETA: 0,
              lastUpdated: parseInt(Date.now() / 1000, 10),
            })
            .where({ did: order[0].carrier });
        } else if (status === `DELIVERED`) {
          const storeETA = await calculateETA(order[0].destination, storeLocation);
          await trx('orders').update({ status, ETA: 0 }).where({ orderid: order[0].orderid });
          await trx('deliveryteam')
            .update({
              status: `ONLINE`,
              location: order[0].destination,
              storeETA,
              lastUpdated: parseInt(Date.now() / 1000, 10),
            })
            .where({ did: order[0].carrier });
        }
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }

    return {
      success: true,
      body: {
        message: 'Status successfully updated',
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
        return trx('deliveryteam').update({ status: `ASSIGNED` }).where({ did: deliveryGuy.id });
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
