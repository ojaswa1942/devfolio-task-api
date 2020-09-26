const bcrypt = require('bcrypt');
// const { secrets } = require('../utils/config');
const { accessControl, ADD_DELIVERY_MEMBER } = require('../utils/accessControl');
const UserService = require('./UserService');

class DeliveryService {
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
}

module.exports = DeliveryService;
