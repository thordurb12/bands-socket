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
    console.log(response)
    score = response.artistInfo.score
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
    timer.html(currTime);
  });

  function prepareNextRound(response) {
    currentFirstLetter = response.artistInfo.currentFirstLetter;
    $('#textfield').val(currentFirstLetter);
    var artist = response.artistInfo.artists.items[0];
    addImage(artist.images[0], response.artistInfo.score, artist.external_urls.spotify, response.tracks.tracks[0].preview_url);
  }

  function addImage(image,score, artistUrl, trackUrl) {
    var numberOfImages = $('.has-content').length;
    addToImageWall(image, trackUrl)

    if(score <= 9) {
      score = "0" + score;
    } else if (score <= 99){
      score = "0" + score;
    }
    if(image != null) {
      $('#image-carousel').slickAdd('<div class="image-wrap has-content"><div class="image" style="background-image: url(' + image.url + ');"><a href="' + artistUrl +'" target="_blank" class="overlay"><span>' + score + '</a></div></div>',5+numberOfImages, true);
    } else {
      $('#image-carousel').slickAdd('<div class="image-wrap has-content"><div class="image"><a href="' + artistUrl +'" target="_blank" class="overlay"><span>' + score + '</a></div></div>',5+numberOfImages, true);
    }
    $('#image-carousel:last-child').slickNext()
  }

  function gameOver(score) {
    $('.inactive-game').removeClass('hide');
    $('.active-game').addClass('hide');
    var textfield = $('#textfield')
    textfield.val(score);
    textfield.disabled = true
    textfield.blur();

    $('.twitter a').attr('href','https://twitter.com/intent/tweet?text=I%20could%20name%20'+ score +'%20bands%20on%20http://bands.staf.li/')

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

  function removeInitialScreen() {
    $('#init-wrap').fadeOut( "slow", function() {
        focusTextField();
      });
  }

  function playAgain() {
    var textfield = $('#textfield')
    $('.has-content').remove();
    $('.inactive-game').addClass('hide');
    $('.active-game').removeClass('hide');
    $('#thanks-wrap').addClass('hide');
    focusTextField();
    $('#timer').html("30");
    $('#all-images').html('');
    $('#all-images-wrap').removeClass('show-all')
    $('#image-carousel').slickGoTo(0)

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
    showAllImages()
  })

  $('#play-button').click(function(e) {
    removeInitialScreen();
  })

  $('#replay-button').click(function(e) {
    playAgain();
  })

  $('#textfield').keydown(function (e) {
    var key = e.which;
    if(key == 13){
      sendAnswerToAPI();
    } else if ((key == 8 || key == 46) && currentFirstLetter !== "") {
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
      description: 'I got ' + score
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

function addToImageWall(image, trackUrl) {
  if(image != undefined){
    var url = image.url
    var image = new Image()
    image.src = url;
    var imageObj = {"image": image, "trackUrl": trackUrl};
    images.push(imageObj);
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
      $('.highscores').append(rendered);
    }
}

function checkOverflow(el) {
 var curOverflow = el.style.overflow;

 if ( !curOverflow || curOverflow === "visible" )
    el.style.overflow = "hidden";

 var isOverflowing = el.clientWidth < el.scrollWidth
    || el.clientHeight < el.scrollHeight;

 el.style.overflow = curOverflow;

 return isOverflowing;
}

function playTrack(url){
  console.log(url);
};

$('.image-wrap').click(function(e) {
  var url = $(e.target).data('id');
  playTrack(url)
});


function displayImages () {
  var target = $('#all-images')
  _.each(images, function(imageObj) {
    var div = document.createElement('div');
    div.style.backgroundImage = "url("+imageObj.image.src+")"
    target.append('<div data-track="' + imageObj.trackUrl +'" class="image-wrap col-xs-6 col-sm-4 col-md-3 col-lg-3"></div>');
    $('.image-wrap').last().html(div);
  });

  var numPlaceHolders = Math.max(8 - images.length, 0);

  for(var i = 0; i < numPlaceHolders; i++) {
      target.append('<div class="image-wrap col-xs-6 col-sm-4 col-md-3 col-lg-3"><div class="placeholder"></div></div>');
  }

  var isOverflowing = checkOverflow(document.getElementById('all-images-wrap'))

  if(!isOverflowing || images.length < 4) {
    $('#load-more-button').addClass('hide');
    $('#all-images-wrap').addClass('show-all');
  }
}


function showAllImages() {
  var target = $('#all-images-wrap');
  target.addClass('show-all');
  $('#load-more-button').addClass('hide');
}

function focusTextField() {
  var textfield = $('#textfield');
  textfield.focus();
}
