require('dotenv').config();
const client = require('../db-client');
// okay to import "json", you will get JavaScript objects :)
const issues = require('./issues.json');

Promise.all(
  issues.map(issue => {
    return client.query(`
        INSERT INTO issues (name, searchterms)
        VALUES ($1, $2);
    `,
    [issue.name, issue.searchterms]
    );
  })
)
  .then(
    () => console.log('seed data load successful'),
    err => console.error(err)
  )
  .then(() => client.end());