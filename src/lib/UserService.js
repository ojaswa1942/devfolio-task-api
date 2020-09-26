const bcrypt = require('bcrypt');
const { accessControl, VIEW_USERS } = require('../utils/accessControl');

class UserService {
  static getCustomer = async (args, { db }) => {
    const { email } = args;
    const user = await db.select().from(`users`).where({ email });
    if (!user.length) return { success: false, error: 'No such user' };

    return {
      success: true,
      body: {
        user: user[0],
      },
    };
  };

  static getDeliveryMember = async (args, { db }) => {
    const { email } = args;
    const user = await db.select().from(`deliveryteam`).where({ email });
    if (!user.length) return { success: false, error: 'No such user' };

    return {
      success: true,
      body: {
        user: user[0],
      },
    };
  };

  static registerCustomer = async (args, context) => {
    const { name, email, password, phone, address = '' } = args;
    const { db, logger } = context;
    const getUserRes = await UserService.getCustomer({ email }, context);
    if (getUserRes.success) {
      return { success: false, error: `User already exists` };
    }

    const hash = await bcrypt.hash(password, 10);
    try {
      await db.transaction(async (trx) => {
        await trx('users').insert({
          name,
          email,
          phone,
          address,
          type: `CUSTOMER`,
        });
        return trx
          .insert({
            email,
            password: hash,
            type: `CUSTOMER`,
          })
          .into('auth');
      });
    } catch (error) {
      logger({ type: `error` }, `[TRX_Failed]`, error);
      return { success: false, error };
    }

    logger(`[REGISTER]`, email, `CUSTOMER`);
    return {
      success: true,
      body: {
        message: `User ${email} successfully registered`,
      },
    };
  };

  static getAllUsers = async (_, context) => {
    const { db, accountType, userEmail } = context;
    if (!(await accessControl(VIEW_USERS, { accountType, userEmail })))
      return { success: false, error: `Not authorized` };

    const users = await db(`users`).select();
    return {
      success: true,
      body: {
        total: users.length,
        message: `Users fetched successfully`,
        users,
      },
    };
  };
}

module.exports = UserService;
