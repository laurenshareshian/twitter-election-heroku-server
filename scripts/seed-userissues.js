require('dotenv').config();
const client = require('../db-client');
// okay to import "json", you will get JavaScript objects :)
const issues = require('./userissues.json');

Promise.all(
  issues.map(userissue => {
    return client.query(`
        INSERT INTO userissues (user_id, name, searchterms)
        VALUES ($1, $2, $3);
    `,
    [userissue.user_id, userissue.name, userissue.searchterms]
    );
  })
)
  .then(
    () => console.log('seed data load successful'),
    err => console.error(err)
  )
  .then(() => client.end());