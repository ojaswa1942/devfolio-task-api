/* eslint-disable camelcase */
const OrderService = require('../../lib/OrderService');
const { stripScriptTags } = require('../../utils/helpers');

const newOrder = async (req, res) => {
  try {
    // items = [{id, quantity}]
    let { items, address } = req.body;
    [address] = stripScriptTags(address);

    if (!address || !items || !items.length) {
      return res.status(400).json('Name and items are required');
    }
    if (!items.every((x) => x.quantity > 0)) {
      return res.status(400).json('Invalid item quantities');
    }

    const serviceRes = await OrderService.newOrder({ items, address }, req.context);
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling /orders/new controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = newOrder;
