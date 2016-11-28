var express = require('express');
var router = express.Router();
const request = require('request-promise')
const bodyParser= require('body-parser')
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/bands';
const pg = require('pg');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/api/v1/highscores', (req, res, next) => {
  const results = [];
  // Grab data from http request
  const data = {name: req.body.name, score: req.body.score};
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert data
    client.query('INSERT INTO highscores(name, score) values($1, $2)',
    [data.name, data.score]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM items ORDER BY id ASC');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

router.get('/api/v1/highscores', (req, res, next) => {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM highscores ORDER BY id DESC;');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});


router.post('/api/v1/artist', (req, res, next) => {
  const results = [];
  // Grab data from http request
  const data = {uri:req.body.uri, name: req.body.name};
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    client.query('WITH upsert AS (UPDATE artists SET count=count+1, name=($2) WHERE uri=($1) RETURNING *) INSERT INTO artists (uri, name, count) SELECT ($1),($2),1 WHERE NOT EXISTS (SELECT * FROM upsert);',
    [data.uri, data.name]);
    
    const query = client.query('SELECT * FROM artists ORDER BY count DESC');
    query.on('row', (row) => {
      results.push(row);
    });
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});


module.exports = router;