var express = require('express');
var router = express.Router();
const request = require('request-promise')
const bodyParser= require('body-parser')
const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/thordur';
const pg = require('pg');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/api/highscores', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM highscores ORDER BY score DESC;');

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

router.get('/api/artists', (req, res, next) => {
  const results = [];

  pg.connect(connectionString, (err, client, done) => {

    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }

    const query = client.query('SELECT * FROM artists ORDER BY count DESC;');

    query.on('row', (row) => {
      results.push(row);
    });

    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});


router.get('/api/ranking', (req, res, next) => {
    const results = [];
    const data = {score: req.query.score};
    pg.connect(connectionString, (err, client, done) => {
      if(err) { 
        done();
        console.log(err);
      }

      const query = client.query('select COUNT(*) from highscores where score > ($1) LIMIT 20;',
      [data.score]);

      query.on('row', (row) => {
        return res.json(row)
      });
    });
});

module.exports = router;