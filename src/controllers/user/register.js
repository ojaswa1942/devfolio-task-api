const { stripScriptTags } = require('../../utils/helpers');

const register = async (req, res) => {
  let { email, name, phone, address } = req.body;
  [email, name, phone, address] = stripScriptTags(email, name, phone, address);
  if (!email || !name || !phone) {
    return res.status(400).json('Name, email and phone are required');
  }

  return res.status(200).json('Okay');
};

module.exports = register;
