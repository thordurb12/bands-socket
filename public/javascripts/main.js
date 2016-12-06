var currentFirstLetter = "";
var score = 0;
var images = []

$(function() {

  $('#image-carousel').slick({
    infinite: false,
    slidesToShow: 11,
    slidesToScroll: 1,
    prevArrow: false,
    nextArrow: false,
    accessibility: false,
    focusOnSelect: false,
    verticalSwiping: false,
    swipe: false,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 7,
          slidesToScroll: 1,
          initialSlide: 6
        }
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          initialSlide: 6      
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          initialSlide: 6
        }
      }
    ]
  });
  
  showHighscores()

  var socket = io();
  socket.on('correctAnswer',function(response){
    score = response.score
    prepareNextRound(response);
  });

  socket.on('wrongAnswer',function(response){
    indicateWrongAnswer()
  });

  socket.on('gameOver',function(score){
    console.log('gameOver')
      
    gameOver(score);
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
    addImage(artist.images[0], response.score)
  }

  function addImage(image,score) {
    var numberOfImages = $('.has-content').length;
    addToImageWall(image)
    if(score <= 9) {
      score = "0" + score;
    } else if (score <= 99){
      score = "0" + score;
    }

    $('#image-carousel').slickAdd('<div class="image-wrap has-content"><div class="image" style="background-image: url(' + image.url + ');"><div class="overlay"><span>' + score + '</div></div></div>',5+numberOfImages, true);
    $('#image-carousel:last-child').slickNext()
  }

  function gameOver(score) {
    $('.inactive-game').removeClass('hide');
    $('.active-game').addClass('hide');
    var textfield = $('#textfield')
    textfield.val(score);
    textfield.disabled = true
    textfield.blur();

    $('#input-section section').addClass('')

    var request = $.get('/api/ranking?score='+score , function(res) {
      var ranking = parseInt(res.count) + 1;
      $('#world-ranking').html('YOU RANK NO. <b>'+ ranking + '</b> WORLDWIDE');
    })
    .fail(function() {
      console.log('error')
    });

    displayImages();
  }

  function playAgain() {
    var textfield = $('#textfield')
    $('.inactive-game').addClass('hide');
    $('.active-game').removeClass('hide');
    $('#thanks-wrap').addClass('hide');
    focusTextField();
    $('#timer').html("30");
    $('.has-content').remove();
    $('#all-images').html('');
    $('#all-images-wrap').removeClass('show-all')
    textfield.disabled = false
    textfield.val('')
    images = []
    score = 0
  }

  focusTextField();

  function submitHighscore(name) {
    socket.emit('submitHighscore', name);
  }
  
  socket.on('highscorecSubmitted', function() {
    $('#submit-wrap').addClass('hide');
    $('#thanks-wrap').removeClass('hide');
  })

  $('#submit-button').click(function(e) {
    var name = $('#submit-input').val()
    if(name.length > 0) {
      submitHighscore(name)
    }
  })
  
  $('#load-more-button').click(function(e) {
    var target = $('#all-images-wrap');
    target.addClass('show-all');
    $(e.target).addClass('hide');
  })

  $('#replay-button').click(function(e) {
    playAgain();
  })

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

function addToImageWall(image) {
  if(image != undefined){
    var url = image.url
    var image = new Image()
    image.src = url;
    images.push(image);
  }
}

function showHighscores() {
  var request = $.get('/api/highscores' , function(res) {
    renderHighscore(res)
  })
  .fail(function() {
    console.log('error')
  });
}

function renderHighscore(list) {
    var template = $('#highscore-row').html();
    Mustache.parse(template);
    var index = 1;
    for (var key in list) {
      var entry = list[key]
      var entryIndex = index;
      if(entryIndex <= 9) {
        entryIndex = "0" + entryIndex;
      }
      var rendered = Mustache.render(template, {index: entryIndex, name: entry.name, score: entry.score});
      index++;
      $('#highscores').append(rendered);
    }
}

function displayImages () {
  var target = $('#all-images')
  _.each(images, function(image) {
    var div = document.createElement('div');
    div.style.backgroundImage = "url("+image.src+")";
    target.append('<div class="image-wrap col-xs-6 col-sm-4 col-md-3 col-lg-2"</div>');
    $('.image-wrap').last().html(div);

  });
}

function focusTextField() {
  var textfield = $('#textfield');
  textfield.focus();
}
