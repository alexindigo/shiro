
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

  // --- get environment

  // get user id
  this.user = $.cookie('game:user');

  // connect to the server
  this.socket.on('open', function primus_onOpen()
  {
    // say hello
    _game.socket.write({ helo: _game.instance });
  });

  // check the user
  this.socket.on('data', function primus_onData(data)
  {
    // welcome message
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

    if (data.error)
    {
//      _game.answer.append('<p>Error: '+data.error.message+'</p>');
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
