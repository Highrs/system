'use strict';
//What are you doing here? How did you get here? Leave.

const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const icons = require('./icons.js');
const lists = require('./lists.js');

function getPageWidth() {return document.body.clientWidth;}
function getPageHeight() {return document.body.clientHeight;}

const drawGrid = (mapPan, options, reReRenderScaleBar) => {
  let grid = ['g', {}];
  let actualGridStep = options.gridStep * mapPan.zoom;
  if (actualGridStep < 100) {actualGridStep *= 10;}

  let gridRectStartX = - mapPan.x + (mapPan.x) % (actualGridStep) - actualGridStep;
  let gridRectStartY = - mapPan.y + (mapPan.y) % (actualGridStep) - actualGridStep;
  let gridRectEndX = gridRectStartX + getPageWidth() + actualGridStep * 2;
  let gridRectEndY = gridRectStartY + getPageHeight() + actualGridStep * 2;

  for (let x = gridRectStartX; x < (gridRectEndX); x += actualGridStep) {
    for (let y = gridRectStartY; y < (gridRectEndY); y += actualGridStep) {
      grid.push(
        icons.gridCross(options.gridCrossSize,  x,  y)
      );
    }
  }

  reReRenderScaleBar(options, mapPan);

  return grid;
};
exports.drawGrid = drawGrid;
exports.drawGridScaleBar = (options, mapPan) => {
  let actualGridStep = options.gridStep * mapPan.zoom;
  let gridStep = actualGridStep;
  let label = "10";
  if (actualGridStep < 100) {
    gridStep = actualGridStep *= 10;
    label = "100";
  }
  let stepTenth = gridStep / 10;
  let bar = ['g', tt(5, (getPageHeight()-30-5))];

  bar.push(['rect', {y: 10, height: 20, width: gridStep + 10, class:'standardBox'}]);


  for (let i = 0; i < 10; i+= 2) {
    bar.push(['g', tt(i * (stepTenth) + 5, 15),
      ['path', {
        d: 'M 0,0 L '+ (stepTenth) + ', 0 L '+ (stepTenth) + ', 7 L 0, 7 Z',
        class:'scaleEmpty',
      }]
    ]);
    bar.push(['g', tt((i + 1) * (stepTenth) + 5, 20),
      ['path', {
        d: 'M 0,-2 L '+ (stepTenth) + ', -2 L '+ (stepTenth) + ', 5 L 0, 5 Z',
        class:'scaleFull',
      }]
    ]);
  }

  bar.push(['g', tt(0,-10),
    ['rect', {height: 20, width: 20, class:'standardBox'}],
    ['text', {y: 15.5, x: 4.5, class:'craftDataText'}, "0"]
  ]);
  bar.push(['g', tt(20,-10),
    ['rect', {height: 20, width: 40, class:'standardBox'}],
    ['text', {y: 15.5, x: 4.5, class:'craftDataText'}, "Mkm"]
  ]);
  bar.push(['g', tt(gridStep - 30, -10),
    ['rect', {height: 20, width: 40, class:'standardBox'}],
    ['text', {y: 15.5, x: 4.5, class:'craftDataText'}, label]
  ]);

  return bar;
};
const drawOrbits = (bodies, mapPan) => {
  if (bodies.length < 1) {return ['g', {}];}

  let retGroup = ['g', {}];
  const zoom = mapPan.zoom;

  bodies.forEach(bodyo => {
    // console.log(bodyo);
    let partOrbit = ['g', {id: bodyo.mapID + '-ORB'}];
    let coords = 'M ';

    for (let i = 0; i < bodyo.orbitPointsArr.length; i++) {
      let currCoord = bodyo.orbitPointsArr[i];
      let currX = currCoord.ax * zoom;
      let currY = currCoord.ay * zoom;

      coords += currX + ',' + currY;
      (i === bodyo.orbitPointsArr.length - 1)?(coords += 'Z'):(coords += 'L');
    }

    partOrbit.push(['path', { d: coords, class: 'majorOrbit' }]);
    partOrbit.push(['line',
      {
        x1: bodyo.orbitDivLine[0].ax * zoom,
        y1: bodyo.orbitDivLine[0].ay * zoom,
        x2: bodyo.orbitDivLine[1].ax * zoom,
        y2: bodyo.orbitDivLine[1].ay * zoom,
        class: 'orbitDivLine'
      }]);
    partOrbit.push(
      ['g', tt(bodyo.orbitDivLine[0].ax * zoom, bodyo.orbitDivLine[0].ay * zoom),
        icons.apsis('-')
      ],
      ['g', tt(bodyo.orbitDivLine[1].ax * zoom, bodyo.orbitDivLine[1].ay * zoom),
        icons.apsis()
      ]
    );
    retGroup.push(partOrbit);
  });

  return retGroup;
};
exports.drawOrbits = drawOrbits;
const drawStars = (stars, mapPan) =>{
  let drawnStars = ['g', {}];
  stars.forEach((staro) => {
    drawnStars.push(icons.star(staro, mapPan));
    // drawnStars.push(drawPolarGrid(staro));
  });
  return drawnStars;
};
exports.drawStars = drawStars;
exports.drawScreenFrame = () => {
  let frame = ['g', {}];

  frame.push( ['g', tt(4,4),
    ['g', tt(0, 0, {id:'buttonSettings', class: 'standardBoxSelectable'}),
      ['rect', {width: 30, height: 30}],
      ['g', tt(15,15),
        ['path', {d:'M 8 -9 A 12 12 0 1 1 -8 -9', class:'UIcon'}],
        ['path', {d:'M 0, 0 L 0, -13', class:'UIcon'}]
      ]
    ]
  ]);
  frame.push( ['g', tt(4,38),
    ['g', tt(0, 0, {id:'button', class: 'standardBoxSelectable'}),
      ['rect', {width: 30, height: 30}],
    ]
  ]);
  frame.push( ['g', tt(4,72),
    ['g', tt(0, 0, {id:'button', class: 'standardBoxSelectable'}),
      ['rect', {width: 30, height: 30}],
    ]
  ]);

  frame.push( ['g', {},
    ['path',
      { d: 'M 40, 2 L 2, 2 L 2, 40',
      class: 'frame' }],
    ['path',
      { d: 'M ' + (getPageWidth() - 40) + ', 2 L ' + (getPageWidth() - 2) + ', 2 L ' + (getPageWidth() - 2) + ', 40',
      class: 'frame' }],
    ['path',
      { d: 'M ' + (getPageWidth() - 40) + ', ' + (getPageHeight() - 2) + ' L ' + (getPageWidth() - 2) + ', ' + (getPageHeight() - 2) + ' L ' + (getPageWidth() - 2) + ', ' + (getPageHeight() - 40) + '',
      class: 'frame' }],
    ['path',
      { d: 'M 40, ' + (getPageHeight() - 2) + ' L 2, ' + (getPageHeight() - 2) + ' L 2, ' + (getPageHeight() - 40) + '',
      class: 'frame' }]
  ]);

  return frame;
};
const drawSimRateModule = (x, y) => {
  let btSz = 30;
  let mrgn = 3;
  return ['g', {id: 'simRateModule'},
    // ['rect', {width: 10, height: 2, class: 'standardBox'}],
    ['g', tt(x,y),
      ['rect', {width: btSz*6+mrgn*4+8, height: btSz+24, class: 'standardBox'}],
      ['text', {class: 'dataText', x: 4, y:15}, 'Simulation rate:']
    ],
    ['g', tt(x+4,y+20),
      ['g', tt(0, 0, {id:'buttonStop', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        ['path', { d: 'M 11, 4 L 11, 26', class: 'UIcon'}],
        ['path', { d: 'M 19, 4 L 19, 26', class: 'UIcon'}],
        // icons.arrow(2, true),
      ],
      ['g', tt(btSz+mrgn,0, {id:'buttonSlow', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(0, true)
      ],
      ['g', tt((btSz+mrgn)*2,0, {id:'simRateDisplay', class: 'standardBox'}),
        ['rect', {width: btSz*2, height: btSz}],
        ['g', {id: 'rateCounter'}]
      ],
      ['g', tt((btSz*4)+(mrgn*3),0, {id:'buttonFast', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(0, false)
      ],
      ['g', tt((btSz*5)+(mrgn*4),0, {id:'buttonMax', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(4, false),
        icons.arrow(-4, false),
      ]
    ]
  ];
};
exports.drawSimRateModule = drawSimRateModule;
exports.drawRateCounter = (options) => {
  return ['text', {x: 4, y: 19,class: 'dataText bold'}, 'X ' + options.rate];
  //options.rate.toString().length
};
exports.drawBoxSettings = () => {
  let box = ['g', {}];

  box.push(['rect', {height: 160, width: 238, class:'standardBox'}]);
  box.push(['rect', {height: 20, width: 208, class:'standardBoxSelectable', id:'boxSettingsDragger'}]);
  box.push(['g', tt(208, 0, {id: 'boxSettingsCloser', class:'standardBoxSelectable'}),
    ['rect', {height: 30, width: 30}],
    ['path', {d: 'M 4, 4 L 26, 26', class: 'UIcon'}],
    ['path', {d: 'M 4, 26 L 26, 4', class: 'UIcon'}]
  ]);
  // box.push(['g', tt(208, 0, {id: 'boxSettingsCloser', class:'standardBoxSelectable'})]);

  let keys = ['g', tt(4, 24)];
  let keysHeight = lists.keys().length * 15 + 4;
  keys.push(['rect', {width: 30*6+3*4+8, height: keysHeight, class: 'standardBox'}]);
  for (let i = 0; i < lists.keys().length; i++) {
    keys.push(['g', tt(2,  16 * i + 14), [ 'text', {class: 'dataText'}, lists.keys()[i] ]],);
  }
  box.push(keys);

  box.push(drawSimRateModule(4, 24 + keysHeight + 4));

  return box;
};

//Moving elements rendered in /main
exports.drawMovingOrbits = (moons, mapPan) => {
  return ['g', {}, drawOrbits(moons, mapPan)];
};
exports.drawSimpleOrbit = (stationo, mapPan) => {

  let retGroup = ['g', {}];

  retGroup.push(
    ['g', tt(stationo.primaryo.x * mapPan.zoom, stationo.primaryo.y * mapPan.zoom),
      ['circle', {
        r : stationo.a * mapPan.zoom,
        class: 'minorOrbit'}
      ]
    ]
  );

  return retGroup;
};
exports.drawRanges = (bodyArr, mapPan) => {
  let rangesDrawn = ['g', {}];
  let linesDrawn = ['g', {}];
  let windowsDrawn = ['g', {}];

  for (let i = 0; i < bodyArr.length; i++) {
    if (bodyArr[i].industry) {
      for (let j = i + 1; j < bodyArr.length; j++) {
        if (bodyArr[j].industry) {
          linesDrawn.push(['line', {
            x1: bodyArr[i].x * mapPan.zoom,
            y1: bodyArr[i].y * mapPan.zoom,
            x2: bodyArr[j].x * mapPan.zoom,
            y2: bodyArr[j].y * mapPan.zoom,
            class: 'rangeLine'
          }]);

          let dist = mech.calcDist(bodyArr[i], bodyArr[j]);

          windowsDrawn.push(['g',
          tt((((bodyArr[j].x) + (bodyArr[i].x)) / 2) * mapPan.zoom,
            (((bodyArr[j].y) + (bodyArr[i].y)) / 2) * mapPan.zoom),
            ['circle', {r: 2, class: 'rangeWindow'}],
            ['rect', {
              width: 42,
              height: 10,
              class: 'rangeWindow'
            }],
            ['text', {
              x: 2,
              y: 8.5,
              class: 'rangeText'}, (dist).toFixed(2)]
          ]);
        }
      }
    }
  }
  rangesDrawn.push(linesDrawn, windowsDrawn);

  return rangesDrawn;
};
exports.drawBody = (bodyo) => {
  let drawnBody = ['g', {}];
  // drawnBody.push(drawBodyData(bodyo));

  if (bodyo.shadow) {drawnBody.push(drawShadow(bodyo));}
  drawnBody.push(icons.body(bodyo));
  drawnBody.push(icons.brackets(bodyo.id, bodyo.objectRadius));

  return drawnBody;
};
const drawShadow = (bodyo) => {
  let shadow = ['g', {
    id: bodyo.mapID + '-SHAD',
    transform: 'rotate(0)'
  }];

  let rad = bodyo.objectRadius * 2;
  let shadLeng = rad*100;
  let shadWidth = rad*10;


  let coords1 = 'M '+rad+',0 L 0,'+shadLeng+' L -'+rad+',0 Z';
  let coords2 = 'M '+rad+',0 L '+shadWidth+','+shadLeng+' L -'+shadWidth+','+shadLeng+' L -'+rad+',0 Z';


  shadow.push(
    ['path', {
      d: coords1,
      // class: 'shadow',
      fill: 'url(#ShadowGrad)'
    }]
  );

  shadow.push(
    ['path', {
      d: coords2,
      // class: 'shadow',
      fill: 'url(#ShadowGrad)'
    }]
  );


  return shadow;
};
exports.drawStation = (stationo) => {
  const drawnStation = ['g', {}];

  // drawnStation.push(['g', {}, drawBodyData(stationo),]);

  drawnStation.push(icons.station(stationo));
  drawnStation.push(icons.brackets(stationo.id, 5));

  return drawnStation;
};
exports.drawCraft = (crafto) => {
  const drawnCraft = ['g', {},
    ['g', {
      transform: 'rotate(' + crafto.course + ')',
      id: crafto.mapID + '-ROT'
    },
    ['path', {
      d: 'M 0,0 L -2, '+(-crafto.accel*8)+' L 2, '+(-crafto.accel*8)+' Z',
      class: 'vector'
    }],
    icons.craft(crafto),
    ]
  ];

  //
  //
  //   // ['g', {
  //   //   transform: 'rotate(' + (crafto.accelStat === 1 ? crafto.course : crafto.course + 180) + ')'
  //   // }, [
  //   // ]],
  //
  //   ['line', {
  //     x1: 0,
  //     y1: 0,
  //     x2: crafto.vx,
  //     y2: crafto.vy,
  //     class: 'vector'
  //   }],
  //   ['g', {
  //     transform: 'translate('+crafto.vx+', '+crafto.vy+')'
  //   }, [
  //     'circle',
  //     {r : 2, class: 'vector'}
  //   ]],
  //   icons.brackets(crafto.id)
  // ]];

  return drawnCraft;
};
exports.updateCraft = (crafto) => {
  if (crafto.type === 'craft' && crafto.render) {
    if (crafto.status === 'new' || crafto.status === 'parked') {
      if (crafto.visible) {
        document.getElementById(crafto.mapID).style.visibility = "hidden";
        crafto.visible = false;
      }
    } else if (crafto.status === 'traveling' || crafto.status === 'drifting') {
      if (!crafto.visible) {
        document.getElementById(crafto.mapID).style.visibility = "visible";
        crafto.visible = true;
        // console.log('here');
      }
      let rotation = crafto.accelStat === -1 ? crafto.course : crafto.course + 180;

      document.getElementById(crafto.mapID + '-ROT').setAttribute(
        'transform', 'rotate(' + (rotation) + ')'
      );
    }
  }
};
exports.drawIntercepts = (listOfcraft, mapPan) => {
  let intercepts = ['g', {}];

  listOfcraft.forEach(crafto => {
    if (crafto.intercept && (crafto.status === 'traveling')) {
      intercepts.push(
        ['g',
        tt(crafto.intercept.x * mapPan.zoom, crafto.intercept.y * mapPan.zoom),
        ['g', {transform: 'scale(2,2)'},
          icons.marker()]
        ]
      );
    }
  });

  return intercepts;
};
exports.drawStatic = () => {
  let starColor = '#ff7800';
  let shadowColor = "#363636";
  return getSvg({w:getPageWidth(), h:getPageHeight(), i:'allTheStuff'}).concat([
    ['defs',
      ['radialGradient', {id: "RadialGradient1", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "0%", 'stop-color': starColor, 'stop-opacity': 0.5 }],
        ['stop', {offset: "100%", 'stop-color': "#363636", 'stop-opacity':    0 }]
      ],
      ['radialGradient', {id: "RadialGradient2", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': "#000000", 'stop-opacity':   0.25 }],
        ['stop', {offset: "50%", 'stop-color': "#000000", 'stop-opacity':   0.1 }],
        ['stop', {offset: "100%", 'stop-color': "#363636", 'stop-opacity':  0 }]
      ],
      ['radialGradient', {id: "RadialGradient3", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': starColor, 'stop-opacity':  1 }],
        ['stop', {offset: "35%", 'stop-color': starColor, 'stop-opacity':  0.3 }],
        ['stop', {offset: "50%", 'stop-color': starColor, 'stop-opacity':  0.1 }],
        ['stop', {offset: "100%", 'stop-color': starColor, 'stop-opacity': 0 }]
      ],
      ['radialGradient', {id: "EngineFlare",     cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': "#ffffff", 'stop-opacity':  0.1 }],
        ['stop', {offset: "90%", 'stop-color': "#ffffff", 'stop-opacity':  0.01 }],
        ['stop', {offset: "100%", 'stop-color': "#ffffff", 'stop-opacity': 0 }]
      ],
      ['linearGradient', {id: "ShadowGrad",     x1: 0, x2: 0, y1: 0, y2: 1 },
        ['stop', {offset: "0%", 'stop-color': shadowColor, 'stop-opacity':  0.5 }],
        ['stop', {offset: "50%", 'stop-color': shadowColor, 'stop-opacity': 0 }]
      ],
    ],
    ['g', {id: 'map'},
      ['g', {id: 'staticOrbits'}],
      ['g', {id: 'movingOrbits'}],
      ['g', {id: 'simpleOrbits'}],
      ['g', {id: 'stars'}],
      ['g', {id: 'grid'}],
      ['g', {id: 'moving'},
        // ['g', {id: 'majorOrbits'}],
        ['g', {id: 'simpleOrbits'}],
        ['g', {id: 'ranges'}],
        ['g', {id: 'belts'}],
        ['g', {id: 'bodies'}],
        // ['g', {id: 'bodiesMoons'}],
        // ['g', {id: 'bodiesPlanets'}],
        // ['g', {id: 'bodiesAsts'}],
        // ['g', {id: 'stations'}],
        ['g', {id: 'crafts'}],
      ],
      ['g', {id: 'intercept'}]
    ],
    ['g', {id: 'screenFrame'}],
    ['g', {id: 'gridScaleBar'}],
    ['g', {id: 'boxes'},
      ['g', {id: 'boxMainSettings'}]
    ]
  ]);
};
