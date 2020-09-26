const DeliveryService = require('../../lib/DeliveryService');

const getDeliveryGuys = async (req, res) => {
  try {
    const serviceRes = await DeliveryService.getDeliveryGuys({}, req.context);
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling /delivery/ controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = getDeliveryGuys;
