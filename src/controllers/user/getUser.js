const UserService = require('../../lib/UserService');

const getUser = async (req, res) => {
  try {
    const { userEmail, accountType } = req.context;
    let serviceRes = {};
    if (accountType !== `DELIVERY`)
      serviceRes = await UserService.getCustomer({ email: userEmail }, req.context);
    else serviceRes = await UserService.getDeliveryMember({ email: userEmail }, req.context);

    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling user/ controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = getUser;
