var _     = require('lodash')
  , level = require('level')
  , async = require('async')

  // token
  , token =
    { meta   : 'meta'
    , user   : 'user'
    , message: 'message'
    }

  // usernames blacklist
  , blockedNames = /(^_|^[Mm][Ee]$|\b[Gg][Aa][Mm][Ee]\b|^[Tt]eam([A-Z\W]|$)|\b[Tt][Ee][Aa][Mm]\b|\b[Aa][Dd][Mm][Ii][Nn]\b)/

  // globals
  , sockets = {} // back reference
  ;

module.exports = Chat;

function Chat(options)
{
  // environment
  this._env = options.env || function(){};

  // db file
  this._storage = options.storage;

  // db instance
  this._db = undefined;

  // meta data
  this.meta = {};
  // list of users
  this.user = {};
  // messages
  this.message = {};
}

Chat.prototype.init = function Chat_init(callback)
{
  var _chat = this
    , now
    ;

  // connect to db and get stuff
  level(this._storage, {keyEncoding: 'utf8', valueEncoding: 'json'}, function(err, db)
  {
    if (err) return callback(err);

    _chat._db = db;

    async.series(
    { meta   : _chat._fetchSlice.bind(_chat, token.meta)
    , user   : _chat._fetchSlice.bind(_chat, token.user)
    , message: _chat._fetchSlice.bind(_chat, token.message)
    }, function(err, res)
    {
      if (err) return callback(err);

      _chat.meta    = res.meta;
      _chat.user    = res.user;
      _chat.message = res.message;

      // {{{ create chat instance id
      // to prevent user name collisions
      // after db reset
      if (!_chat.meta.instance)
      {
        now = process.hrtime();

        _chat.save('meta', 'instance', now[1].toString(36) + now[0].toString(36), callback);
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
Chat.prototype.save = function Chat_save(channel, key, value, callback)
{
  var _chat = this;

  this._db.put(token[channel]+':'+key, value, function(err)
  {
    if (err) return callback(err);

    // update local
    _chat[channel][key] = value;

    return callback(null);
  });
}

// loads data from db
Chat.prototype.load = function Chat_load(channel, key, callback)
{
  this._db.get(token[channel]+':'+key, function(err, value)
  {
    if (err)
    {
      // reset local
      if (key in _chat[channel])
      {
        delete _chat[channel][key];
      }

      if (err.notFound)
      {
        return callback(null, undefined);
      }

      return callback(err);
    }

    // update local
    _chat[channel][key] = value;

    return callback(null, value);
  });
}

// logins with existing user
Chat.prototype.login = function Chat_login(user, callback)
{
  var _chat = this
    , userData
    ;

  if (!user.nickname || !user.password)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (!this.user[user.nickname] || this.user[user.nickname].password != user.password)
  {
    return callback({code: 401, message: 'Wrong user/password combination.'});
  }

  // create user object
  userData = {socketid: user.socketid, nickname: user.nickname, password: user.password};

  // save
  this.save('user', userData.nickname, userData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    sockets[userData.socketid] = userData;
    return callback(null, userData);
  });
}

// creates new user
Chat.prototype.join = function Chat_join(user, callback)
{
  var _chat = this
    , userData
    , password
    ;

  if (!user.nickname)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (this.user[user.nickname] && !user['force'])
  {
    return callback({code: 400, message: 'User '+user.nickname+' already exists.'});
  }

  if (user.nickname.match(blockedNames) && !user['force'])
  {
    return callback({code: 400, message: 'Name '+user.nickname+' is not allowed.'});
  }

  // create password
  password = user.password || this._generatePassword();

  // create user object
  userData = {socketid: user.socketid, nickname: user.nickname, password: password};

  // clean up dead socket.id
  if (user['force'] && this.user[user.nickname])
  {
    // TODO: Send up 'left' event
    delete sockets[this.user[user.nickname].socketid];
  }

  // save
  this.save('user', userData.nickname, userData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    sockets[userData.socketid] = userData;
    return callback(null, userData);
  });
}

// cleans up disconnected user
Chat.prototype.left = function Chat_left(user, callback)
{
  var _chat = this
    , userData
    ;

  if (!user.socketid || !sockets[user.socketid])
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  // cleanup user object
  userData = sockets[user.socketid];
  delete userData.socketid;
  delete sockets[user.socketid];

  // resave
  this.save('user', userData.nickname, userData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, userData);
  });
}

// Attaches reference to known external objects
Chat.prototype.attach = function Chat_attach(collection)
{
  // game reference
  if ('game' in collection)
  {
    this._game = collection['game'];
  }

  // websockets reference
  if ('sockets' in collection)
  {
    this._sockets = collection['sockets'];
  }
}

// Adds new message
Chat.prototype.addMessage = function Chat_addMessage(message, callback)
{
  var _chat = this
    , now   = process.hrtime()
    , messageData
    ;

  if (!message.text || !message.socketid)
  {
    return callback({code: 400, message: 'Missing data.'});
  }

  if (!sockets[message.socketid])
  {
    return callback({code: 403, message: 'Permission denied.'});
  }


  // create message data
  messageData = {time: Date.now(), user: sockets[message.socketid].nickname, text: message.text};

  // add id
  messageData.id = now[0] * 1e9 + now[1];

  // save
  this.save('message', messageData.id, messageData, function(err)
  {
    if (err) return callback({code: 500, message: err});
    return callback(null, messageData);
  });
}

// local join call, ignoring all the constrains
Chat.prototype.forceJoin = function Chat_forceJoin(sockets, socket, data)
{
  // check socket ids, in case user logged in properly already
  if (this.user[data.nickname] && socket.id == this.user[data.nickname].socketid) return;

  this.join({
    nickname: data.nickname,
    password: data.password,
    socketid: socket.id,
    force   : true
  }, function Chat_forceJoin_callback(err, user)
  {
    if (err) return socket.write({ 'chat:error': {err: err, origin: 'join', data: data} });

    sockets.write({ 'chat:user': {nickname: user.nickname} });
    socket.write({ 'chat:logged': {nickname: user.nickname, password: user.password} });
  });
}

// --- Internal logic lives here

// sets event listeners
// Note: all the event handlers bound to primus (websockets) object
Chat.prototype._initEventListeners = function Chat__initEventListeners()
{
  var _chat = this;

  this.events = {};

  // [helo] initial handshake
  this.events['helo'] = function Chat__initEventListeners_helo(socket, data)
  {
    // don't talk to anybody else
    if (data != 'chat') return;

    // send initial data to the requesting socket
    socket.write(
    {
      chat:
      { instance: _chat.meta.instance
        // send upstairs only nicknames
      , users   : _.pluck(_chat.user, 'nickname')
        // send upstairs last 50 messages
      , messages: _.last(_.values(_chat.message), 50)
      }
    });
  };

  // [disconnection]
  this.events['disconnection'] = function Chat__initEventListeners_disconnection(socket)
  {
    var _sockets = this;

    _chat.left(
    {
      socketid: socket.id
    }, function Chat_left_callback(err, user)
    {
      if (err) return console.log({ 'chat:error': {err: err, origin: 'disconnection', data: user} });

      _sockets.write({ 'chat:left': {nickname: user.nickname} });
    });
  };

  // [chat:login]
  this.events['chat:login'] = function Chat__initEventListeners_chat_login(socket, data)
  {
    var _sockets = this;

    // check socket ids, in case user already logged in via forceJoin
    if (data && _chat.user[data.nickname] && socket.id == _chat.user[data.nickname].socketid) return;

    _chat.login(
    {
      nickname: data.nickname,
      password: data.password,
      socketid: socket.id
    }, function Chat_login_callback(err, user)
    {
      if (err) return socket.write({ 'chat:error': {err: err, origin: 'login', data: data} });

      socket.write({ 'chat:logged': {nickname: user.nickname, password: user.password} });
      _sockets.write({ 'chat:user': {nickname: user.nickname} });
    });
  };

  // [chat:join]
  this.events['chat:join'] = function Chat__initEventListeners_chat_join(socket, data)
  {
    var _sockets = this;

    // no new chat users during countdown
    if (_chat._game.state['timer'])
    {
      socket.write({ 'chat:error': {err: {code: 503, message: 'Chat is blocked during countdown.'}, origin: 'join'} });
      return;
    }

    _chat.join({
      nickname: _chat._stripTags(data.nickname).replace(/^_+|_+$/g, ''), // trim _
      socketid: socket.id
    }, function Chat_join_callback(err, user)
    {
      if (err) return socket.write({ 'chat:error': {err: err, origin: 'join', data: data} });

      _sockets.write({ 'chat:user': {nickname: user.nickname} });
      socket.write({ 'chat:logged': {nickname: user.nickname, password: user.password} });
    });
  };

  // [chat:message]
  this.events['chat:message'] = function Chat__initEventListeners_chat_message(socket, data)
  {
    var _sockets = this;

    // no messages during countdown
    // unless it's admin
    if (_chat._game.state['timer'] && !_chat._game._isAdmin(socket, 'chat:message', false))
    {
      socket.write({ 'chat:error': {err: {code: 503, message: 'Chat is blocked during countdown.'}, origin: 'message'} });
      return;
    }

    _chat.addMessage({
      text: _chat._stripTags(data).trim(), // + cleanup
      socketid: socket.id
    }, function Chat_message_callback(err, message)
    {
      if (err) return socket.write({ 'chat:error': {err: err, origin: 'message', data: data} });
      _sockets.write({ 'chat:message': message });
    });
  };

}


// --- Santa's little helpers

// fetches slice of data from the database
Chat.prototype._fetchSlice = function Chat__fetchSlice(slice, callback)
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

// generate (uniqly) random hash
Chat.prototype._generatePassword = function Chat__generatePassword()
{
  var time = process.hrtime() // get unique number
    , salt = Math.floor(Math.random() * Math.pow(10, Math.random()*10)) // get variable length prefix
    , hash = salt.toString(36) + time[1].toString(36) + time[0].toString(36) // construct unique id
    ;

  return hash;
}

// Strips html tags from provided string
Chat.prototype._stripTags = function Chat__stripTags(s)
{
  return s ? (''+s).replace(/<[^<]*(>|$)/g, '') : '';
}
