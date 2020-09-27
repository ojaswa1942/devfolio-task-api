require('dotenv').config();

const {
  PORT,
  PGHOST,
  PGUSER,
  PGDATABASE,
  PGPASSWORD,
  PGPORT,
  JWT_SECRET,
  MAPS_API_KEY,
} = process.env;

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
    maps: MAPS_API_KEY,
  },
  location: {
    // store location
    // permitted values: complete street address or "lat,long"
    store: `34, Chhatri Chowk, Ujjain, Madhya Pradesh, India`,
  },
  constraints: {
    // from driver's current location to store
    // failing which order cannot be placed
    allowedPickupETA: 15 * 60,

    // from store to destination
    // exceeding which order cannot be placed
    allowedDestinationETA: 50 * 60,

    // from existing destination to another
    // if satisfied, order can be assigned to same delivery guy
    allowedVicinityETA: 10 * 60,

    // for each order, allowedVicinityETA to be
    // decreased by a factor (can be number of orders)
    allowedVicinityETAFactor: 2 * 60,

    // maximum allowed concurrent orders per driver
    allowedMaxOrders: 3 * 60,

    // from location to store while going to deliver an order
    // if satisfied, the driver can be called back and the
    // order can be assigned to same delivery guy
    allowedStoreVicinityETA: 3 * 60,

    // the last updated location
    // determines if a driver is online or now
    allowedUpdateInterval: 5 * 60,

    // Mark a driver offline if location not updated in
    // this much interval. Cron to be run in 1/2 times of this interval
    // to keep edge cases close
    allowedOfflineInterval: 20 * 60,
  },
};
