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

// connect to the database
const client = require('./db-client');

// server files in public directory
app.use(express.static('public'));

/* TEMP DATABASE SOLUTION */

// temp solution to updating data...
const fs = require('fs');
// fs file paths are relative to pwd (cwd) aka where you started node
// path to data file:
const dataPath = 'data/tweets.json';

function readData() {
  // convenient method for reading file.
  // DON'T ever use in production
  const raw = fs.readFileSync(dataPath);
  // make into js array with house objects
  const data = JSON.parse(raw);

  return data;
}

/* ROUTES */

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
          console.log('im resolved');
          fs.writeFileSync(dataPath, JSON.stringify(tweets));
          res.send(tweets);
          // return resolve(allTweets);
        }
      });
    });
  }

  fetchTweets(2, params);


// old way to get tweets without using recursion
  // twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
  //   [max_id, old_max_id, data, params] = handleTweets(error, max_id, tweets, data, screen_name);
  //   if(old_max_id !== max_id) {
  //     twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
  //       [max_id, old_max_id, data, params] = handleTweets(error, max_id, tweets, data, screen_name);
  //       if(old_max_id !== max_id){
  //         twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
  //           [max_id, old_max_id, data, params] = handleTweets(error, max_id, tweets, data, screen_name);
  //           if(old_max_id !== max_id){
  //             twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
  //               [max_id, old_max_id, data, params] = handleTweets(error, max_id, tweets, data, screen_name);
  //               if(old_max_id !== max_id){
  //                 twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
  //                   [max_id, old_max_id, data, params] = handleTweets(error, max_id, tweets, data, screen_name);
  //                   fs.writeFileSync(dataPath, JSON.stringify(data));
  //                   res.send(data);
  //                 });
  //               }
  //             });
  //           }
  //         });
  //       }
  //     });
  //   }
  // });
});

// read directly from json, not directly from twitter
app.get('/api/oldtweets', (req, res) => {
  const data = readData();
  // send back the data:
  res.send(data);
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

app.get('/api/states', (req, res) => {
  client.query(`
    SELECT *
    FROM states;
  `)
    .then(result => {
      res.send(result.rows);
    });
});

app.get('/api/issues', (req, res) => {
  client.query(`
    SELECT *
    FROM issues;
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

app.get('/api/issues/:id', (req, res) => {
  console.log('in issue by id');
  client.query(`
    SELECT 
      id,
      name, 
      searchterms
    FROM issues
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
const PORT = 3000;

// start "listening" (run) the app (server)
app.listen(PORT, () => console.log('app running...'));
