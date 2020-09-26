const UserService = require('../../lib/UserService');
const { stripScriptTags } = require('../../utils/helpers');

const register = async (req, res) => {
  try {
    let { email, name, phone, address, password } = req.body;
    [email, name, phone, address] = stripScriptTags(email, name, phone, address);
    if (!email || !name || !phone || !password) {
      return res.status(400).json('Name, email, password and phone are required');
    }
    // Maybe validate input here? Will just skip for now

    const serviceRes = await UserService.registerCustomer(
      { email, name, phone, address, password },
      req.context
    );
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling user/register controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = register;
