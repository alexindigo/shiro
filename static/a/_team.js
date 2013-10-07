/* team level specific js */

// post init will be called after generic init
Game.prototype._postInit = function Game__postInit()
{
  var _game = this;

  // add extra events
  this.socket.on('data', function primus_onData(data)
  {
    // [game:auth]
    if (data['game:auth'])
    {
      // check for user
      if (!_game.user() || !_game.user().password)
      {
        _game._toggleAuthModal(true, data['game:auth']);
      }
      else // try to login
      {
        _game.socket.write({ 'game:auth': _game.user() });
      }
    }

    // [game:logged]
    if (data['game:logged'])
    {
      _game._logged(data['game:logged']);
    }

    // [admin:error]
    if (data['admin:error'])
    {
      if (_game._chat)
      {
        _game._chat.addSystemMessage('Error: '+data['admin:error'].err.message+'.', 'error');
      }
    }

  });

  // --- create auth prompt

  this.authModal = new FormPrompt(
  {
    sticky: true,
    title: 'enter username and password to login',
    fields:
    [
      {name: 'login', title: 'username'},
      {type: 'password', name: 'password', title: 'password'}
    ],
    controls:
    [
      {action: 'submit', title: 'ok'},
      {action: 'cancel', title: 'cancel'}
    ]
  });
}

// handle logged event
Game.prototype._logged = function Game__logged(user)
{
  this.user(user);
  this._toggleAuthModal(false, user.login == 'admin' ? 'admin' : 'team');
}

// toggles auth modal on/off
Game.prototype._toggleAuthModal = function Game__toggleAuthModal(show, type)
{
  var _game = this;

  if (arguments.length < 1)
  {
    show = true;
  }

  if (show)
  {
    this.authModal.activate(function(action, data)
    {
      if (action == 'submit')
      {
        // validate
        // TODO: actuall make it work
        if (!data.password || (!data.login && type != 'admin'))
        {
          return 'All fields are required to fill in.';
        }

        _game.socket.write({ 'game:auth': {login: (type == 'admin' ? 'admin' : data.login), password: data.password} });
      }
    });
  }
  else
  {
    this.authModal.deactivate();
  }
}
