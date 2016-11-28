var currentFirstLetter = "";

$(function() {

  $('#image-carousel').slick({
    infinite: false,
    slidesToShow: 11,
    slidesToScroll: 1,
    prevArrow: false,
    nextArrow: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 7,
          slidesToScroll: 1    
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1      }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1
        }
      }
    ]
  });
      
  var socket = io();
  socket.on('correctAnswer',function(response){
    console.log(response);
    $('#score').html(response.score);
    prepareNextRound(response);
  });

  socket.on('wrongAnswer',function(response){
    indicateWrongAnswer()
  });

  socket.on('gameOver',function(){
    console.log('gameOver');
    alert('Game over');
  });

  socket.on('wrongFirstLetter', function(letter) {
    indicateWrongAnswer()
    $('#textfield').val(letter);
  });

  function sendAnswerToAPI() {
    socket.emit('answer', $('#textfield').val());
  }

  socket.on('time', function(currTime) {
    var timer = $('#timer');
    console.log(currTime);
    timer.html(currTime);
  });

  function prepareNextRound(response) {
    $('#textfield').val(response.currentFirstLetter);
    var artist = response.artists.items[0]
    addImage(artist.images[0])
  }

  function addImage(image) {
    var numberOfImages = $('.has-content').length;
    console.log(numberOfImages)

    if(numberOfImages >= 11) {
      $('#image-carousel').slickAdd('<div class="image-wrap has-content"><div class="image" style="background-image: url(' + image.url + ');"></div></div>');
      $('#image-carousel:last-child').slickNext()
    }
    else if(numberOfImages >= 5) {
      $('#image-carousel').slickAdd('<div class="image-wrap has-content"><div class="image" style="background-image: url(' + image.url + ');"></div></div>',numberOfImages, true);
      $('#image-carousel').slickRemove(11);
    } else {
      $('#image-carousel').slickAdd('<div class="image-wrap has-content"><div class="image" style="background-image: url(' + image.url + ');"></div></div>',5, true);
      $('#image-carousel').slickRemove(0);
    }

  }

  focusTextField();

  $('#textfield').keydown(function (e) {
    var key = e.which;
    if(key == 13){

      sendAnswerToAPI();
    } else if (key == 8) {
      if ($('#textfield').val().length == 1){
        e.preventDefault()
      }
    }
  });

  $('.facebook').on('click', function(e) {
      e.preventDefault();
      FB.ui(
        {
      app_id: '1798128600435648',
      method: 'share',
      name: 'Name a band | How far can you get?',
      link: window.location.href,
      href: window.location.href,
      image: 'http://bands.staf.li/public/images/fb.jpg',
      description: 'I got to ' + currentStreak
          },
        function(response) {
          //do noting
        }
      );
  });
});

function indicateWrongAnswer() {
  $("#textfield").effect( "shake", {times:1}, 200 );
}

function addImage(image) {
  if(image != undefined){
    var url = image.url
    var image = new Image()
    image.src = url;
    images.push(image);
  }
}

function displayImages () {
  var screenHeight = $(window).height();
  var screenWidth = $(window).width(); 
  var imageCount = images.length;
  var imageSize = Math.sqrt((screenHeight*screenWidth)/imageCount);

  var imagesInRow = Math.ceil(screenWidth / imageSize);
  var numberOfRows = Math.ceil(images.length/imagesInRow);

  if((screenHeight) - (numberOfRows*imageSize) > 0) {
    imageSize = imageSize + ((screenHeight) - (numberOfRows*imageSize))/numberOfRows;
  }

  $('#overlay').css("width",imagesInRow*imageSize);

  _.each(images, function(image) {
    // image.height = imageSize;
    image.width = imageSize;
    $('#overlay').prepend('<div class="image-wrap" style="height:' + imageSize +'px; width: ' + imageSize +'px;"></div>');
    $('#overlay div').first().html(image);
    $('#overlay div img').first().css({
                                        "min-height": imageSize,
                                        "min-width" : imageSize
                                      });
  });
}
function focusTextField() {
  var textfield = $('#textfield');
  textfield.focus();
}
