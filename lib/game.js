var _     = require('lodash')
  , level = require('level')
  , async = require('async')
  , merge = require('deeply')

  // token
  , token =
    { meta    : 'meta'
    , team    : 'team'
    , state   : 'state'
    , question: 'question'
    }

  , templateTeam =
    { login     : ''
    , name      : ''
    , password  : ''
    , online    : false
    , points    : 0
    , time_spent: 0
    }

  , templateQuestion =
    { index : 0
    , text  : ''
    , answer: ''
    , played: false
    }


  // globals
  , admin = {} // admin socket.id back reference
  , teams = {} // teams socket.id back reference
  ;

module.exports = Game;

function Game(options)
{
  // environment
  this._env = options.env || function(){};

  // db file
  this._storage = options.storage;

  // db instance
  this._db = undefined;

  // meta data
  this.meta = {};
  // list of teams
  this.team = {};
  // questions (with answers)
  this.question = {};
}

Game.prototype.init = function Game_init(callback)
{
  var _game = this
    , now
    ;

  // connect to db and get stuff
  level(this._storage, {keyEncoding: 'utf8', valueEncoding: 'json'}, function(err, db)
  {
    if (err) return callback(err);

    _game._db = db;

    async.series(
    { meta    : _game._fetchSlice.bind(_game, token.meta)
    , team    : _game._fetchSlice.bind(_game, token.team)
    , state   : _game._fetchSlice.bind(_game, token.state)
    , question: _game._fetchSlice.bind(_game, token.question)
    }, function(err, res)
    {
      if (err) return callback(err);

      _game.meta     = res.meta;
      _game.state    = res.state;
      // filter it thru template object
      _game.team     = _.each(res.team, function(team, key){ res.team[key] = merge(templateTeam, team); }) && res.team;
      _game.question = _.each(res.question, function(question, key){ res.question[key] = merge(templateQuestion, question); }) && res.question;

      // {{{ create game instance id
      // to prevent user name collisions
      // after db reset
      if (!_game.meta.instance)
      {
        now = process.hrtime();

        _game.save('meta', 'instance', now[1].toString(36) + now[0].toString(36), callback);
      }
      else
      {
        callback(null);
      }
    });
  });

  // set event listeners
  this._initEventListeners();
}

// saves data to db
Game.prototype.save = function Game_save(channel, key, value, callback)
{
  var _game = this;

  this._db.put(token[channel]+':'+key, value, function(err)
  {
    if (err) return callback(err);

    // update local
    _game[channel][key] = value;

    return callback(null);
  });
}

// loads data from db
Game.prototype.load = function Game_load(channel, key, callback)
{
  var _game = this;

  this._db.get(token[channel]+':'+key, function(err, value)
  {
    if (err)
    {
      // reset local
      if (key in _game[channel])
      {
        delete _game[channel][key];
      }

      if (err.notFound)
      {
        return callback(null, undefined);
      }

      return callback(err);
    }

    // update local
    _game[channel][key] = value;

    return callback(null, value);
  });
}

// deletes data from db
Game.prototype.delete = function Game_delete(channel, key, callback)
{
  var _game = this;

  this._db.del(token[channel]+':'+key, function(err)
  {
    if (err) return callback(err);

    // update local
    delete _game[channel][key];

    return callback(null);
  });
}

// authenticates as admin or team user
Game.prototype.auth = function Game_auth(user, callback)
{
  var _game = this
    , info
    , userData
    ;

  if (!user.login || !user.password) return callback({code: 400, message: 'Missing data.'});


  if (user.login == 'admin')
  {
    if (this._env('admin') != user.password) return callback({code: 400, message: 'Wrong password.'});

    userData = {login: 'admin', password: user.password};

    // store temporarily
    admin[user.socketid] = userData;
  }
  else if (this.team[user.login])
  {
    if (this.team[user.login].password != user.password) return callback({code: 400, message: 'Wrong team/password combination.'});

    // set online flag
    this.team[user.login].online = true;

    userData = this.team[user.login];

    // store temporarily
    teams[user.socketid] = userData;
  }
  else
  {
    return callback({code: 404, message: 'Could not recognize provided login.'});
  }

  // done here
  callback(null, userData);
}

// cleans up disconnected user
Game.prototype.left = function Game_left(user, callback)
{
  var _game = this
    , info
    , userData
    ;

  if (!user.socketid)
  {
    return callback({code: 400, message: 'Missing data.', wtf: user});
  }
  else if (userData = teams[user.socketid])
  {
    info  = 'team';
    // cleanup user object
    delete userData.socketid;
    delete teams[user.socketid];
  }
  else if (userData = admin[user.socketid])
  {
    info  = 'meta';
    // cleanup user object
    delete userData.socketid;
    delete admin[user.socketid];
  }
  else
  {
    // whatever
    return callback(null, {});
  }

  // kill online flag
  userData.online = false;

  // resave
  this.save(info, userData.login, userData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, userData);
  });
}

