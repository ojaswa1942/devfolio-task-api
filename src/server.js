const express = require('express');
// const { Client } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const provideContext = require('./context');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(provideContext);

app.get('/', (req, res) => res.sendStatus(200));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
