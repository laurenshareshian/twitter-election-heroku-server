require('dotenv').config();
const client = require('../db-client');

client.query(`
    DROP TABLE IF EXISTS states;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS userissues;
`)
  .then(
    () => console.log('drop tables complete'),
    err => console.log(err)
  )
  .then(() => {
    client.end();
  });