// Attaches reference to known external objects
Game.prototype.attach = function Game_attach(collection)
{
  // chat reference
  if ('chat' in collection)
  {
    this._chat = collection['chat'];
  }

  // websockets reference
  if ('sockets' in collection)
  {
    this._sockets = collection['sockets'];
  }
}

// Sets timer on/off
Game.prototype.setTimer = function Game_setTimer(timer, callback)
{
  var _game = this
    , timerData
    ;

  if (!timer)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (timer == 'on' && this.state['timer'])
  {
    return callback({code: 400, message: 'Timer has already started.'});
  }
  else if (timer == 'off' && !this.state['timer'])
  {
    return callback({code: 400, message: 'No timer to turn off.'});
  }

  if (timer == 'off')
  {
    timerData = false;

    // kill countdown
    if (this.state['timer'].countdown)
    {
      clearInterval(this.state['timer'].countdown);
    }
  }
  else
  {
    timerData = { start: process.hrtime() };
  }

  // save
  this.save('state', 'timer', timerData, function(err)
  {
    if (err) return callback({code: 500, message: err});

    // start timer countdown
    if (timerData)
    {
      _game._startTimerCountdown();
    }

    return callback(null, timerData);
  });
}

// Adds new team
Game.prototype.addTeam = function Game_addTeam(team, callback)
{
  var _game = this
    , teamData
    ;

  if (!team.login || !team.name || !team.password)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (this.team[team.login])
  {
    return callback({code: 400, message: 'Team '+team.login+' already exists.'});
  }

  // create team data
  teamData = merge(templateTeam, {login: team.login, name: team.name, password: team.password});

  // save
  this.save('team', teamData.login, teamData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, teamData);
  });
}

// Updates existing team
Game.prototype.updateTeam = function Game_updateTeam(team, callback)
{
  var _game = this
    , teamData
    ;

  if (!team.login)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (!this.team[team.login])
  {
    return callback({code: 404, message: 'Team '+team.login+' does not exist.'});
  }

  // deep merge team data
  teamData = merge(this.team[team.login], team);

  // save
  this.save('team', teamData.login, teamData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, teamData);
  });
}

// Deletes existing team
Game.prototype.deleteTeam = function Game_deleteTeam(team, callback)
{
  var _game = this
    , teamData
    ;

  if (!team.login)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (!this.team[team.login])
  {
    return callback({code: 404, message: 'Team '+team.login+' does not exist.'});
  }

  // last reference to the team data
  teamData = this.team[team.login];

  // delete
  this.delete('team', teamData.login, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, teamData);
  });
}

// --- Questions

// Sets current question (in play)
Game.prototype.setQuestion = function Game_setQuestion(question, callback)
{
  var _game = this
    , questionData
    ;

  if (!('index' in question))
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (question.index && !this.question[question.index])
  {
    return callback({code: 404, message: 'Question '+question.index+' does not exist.'});
  }

  if (this.state['current_question'] == question.index)
  {
    if (question.index)
    {
      return callback({code: 400, message: 'Question '+question.index+' is already in play.'});
    }
    else
    {
      return callback({code: 400, message: 'No question to unset.'});
    }
  }

  // get question data or null
  questionData = question.index ? this.question[question.index] : {index: false};

  // save
  this.save('state', 'current_question', questionData.index, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, questionData);
  });
}

// Adds new question
Game.prototype.addQuestion = function Game_addQuestion(data, callback)
{
  var _game = this
    , questionData
    ;

  if (!data.text || !data.answer)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  // create team data
  questionData = {text: data.text, answer: data.answer};

  // add index
  questionData.index = _.keys(this.question).length + 1;

  // save
  this.save('question', questionData.index, questionData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, questionData);
  });
}

// Updates existing question
Game.prototype.updateQuestion = function Game_updateQuestion(question, callback)
{
  var _game = this
    , questionData
    ;

  if (!question.index)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (!this.question[question.index])
  {
    return callback({code: 404, message: 'Question '+question.index+' does not exist.'});
  }

  // deep merge team data
  questionData = merge(this.question[question.index], question);

  // save
  this.save('question', questionData.index, questionData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, questionData);
  });
}

// Deletes existing question
Game.prototype.deleteQuestion = function Game_deleteQuestion(question, callback)
{
  var _game = this
    , questionData
    ;

  if (!question.index)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (!this.question[question.index])
  {
    return callback({code: 404, message: 'Question '+question.index+' does not exist.'});
  }

  // last reference to the team data
  questionData = this.question[question.index];

  // delete
  this.delete('question', questionData.index, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, questionData);
  });
}

