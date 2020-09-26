const AdminService = require('../../lib/AdminService');
const { stripScriptTags } = require('../../utils/helpers');

const revokeAdmin = async (req, res) => {
  try {
    let { email } = req.body;
    [email] = stripScriptTags(email);

    if (!email) {
      return res.status(400).json('Email is required');
    }

    const serviceRes = await AdminService.revokeAdmin({ email }, req.context);
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger(
      { type: `error` },
      `Error while handling admin/revokeAdmin controller:`,
      error
    );
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = revokeAdmin;
