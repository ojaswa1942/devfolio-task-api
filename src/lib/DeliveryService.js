const bcrypt = require('bcrypt');
const {
  location: { store: storeLocation },
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

        return trx('deliveryteam').update(updatePayload).where({ email });
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