// Fetches question data
Game.prototype.getQuestion = function Game_getQuestion(question, callback)
{
  var _game = this
    ;

  if (!question.index)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (!this.question[question.index])
  {
    return callback({code: 404, message: 'Question '+question.index+' does not exist.'});
  }

  // fetch
  this.load('question', question.index, function(err, questionData)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, questionData);
  });
}

// --- Internal logic lives here

// starts countdown interval counter
Game.prototype._startTimerCountdown = function Game__startTimerCountdown()
{
  this.state['timer'].countdown = setInterval(this._timerCountdown.bind(this), 500); // twice a second should be precise enough
}

Game.prototype._timerCountdownStub = function Game__timerCountdown()
{
  var _game = this;

  var diff = process.hrtime(this.state['timer'].start);

  if (this._sockets)
  {
    this._sockets.write({'game:timer': {tick: diff[0], nano: diff[1]} });
  }

  // check the limits
  if (diff[0] >= 60)
  {
    // turn off timer
    this.setTimer('off', function Game_setTimer_off_callback(err, timer)
    {
      if (err) return console.log(['Could not set timer off from countdown interval', err]);

      _game._sockets.write({'game:timer': false });
    });
  }
}

// sets event listeners
// Note: all the event handlers bound to primus (websockets) object
Game.prototype._initEventListeners = function Game__initEventListeners()
{
  var _game = this;

  this.events = {};

  // [helo] initial handshake
  this.events['helo'] = function Game__initEventListeners_helo(socket, data)
  {
    // don't talk to anybody else
    if (data != 'game' && data != 'team' && data != 'admin') return;

    // send initial data to the requesting socket
    socket.write(
    {
      game:
      { instance : _game.meta.instance
        // don't expose password and answers
      , teams    : _.map(_game.team, function(team){ return _.omit(team, ['password', 'answers']); })
      , questions: _.map(_game.question, function(question){ return _.omit(question, ['text', 'answer']); })
      , state    : _game.state
      }
    });

    // if it's team or admin ask to auth
    if (data == 'team' || data == 'admin')
    {
      socket.write({'game:auth': data});
    }
  };

  // [disconnection]
  this.events['disconnection'] = function Game__initEventListeners_disconnection(socket)
  {
    var _sockets = this;

    _game.left(
    {
      socketid: socket.id
    }, function Game_left_callback(err, user)
    {
      if (err) return console.log({ 'game:error': {err: err, origin: 'disconnection', data: user} });

      // if it's regular spectator don't raise a fuss
      if (user.login)
      {
        _sockets.write({ 'game:left': {login: user.login} });
      }
    });
  };

  // [game:auth]
  this.events['game:auth'] = function Game__initEventListeners_game_auth(socket, data)
  {
    var _sockets = this
      , nickname
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    _game.auth(
    {
      login   : data.login,
      password: data.password,
      socketid: socket.id
    }, function Game_auth_callback(err, user)
    {
      if (err) return socket.write({ 'game:error': {err: err, origin: 'auth', data: data} });

      if (user.login == 'admin')
      {
        _sockets.write({ 'game:admin': {login: user.login} });
        nickname = '_admin_'+user.login;
      }
      else
      {
        _sockets.write({ 'game:team': {login: user.login, name: user.name} });
        nickname = '_team_'+user.login;
      }

      socket.write({ 'game:logged': {login: user.login, password: user.password} });

      // Auto-login into chat as game user
      if (_game._chat)
      {
        _game._chat.forceJoin(_sockets, socket, {nickname: nickname, password: data.password});
      }
    });
  };

  // --- admin stuff

  // [admin:set_timer]
  this.events['admin:set_timer'] = function Game__initEventListeners_admin_set_timer(socket, data)
  {
    var _sockets = this
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'set_timer'))
    {
      return;
    }

    _game.setTimer(data, function Game_setTimer_callback(err, timer)
    {
      if (err) return socket.write({ 'admin:error': {err: err, origin: 'set_timer', data: data} });
      _sockets.write({ 'game:timer': timer });
    });
  };

  // [admin:set_question]
  this.events['admin:set_question'] = function Game__initEventListeners_admin_set_question(socket, data)
  {
    var _sockets = this
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'set_question'))
    {
      return;
    }

    _game.setQuestion(data, function Game_setQuestion_callback(err, question)
    {
      if (err) return socket.write({ 'admin:error': {err: err, origin: 'set_question', data: data} });
      _sockets.write({ 'game:current_question': _.omit(question, ['text', 'answer']) });
    });
  };

  // [admin:add_team]
  this.events['admin:add_team'] = function Game__initEventListeners_admin_add_team(socket, data)
  {
    var _sockets = this
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'add_team'))
    {
      return;
    }

    _game.addTeam({
      login   : _game._makeHandle(data.name),
      name    : data.name,
      password: data.password
    }, function Game_addTeam_callback(err, team)
    {
      if (err) return socket.write({ 'admin:error': {err: err, origin: 'add_team', data: data} });
      _sockets.write({ 'game:team_added': _.omit(team, ['password', 'answers']) });
    });
  };

  // [admin:update_team]
  this.events['admin:update_team'] = function Game__initEventListeners_admin_update_team(socket, data)
  {
    var _sockets = this
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'update_team'))
    {
      return;
    }

    _game.updateTeam(data, function Game_updateTeam_callback(err, team)
    {
      if (err) return socket.write({ 'admin:error': {err: err, origin: 'update_team', data: data} });
      _sockets.write({ 'game:team_updated': _.omit(team, ['password', 'answers']) });
    });
  };

  // [admin:delete_team]
  this.events['admin:delete_team'] = function Game__initEventListeners_admin_delete_team(socket, data)
  {
    var _sockets = this
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'delete_team'))
    {
      return;
    }

    _game.deleteTeam(data, function Game_deleteTeam_callback(err, team)
    {
      if (err) return socket.write({ 'admin:error': {err: err, origin: 'delete_team', data: data} });
      _sockets.write({ 'game:team_deleted': {login: team.login} });
    });
  };

  // --- questions

  // [admin:add_question]
  this.events['admin:add_question'] = function Game__initEventListeners_admin_add_question(socket, data)
  {
    var _sockets = this
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'add_question'))
    {
      return;
    }

    _game.addQuestion(data, function Game_addQuestion_callback(err, question)
    {
      if (err) return socket.write({ 'admin:error': {err: err, origin: 'add_question', data: data} });
      _sockets.write({ 'game:question_added': _.omit(question, ['text', 'answer']) });
    });
  };

  // [admin:update_question]
  this.events['admin:update_question'] = function Game__initEventListeners_admin_update_question(socket, data)
  {
    var _sockets = this
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'update_question'))
    {
      return;
    }

    _game.updateQuestion(data, function Game_updateQuestion_callback(err, question)
    {
      if (err) return socket.write({ 'admin:error': {err: err, origin: 'update_question', data: data} });
      _sockets.write({ 'game:question_updated': _.omit(question, ['text', 'answer']) });
    });
  };

  // [admin:delete_question]
  this.events['admin:delete_question'] = function Game__initEventListeners_admin_delete_question(socket, data)
  {
    var _sockets = this
      ;

    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'delete_question'))
    {
      return;
    }

    _game.deleteQuestion(data, function Game_deleteQuestion_callback(err, question)
    {
      if (err) return socket.write({ 'admin:error': {err: err, origin: 'delete_question', data: data} });
      _sockets.write({ 'game:question_deleted': {index: question.index} });
    });
  };

  // -- special stuff

  // [admin:get_question]
  // fetches question data and sends it using "callback"
  this.events['admin:get_question'] = function Game__initEventListeners_admin_get_question(socket, data)
  {
    if (!data)
    {
      // it's something like I don't know
      return;
    }

    if (!_game._isAdmin(socket, 'get_question'))
    {
      return;
    }

    _game.getQuestion({index: data.index}, function Game_getQuestion_callback(err, question)
    {
      // perform callback
      socket.write({ '_:callback': {hash: data.callback, err: err, data: merge(templateQuestion, question)} });
    });
  }


}

Game.prototype._isAdmin = function Game__isAdmin(socket, origin)
{
  if (!admin[socket.id])
  {
    socket.write({ 'admin:error': {err: {code: 403, message: 'Permission denied.'}, origin: origin} });
    return false;
  }

  return true;
}


// --- Santa's little helpers

// fetches slice of data from the database
Game.prototype._fetchSlice = function Game__fetchSlice(slice, callback)
{
  var results = {}
    , sliceRE = new RegExp('^'+slice+'\:')
    ;

  this._db.createReadStream({start: slice+':', end: slice+':~'})
    .on('data', function(data)
    {
      results[data.key.replace(sliceRE, '')] = data.value;
    })
    .on('error', function(err)
    {
      callback(err);
    })
    .on('end', function()
    {
      callback(null, results);
    });
}

Game.prototype._makeHandle = function Game__makeHandle(s)
{
  return (''+(s || '')).toLowerCase().replace(/[^a-z0-9-]/g, '_').replace(/^[0-9-_]*/, '');
}
