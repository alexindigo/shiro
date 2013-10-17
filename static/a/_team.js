/* team level specific js */

// post init will be called after generic init
Game.prototype._postInit = function Game__postInit()
{
  var _game = this;

  // --- local events

  // window has focus event
  visibilityChange(function(hasFocus)
  {
    if (hasFocus)
    {
      $('.answer_form').addClass('answer_form_has_focus');
    }
    else
    {
      $('.answer_form').removeClass('answer_form_has_focus');
    }

    // notify mothership
    _game.socket.write({ 'team:visibility': !!hasFocus });
  });

  // submit answer button
  $('.answer_form_messagebox_send').on('click', function(e)
  {
    var answer = $('.answer_form_messagebox')[0].value;

    e.stop();

    if (answer && answer.length > 0)
    {
      _game.socket.write({ 'team:answer': {text: answer} });
    }
    else
    {
      _game.confirmModal.title('Are you sure you want to submit an empty answer?');

      _game.confirmModal.activate(function(action)
      {
        if (action == 'yes')
        {
          _game.socket.write({ 'team:answer': {text: answer} });
        }
      });
    }
  });

  // add extra events
  this.socket.on('data', function primus_onData(data)
  {
    // [game:auth]
    if (data['game:auth'])
    {
      // compare instances
      if (_game.instance() != data['game:auth'].instance)
      {
        _game.instance(data['game:auth'].instance);
        _game.user(false);
      }

      // check for user
      if (!_game.user() || !_game.user().password)
      {
        _game._toggleAuthModal(true, data['game:auth'].type);
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

    // [game:error]
    if (data['game:error'])
    {
      _game._handleError(data['game:error']);
    }

    // --- team

    // [team:error]
    if (data['team:error'])
    {
      _game._handleError(data['team:error']);
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
      {action: 'submit', title: 'ok'}
    ]
  });

  // confimation modal
  this.confirmModal = new FormPrompt(
  {
    controls:
    [
      {action: 'no', title: 'no'},
      {action: 'yes', title: 'yes'}
    ]
  });
}

Game.prototype._handleError = function Game__handleError(error)
{
  if (typeof error != 'object' && typeof error.err != 'object') return;

  if (this._chat)
  {
    this._chat.addSystemMessage('Error: '+error.err.message+'.', 'error');
  }

  // check error code
  // only handle 401 for now
  switch (error.err.code)
  {
    case 401:
      this.user(false);
      this._login();
      return;
      break;
  }

  // check error origin
  switch (error.origin)
  {
    // handle login errors
    case 'auth':
      this.user(false);
      this._login();
      return;
      break;
  }
}

Game.prototype._login = function Game__login(instance)
{
  // if current instance is out of date
  // reset it
  if (instance && this.instance() != instance)
  {
    this.instance(instance);
    this.user(false);
  }

  // check for user
  if (!this.user())
  {
    this._toggleAuthModal(true, 'team');
  }
  else // try to login
  {
    this.socket.write({ 'game:auth': this.user() });
  }
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

// small modifications to displaying answer
Game.prototype._team_commonDisplay = Game.prototype.display;
// do custom thing and proceed to the original version
Game.prototype.display = function Game_display(data)
{
  if (data && data['answer'])
  {
    $('.answer_form').hide();
  }

  return this._team_commonDisplay(data);
};

// modifications to timer controller
Game.prototype._team_commonUpdateTimer = Game.prototype.updateTimer;
// do custom thing and proceed to the original version
Game.prototype.updateTimer = function Game_updateTimer(timer)
{
  var team;

  if (!this.user() || !this.user().login || !(team = this.getTeam(this.user().login)))
  {
    return this._team_commonUpdateTimer(timer);
  }

  if (timer && !(this.questionInPlay in team.answers))
  {
    // John and Mary Case decided to name their son Justin
    $('.answer_text').hide();
    $('.answer_form').show();
  }
  else
  {
    $('.answer_form').hide();
    $('.answer_form_messagebox')[0].value = '';
  }

  return this._team_commonUpdateTimer(timer);
}


// visibility change subroutine
function visibilityChange(callback)
{
  var hasFocus = false
  , hasFocusInterval
  ;

  hasFocusInterval = setInterval(function()
  {
    if (hasFocus != document.hasFocus())
    {
      hasFocus = document.hasFocus();
      callback(hasFocus, hasFocusInterval);
    }
  }, 500);

  // do initial call right now
  hasFocus = document.hasFocus();
  callback(hasFocus, hasFocusInterval);
}
