var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var _ = require("underscore");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var routes = require('./routes/routes');
const connectionString = process.env.DATABASE_URL || 'postgres://sdzylqidfjunid:FLDP-SOZg43cpRY-s3wwRTn137@ec2-46-137-97-169.eu-west-1.compute.amazonaws.com:5432/d5cquq4ebk7477';
const pg = require('pg');

http.listen(process.env.PORT || 3000, function(){
  console.log('listening on *:3000');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

io.on('connection', function(socket){
  console.log('user with id: '+ socket.id + ' connected');

  var score = 0;
  const request = require('request-promise')
  var INITTIME = 4;
  var MAXTIME = 30;
  var time = INITTIME;
  var timeElapsed = 0;
  var rightAnswers = [];
  var score = 0;
  var currentTiming = null;
  var currentFirstLetter = null;
  var gameInProgress = true

  socket.on('answer', function(answer){
    sendAnswerToApi(answer)
    if (!gameInProgress)
      startNewGame();
  });

  socket.on('submitHighscore', function(name){
    submitHighscore(name);
    socket.emit('highscorecSubmitted', name)
  });

  function getLastLetter(oldSearchString) {
    var lastLetter = oldSearchString[oldSearchString.length - 1];
    return lastLetter;
  }

  function sendAnswerToApi(searchString) {
    if (!gameInProgress) {
      return
    }

    if(currentFirstLetter != null) {
      if(currentFirstLetter != searchString.charAt(0)){
        socket.emit("wrongFirstLetter", currentFirstLetter);
        return
      }
    }
    const options = {  
      method: 'GET',
      uri: "https://api.spotify.com/v1/search?q="+ searchString +"&limit=1&type=artist",
      json: true
    }
    request(options)  
      .then(function (response) {
        if(checkAnswer(response, searchString) == true) {
          addRightAnswerToList(searchString);
          currentFirstLetter = getLastLetter(searchString);
          response["currentFirstLetter"] = currentFirstLetter;
          score++
          response["score"] = score
          setNewTime();
          socket.emit("correctAnswer", response);
          storeArtistInDatabase(response.artists.items[0])
        } else {
          socket.emit("wrongAnswer", response);
        }
      })
      .catch(function (err) {
        console.log(err);
      })
  }

  function storeArtistInDatabase(artist){
    const results = [];
    const uri = artist.uri.split(':')[artist.uri.split(':').length-1]
    const data = {uri:uri, name: artist.name};
    pg.connect(connectionString, (err, client, done) => {
      if(err) {
        done();
        console.log(err);
      }
      client.query('WITH upsert AS (UPDATE artists SET count=count+1, name=($2) WHERE uri=($1) RETURNING *) INSERT INTO artists (uri, name, count) SELECT ($1),($2),1 WHERE NOT EXISTS (SELECT * FROM upsert);',
      [data.uri, data.name]);
      
      const query = client.query('SELECT * FROM artists ORDER BY count DESC');
      query.on('row', (row) => {
        results.push(row);
      });

      query.on('end', () => {
        done();
        return results;
      });
    });
  }

  function submitHighscore(name) {
    const results = [];
      // Grab data from http request
      const data = {name: name, score: score};
      // Get a Postgres client from the connection pool
      pg.connect(connectionString, (err, client, done) => {
        // Handle connection errors
        if(err) {
          done();
          console.log(err);
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
          return results;
        });
      });
  }

  function checkAnswer(response, searchString) {
    if (compareWordToResponseList(response.artists.items, searchString)){
      if (compareWordToArrayList(rightAnswers, searchString)) {
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }
  }

  function addRightAnswerToList(answer) {
    rightAnswers.push(answer);
  }

  function compareWordToResponseList(list, word) {
    var returnValue = false;
    _.each(list, function(artist) {
      var name = artist.name.toLowerCase();
      var string = word.toLowerCase();
      var stringArray = name.split(' ');

      if (name == string) {
        returnValue = true
      }
      else if (stringArray[0] = "the") {
        stringArray.shift();
        name = stringArray.join(" ");    
        if (name == string) {
          returnValue = true
        }
      }
    });

    return returnValue
  }

  function compareWordToArrayList(list, word) {
    var returnValue = false;
    _.each(list, function(artist) {
      var name = artist.toLowerCase();
      var string = word.toLowerCase();
      if (name == string) {
        returnValue = true
      }
    });

    return returnValue
  }

  function startNewGame() {
    currentFirstLetter = null;
    time = INITTIME;
    timeElapsed = 0;
    rightAnswers = [];
    score = 0;
    currentFirstLetter = null;
    startTimer();
  }

  function gameOver() {
    gameInProgress = false
    
    clearInterval(currentTiming);
    currentTiming = undefined

    socket.emit('gameOver', score)
  }

  function startTimer () {
    gameInProgress = true
    
    currentTiming = setInterval(function() {
      time = time - 1;
      if(time == 0)
        gameOver();
      socket.emit('time', time);
    }, 1000)
  
  }

  function resetTime() {
    clearInterval(currentTiming);
    time = INITTIME;
  }

  function setNewTime() {
    clearInterval(currentTiming);  
    currentTiming = null
    time = Math.min(MAXTIME, time+5);
    startTimer();
  }

});

