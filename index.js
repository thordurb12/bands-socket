var express = require('express');
var path = require('path');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require("underscore");
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var sass = require('node-sass');
var routes = require('./routes/routes');

http.listen(3000, function(){
  console.log('listening on *:3000');
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
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
  var score = 0;
  const request = require('request-promise')
  var INITTIME = 30;
  var MAXTIME = 30;
  var time = INITTIME;
  var timeElapsed = 0;
  var rightAnswers = [];
  var currentStreak = 0;
  var bestStreak = 0;
  var currentTiming;
  var currentFirstLetter = null;
  var images = [];

  console.log('user with id: '+ socket.id + ' connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('answer', function(answer){
    sendAnswerToApi(answer)
  });

  function getLastLetter(oldSearchString) {
    var lastLetter = oldSearchString[oldSearchString.length - 1];
    return lastLetter;
  }

  function sendAnswerToApi(searchString) {
    if(currentFirstLetter != null) {
      if(currentFirstLetter != searchString.charAt(0)){
        indicateWrongAnswer();
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
        console.log(response)
        if(checkAnswer(response, searchString) == true) {
          addRightAnswerToList(searchString);
          currentFirstLetter = getLastLetter(searchString);
          response["currentFirstLetter"] = currentFirstLetter;
          socket.emit("correctAnswer", response);
        } else {
          indicateWrongAnswer();
        }
      })
      .catch(function (err) {
        console.log(err);
      })
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
    console.log(rightAnswers);
    console.log(answer);

    rightAnswers.push(answer);
    console.log(rightAnswers);
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

  function restart() {
    //TODO: stuff
    currentFirstLetter = null;
  }

  function gameOver() {
    restart()
  }

  function resetTime() {

  }

  function setNewTime() {

  }

  function startTimer () {

  }

  function indicateWrongAnswer() {

  }

});

