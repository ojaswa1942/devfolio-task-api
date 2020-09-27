const OrderService = require('../../lib/OrderService');

const getOrders = async (req, res) => {
  try {
    let orderId = parseInt(req.params.id, 10);
    let serviceRes = await OrderService.getOrder({ id: orderId }, req.context);
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling order/:id controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = getOrders;
