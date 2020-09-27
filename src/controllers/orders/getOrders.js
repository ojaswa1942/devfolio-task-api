const OrderService = require('../../lib/OrderService');

const getOrders = async (req, res) => {
  try {
    const { userEmail, accountType } = req.context;
    let serviceRes = {};
    switch (accountType) {
      case `DELIVERY`:
        serviceRes = await OrderService.getDeliveryOrders({ email: userEmail }, req.context);
        break;
      case `ROOT`:
        serviceRes = await OrderService.getAllOrders({ email: userEmail }, req.context);
        break;
      default:
        serviceRes = await OrderService.getCustomerOrders({ email: userEmail }, req.context);
        break;
    }
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling orders/ controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = getOrders;
