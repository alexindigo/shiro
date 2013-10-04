
// --- game

function Game(options)
{
  this.scoreboard = typeof options.scoreboard == 'string' ? $(options.scoreboard) : options.scoreboard;
  this.timer      = typeof options.timer == 'string' ? $(options.timer) : options.timer;
  this.question   = typeof options.question == 'string' ? $(options.question) : options.question;

  // game play type
  this.type   = options.type;

  // websockets
  this.socket = options.transport;
  // d3
  this.d3     = options.d3;

  // init
  this.init();
}

Game.prototype.init = function Game_init()
{
  var _game = this
    ;

  // connect to the server
  this.socket.on('open', function primus_onOpen()
  {
    // say hello
    _game.socket.write({ helo: _game.type });
  });

  // check the user
  this.socket.on('data', function primus_onData(data)
  {
    // [game] welcome message
    if (data.game)
    {
      // if current instance is out of date
      // reset it
      if (_game.instance() != data.game.instance)
      {
        _game.instance(data.game.instance);
        _game.user(undefined);
      }
    }

    // [game:error]
    if (data['game:error'])
    {
//      _game.answer.append('<p>Error: '+data.error.message+'</p>');
    }

    // [game:logged]
    if (data['game:logged'])
    {
      _game._logged(data['game:logged']);
    }

    console.log('game', data);
  });

}

// --- getters/setters

Game.prototype.user = function Game_user(value)
{
  if (arguments.length > 0)
  {
    $.cookie('game:user', value, {months: 1});
  }

  return $.cookie('game:user');
}

Game.prototype.instance = function Game_instance(value)
{
  if (arguments.length > 0)
  {
    $.cookie('game:instance', value, {months: 1});
  }

  return $.cookie('game:instance');
}

// --- demi-private methods

// handle logged event
Game.prototype._logged = function Game__logged(user)
{
  this.user(user);
  this._toggleAuthModal(false);
}

// toggles auth modal on/off
// on by default
Game.prototype._toggleAuthModal = function Game__toggleAuthModal(show)
{
  var _game = this;

return;

  // if (arguments.length < 1)
  // {
  //   show = true;
  // }

  // if (show)
  // {
  //   this.userPanel.removeAttr('hidden');

  //   // add event listeners

  //   // enter in the input field
  //   this.nicknameBox.on('keydown', function(e)
  //   {
  //     var nickname;
  //     if ( e.which == 13 && (nickname = this.value.trim()) )
  //     {
  //       e.preventDefault();
  //       _chat.join(nickname);
  //       return false;
  //     }
  //   });

  //   // click on the join button
  //   this.userJoinButton.on('click', function(e)
  //   {
  //     var nickname;

  //     e.preventDefault();

  //     if (nickname = _chat.nicknameBox.val().trim())
  //     {
  //       _chat.join(nickname);
  //       return false;
  //     }
  //   });
  // }
  // else
  // {
  //   this.userPanel.attr('hidden', true);

  //   // remove event listeners
  //   this.nicknameBox.off();
  //   this.userJoinButton.off();
  // }
}
