
// --- game

function Game(options)
{
  this.scoreboard = typeof options.scoreboard == 'string' ? $(options.scoreboard) : options.scoreboard;
  this.teamsList  = typeof options.teamsList == 'string' ? $(options.teamsList) : options.teamsList;
  this.timer      = typeof options.timer == 'string' ? $(options.timer) : options.timer;
  this.question   = typeof options.question == 'string' ? $(options.question) : options.question;

  // game play type
  this.type   = options.type || 'game';

  // websockets
  this.socket = options.transport;
  // d3
  this.d3     = options.d3;
  // chat (optional)
  this._chat  = options.chat;

  // container
  this._container = this.d3.select(this.teamsList[0]);
  // drawing function
  this._drawTeam = $.partial(this._drawTeamStub, this);

  // teams storage
  this.teams = [];

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

  // events come from data
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

      _game.setTeams(data.game.teams);
    }

    // [game:error]
    if (data['game:error'])
    {
      if (_game._chat)
      {
        _game._chat.addSystemMessage('Error: '+data['game:error'].err.message+'.', 'error');
      }
    }

    // [game:team_added]
    if (data['game:team_added'])
    {
      _game.addTeam(data['game:team_added']);
    }

    // [game:team_updated]
    if (data['game:team_updated'])
    {
      _game.updateTeam(data['game:team_updated']);
    }

    // [game:team_deleted]
    if (data['game:team_deleted'])
    {
      _game.deleteTeam(data['game:team_deleted']);
    }

    console.log('game', data);
  });

  // extra post init
  if (typeof this._postInit == 'function')
  {
    this._postInit();
  }

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

Game.prototype.addTeam = function Game_addTeam(team)
{
  this.teams.push(team);

  this._renderTeams();
}

Game.prototype.updateTeam = function Game_updateTeam(team)
{
  // merge in updated team data
  this.teams = $.each(this.teams, function(t){ if (t.login == team.login) { $.merge(t, team); } });

  this._renderTeams();
}

Game.prototype.deleteTeam = function Game_deleteTeam(team)
{
  var _game = this;

  // find and kill
  $.find(this.teams, function(t, i){ if (t.login == team.login) { _game.teams.splice(i, 1); } });

  this._renderTeams();
}

Game.prototype.setTeams = function Game_setTeams(teams)
{
  this.teams = teams;
  this._renderTeams();
}

// --- demi-private methods

Game.prototype._renderTeams = function Game__renderTeams()
{
  var item;

  item = this._container.selectAll('.scoreboard_team')
    .data(this.teams, function(d){ return d.login; })
    .sort(this._sortTeams)
    .each(this._drawTeam)
    ;

  item.enter().append('span')
    .sort(this._sortTeams)
    .each(this._drawTeam)
    ;

  item.exit()
    .remove()
    ;
}

Game.prototype._drawTeamStub = function Game__drawTeamStub(_game, d)
{
  // this here is a DOM element
  var el   = _game.d3.select(this)
    , isMe = (_game.user() && d.login == _game.user().login)
    , html = '';
    ;

  html += '<span class="scoreboard_team_name">'+d.name+'</span>';
  html += '<span class="scoreboard_team_points">'+d.points+'</span>';

  el
    .classed('scoreboard_team', true)
    .classed('scoreboard_team_mine', isMe)
    .attr('id', 'scoreboard_team_'+d.login)
    .html(html);
}

Game.prototype._sortTeams = function Game__sortTeams(a, b)
{
  var comp = 0;

  // check points first
  if ((comp = a.points - b.points) == 0)
  {
    // check time_spent
    if ((comp = (a.time_spent - b.time_spent) * -1) == 0)
    {
      // check names
      comp = (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0));
    }
  }
console.log(['sort', a.name, b.name, comp]);
  return comp;
}
