const UserService = require('../../lib/UserService');

const getAllUsers = async (req, res) => {
  try {
    const serviceRes = await UserService.getAllUsers(null, req.context);
    if (serviceRes.success) {
      return res.status(200).json(serviceRes.body);
    }
    return res.status(400).json(`${serviceRes.error}`);
  } catch (error) {
    req.context.logger({ type: `error` }, `Error while handling user/all controller:`, error);
    return res.status(500).json('Something went wrong!');
  }
};

module.exports = getAllUsers;
