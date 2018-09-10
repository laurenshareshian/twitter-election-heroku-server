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

// var Twitter = require('twitter-node-client').Twitter;
// var Twitter = require('twitter');
var Twit = require('twit');

var config = require('./config.js');


//var twitter = new Twitter(config);
var twitter = new Twit(config);

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


app.get('/api/tweets', (req, res) => {

  const data = [];
  var params = { screen_name: 'realdonaldtrump', count: 200 };
  
  var max_id = 0;
  var old_max_id = 0;
  twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
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
      max_id = tweets[tweets.length - 1].id_str;
    }
    old_max_id = max_id;
    var params = { screen_name: 'realdonaldtrump', count: 200, max_id: max_id };
    twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
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
        max_id = tweets[tweets.length - 1].id_str;
        console.log('max', max_id, 'old', old_max_id);
      }

      if(old_max_id !== max_id){
        old_max_id = max_id;
        var params = { screen_name: 'realdonaldtrump', count: 200, max_id: max_id };
        twitter.get('statuses/user_timeline', params, function(error, tweets, response) {
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
            max_id = tweets[tweets.length - 1].id_str;
            console.log('max', max_id, 'old', old_max_id);
            fs.writeFileSync(dataPath, JSON.stringify(data));
            res.send(data);
          }
        });
      }
    });

    
    console.log('last id', max_id, 'length', data.length);
  });
});

app.post('/api/tweets', (req, res) => {

  const data = readData();
  data.push(req.body);
  // save file
  fs.writeFileSync(dataPath, JSON.stringify(data));

  res.send(req.body);
});


// read directly from json, not directly from twitter
app.get('/api/oldtweets', (req, res) => {
  const data = readData();
  // send back the data:
  res.send(data);
});


/* RUN THE SERVER */

// set the PORT on which to listen
const PORT = 3000;

// start "listening" (run) the app (server)
app.listen(PORT, () => console.log('app running...'));
