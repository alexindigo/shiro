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

  // add team action
  $('.scoreboard_add_team').on('click', function(e)
  {
    _game._toggleAddTeamModal(true);
  });

  // edit team action
  $('.scoreboard').on('click', '.scoreboard_edit_team', function(e)
  {
    var el = $(this)
      , team = el.parents('.scoreboard_team').attr('id').replace(/^scoreboard_team_/, '')
      ;

    if (!team) return;

    _game._toggleEditTeamModal(true, team);
  });

  // delete team action
  $('.scoreboard').on('click', '.scoreboard_delete_team', function(e)
  {
    var el = $(this)
      , team = el.parents('.scoreboard_team').attr('id').replace(/^scoreboard_team_/, '')
      ;

    if (!team) return;

    _game._toggleDeleteTeamModal(true, team);
  });

  // create auth prompt
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

  // create team prompt
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

  // edit team prompt
  this.teamEditModal = new FormPrompt(
  {
    title: 'edit team',
    fields:
    [
      {name: 'login', title: 'login', readonly: true},
      {name: 'name', title: 'team'},
      {name: 'password', title: 'password'},
      {name: 'points', title: 'points'},
      {name: 'time_spent', title: 'time spent'}
    ],
    controls:
    [
      {action: 'submit', title: 'update'},
      {action: 'cancel', title: 'cancel'}
    ]
  });

  // confimation modal (delete team)
  this.confirmModal = new FormPrompt(
  {
    controls:
    [
      {action: 'no', title: 'no'},
      {action: 'yes', title: 'yes'}
    ]
  });

}


// --- toggles team modals on/off

// add team
Game.prototype._toggleAddTeamModal = function Game__toggleAddTeamModal(show)
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

// edit team
Game.prototype._toggleEditTeamModal = function Game__toggleEditTeamModal(show, team)
{
  var _game = this
    , team  = this.getTeam(team)
    ;

  // be on defensive side
  if (!team) return;

  if (arguments.length < 1)
  {
    show = true;
  }

  if (show)
  {
    this.teamEditModal.title('Edit team <i>'+team.name+'</i>');
    this.teamEditModal.data(team);

    this.teamEditModal.activate(function(action, data)
    {
      var diff;

      if (action == 'submit')
      {
        if (diff = _game._diffObject(team, data))
        {
          _game.socket.write({ 'admin:update_team': $.merge({login: team.login}, diff) });
        }
      }
    });
  }
  else
  {
    this.teamEditModal.deactivate();
  }
}

// delete team
Game.prototype._toggleDeleteTeamModal = function Game__toggleDeleteTeamModal(show, team)
{
  var _game = this
    , team  = this.getTeam(team)
    ;

  // be on defensive side
  if (!team) return;

  if (arguments.length < 1)
  {
    show = true;
  }

  if (show)
  {
    this.confirmModal.title('Are you sure you want to <i>delete</i> team <i>'+team.name+'</i>?');

    this.confirmModal.activate(function(action)
    {
      if (action == 'yes')
      {
        _game.socket.write({ 'admin:delete_team': {login: team.login} });
      }
    });
  }
  else
  {
    this.confirmModal.deactivate();
  }

}

// Custom team html element
Game.prototype._drawTeamStub = function Game__drawTeamStub(_game, d)
{
  // this here is a DOM element
  var el   = _game.d3.select(this)
    , isMe = (_game.user() && d.login == _game.user().login)
    , html = '';
    ;

  html += '<span class="scoreboard_team_name">'+d.name+'</span>';
  html += '<span class="scoreboard_team_points">'+d.points+'</span>';
  html += '<span class="scoreboard_team_controls"><span class="scoreboard_edit_team"></span><span class="scoreboard_delete_team"></span></span>';

  el
    .classed('scoreboard_team', true)
    .classed('scoreboard_team_mine', isMe)
    .attr('id', 'scoreboard_team_'+d.login)
    .html(html);
}

// Object diff method
// Shallow and simple version works for the same set of keys (kindof)
Game.prototype._diffObject = function Game__diffObject(a, b)
{
  var key
    , isDifferent = false
    , result = {}
    ;

  for (key in b)
  {
    if (!b.hasOwnProperty(key)) continue;

    if (a[key] != b[key] && (a[key] || b[key]))
    {
      isDifferent = true;
      result[key] = b[key];
    }
  }

  return isDifferent ? result : false;
}
