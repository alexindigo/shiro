/* admin level specific js */

// post init will be called after generic init
// Note: overrides team level
Game.prototype._postInit = function Game__postInit()
{
  var _game = this;

  // --- add extra events

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
  });

  // --- add local event handlers

  // admin stuff
  $('.scoreboard_add_team').on('click', function(e)
  {
    _game._toggleTeamModal(true);
  });

  // --- create auth prompt

  this.authModal = new FormPrompt(
  {
    sticky: true,
    title: 'enter admin password to login',
    fields:
    [
      {type: 'password', name: 'password', title: 'password'}
    ],
    controls:
    [
      {action: 'submit', title: 'ok'},
      {action: 'cancel', title: 'cancel'}
    ]
  });

  // --- create team prompts

  this.teamModal = new FormPrompt(
  {
    title: 'add new team',
    fields:
    [
      {type: 'text', name: 'name', title: 'team'},
      {type: 'text', name: 'password', title: 'password'}
    ],
    controls:
    [
      {action: 'submit', title: 'add'},
      {action: 'cancel', title: 'cancel'}
    ]
  });
}


// toggles team modal on/off
Game.prototype._toggleTeamModal = function Game__toggleTeamModal(show)
{
  var _game = this;

  if (arguments.length < 1)
  {
    show = true;
  }

  if (show)
  {
    this.teamModal.activate(function(action, data)
    {
      if (action == 'submit')
      {
        _game.socket.write({ 'admin:add_team': {name: data.name, password: data.password} });
      }
    });
  }
  else
  {
    this.teamModal.deactivate();
  }
}
