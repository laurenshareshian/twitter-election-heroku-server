require('dotenv').config();
const client = require('../db-client');
// okay to import "json", you will get JavaScript objects :)
const states = require('./states.json');

Promise.all(
  states.map(state => {
    return client.query(`
        INSERT INTO states (name, pol1, pol2, twitter1, twitter2)
        VALUES ($1, $2, $3, $4, $5);
    `,
    [state.name, state.pol1, state.pol2, state.twitter1, state.twitter2]
    );
  })
)
  .then(
    () => console.log('seed data load successful'),
    err => console.error(err)
  )
  .then(() => client.end());