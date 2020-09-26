const AdminService = require('../../lib/AdminService');
const { stripScriptTags } = require('../../utils/helpers');

const registerDeliveryGuy = async (req, res) => {
  try {
    let { email, name, phone, password } = req.body;
    [email, name, phone] = stripScriptTags(email, name, phone);

    if (!email || !name || !phone || !password) {
      return res.status(400).json('Name, email, password and phone are required');
    }

    const serviceRes = await AdminService.registerDeliveryGuy(
      { email, name, phone, password },
      req.context
    );
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger(
      { type: `error` },
      `Error while handling admin/delivery/add controller:`,
      error
    );
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = registerDeliveryGuy;
