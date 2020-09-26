require('dotenv').config();

const { PORT, PGHOST, PGUSER, PGDATABASE, PGPASSWORD, PGPORT, JWT_SECRET } = process.env;

module.exports = {
  port: PORT || 3000,

  pgConfig: {
    user: PGUSER,
    password: PGPASSWORD,
    host: PGHOST,
    database: PGDATABASE,
    port: PGPORT,
  },

  secrets: {
    jwt: JWT_SECRET,
  },
  location: {
    // store location
    // permitted values: complete street address or "lat,long"
    store: '',
  },
  constraints: {
    // from driver's current location to store
    // failing which order cannot be placed
    allowedPickupETA: 15,

    // from store to destination
    // exceeding which order cannot be placed
    allowedDestinationETA: 50,

    // from existing destination to another
    // if satisfied, order can be assigned to same delivery guy
    allowedVicinityETA: 10,

    // for each order, allowedVicinityETA to be
    // decreased by a factor (can be number of orders)
    allowedVicinityETAFactor: 2,

    // maximum allowed concurrent orders per driver
    allowedMaxOrders: 3,

    // from location to store while going to deliver an order
    // if satisfied, the driver can be called back and the
    // order can be assigned to same delivery guy
    allowedStoreVicinityETA: 3,

    // the last updated location
    // determines if a driver is online or now
    allowedUpdateInterval: 5,
  },
};
