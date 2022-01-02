'use strict';
//What are you doing here? How did you get here? Leave.

const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const icons = require('./icons.js');
const lists = require('./lists.js');

function getPageWidth() {return document.body.clientWidth;}
function getPageHeight() {return document.body.clientHeight;}
const boundsCheck = (x, y, margin = 10) => {
  if (
    x + margin > 0 &&
    x - margin < getPageWidth() &&
    y + margin > 0 &&
    y - margin < getPageHeight()
  ) {
    return true;
  } else {
    return false;
  }
};

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
    let partOrbit = ['g', tt(bodyo.primaryo.x * zoom, bodyo.primaryo.y * zoom)];
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
const drawSimpleOrbit = (stations, mapPan) => {
  if (stations.length < 1) {return ['g', {}];}

  let retGroup = ['g', {}];

  stations.forEach(e => {
    retGroup.push(
      ['g', tt(e.px * mapPan.zoom, e.py * mapPan.zoom),
        ['circle', {r : e.a * mapPan.zoom, class: 'minorOrbit'}]
      ]
    );
  });

  return retGroup;
};
const drawBodyData = (bodyo) => {
  let dataDisp = ['g', {}];

  dataDisp.push(
    ['path', {d: 'M 0,0 L 20, -20 L 80, -20', class: 'dataLine'}],
    ['text', {x: 20, y: -22, class: 'dataText'}, bodyo.name],
    ['text', {x: 20, y: -10, class: 'rangeText'},
      (bodyo.x).toFixed(0) + ',' +
      (bodyo.y).toFixed(0) + ',' +
      (bodyo.z).toFixed(0)
    ]
  );

  return dataDisp;
};
const drawBodies = (bodies, options, mapPan) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  bodies.forEach (bodyo =>{
    if (boundsCheck(bodyo.x * mapPan.zoom + mapPan.x, bodyo.y * mapPan.zoom + mapPan.y, bodyo.objectRadius * 3)) {
      let partBody = ['g', tt(bodyo.x * mapPan.zoom, bodyo.y * mapPan.zoom)];
      if (options.planetData) {
        partBody.push(drawBodyData(bodyo));
      }

      partBody.push(icons.body(bodyo, mapPan));
      bodiesDrawn.push(partBody);
    }
  });
  return bodiesDrawn;
};
const drawStations = (stations, options, mapPan) => {
  if (stations.length < 1) {return ['g', {}];}
  const stationsDrawn = ['g', {}];
  stations.forEach(stationo => {
    if (boundsCheck(stationo.x * mapPan.zoom + mapPan.x, stationo.y * mapPan.zoom + mapPan.y, 30)) {
      for (let i = 0; i < stations.length; i++) {
        let partStation = ['g', tt((stationo.x * mapPan.zoom), (stationo.y * mapPan.zoom))];
        if (options.planetData) {partStation.push(['g', {}, drawBodyData(stationo),]);}

        partStation.push(icons.station(stationo, mapPan));
        stationsDrawn.push(partStation);
      }
    }
  });


  return stationsDrawn;
};
const drawBelts = (belts, mapPan) => {
  let rocksDrawn = ['g', {}];

  belts.forEach(e => {
    e.rocks.forEach(rocko => {
      if (boundsCheck(rocko.x * mapPan.zoom + mapPan.x, rocko.y * mapPan.zoom + mapPan.y, rocko.objectRadius * 3)) {
        rocksDrawn.push(
          ['g', tt(rocko.x * mapPan.zoom, rocko.y * mapPan.zoom), icons.body(rocko, mapPan)]
        );
      }
    });
  });

  return rocksDrawn;
};
const drawStars = (stars, mapPan) =>{
  let drawnStars = ['g', {}];
  stars.forEach((staro) => {
    drawnStars.push(icons.star(staro, mapPan));
    // drawnStars.push(drawPolarGrid(staro));
  });
  return drawnStars;
};
exports.drawStars = drawStars;
const drawCraftData = (crafto) =>{
  let drawnData = ['g', {}];

  drawnData.push(
    ['path', {d: 'M 0,0 L 10, -10 L 25, -10', class: 'dataLine'}],
    ['text', {x: 10, y: -11, class: 'dataText'}, crafto.name + ' ' + crafto.abr],
    // ['text', {x: 10, y: -4, class: 'dataText'}, 'F:' + ((crafto.fuel / crafto.fuelCapacity) * 100).toFixed(0) + '%']
  );

  // let offset = 0;
  // Object.keys(crafto.cargo).forEach(specCargo => {
  //   if (crafto.cargo[specCargo] > 0) {
  //     drawnData.push(
  //       ['text', {x: 10, y: 8 * offset, class: 'dataText'}, specCargo + ':' + crafto.cargo[specCargo]]
  //     );
  //     offset++;
  //   }
  // });

  return drawnData;
};
const drawCraft = (listOfCraft, options, mapPan) => {
  let drawnCraft = ['g', {}];

  listOfCraft.forEach(crafto => {
    if (crafto.status === 'traveling' || crafto.status === 'drifting') {
      if (boundsCheck(crafto.x * mapPan.zoom + mapPan.x, crafto.y * mapPan.zoom + mapPan.y, 30)) {
        let partCraft = ['g', tt((crafto.x * mapPan.zoom), (crafto.y * mapPan.zoom))];

        // Accel Indicator
        partCraft.push(
          icons.thrustVector(crafto)
        );

        // Vector Line
        partCraft.push(
          ['line', {
            x1: 0,
            y1: 0,
            x2: crafto.vx,
            y2: crafto.vy,
            class: 'vector'
          }],
          ['g', tt(crafto.vx, crafto.vy), [
            'circle',
            {r : 2, class: 'vector'}
          ]]
        );

        // Data Display
        if (options.craftData) { partCraft.push(drawCraftData(crafto)); }

        // Craft Icon Itself
        partCraft.push(
          ['g', {},
            ['g', {transform: 'rotate(' + crafto.course + ')'},
              icons.craft(crafto)
            ]
          ]
        );

        drawnCraft.push(partCraft);
      }
    }
  });

  return drawnCraft;
};
const drawRanges = (bodyArr, mapPan) => {
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
const drawMovingOrbits = (moons, mapPan) => {
  return ['g', {}, drawOrbits(moons, mapPan)];
};
exports.drawScreenFrame = (options) => {
  let frame = ['g', {}];

  // if (options.headerKeys) {
  //   let keys = ['g', tt(4, 4)];
  //
  //   keys.push(['rect', {width: 170, height: lists.keys().length * 15 + 4, class: 'standardBox'}]);
  //
  //   for (let i = 0; i < lists.keys().length; i++) {
  //     keys.push(['g', tt(2,  16 * i + 14), [ 'text', {class: 'dataText'}, lists.keys()[i] ]],);
  //   }
  //
  //   frame.push(keys);
  // }

  frame.push( ['g', tt(4,4),
    ['g', tt(0, 0, {id:'buttonSettings', class: 'standardBoxSelectable'}),
      ['rect', {width: 30, height: 30}],
      ['g', tt(15,15),
        ['path', {d:'M 8 -9 A 12 12 0 1 1 -8 -9', class:'UIcon'}],
        ['path', {d:'M 0, 0 L 0, -13', class:'UIcon'}]
      ]
    ]
  ]);

  // frame.push(drawSimRateModule(4, 80));

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
      ['g', tt(0, 0, {id:'buttonStop', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        ['path', { d: 'M 6, 4 L 6, 16', class: 'standardLine'}],
        ['path', { d: 'M 12, 4 L 12, 16', class: 'standardLine'}],
        // icons.arrow(2, true),
      ],
      ['g', tt(btSz+mrgn,0, {id:'buttonSlow', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(2, true)
      ],
      ['g', tt((btSz+mrgn)*2,0, {id:'simRateDisplay', class: 'standardBox'}),
        ['rect', {width: btSz, height: btSz}],
        ['g', {id: 'rateCounter'}]
      ],
      ['g', tt((btSz+mrgn)*3,0, {id:'buttonFast', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(-2, false)
      ],
      ['g', tt((btSz+mrgn)*4,0, {id:'buttonMax', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(0, false),
        icons.arrow(-5, false),
      ]
    ]
  ];
};
exports.drawSimRateModule = drawSimRateModule;
exports.drawRateCounter = (options) => {
  return ['text', {x: 11, y: 15,class: 'dataText bold'}, options.rate];
  //options.rate.toString().length
};
exports.drawBoxSettings = () => {
  let box = ['g', {}];

  box.push(['rect', {height: 80, width: 160, class:'standardBox'}]);
  box.push(['rect', {height: 10, width: 150, class:'standardBoxSelectable', id:'boxSettingsDragger'}]);
  box.push(['g', tt(150, 0, {id: 'boxSettingsCloser', class:'standardBoxSelectable'}),
    ['rect', {height: 10, width: 10}],
    ['path', {d: 'M 2, 2 L 8, 8', class: 'standardLine'}],
    ['path', {d: 'M 2, 8 L 8, 2', class: 'standardLine'}]
  ]);

  return box;
};

exports.drawMoving = (options, clock, planets, moons, ast, belts, craft, stations, rendererMovingOrbits, mapPan) => {
  let rangeCandidates = [...planets, ...moons, ...ast];

  rendererMovingOrbits(drawMovingOrbits(moons, mapPan));

  return ['g', {},
    // drawHeader(clock, options),
    drawBelts(belts, mapPan),
    drawSimpleOrbit(stations, mapPan),
    drawRanges(rangeCandidates, mapPan),
    drawBodies(moons, options, mapPan),
    drawBodies(planets, options, mapPan),
    drawBodies(ast, options, mapPan),
    drawStations(stations, options, mapPan),
    drawCraft(craft, options, mapPan)
  ];
};
exports.drawIntercepts = (listOfcraft, mapPan) => {
  let intercepts = ['g', {}];

  listOfcraft.forEach(crafto => {
    if (crafto.intercept && (crafto.status === 'traveling')) {
      intercepts.push(['g', tt(crafto.intercept.x * mapPan.zoom, crafto.intercept.y * mapPan.zoom), icons.marker()]);
    }
  });

  return intercepts;
};
exports.drawStatic = (options, stars) => {
  return getSvg({w:getPageWidth(), h:getPageHeight(), i:'allTheStuff'}).concat([
    ['defs',
      ['radialGradient', {id: "RadialGradient1", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "0%", 'stop-color': stars[0].color, 'stop-opacity': 0.5 }],
        ['stop', {offset: "100%", 'stop-color': "#363636", 'stop-opacity':    0 }]
      ],
      ['radialGradient', {id: "RadialGradient2", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': "#000000", 'stop-opacity':   0.25 }],
        ['stop', {offset: "50%", 'stop-color': "#000000", 'stop-opacity':   0.1 }],
        ['stop', {offset: "100%", 'stop-color': "#363636", 'stop-opacity':  0 }]
      ],
      ['radialGradient', {id: "RadialGradient3", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': stars[0].color, 'stop-opacity':  1 }],
        ['stop', {offset: "35%", 'stop-color': stars[0].color, 'stop-opacity':  0.3 }],
        ['stop', {offset: "50%", 'stop-color': stars[0].color, 'stop-opacity':  0.1 }],
        ['stop', {offset: "100%", 'stop-color': stars[0].color, 'stop-opacity': 0 }]
      ],
      ['radialGradient', {id: "EngineFlare", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': "#ffffff", 'stop-opacity':  0.2 }],
        // ['stop', {offset: "35%", 'stop-color': "#ffffff", 'stop-opacity':  0.3 }],
        ['stop', {offset: "90%", 'stop-color': "#ffffff", 'stop-opacity':  0.01 }],
        ['stop', {offset: "100%", 'stop-color': "#ffffff", 'stop-opacity': 0 }]
      ]
    ],
    ['g', {id: 'map'},
      ['g', {id: 'staticOrbits'}],
      ['g', {id: 'movingOrbits'}],
      ['g', {id: 'stars'}],
      ['g', {id: 'grid'}],
      ['g', {id: 'moving'}],
      ['g', {id: 'intercept'}]
    ],
    ['g', {id: 'screenFrame'}],
    ['g', {id: 'gridScaleBar'}],
    ['g', {id: 'boxes'},
      ['g', {id: 'boxMainSettings'}]
    ]
  ]);
};
