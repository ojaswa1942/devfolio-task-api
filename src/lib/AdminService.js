// const { secrets } = require('../utils/config');
const { accessControl, CREATE_ROOT, REVOKE_ROOT } = require('../utils/accessControl');
const UserService = require('./UserService');

class AdminService {
  static makeAdmin = async (args, context) => {
    const { email } = args;
    const { db, logger, accountType, userEmail } = context;

    if (!(await accessControl(CREATE_ROOT, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const getUserRes = await UserService.getCustomer({ email }, context);
    if (!getUserRes.success) {
      return { success: false, error: `User doesn't exist` };
    }
    const { user } = getUserRes.body;
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
    return {
      success: true,
      body: {
        message: `User ${email} successfully converted to an Admin`,
      },
    };
  };

  static revokeAdmin = async (args, context) => {
    const { email } = args;
    const { db, logger, accountType, userEmail } = context;

    if (!(await accessControl(REVOKE_ROOT, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const getUserRes = await UserService.getCustomer({ email }, context);
    if (!getUserRes.success) {
      return { success: false, error: `User doesn't exist` };
    }
    const { user } = getUserRes.body;
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
    return {
      success: true,
      body: {
        message: `User ${email} successfully converted to a Customer`,
      },
    };
  };
}

module.exports = AdminService;
