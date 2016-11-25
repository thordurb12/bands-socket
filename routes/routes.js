var express = require('express');
var router = express.Router();
const request = require('request-promise')
const bodyParser= require('body-parser')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/spotify', function(req, res, next) {
  var searchString = req.query.searchString;

  const options = {  
    method: 'GET',
    uri: "https://api.spotify.com/v1/search?q="+ searchString +"&type=artist",
    json: true
  }

  request(options)  
    .then(function (response) {
      res.json(response);
    })
    .catch(function (err) {
      console.log(err);
    })
});

module.exports = router;