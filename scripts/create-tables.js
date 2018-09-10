require('dotenv').config();
const client = require('../db-client');

client.query(`
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      name VARCHAR(256) NOT NULL,
      searchterms VARCHAR(256) ARRAY[10]
    );
    CREATE TABLE IF NOT EXISTS states (
      id SERIAL PRIMARY KEY,
      name VARCHAR(256) NOT NULL,
      pol1 VARCHAR(256),
      pol2 VARCHAR(256),
      twitter1 VARCHAR(256),
      twitter2 VARCHAR(256)
    );
`)
  .then(
    () => console.log('create tables complete'),
    err => console.log(err)
  )
  .then(() => {
    client.end();
  });