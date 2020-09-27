const bcrypt = require('bcrypt');
const {
  location: { store: storeLocation },
  constraints,
} = require('../utils/config');
const { calculateETA } = require('../utils/helpers');
const {
  accessControl,
  ADD_DELIVERY_MEMBER,
  VIEW_DELIVERY_MEMBERS,
  UPDATE_LOCATION,
} = require('../utils/accessControl');
const UserService = require('./UserService');

class DeliveryService {
  // Get active orders of a delivery guy
  static getActiveOrders = async ({ did }, { db }) => {
    return db('orders')
      .where({ carrier: did })
      .whereNot({ status: 'DELIVERED' })
      .orderBy('timestamp', 'desc');
  };

  static updateLocation = async (args, context) => {
    const { email, location } = args;
    const { db, accountType, userEmail, logger } = context;
    if (!(await accessControl(UPDATE_LOCATION, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    try {
      await db.transaction(async (trx) => {
        let deliveryUser = await UserService.getDeliveryMember({ email }, context);
        if (deliveryUser.success) deliveryUser = deliveryUser.body.user;
        else throw new Error(deliveryUser.error);

        let updatePayload = {
          status: deliveryUser.status === `OFFLINE` ? `ONLINE` : deliveryUser.status,
          location,
          lastUpdated: parseInt(Date.now() / 1000, 10),
        };
        updatePayload.storeETA = await calculateETA(location, storeLocation);

        await trx('deliveryteam').update(updatePayload).where({ email });

        // Update ETAs of active orders
        let activeOrders = await DeliveryService.getActiveOrders(
          { did: deliveryUser.did },
          { ...context, db: trx }
        );
        // eslint-disable-next-line
        for(let activeOrder of activeOrders) {
          let currentETA = 0;
          if (activeOrder.status === `PROCESSING`) {
            currentETA += await calculateETA(location, storeLocation);
            currentETA += await calculateETA(storeLocation, activeOrder.destination);
          } else if (activeOrder.status === `PICKED`) {
            currentETA += await calculateETA(location, activeOrder.destination);
          }
          await trx('orders').update({ ETA: currentETA }).where({ orderid: activeOrder.orderid });
        }
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }

    return {
      success: true,
      body: {
        message: `Location successfully acknowledged`,
      },
    };
  };

  static findAvailableDeliveryGuy = async (args, context) => {
    const { destination } = args;
    const { db, logger } = context;
    try {
      return db.transaction(async (trx) => {
        // First case
        // Carrier has picked an order and just left for delivery
        // If he is heading in the same direction - assign another
        const pickedUsers = await trx('deliveryteam')
          .join('orders', 'deliveryteam.did', 'orders.carrier')
          .select({
            did: `deliveryteam.did`,
            oldOrderDestination: `orders.destination`,
            storeETA: `deliveryteam.storeETA`,
          })
          .where({
            'deliveryteam.status': `ASSIGNED`,
            'orders.status': `PICKED`,
          })
          .andWhere('deliveryteam.storeETA', '<=', constraints.allowedStoreVicinityETA)
          .orderBy('deliveryteam.storeETA', 'asc');

        // eslint-disable-next-line
        for( let user of pickedUsers ) {
          const activeOrders = await DeliveryService.getActiveOrders({ did: user.did }, context);
          if (activeOrders.length < constraints.allowedMaxOrders) {
            const eta = await calculateETA(user.oldOrderDestination, destination);
            if (eta <= constraints.allowedVicinityETA) {
              return { success: true, body: { id: user.did, storeETA: user.storeETA } };
            }
          }
        }

        // Second case
        // Carrier has not yet picked an order but has been assigned one
        // If heading in same direction - assign another
        const assignedUsers = await trx('deliveryteam')
          .join('orders', 'deliveryteam.did', 'orders.carrier')
          .select({
            did: `deliveryteam.did`,
            oldOrderDestination: `orders.destination`,
            storeETA: `deliveryteam.storeETA`,
          })
          .where({
            'deliveryteam.status': `ASSIGNED`,
            'orders.status': `PROCESSING`,
          })
          .orderBy('deliveryteam.storeETA', 'asc');

        // eslint-disable-next-line
        for( let user of assignedUsers ) {
          const activeOrders = await DeliveryService.getActiveOrders({ did: user.did }, context);
          if (activeOrders.length < constraints.allowedMaxOrders) {
            const eta = await calculateETA(user.oldOrderDestination, destination);
            if (eta <= constraints.allowedVicinityETA) {
              return { success: true, body: { id: user.did, storeETA: user.storeETA } };
            }
          }
        }

        // Third case
        // Carrier is free and online
        // Assign to nearest carrier
        // Also, consider online only when he has updated his location in allowedUpdateInterval (since no cron setup yet)
        let allowedInterval = parseInt(Date.now() / 1000, 10) - constraints.allowedUpdateInterval;
        const onlineUsers = await trx('deliveryteam')
          .select()
          .where({
            status: `ONLINE`,
          })
          .andWhere('lastUpdated', '>=', allowedInterval)
          .orderBy('deliveryteam.storeETA', 'asc');

        if (onlineUsers && onlineUsers.length) {
          return {
            success: true,
            body: { id: onlineUsers[0].did, storeETA: onlineUsers[0].storeETA },
          };
        }

        return { success: false, error: `Cannot find any active delivery executive for your area` };
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }
  };

  static registerDeliveryGuy = async (args, context) => {
    const { name, email, password, phone } = args;
    const { db, accountType, userEmail, logger } = context;

    if (!(await accessControl(ADD_DELIVERY_MEMBER, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const getUserRes = await UserService.getDeliveryMember({ email }, context);
    if (getUserRes.success) {
      return { success: false, error: `User already exists` };
    }

    const hash = await bcrypt.hash(password, 10);
    try {
      await db.transaction(async (trx) => {
        await trx('deliveryteam').insert({
          name,
          email,
          phone,
          status: `OFFLINE`,
        });
        return trx
          .insert({
            email,
            password: hash,
            type: `DELIVERY`,
          })
          .into('auth');
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }
    return {
      success: true,
      body: {
        message: `Delivery guy ${email} successfully registered`,
      },
    };
  };

  static getDeliveryGuys = async (_, context) => {
    const { db, accountType, userEmail } = context;
    if (!(await accessControl(VIEW_DELIVERY_MEMBERS, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const deliveryGuys = await db(`deliveryteam`).select();
    return {
      success: true,
      body: {
        total: deliveryGuys.length,
        message: `Delivery team fetched successfully`,
        deliveryGuys,
      },
    };
  };
}

module.exports = DeliveryService;
