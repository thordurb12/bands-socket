var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
 var _ = require("underscore");

var player; 

http.listen(3000, function(){
  console.log('listening on *:3000');
});

app.get('/',function(req, res){ 
  res.sendFile(__dirname + '/index.html');
});

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

  function prepareNewRound(oldSearchString) {
    currentStreak += 1;
    setNewTime();
    startTimer();
    var lastLetter = oldSearchString[oldSearchString.length - 1];
    currentFirstLetter = lastLetter;
  }

  function sendAnswerToApi(searchString) {
    console.log('searchString.charAt(0): ' + searchString.charAt(0))
    console.log('currentFirstLetter: ' + currentFirstLetter)
    if(currentFirstLetter != null) {
      if(currentFirstLetter != searchString.charAt(0)){
        indicateWrongAnswer();
        return
      }
    }
    const options = {  
      method: 'GET',
      uri: "https://api.spotify.com/v1/search?q="+ searchString +"&type=artist",
      json: true
    }
    request(options)  
      .then(function (response) {
        console.log(response)
        if(checkAnswer(response, searchString) == true) {
          addRightAnswerToList(searchString);
          prepareNewRound(searchString);
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

