require('dotenv').config();

// require the express module (installed via `npm i express`)
const express = require('express');

// make an express app. no "new" keyword ¯\_(ツ)_/¯
const app = express();

/* SERVER SETUP */

// import morgan for logging
const morgan = require('morgan');
app.use(morgan('dev'));

// import cors "middleware" to enable our server to do CORS
const cors = require('cors');
// register it
app.use(cors());

// register express "middleware" for converting incoming
// request body to deserialized request.body property
app.use(express.json());

// server files in public directory
app.use(express.static('public'));

// connect to the database
const client = require('./db-client');


/* ROUTES */

// setup a "route":
// 1) HTTP METHOD, i.e. app.get === for GET requests
// 2) PATH, i.e. '/api/houses` === the requested path

app.post('/api/auth/signup', (req, res) => {
  const body = req.body;
  const email = body.email;
  const password = body.password;

  if(!email || !password) {
    res.status(400).send({
      error: 'email and password are required'
    });
    return;
  }

  client.query(`
    select count(*)
    from users
    where email = $1
  `,
  [email])
    .then(results => {
      if(results.rows[0].count > 0) {
        res.status(400).send({ error: 'email already in use' });
        return;
      }

      client.query(`
        insert into users (email, password)
        values ($1, $2)
        returning id, email
      `,
      [email, password])
        .then(results => {
          res.send(results.rows[0]);
        });
    });

});

app.post('/api/auth/signin', (req, res) => {
  const body = req.body;
  const email = body.email;
  const password = body.password;

  if(!email || !password) {
    res.status(400).send({
      error: 'email and password are required'
    });
    return;
  }

  client.query(`
    select id, email, password
    from users
    where email = $1
  `,
  [email]
  )
    .then(results => {
      const row = results.rows[0];
      if(!row || row.password !== password) {
        res.status(401).send({ error: 'invalid email or password' });
        return;
      }
      res.send({ 
        id: row.id,
        email: row.email
      });
    });
});

app.use((req, res, next) => {
  // is there a Authorization header?
  const id = req.get('Authorization');
  if(!id) {
    // no - send an error
    res.status(403).send({
      error: 'No token found'
    });
    return;
  }

  // 1. set req.userId to the header
  req.userId = id;
  // 2. call next()
  next();
});

// setup a "route":
// 1) HTTP METHOD, i.e. app.get === for GET requests
// 2) PATH, i.e. '/api/houses` === the requested path

var Twit = require('twit');

var config = require('./config.js');

//var twitter = new Twitter(config);
var twitter = new Twit(config);

// get all tweets from screenname
app.post('/api/tweets', (req, res) => {
  const body = req.body;
  let screen_name = body.screenName;
  console.log(body);
  var params = { screen_name: screen_name, count: 200 };
  var data = [];
  var max_id = 0;
  var old_max_id = 0;

  function fetchTweets(callsToMake = 3, params = {}, allTweets = []) { 
    return new Promise(() => {
      twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
        [max_id, old_max_id, data, params] = handleTweets(error, max_id, tweets, data, screen_name);
        allTweets = allTweets.concat(tweets);
        if(callsToMake > 1 && old_max_id !== max_id) {
          return fetchTweets(--callsToMake, params, allTweets);
        } else {
          console.log('im resolved', response);
          res.send(tweets);
          // return resolve(allTweets); //why isnt this working?
        }
      });
    });
  }

  fetchTweets(2, params);

});

function handleTweets(error, max_id, tweets, data, screen_name) {
  if(!error) {
    for(let i = 0; i < tweets.length; i++){
      let tweet = {
        created_at: tweets[i].created_at,
        id: tweets[i].id,
        text: tweets[i].text,
        retweet_count: tweets[i].retweet_count,
        location: tweets[i].location
      };
      data.push(tweet);
    }
    let old_max_id = max_id;
    max_id = tweets[tweets.length - 1].id_str;
    var params = { screen_name: screen_name, count: 200, max_id: max_id };
    console.log(data.length, max_id, old_max_id);
    return [max_id, old_max_id, data, params];
  }
}


app.get('/api/userissues', (req, res) => {
  client.query(`
    SELECT
      id,
      user_id as "userId", 
      name,
      searchterms as "searchTerms"
    FROM userissues
    WHERE user_id = $1
    OR user_id = 0;
  `,
  [req.userId]
  )
    .then(result => {
      res.send(result.rows);
    });
});

app.get('/api/userissues/:id', (req, res) => {
  client.query(`
    SELECT 
      id,
      user_id as "userId", 
      name,
      searchterms as "searchTerms"
    FROM userissues
    WHERE id = $1;
  `,
  [req.params.id]
  )
    .then(result => {
      res.send(result.rows[0]);
    })
    .catch(err => console.log(err));
  
});

app.post('/api/userissues', (req, res) => {
  console.log('posting');
  const body = req.body;
  console.log(body);
  client.query(`
    INSERT INTO userissues (user_id, name, searchterms)
    VALUES ($1, $2, $3)
    returning *, user_id as "userId";
  `,
  [req.userId, body.name, body.searchTerms]
  )
    .then(result => {
      // we always get rows back, in this case we just want first one.
      res.send(result.rows[0]);
    })
    .catch(err => console.log(err));
});

app.put('/api/userissues', (req, res) => {
  console.log('putting');
  const body = req.body;
  console.log(body);
  client.query(`
    UPDATE userissues 
    SET name = $2,
        searchterms = $3,
        user_id = $4
    WHERE id = $1
    AND user_id = $4
    RETURNING *, user_id as "userId";
  `,
  [body.id, body.name, body.searchTerms, req.userId]
  )
    .then(result => {
      // we always get rows back, in this case we just want first one.
      res.send(result.rows[0]);
    })
    .catch(err => console.log(err));
});

app.delete('/api/userissues/:id', (req, res) => {
  console.log('deleting');
  client.query(`
    DELETE FROM userissues
    WHERE id = $1
    AND user_id = $2
    RETURNING *;
  `,
  [req.params.id, req.userId]
  )
    .then(result => {
      res.send(result.rows[0]);
    })
    .catch(err => console.log('here is your error', err));
  
});


app.get('/api/states', (req, res) => {
  client.query(`
    SELECT *
    FROM states;
  `)
    .then(result => {
      res.send(result.rows);
    });
});

app.get('/api/states/:id', (req, res) => {
  client.query(`
    SELECT 
      id,
      name, 
      pol1, 
      pol2, 
      twitter1, 
      twitter2
    FROM states
    WHERE id = $1;
  `,
  [req.params.id]
  )
    .then(result => {
      res.send(result.rows[0]);
    })
    .catch(err => console.log(err));
  
});



/* RUN THE SERVER */

// set the PORT on which to listen
const PORT = process.env.PORT;

// start "listening" (run) the app (server)
app.listen(PORT, () => console.log('app running on 3000...'));
