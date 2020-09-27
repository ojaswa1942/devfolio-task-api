const xss = require('xss');
const { Client } = require('@googlemaps/google-maps-services-js');
const { secrets } = require('./config');
const logger = require('./logger');

const stripScriptTags = (...args) => {
  const xssOptions = {
    whiteList: [],
    stripIgnoreTag: [],
    stripIgnoreTagBody: ['script'],
  };

  const answerArray = args.map((val) => (val ? xss(val, xssOptions) : val));
  return answerArray;
};

const calculateETA = async (source, destination, time = Date.now() / 1000) => {
  const client = new Client({});
  const res = await client.distancematrix({
    params: {
      origins: [source],
      destinations: [destination],
      units: `metric`,
      departureTime: time,
      key: secrets.maps,
    },
  });

  if (res.data.status !== `OK` || !res.data.rows.length || !res.data.rows[0].elements.length) {
    logger({ type: `error` }, `Cannot deterimine ETA`, res.data);
    throw new Error('Unable to deterimine ETA');
  }

  const ele = res.data.rows[0].elements[0];
  const eta = ele.duration_in_traffic ? ele.duration_in_traffic.value : ele.duration.value;
  return eta;
};

const orderStatusPrecedence = (status) => {
  switch (status.toUpperCase()) {
    case `PROCESSING`:
      return 1;
    case `PICKED`:
      return 2;
    case `DELIVERED`:
      return 3;
    default:
      return -100;
  }
};

module.exports = {
  stripScriptTags,
  calculateETA,
  orderStatusPrecedence,
};
