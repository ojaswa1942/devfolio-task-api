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
};
