$.domReady(function()
{
  var primus        = new Primus()
    , formatSeconds = d3.format('02')
    , formatFrac    = d3.format('03')
    , isRotating    = false // board rotating flag
    , currentXY     = [0, 0]
    , rotatedXYZ    = [60, 0, 15]
    , boardPanel    = $('.board')
    , direction     = [0, 0]
    , bodyDim
    , initAngle
    ;

  var transformName = '';
  if (navigator.userAgent.match(/AppleWebKit/))
  {
    vP = '-webkit-';
  }

  // connect to the server
  primus.on('open', function primus_onOpen()
  {
    // say hello
    primus.write({ helo: 'game' });
  });

  // events come from data
  primus.on('data', function primus_onData(data)
  {
    // [game] welcome message
    if (data.game)
    {
      renderTeams(data.game.teams, data.game.questions);
    }
  });

  $('body').on('mousedown', function(e)
  {
    bodyDim = $('body').dim();

    isRotating = true;
    currentXY  = [e.pageX, e.pageY];

    initAngle  = getAngle(e.pageX, e.pageY);

    $('body').addClass('rotating');
  });
  $('body').on('mousemove', function(e)
  {
    var dY, angle;

    if (isRotating)
    {
      angle = getAngle(e.pageX, e.pageY);
      dY = e.pageY - currentXY[1];

      rotatedXYZ[0] -= Math.floor((dY / bodyDim.height * 100) * 0.9);
      currentXY[1] = e.pageY;

      rotatedXYZ[2] += angle - initAngle;
      initAngle = angle;

      boardPanel.css(vP+'transform', 'translateX(-50%) translateY(-50%) rotateX('+rotatedXYZ[0]+'deg) rotateY('+rotatedXYZ[1]+'deg) rotateZ('+rotatedXYZ[2]+'deg)');
    }
  });
  $('body').on('mouseup', function()
  {
    isRotating = false;
    currentXY  = [0, 0];

    $('body').removeClass('rotating');
  });

  function renderTeams(teams, questions)
  {
    // pre
    boardPanel.css('min-width', (questions.length*60)+'px');
    boardPanel.css('min-height', (teams.length*60)+'px');

    var board
      , team
      , round
      , minCellSize  = 26
      , boardDim     = boardPanel.dim()
      , cellWidth    = (100/questions.length)
      , cellHeight   = (100/teams.length)
      , shortSide    = Math.floor(Math.min(boardDim.width/questions.length, boardDim.height/teams.length))
      , cubeSide     = Math.max(minCellSize, shortSide - (shortSide % 50) - 50) // min side - 20px
      , cubeStep     = Math.max(1, Math.floor(cubeSide / 20))
      , current      = {}
      , pseudoStyles = []
      , stylebox
      ;

    // check for custom styles
    if (!stylebox)
    {
      stylebox = $('<style></style>').appendTo('head');
    }

    teams.sort(sortTeams);

    board = d3.select(boardPanel[0]);

    // add content dependent styles
    pseudoStyles.push('.team:before, .team:after { line-height: '+Math.max(minCellSize, Math.floor(boardDim.height/100*cellHeight)-20)+'px; }');

    // team
    team = board.selectAll('.team')
      .data(teams, function(d){ return d.login; })
      .order()
      .attr('class', function(d){ return 'team_'+d.login; })
      .classed('team', true)
      .style('height', cellHeight+'%')
      .attr('data-name', function(d){ return d.name; })
      .attr('data-points', function(d)
      {
        var frac = d.time_bonus && d.points ? Math.round(d.time_bonus / ((d.points - (d.adjustment || 0)) * 60000) * 1000) : 0;
        return d.points + '.' + formatFrac(frac);
      })
      ;

    team.enter().append('div')
      .order()
      .style('height', cellHeight+'%')
      .attr('class', function(d){ return 'team_'+d.login; })
      .classed('team', true)
      .attr('data-name', function(d){ return d.name; })
      .attr('data-points', function(d)
      {
        var frac = d.time_bonus && d.points ? Math.round(d.time_bonus / ((d.points - (d.adjustment || 0)) * 60000) * 1000) : 0;
        return d.points + '.' + formatFrac(frac);
      })
      ;

    team.exit()
      .remove()
      ;

    // round
    round = team.selectAll('.round')
      .data(function(d){ return $.values($.map(questions, function(q){ return d.answers[q.index] ? $.merge(d.answers[q.index], {id: q.index, played: q.played, team: d.login}) : {id: q.index, played: false, team: d.login}; })); })
      .order()
      .style('width', cellWidth+'%')
      .attr('class', function(d){ return 'round_'+d.id; })
      .classed('round', true)
      .classed('played', function(d){ return !!d.played; })
      .attr('data-round', function(d){ return d.id; })
      ;

    round.enter().append('div')
      .order()
      .style('width', cellWidth+'%')
      .attr('class', function(d){ return 'round_'+d.id; })
      .classed('round', true)
      .classed('played', function(d){ return !!d.played; })
      .attr('data-round', function(d){ return d.id; })
      .html(function(d)
      {
        var tall      = d.time ? cubeStep*(d.time[0]) : 0
          , outStyles = []
          , inStyles  = []
          ;

        outStyles.push('width: '+cubeSide+'px');
        outStyles.push('height: '+cubeSide+'px');
        outStyles.push('margin: -'+Math.floor(cubeSide/2)+'px 0px 0px -'+Math.floor(cubeSide/2)+'px');
        outStyles.push('background-color: '+(d.correct === null ? 'rgba(221, 221, 221, 0.5)' : (d.correct ? 'rgba(51, 221, 51, 0.5)' : 'rgba(221, 51, 51, 0.5)')));
        outStyles.push('outline: 1px solid '+(d.correct === null ? '#cccccc' : (d.correct ? 'rgba(51, 221, 51, 0.9)' : 'rgba(221, 51, 51, 0.6)')));

        inStyles.push('line-height: '+cubeSide+'px');
        inStyles.push('font-size: '+Math.floor(cubeSide/2)+'px');
        inStyles.push('color: '+(d.correct === null ? '#999999' : '#ffffff'));
        inStyles.push('-webkit-transform: rotateZ(90deg) translateZ('+tall+'px)');
        inStyles.push('transform: rotateZ(90deg) translateZ('+tall+'px)');

        pseudoStyles.push('.team_'+d.team+' .round_'+d.id+' .cube:before { left: -'+Math.ceil(tall/2)+'px; width: '+tall+'px; } ');
        pseudoStyles.push('.team_'+d.team+' .round_'+d.id+' .cube:after { right: -'+Math.ceil(tall/2)+'px; width: '+tall+'px; } ');

        pseudoStyles.push('.team_'+d.team+' .round_'+d.id+' .cube>i:before { left: -'+Math.ceil(tall/2)+'px; width: '+tall+'px; } ');
        pseudoStyles.push('.team_'+d.team+' .round_'+d.id+' .cube>i:after { right: -'+Math.ceil(tall/2)+'px; width: '+tall+'px; } ');

        return d.time ? '<span style="'+outStyles.join('; ')+';" class="cube"><i style="'+inStyles.join('; ')+';">:'+formatSeconds(d.time[0])+'</i></span>' : '';
      })
      ;

    round.exit()
      .remove()
      ;

    // add styles for pseudo elements
    stylebox.html(pseudoStyles.join('\n'));

    // done
    boardPanel.removeClass('loading');
  }

  function sortTeams(a, b)
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

  // deps: bodyDim
  function getAngle(x, y)
  {
    var centerPoint
      , dX
      , dY
      ;

    centerPoint = [Math.floor(bodyDim.width/2), Math.floor(bodyDim.height/2)];

    dX = centerPoint[0] - x;
    dY = centerPoint[1] - y;

    return Math.atan2(dY, dX) / Math.PI * 180;
  }

});

