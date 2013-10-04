var level = require('level')
  , async = require('async')

  // token
  , token =
    { meta    : 'meta'
    , team    : 'team'
    , state   : 'state'
    , question: 'question'
    }
  ;

module.exports = Game;

function Game(options)
{
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
      _game.team     = res.team;
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

// --- Internal logic lives here

// sets event listeners
// Note: all the event handlers bound to primus (websockets) object
Game.prototype._initEventListeners = function Game__initEventListeners()
{
  var _game = this;

  this.events = {};

  // initial handshake
  this.events['helo'] = function Game__initEventListeners_helo(socket, data)
  {
    // don't talk to anybody else
    if (data != 'game' && data != 'team' && data != 'admin') return;

    // send initial data to the requesting socket
    socket.write(
    {
      game:
      { teams: _game.team
      , state: _game.state
      }
    });

    // if it's team or admin ask to auth
    if (data == 'team' || data == 'admin')
    {
      socket.write({auth: data});
    }
  }

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
