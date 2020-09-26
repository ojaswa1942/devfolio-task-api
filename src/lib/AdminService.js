const bcrypt = require('bcrypt');
// const { secrets } = require('../utils/config');
// const { accessControl } = require('../utils/accessControl');
const UserService = require('./UserService');

class AdminService {
  static registerDeliveryGuy = async (args, context) => {
    const { name, email, password, phone } = args;
    const { db, logger } = context;
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

    logger(`[REGISTER]`, email, `DELIVERY`);
    return { success: true, body: `Delivery guy ${email} successfully registered` };
  };

  static makeAdmin = async (args, context) => {
    const { email } = args;
    const { db, logger } = context;
    const getUserRes = await UserService.getCustomer({ email }, context);
    if (!getUserRes.success) {
      return { success: false, error: `User doesn't exist` };
    }
    const user = getUserRes.body;
    if (user.type === `ROOT`) return { success: false, error: `User already an admin` };

    try {
      await db.transaction(async (trx) => {
        await trx(`users`).update({ type: `ROOT` }).where({ email });
        return trx(`auth`).update({ type: `ROOT` }).where({ email });
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }

    logger(`[MAKE_ADMIN]`, email);
    return { success: true, body: `User ${email} successfully converted to an Admin` };
  };

  static revokeAdmin = async (args, context) => {
    const { email } = args;
    const { db, logger } = context;
    const getUserRes = await UserService.getCustomer({ email }, context);
    if (!getUserRes.success) {
      return { success: false, error: `User doesn't exist` };
    }
    const user = getUserRes.body;
    if (user.type !== `ROOT`) return { success: false, error: `User not an admin` };

    try {
      await db.transaction(async (trx) => {
        await trx(`users`).update({ type: `CUSTOMER` }).where({ email });
        return trx(`auth`).update({ type: `CUSTOMER` }).where({ email });
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }

    logger(`[REVOKE_ADMIN]`, email);
    return { success: true, body: `User ${email} successfully converted to a Customer` };
  };
}

module.exports = AdminService;
