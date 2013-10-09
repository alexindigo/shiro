
// --- game

function Game(options)
{
  this.gameplay   = typeof options.gameplay == 'string' ? $(options.gameplay) : options.gameplay;
  this.scoreboard = typeof options.scoreboard == 'string' ? $(options.scoreboard) : options.scoreboard;
  this.teamsList  = typeof options.teamsList == 'string' ? $(options.teamsList) : options.teamsList;
  this.timer      = typeof options.timer == 'string' ? $(options.timer) : options.timer;
  this.question   = typeof options.question == 'string' ? $(options.question) : options.question;

  // game play type
  this.type   = options.type || 'game';

  // websockets
  this.socket = options.transport;

  // -- teams

  // d3
  this.d3     = options.d3;
  // teams container
  this._container = this.d3.select(this.teamsList[0]);
  // team drawing function
  this._drawTeam = $.partial(this._drawTeamStub, this);

  // question drawing function
  this._drawQuestion = $.partial(this._drawQuestionStub, this);

  // -- gameplay

  // d3
  this._gameplayContainer = this.d3.select(this.gameplay[0]);
  // drawing function
  this._drawQuestion = $.partial(this._drawQuestionStub, this);

  // --- current data storage
  this.teams     = [];
  this.questions = [];

  this.questionInPlay = 0;

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
        _game.user(false);
      }

      _game.setTeams(data.game.teams);
      _game.setQuestions(data.game.questions);
      _game.setState(data.game.state);
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

    // [game:question_added]
    if (data['game:question_added'])
    {
      _game.addQuestion(data['game:question_added']);
    }

    // [game:question_updated]
    if (data['game:question_updated'])
    {
      _game.updateQuestion(data['game:question_updated']);
    }

    // [game:team_deleted]
    if (data['game:question_deleted'])
    {
      _game.deleteQuestion(data['game:question_deleted']);
    }

    // [game:current_question]
    if (data['game:current_question'])
    {
      _game.currentQuestion(data['game:current_question'].index);
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

Game.prototype.getTeam = function Game_getTeam(handle)
{
  return $.find(this.teams, {login: handle});
}

// Attaches reference to known external objects
Game.prototype.attach = function Game_attach(collection)
{
  // so far it's only chat
  if ('chat' in collection)
  {
    this._chat = collection['chat'];
  }
}

// more meaningful methods

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
  $.find(this.teams, function(t, i){ if (t.login == team.login) { _game.teams.splice(i, 1); return true; } });

  this._renderTeams();
}

Game.prototype.setTeams = function Game_setTeams(teams)
{
  this.teams = teams;
  this._renderTeams();
}

Game.prototype.addQuestion = function Game_addQuestion(question)
{
  this.questions.push(question);

  this._renderQuestions();
}

Game.prototype.updateQuestion = function Game_updateQuestion(question)
{
  // merge in updated question data
  this.questions = $.each(this.questions, function(q){ if (q.index == question.index) { $.merge(q, question); } });

  // render question element directly
  this._drawQuestionStub.call($('#gameplay_question_'+question.index)[0], this, question);
}

Game.prototype.deleteQuestion = function Game_deleteQuestion(question)
{
  var _game = this;

  // find and kill
  $.find(this.questions, function(q, i){ if (q.index == question.index) { _game.questions.splice(i, 1); return true; } });

  this._renderQuestions();
}

Game.prototype.setQuestions = function Game_setQuestions(questions)
{
  this.questions = questions;
  this._renderQuestions();
}

Game.prototype.currentQuestion = function Game_currentQuestion(index)
{
  if (this.questionInPlay != index)
  {
    // unselect previous one
    if (this.questionInPlay)
    {
      $('#gameplay_question_'+this.questionInPlay).removeClass('gameplay_question_playing');
    }

    // don't do anything if current question was reset
    if (this.questionInPlay = index)
    {
      $('#gameplay_question_'+this.questionInPlay).addClass('gameplay_question_playing');
    }
  }

  return this.questionInPlay;
}

// Sets current game state
Game.prototype.setState = function Game_setState(state)
{
  // current question
  if (state['current_question'])
  {
    this.currentQuestion(state['current_question']);
  }
}

// --- demi-private methods

Game.prototype._renderTeams = function Game__renderTeams()
{
  var item;

  // sort
  this.teams.sort(this._sortTeams);

  item = this._container.selectAll('.scoreboard_team')
    .data(this.teams)
    .order()
    .each(this._drawTeam)
    ;

  item.enter().append('span')
    .order()
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

Game.prototype._renderQuestions = function Game__renderQuestions()
{
  var item;

  // sort
  this.questions = $.sortBy(this.questions, 'index');

  item = this._gameplayContainer.selectAll('.gameplay_question')
    .data(this.questions)
    .order()
    .each(this._drawQuestion)
    ;

  item.enter().append('span')
    .order()
    .each(this._drawQuestion)
    ;

  item.exit()
    .remove()
    ;
}

Game.prototype._drawQuestionStub = function Game__drawQuestionStub(_game, d)
{
  // this here is a DOM element
  var el   = _game.d3.select(this)
    ;

  el
    .classed('gameplay_question', true)
    .classed('gameplay_question_played', !!d.played)
    .attr('id', 'gameplay_question_'+d.index)
    .text(d.index);
}

Game.prototype._sortTeams = function Game__sortTeams(a, b)
{
  var comp = 0;

  // check points first
  if ((comp = b.points - a.points) == 0)
  {
    // check time_spent
    if ((comp = b.time_spent - a.time_spent) == 0)
    {
      // check names
      comp = (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0));
    }
  }

  return comp;
}
