var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var player; 

http.listen(3000, function(){
  console.log('listening on *:3000');
});

app.get('/',function(req, res){ 
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  var score = 0;

  console.log('user with id: '+ socket.id + ' connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('answer', function(msg){
    console.log('answer: ' + msg + '\nsocket id: ' + socket.id);
    console.log('points' + index);
  });

  

});

