/* admin level specific js */

// post init will be called after generic init
// Note: overrides team level
Game.prototype._postInit = function Game__postInit()
{
  var _game = this;

  // keep track of answered questions
  this.answered = {};

  // socket callback pool
  this._callbackPool = {};

  // prepare stub methods
  this._drawTeamAnswer = $.partial(this._drawTeamAnswerStub, this);
  this._sortTeamAnswer = $.partial(this._sortTeamAnswerStub, this);

  // --- add extra containers

  // global var – containerGameplay, set in admin.html
  this.gameplay = typeof containerGameplay == 'string' ? $(containerGameplay) : containerGameplay;
  // d3
  this._gameplayContainer = this.d3.select(this.gameplay[0]);

  // teams' answers
  this.teamsAnswersPanel = $('.answer_teams');
  // d3
  this._teamsAnswersContainer = this.d3.select(this.teamsAnswersPanel[0]);

  // --- add extra events

  this.socket.on('data', function primus_onData(data)
  {
    // [_:callback]
    if (data['_:callback'])
    {
      if (typeof data['_:callback'] == 'object' && data['_:callback'].hash && typeof _game._callbackPool[data['_:callback'].hash] == 'function')
      {
        // pass error and data to the stored callback
        _game._callbackPool[data['_:callback'].hash].call(_game, data['_:callback'].err, data['_:callback'].data);
        // cleanup
        delete _game._callbackPool[data['_:callback'].hash];
      }
    }

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

    // [game:current_question]
    // ['game:team_updated']
    // redraw teams answers
    if (data['game:current_question'] || data['game:team_updated'])
    {
      _game._displayTeamsAnswers();
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

  // --- add local event handlers

  // admin stuff

  // start timer
  $('.gameplay_start_timer').on('click', function(e)
  {
    e.stop();
    _game.startStopTimer();
  });

  // add team action
  $('.scoreboard_add_team').on('click', function(e)
  {
    e.stop();
    _game._toggleAddTeamModal(true);
  });

  // edit team action
  this.scoreboard.on('click', '.scoreboard_edit_team', function(e)
  {
    var el = $(this)
      , team = el.parents('.scoreboard_team').attr('id').replace(/^scoreboard_team_/, '')
      ;

    if (!team) return;

    e.stop();

    _game._toggleEditTeamModal(true, team);
  });

  // delete team action
  this.scoreboard.on('click', '.scoreboard_delete_team', function(e)
  {
    var el = $(this)
      , team = el.parents('.scoreboard_team').attr('id').replace(/^scoreboard_team_/, '')
      ;

    if (!team) return;

    e.stop();

    _game._toggleDeleteTeamModal(true, team);
  });

  // pick question action
  this.gameplay.on('click', '.gameplay_question', function(e)
  {
    var question;

    // reduce noise
    if (!$(e.target).hasClass('gameplay_question_controls')) return;

    question = $(this).attr('id').replace(/^gameplay_question_/, '');

    if (!question) return;

    e.stop();

    _game.pickQuestion(question);
  });

  // add question action
  $('.gameplay_add_question').on('click', function(e)
  {
    e.stop();
    _game._toggleAddQuestionModal(true);
  });

  // edit question action
  this.gameplay.on('click', '.gameplay_edit_question', function(e)
  {
    var el       = $(this)
      , question = el.parents('.gameplay_question').attr('id').replace(/^gameplay_question_/, '')
      ;

    if (!question) return;

    e.stop();

    _game._toggleEditQuestionModal(true, question);
  });

  // delete question action
  this.gameplay.on('click', '.gameplay_delete_question', function(e)
  {
    var el       = $(this)
      , question = el.parents('.gameplay_question').attr('id').replace(/^gameplay_question_/, '')
      ;

    if (!question) return;

    e.stop();

    _game._toggleDeleteQuestionModal(true, question);
  });

  // show answer action
  this.gameplay.on('click', '.gameplay_show_answer', function(e)
  {
    var el       = $(this)
      , question = el.parents('.gameplay_question').attr('id').replace(/^gameplay_question_/, '')
      ;

    if (!question) return;

    e.stop();

    _game.showAnswer(question);
  });

  this.teamsAnswersPanel.on('click', '.answer_teams_team_correct', function(e)
  {
    var el   = $(this)
      , team = el.parents('.answer_teams_team').attr('id').replace(/^answer_teams_team_/, '')
      ;

    if (!team) return;

    e.stop();

    _game.evalAnswer(team, 'correct');
  });

  this.teamsAnswersPanel.on('click', '.answer_teams_team_wrong', function(e)
  {
    var el   = $(this)
      , team = el.parents('.answer_teams_team').attr('id').replace(/^answer_teams_team_/, '')
      ;

    if (!team) return;

    e.stop();

    _game.evalAnswer(team, 'wrong');
  });


  // --- Modals

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
      {action: 'submit', title: 'ok'}
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
      {name: 'time_bonus', title: 'time bonus'}
    ],
    controls:
    [
      {action: 'submit', title: 'update'},
      {action: 'cancel', title: 'cancel'}
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

  // --- questions

  // create team prompt
  this.questionModal = new FormPrompt(
  {
    title: 'add question',
    fields:
    [
      {type: 'textarea', name: 'text', title: 'question'},
      {type: 'textarea', name: 'answer', title: 'answer'}
    ],
    controls:
    [
      {action: 'submit', title: 'add'},
      {action: 'cancel', title: 'cancel'}
    ]
  });

  // edit team prompt
  this.questionEditModal = new FormPrompt(
  {
    title: 'edit question',
    fields:
    [
      {type: 'checkbox', name: 'played', title: 'been played'},
      {type: 'textarea', name: 'text', title: 'question'},
      {type: 'textarea', name: 'answer', title: 'answer'}
    ],
    controls:
    [
      {action: 'submit', title: 'update'},
      {action: 'cancel', title: 'cancel'}
    ]
  });
}
// end of init

// Sets customed for admin current game state
Game.prototype._admin_commonSetTeams = Game.prototype.setTeams;

Game.prototype.setTeams = function Game_setTeams(teams)
{
  // first do everythign else
  var result = this._admin_commonSetTeams(teams);

  // teams' answers
  this._displayTeamsAnswers();

  return result;
}

Game.prototype.startStopTimer = function Game_startStopTimer()
{
  // turn it on if it's off
  // and vice versa
  if (this.timerCounting)
  {
    this.socket.write({ 'admin:set_timer': 'off' });
  }
  else
  {
    this.socket.write({ 'admin:set_timer': 'on' });
  }
}

Game.prototype.pickQuestion = function Game_pickQuestion(index)
{
  if (this.questionInPlay != index)
  {
    this.socket.write({ 'admin:set_question': {index: index} });
  }
  else // unset
  {
    this.socket.write({ 'admin:set_question': {index: 0} });
  }
}

Game.prototype.showAnswer = function Game_showAnswer(index)
{
  this.socket.write({ 'admin:show_answer': {index: index} });
}

Game.prototype.evalAnswer = function Game_evalAnswer(team, status)
{
  var question;

  // no current question, team or status, bye bye
  if (!team || !status || !(question = this.questionInPlay)) return;

  this.socket.write({ 'admin:eval_answer': {question: question, team: team, status: status} });
}

// shows answers for the current questions
Game.prototype._displayTeamsAnswers = function Game__displayTeamsAnswers(show)
{
  var _game = this
    , teams
    ;

  if (arguments.length < 1)
  {
    show = true;
  }

  // sanity check
  if (!show || !this.questionInPlay)
  {
    this.teamsAnswersPanel.hide();
    return;
  }
  else
  {
    this.teamsAnswersPanel.show();
  }

  // get only ones answered
  teams = $.filter(this.teams, function(t){ return t.answers && t.answers[_game.questionInPlay]; });

  this._renderTeamsAnswers(teams);
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

// add question
Game.prototype._toggleAddQuestionModal = function Game__toggleAddQuestionModal(show)
{
  var _game = this;

  if (arguments.length < 1)
  {
    show = true;
  }

  if (show)
  {
    this.questionModal.activate(function(action, data)
    {
      if (action == 'submit')
      {
        _game.socket.write({ 'admin:add_question': {text: data.text, answer: data.answer} });
      }
    });
  }
  else
  {
    this.questionModal.deactivate();
  }
}

// edit question
Game.prototype._toggleEditQuestionModal = function Game__toggleEditQuestionModal(show, question)
{
  var _game    = this
    , callback = this._generateHash()
    ;

  // be on defensive side
  if (!question) return;

  if (arguments.length < 1)
  {
    show = true;
  }

  if (show)
  {
    // fetch question data
    this.socket.write({ 'admin:get_question': {index: question, callback: callback} });

    // wait for the response
    this._onSocketCallback(callback, function(err, question)
    {
      if (err) return;

      this.questionEditModal.title('Edit question <i>'+question.index+'</i>');
      this.questionEditModal.data(question);

      this.questionEditModal.activate(function(action, data)
      {
        var diff;

        if (action == 'submit')
        {
          if (diff = _game._diffObject(question, data))
          {
            _game.socket.write({ 'admin:update_question': $.merge({index: question.index}, data) });
          }
        }
      });

    });
  }
  else
  {
    this.questionEditModal.deactivate();
  }
}

// delete question
Game.prototype._toggleDeleteQuestionModal = function Game__toggleDeleteQuestionModal(show, question)
{
  var _game = this
    ;

  // be on defensive side
  if (!question) return;

  if (arguments.length < 1)
  {
    show = true;
  }

  if (show)
  {
    this.confirmModal.title('Are you sure you want to <i>delete</i> question <i>'+question+'</i>?');

    this.confirmModal.activate(function(action)
    {
      if (action == 'yes')
      {
        _game.socket.write({ 'admin:delete_question': {index: question} });
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
    , frac = d.time_bonus && d.points ? Math.round(d.time_bonus / (d.points * 60000) * 1000) : 0
    , bonus = Math.round(d.time_bonus/1000)
    , html = ''
    ;

  bonus = bonus < 10 ? '0'+bonus : ''+bonus;

  html += '<span class="scoreboard_team_name">'+d.name+'</span>';
  html += '<span class="scoreboard_team_time_bonus">:'+bonus+'</span>';
  html += '<span class="scoreboard_team_points">'+d.points+'<span class="scoreboard_team_fracs">.'+(frac < 10 ? '00'+frac : (frac < 100 ? '0' + frac : frac))+'</span></span>';
  html += '<span class="scoreboard_team_controls"><span class="scoreboard_edit_team"></span><span class="scoreboard_delete_team"></span></span>';

  el
    .classed('scoreboard_team', true)
    .classed('scoreboard_team_mine', isMe)
    .classed('scoreboard_team_online', d.online)
    .classed('scoreboard_team_has_focus', d.visibility)
    .attr('id', 'scoreboard_team_'+d.login)
    .html(html);
}

// Custom question html element
Game.prototype._drawQuestionStub = function Game__drawQuestionStub(_game, d)
{
  // this here is a DOM element
  var el   = _game.d3.select(this)
    , html = d.index;
    ;

  html += '<span class="gameplay_question_controls"><span class="gameplay_edit_question"></span><span class="gameplay_delete_question"></span><span class="gameplay_show_answer"></span></span>';

  el
    .classed('gameplay_question', true)
    .classed('gameplay_question_played', !!d.played)
    .attr('id', 'gameplay_question_'+d.index)
    .html(html);
}

// Admin specific timer animation
Game.prototype._renderTimer = function Game__renderTimer()
{
  var _game = this
    , leftover
    ;

  // turn it off
  if (!this.timerCounting)
  {
    $('.gameplay_start_timer')
      .removeAttr('data-timer')
      .removeClass('timer_running_out')
      ;
    return;
  }

  // be lazy
  if (this._lastTick === this.timerCounting.tick) return;
  this._lastTick = this.timerCounting.tick;

  leftover = 59-(this.timerCounting.tick || 0);

  $('.gameplay_start_timer').attr('data-timer', leftover < 10 ? '0'+leftover : leftover);

  // extra treatment for the last 10 seconds
  if (leftover < 10)
  {
    $('.gameplay_start_timer').addClass('timer_running_out');
  }
  else
  {
    $('.gameplay_start_timer').removeClass('timer_running_out');
  }
}

// Draws teams' answers panel
Game.prototype._renderTeamsAnswers = function Game__renderTeamsAnswers(teams)
{
  var _game = this
    , item
    ;

  // cleanup
  // TODO: Fix it properly
  this.teamsAnswersPanel.html('');

  item = this._teamsAnswersContainer.selectAll('.answer_teams_team')
    .data(teams, function(d){ return d.login; })
    .sort(this._sortTeamAnswer)
    .each(this._drawTeamAnswer)
    ;

  item.enter().append('span')
    .sort(this._sortTeamAnswer)
    .each(this._drawTeamAnswer)
    ;

  item.exit()
    .remove()
    ;
}

Game.prototype._sortTeamAnswerStub = function Game__sortTeamAnswerStub(_game, a, b)
{
  var answerA = a.answers[_game.questionInPlay]
    , answerB = b.answers[_game.questionInPlay]
    , evaluatedA = typeof answerA.correct == 'boolean'
    , evaluatedB = typeof answerB.correct == 'boolean'
    , evaluated  = 0
    ;

  if (evaluatedA && !evaluatedB)
  {
    evaluated = 1;
  }
  else if (!evaluatedA && evaluatedB)
  {
    evaluated = -1;
  }

  return evaluated ? evaluated : (answerB.bonus - answerA.bonus);
}

Game.prototype._drawTeamAnswerStub = function Game__drawTeamAnswerStub(_game, d)
{
  // this here is a DOM element
  var el     = _game.d3.select(this)
    , answer = d.answers[_game.questionInPlay]
    , seconds = answer.time[0] < 10 ? '0'+answer.time[0] : answer.time[0]
    , permile = Math.floor(answer.time[1]/1e6)
    , html   = ''
    ;

  // add zeros to the end
  permile = permile < 10 ? permile + '00' : (permile < 100 ? permile + '0' : permile);

  html += '<button class="answer_teams_control answer_teams_team_correct'+(answer.correct === true ? ' answer_teams_control_selected' : '')+'"></button>'

  if (typeof answer.correct == 'boolean')
  {
    html += '<span class="answer_teams_team_name">'+d.name+'</span>';
  }
  else
  {
    html += '<span class="answer_teams_team_time">:'+seconds+'<span class="answer_teams_team_time_permile">.'+permile+'</span></span>';
  }

  html += '<span class="answer_teams_team_answer">'+(answer.text || sample) +'</span>';
  html += '<button class="answer_teams_control answer_teams_team_wrong'+(answer.correct === false ? ' answer_teams_control_selected' : '')+'"></button>'

  el
    .classed('answer_teams_team', true)
    .classed('answer_teams_team_evaluated', typeof answer.correct == 'boolean')
    .classed('answer_teams_team_evaluated_correct', answer.correct)
    .attr('id', 'answer_teams_team_'+d.login)
    .html(html);
}

// -- Santa's little helpers

// Waits for callback event from the server
// TOOD: Add timeout
Game.prototype._onSocketCallback = function Game__onSocketCallback(hash, callback, options)
{
  this._callbackPool[hash] = callback;
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

// generates (uniqly) random hash
// for callback id
Game.prototype._generateHash = function Game__generateHash()
{
  var time = Date.now() // get unique number
    , salt = Math.floor(Math.random() * Math.pow(10, Math.random()*10)) // get variable length prefix
    , hash = time.toString(36) + salt.toString(36) // construct unique id
    ;

  return hash;
}

// --- custom chat methods

// don't block admin's chat
// blocks chat's UI
Chat.prototype.block = function Chat_block(blocked)
{
  // do nothing
}
