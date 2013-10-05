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
      // reset online flag
      _game.team     = _.each(res.team, function(team, key){ res.team[key] = merge(templateTeam, team); console.log(['team', key, res.team[key]]); }) && res.team;
      _game.state    = res.state;
      _game.question = res.question;

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

    info = 'meta';
    // create admin user object
    userData = {socketid: user.socketid, login: 'admin', password: user.password};
  }
  else if (this.team[user.login])
  {
    if (this.team[user.login].password != user.password) return callback({code: 400, message: 'Wrong team/password combination.'});


//// TODO:::::


    info = 'team';
    // create team user object
    userData = {socketid: user.socketid, login: user.login, password: user.password, name: this.team[user.login].name};
  }
  else
  {
    return callback({code: 404, message: 'Could not recognize provided login.'});
  }

  // set online flag
  userData.online = true;

  // save
  this.save(info, userData.login, userData, function(err)
  {
    if (err) return callback({code: 500, message: err});

    if (info == 'meta')
    {
      admin[userData.socketid] = userData;
    }
    else
    {
      teams[userData.socketid] = userData;
    }
    return callback(null, userData);
  });
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
    return callback({code: 400, message: 'Missing data.'});
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
  // so far it's only chat
  if ('chat' in collection)
  {
    this._chat = collection['chat'];
  }
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
  teamData = {login: team.login, name: team.name, password: team.password, online: false, points: 0};

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

  // save
  this.delete('team', teamData.login, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, teamData);
  });
}

// --- Internal logic lives here

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
      { instance: _game.meta.instance
        // don't expose password and answers
      , teams   : _.map(_game.team, function(team){ return _.omit(team, ['password', 'answers']); })
      , state   : _game.state
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
      if (err) return console.log({ 'game:error': {err: err, from: 'disconnection', data: user} });

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
      if (err) return socket.write({ 'game:error': {err: err, from: 'auth', data: data} });

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
        _game._chat.forceJoin(_sockets, socket, {nickname: nickname});
      }
    });
  };

  // --- admin stuff

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
      if (err) return socket.write({ 'admin:error': {err: err, from: 'add_team', data: data} });
      _sockets.write({ 'game:team_added': {login: team.login, name: team.name, points: team.points} });
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
      if (err) return socket.write({ 'admin:error': {err: err, from: 'update_team', data: data} });
      _sockets.write({ 'game:team_updated': {login: team.login, name: team.name, points: team.points} });
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
      if (err) return socket.write({ 'admin:error': {err: err, from: 'delete_team', data: data} });
      _sockets.write({ 'game:team_deleted': {login: team.login} });
    });
  };

}

Game.prototype._isAdmin = function Game__isAdmin(socket, from)
{
  if (!admin[socket.id])
  {
    socket.write({ 'admin:error': {err: {code: 403, message: 'Permission denied.'}, from: from} });
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
