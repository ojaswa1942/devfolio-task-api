const OrderService = require('../../lib/OrderService');
const { stripScriptTags } = require('../../utils/helpers');

let allowedOrderStatus = [`PICKED`, `DELIVERED`];

const getOrders = async (req, res) => {
  try {
    let orderId = parseInt(req.params.id, 10);
    let { status } = req.body;
    [status] = stripScriptTags(status);
    status = status.toUpperCase();

    if (!allowedOrderStatus.includes(status)) return res.status(400).json(`Invalid status`);

    let serviceRes = await OrderService.updateOrderStatus({ id: orderId, status }, req.context);
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger(
      { type: `error` },
      `Error while handling order/:id/update controller:`,
      error
    );
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = getOrders;
