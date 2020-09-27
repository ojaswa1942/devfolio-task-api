const DeliveryService = require('../../lib/DeliveryService');
const { stripScriptTags } = require('../../utils/helpers');

const updateLocation = async (req, res) => {
  try {
    const { userEmail } = req.context;
    let { location } = req.body;
    [location] = stripScriptTags(location);

    if (!location) return res.status(400).json(`Location is required`);

    const serviceRes = await DeliveryService.updateLocation(
      { email: userEmail, location },
      req.context
    );
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger(
      { type: `error` },
      `Error while handling /delivery/updateLocation controller:`,
      error
    );
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = updateLocation;
