$.domReady(function()
{
  /* var */ primus = new Primus();

  var chat = new Chat(
      { d3            : d3
      , transport     : primus
      , messageList   : '.log'
      , messageBox    : '.chat_messagebox'
      , submitButton  : '.chat_messagebox_send'
      , hotkeyMod     : '.chat_messagebox_hotkey_mod'
      , userPanel     : '.user'
      , nicknameBox   : '.user_nickname'
      , userJoinButton: '.user_join'
      })
    ;

  /*var*/ game = new Game(
      { type      : window.gameType
      , chat      : chat
      , d3        : d3
      , transport : primus
      , scoreboard: '.scoreboard'
      , teamsList : '.scoreboard_teams'
      , timer     : '.timer'
      , question  : '.question'
      , answer    : '.answer'
      })
    ;
});

