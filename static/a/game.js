
// --- game

function Game(options)
{
  this.gameplay      = typeof options.gameplay == 'string' ? $(options.gameplay) : options.gameplay;
  this.scoreboard    = typeof options.scoreboard == 'string' ? $(options.scoreboard) : options.scoreboard;
  this.teamsList     = typeof options.teamsList == 'string' ? $(options.teamsList) : options.teamsList;
  this.timerPanel    = typeof options.timer == 'string' ? $(options.timer) : options.timer;
  this.questionPanel = typeof options.question == 'string' ? $(options.question) : options.question;
  this.questionText  = typeof options.questionText == 'string' ? $(options.questionText) : options.questionText;
  this.answerPanel   = typeof options.answer == 'string' ? $(options.answer) : options.answer;
  this.answerText    = typeof options.answerText == 'string' ? $(options.answerText) : options.answerText;

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

  // team answer chart
  this._drawTeamAnswerChart = $.partial(this._drawTeamAnswerChartStub, this);

  // -- gameplay

  // d3
  this._gameplayContainer = this.d3.select(this.gameplay[0]);
  // drawing function
  this._drawQuestion = $.partial(this._drawQuestionStub, this);

  // -- timer

  // create list of ticks
  // one per second
  this._timerTicksList = this.d3.range(60);
  this._timerContainer = this.d3.select(this.timerPanel[0]);

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

      _game.setQuestions(data.game.questions);
      _game.setState(data.game.state);
      _game.setTeams(data.game.teams);
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

    // [game:timer]
    if ('game:timer' in data)
    {
      _game.updateTimer(data['game:timer']);
    }

    // [game:display]
    if ('game:display' in data)
    {
      _game.display(data['game:display']);
    }

    // [game:team]
    if (data['game:team'])
    {
      _game.teamOnline(data['game:team'], true);
    }
    // [game:left]
    if (data['game:left'])
    {
      _game.teamOnline(data['game:left'], false);
    }

    // [team:visibility]
    if (data['team:visibility'])
    {
      _game.teamVisibility(data['team:visibility']);
    }

    // [game:current_question]
    // ['game:team_updated']
    // redraw teams chart
    if (data['game:current_question'] || data['game:team_updated'])
    {
      _game._displayTeamsChart();
    }

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

// Attaches reference to known external objects
Game.prototype.attach = function Game_attach(collection)
{
  // so far it's only chat
  if ('chat' in collection)
  {
    this._chat = collection['chat'];
  }
}

// Fetches team object
Game.prototype.getTeam = function Game_getTeam(handle)
{
  return $.find(this.teams, {login: handle});
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
  this.teams = $.transform(this.teams, function(result, t){ if (t.login == team.login) { result.push(team) } else { result.push(t); } return result; });
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

  // display answers stats chart
  this._displayTeamsChart();
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
  if ('current_question' in state)
  {
    this.currentQuestion(state['current_question']);
  }

  // timer
  this.updateTimer(state['timer']);

  // display
  this.display(state['display']);
}

Game.prototype.updateTimer = function Game_updateTimer(timer)
{
  if (timer)
  {
    this.timerCounting = timer;
    this._chat.block(true);
  }
  else
  {
    this.timerCounting = false;
    this._chat.block(false);
  }

  this._renderTimer();
}

// displaying question or question + answer
// TODO: make it less coupled
Game.prototype.display = function Game_display(data)
{
  // question
  if (data && data['question'])
  {
    this.questionText.html(data['question'].text);
    this.questionPanel.show();
  }
  else
  {
    this.questionPanel.hide();
    this.questionText.html('');
  }

  // answer
  if (data && data['answer'])
  {
    this.answerText.html(data['answer'].answer).show();
    this.questionText.html(data['answer'].text);
    this.questionPanel.show();
  }
  else if (!data)
  {
    this.answerText.hide().html('');
    this.questionPanel.hide();
    this.questionText.html('');
  }
}
// Updates team's online status
Game.prototype.teamOnline = function Game_teamOnline(data, online)
{
  if (arguments.length < 2)
  {
    online = true;
  }

  if (typeof data != 'object' || !data.login)
  {
    return;
  }

  $('#scoreboard_team_'+data.login)[online ? 'addClass' : 'removeClass']('scoreboard_team_online');
}


// Updates team's visibility status
Game.prototype.teamVisibility = function Game_teamVisibility(data)
{
  if (typeof data != 'object' || !data.team || !('visibility' in data))
  {
    return;
  }

  $('#scoreboard_team_'+data.team)[data.visibility ? 'addClass' : 'removeClass']('scoreboard_team_has_focus');
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
    , frac = d.time_bonus && d.points ? Math.round(d.time_bonus / ((d.points - (d.adjustment || 0)) * 60000) * 1000) : 0
    , html = ''
    ;

  html += '<span class="scoreboard_team_name">'+d.name+'</span>';
  html += '<span class="scoreboard_team_points">'+d.points+'<span class="scoreboard_team_fracs">.'+(frac < 10 ? '00'+frac : (frac < 100 ? '0' + frac : frac))+'</span></span>';

  el
    .classed('scoreboard_team', true)
    .classed('scoreboard_team_mine', isMe)
    .classed('scoreboard_team_online', d.online)
    .classed('scoreboard_team_has_focus', d.visibility)
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
  var el = _game.d3.select(this)
    ;

  el
    .classed('gameplay_question', true)
    .classed('gameplay_question_played', !!d.played)
    .attr('id', 'gameplay_question_'+d.index)
    .text(d.index);
}

Game.prototype._renderTimer = function Game__renderTimer()
{
  var _game = this
    , item
    , totalWidth
    , tickWidth
    , tickMargin
    ;

  // check if timer stopped
  // and cleanup
  if (!this.timerCounting)
  {
    this.timerPanel.hide();
    this.timerPanel.html('');
    // show gameplay
    this.gameplay.show();
    // reset last tick
    this._lastTick = null;
    return;
  }
  else
  {
    // hide gameplay
    this.gameplay.hide();
    this.timerPanel.show();
  }

  // be lazy
  if (this._lastTick === this.timerCounting.tick) return;
  this._lastTick = this.timerCounting.tick;

  totalWidth = this.timerPanel.dim().width;
  // width – 1% within 5px - 20px range
  tickWidth  = Math.min(20, Math.max(5, Math.floor(totalWidth/100)));
  // margin - 0.5% within 2px - 10px range
  tickMargin = Math.min(10, Math.max(2, Math.floor(totalWidth/200)));

  // extra treatment for the last 10 seconds
  this._timerContainer.classed('timer_running_out', (_game.timerCounting.tick > 49))

  item = this._timerContainer.selectAll('.timer_tick')
    .data(this._timerTicksList)
    .order()
    .classed('timer_tick', true)
    .classed('timer_tick_passed', function(d) { return d < 60 - _game.timerCounting.tick})
    .style('width', tickWidth + 'px')
    .style('margin-left', tickMargin + 'px')
    ;

  item.enter().append('span')
    .order()
    .classed('timer_tick', true)
    .classed('timer_tick_passed', function(d) { return d < 60 - _game.timerCounting.tick})
    .style('width', tickWidth + 'px')
    .style('margin-left', tickMargin + 'px')
    ;

  item.exit()
    .remove()
    ;
}

// TODO: Make it less of a hack
Game.prototype._displayTeamsChart = function Game__displayTeamsChart()
{
  var _game = this
    , item
    , d3 = this.d3
    , panel = $('.answer_teams_chart')
    , width = 100 / this.teams.length
    , teams = $.sortBy(this.teams, 'name')
    ;

  // sanity check
  if (!this.questionInPlay)
  {
    panel.hide();
    return;
  }
  else
  {
    panel.show();
  }

  if (!this._chartBase)
  {
    this._chartBase = this._createChartBase(panel);
  }

  item = this._chartBase.selectAll('.answer_teams_chart_team')
    .data(teams, function(d){ return d.login; })
    .order()
    .style('width', width+'%')
    .each(this._drawTeamAnswerChart)
    ;

  item.enter().append('span')
    .order()
    .style('width', width+'%')
    .each(this._drawTeamAnswerChart)
    ;

  item.exit()
    .remove()
    ;
}

Game.prototype._drawTeamAnswerChartStub = function Game__drawTeamAnswerChartStub(_game, d)
{
  var el      = _game.d3.select(this)
    , answer  = d.answers[_game.questionInPlay]
    , time    = answer && answer.time ? answer.time[0] : 0
    , html    = ''
    ;

  html += '<span class="answer_teams_chart_team_name">'+d.name+'</span>';
  html += '<span style="height: '+(time / 60 * 100)+'%" class="answer_teams_chart_team_bar"></span>';

  el
    .classed('answer_teams_chart_team', true)
    .classed('answer_teams_chart_team_correct', answer && typeof answer.correct == 'boolean' && answer.correct)
    .classed('answer_teams_chart_team_wrong', answer && typeof answer.correct == 'boolean' && !answer.correct)
    .html(html)
    ;
}

Game.prototype._createChartBase = function Game__createChartBase(panel)
{
  var chart = this.d3.select(panel[0])
    ;

  // create Y-axis
  panel.html('<span class="answer_teams_chart_axis_y"><i>'+([60, 45, 30, 15, 0].join('</i><i>'))+'</i></span>');

  return chart;
}

Game.prototype._sortTeams = function Game__sortTeams(a, b)
{
  var comp = 0;

  // check points first
  if ((comp = b.points - a.points) == 0)
  {
    // check time_bonus
    if ((comp = b.time_bonus - a.time_bonus) == 0)
    {
      // check names
      comp = (a.name < b.name ? -1 : (a.name > b.name ? 1 : 0));
    }
  }

  return comp;
}
