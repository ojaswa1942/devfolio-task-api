// Contains master function asserting roles
// These mappings can also be kept in database in configurations
// But for this task, let's do it this way itself - nothing wrong about it either!

const logger = require(`./logger`);

const actions = {
  CREATE_ROOT: `CREATE_ROOT`,
  REVOKE_ROOT: `REVOKE_ROOT`,
  ADD_DELIVERY_MEMBER: `ADD_DELIVERY_MEMBER`,
  MODIFY_DELIVERY_MEMBER: `MODIFY_DELIVERY_MEMBER`, // Currently not in use
  VIEW_DELIVERY_MEMBERS: `VIEW_DELIVERY_MEMBERS`,
  VIEW_DELIVERY_MEMBER: `VIEW_DELIVERY_MEMBER`, // Currently not in use
  ADD_PRODUCT: `ADD_PRODUCT`,
  VIEW_PRODUCTS: `VIEW_PRODUCTS`,
  VIEW_PRODUCT: `VIEW_PRODUCT`,
  MODIFY_PRODUCT: `MODIFY_PRODUCT`, // Currently not in use
  UPDATE_LOCATION: `UPDATE_LOCATION`,
  CREATE_ORDER: `CREATE_ORDER`,
  MODIFY_ORDER: `MODIFY_ORDER`, // Currently not in use
  MODIFY_ORDER_STATUS: `MODIFY_ORDER_STATUS`,
  MODIFY_CUSTOMER: `MODIFY_CUSTOMER`, // Currently not in use
  VIEW_USERS: `VIEW_USERS`,
};

const roles = {
  ROOT: `ROOT`,
  DELIVERY: `DELIVERY`,
  CUSTOMER: `CUSTOMER`,
};

const priviledgedRoles = [roles.ROOT];

// async because may need to make some db calls later
const accessControl = async (action, { accountType, userEmail }) => {
  const { ROOT, DELIVERY, CUSTOMER } = roles;
  logger({ type: `WARNING` }, `ACCESS_CONTROL: ${accountType} ${userEmail} performing ${action}`);

  if (accountType === ROOT) {
    logger({ type: `BOLD` }, `ACCESS_CONTROL: Access granted`);
    return true;
  }

  // allowedRoles indicate roles allowed for an action
  let allowedRoles = [];
  switch (action) {
    case actions.CREATE_ROOT:
    case actions.ADD_DELIVERY_MEMBER:
    case actions.MODIFY_DELIVERY_MEMBER:
    case actions.VIEW_DELIVERY_MEMBERS:
    case actions.VIEW_DELIVERY_MEMBER:
    case actions.ADD_PRODUCT:
    case actions.MODIFY_PRODUCT:
    case actions.VIEW_USERS:
      allowedRoles = []; // if root, we will never come here: can skip this block
      break;

    case actions.CREATE_ORDER:
    case actions.MODIFY_CUSTOMER:
      allowedRoles = [CUSTOMER];
      break;

    case actions.UPDATE_LOCATION:
    case actions.MODIFY_ORDER_STATUS:
      allowedRoles = [DELIVERY];
      break;

    case actions.VIEW_PRODUCTS:
    case actions.VIEW_PRODUCT:
      allowedRoles = [CUSTOMER, DELIVERY];
      break;

    default:
      logger({ type: `ERROR` }, `ACCESS_CONTROL: Unknown action ${action}`);
  }
  const roleAccess = allowedRoles.includes(accountType);

  const grant = roleAccess;
  logger({ type: `BOLD` }, `ACCESS_CONTROL: Access ${grant ? `granted` : `denied`}.`);
  return grant;
};

module.exports = {
  accessControl,
  priviledgedRoles,
  ...actions,
};
