'use strict';
//What are you doing here? How did you get here? Leave.

// const majObj = require('./majorObjects2.json');
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const icons = require('./icons.js');
const lists = require('./lists.js');

function getPageWidth() {
  return document.body.clientWidth;
}
function getPageHeight() {
  return document.body.clientHeight;
}

// const PI = Math.PI;
// const drawPolarGrid = (staro) => {
//   let polarGrid = ['g', tt(staro.x, staro.y)];
//
//   for (let i = 1; i < 5; i++) {
//     polarGrid.push(['circle', {r: 150 * i, class: 'grid'}]);
//     for (let j = 0; j < 16; j++) {
//       polarGrid.push(['line', {
//         transform: 'rotate(' + ((360 / 16) * j) +')',
//         x1: 150 * i + 15,
//         x2: 150 * i - 5,
//         class: 'grid'}]);
//     }
//   }
//   return polarGrid;
// };

const drawGrid = (staro, mapPan) => {
  let grid = ['g', {}];
  let crossSize = 5 * mapPan.zoom;
  if (crossSize < 1) {crossSize = 1;}

  for (let x = 0 + staro.x%100; ((x <= getPageWidth()) && (x <= 1000 * mapPan.zoom)); x += 100 * mapPan.zoom) {
    for (let y = 0 + staro.y%100; ((y <= getPageHeight()) && (y <= 1000 * mapPan.zoom) ); y += 100 * mapPan.zoom) {
      grid.push(
        icons.gridCross(crossSize,  x,  y),
        icons.gridCross(crossSize, -x,  y),
        icons.gridCross(crossSize,  x, -y),
        icons.gridCross(crossSize, -x, -y)
      );
    }

    grid.push(
      ['line', {
        x1: staro.x,
        y1: x + 10 * mapPan.zoom,
        x2: staro.x,
        y2: x + 90 * mapPan.zoom,
        class: 'grid'}],
      ['line', {
        x1: staro.x,
        y1: - x - 10 * mapPan.zoom,
        x2: staro.x,
        y2: - x - 90 * mapPan.zoom,
        class: 'grid'}],
      ['line', {
        x1: x + 10 * mapPan.zoom,
        y1: staro.y,
        x2: x + 90 * mapPan.zoom,
        y2: staro.y,
        class: 'grid'}],
      ['line', {
        x1: - x - 10 * mapPan.zoom,
        y1: staro.y,
        x2: - x - 90 * mapPan.zoom,
        y2: staro.y,
        class: 'grid'}]
  );
  }

  return grid;
};
exports.drawGrid = drawGrid;
const drawOrbits = (bodies, mapPan) => {
  if (bodies.length < 1) {return ['g', {}];}

  let retGroup = ['g', {}];

  bodies.forEach(bodyo => {
    let partOrbit = ['g', tt(bodyo.primaryo.x * mapPan.zoom, bodyo.primaryo.y * mapPan.zoom)];
    let coords = 'M ';

    for (let i = 0; i < bodyo.orbitPointsArr.length; i++) {
      let currCoord = bodyo.orbitPointsArr[i];
      let currX = currCoord.ax * mapPan.zoom;
      let currY = currCoord.ay * mapPan.zoom;

      coords += currX + ',' + currY;
      (i === bodyo.orbitPointsArr.length - 1)?(coords += 'Z'):(coords += 'L');
    }

    partOrbit.push(['path',
      { d: coords, class: 'majorOrbit' }]);
    partOrbit.push(['line',
      {
        x1: bodyo.orbitDivLine[0].ax * mapPan.zoom,
        y1: bodyo.orbitDivLine[0].ay * mapPan.zoom,
        x2: bodyo.orbitDivLine[1].ax * mapPan.zoom,
        y2: bodyo.orbitDivLine[1].ay * mapPan.zoom,
        class: 'orbitDivLine'
      }]);
    partOrbit.push(
      ['g', tt(bodyo.orbitDivLine[0].ax * mapPan.zoom, bodyo.orbitDivLine[0].ay * mapPan.zoom),
        icons.apsis('-')
      ],
      ['g', tt(bodyo.orbitDivLine[1].ax * mapPan.zoom, bodyo.orbitDivLine[1].ay * mapPan.zoom),
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
      ['g', tt(e.px * mapPan.zoom, e.py * mapPan.zoom), [
        'circle',
        {
          r : e.a * mapPan.zoom,
          class: 'minorOrbit'
        }
      ]]
    );
  });

  return retGroup;
};
// const drawIndustryData = (body) => {
//   let display = ['g', tt(10, -10)];
//
//   display.push(
//     ['text', {
//       x: 0,
//       y: 6,
//       class: 'dataText'
//     }, 'IND:'],
//     ['text', {
//       x: 0,
//       y: (body.industry.length + 2) * 6,
//       class: 'dataText'
//     }, 'STORE:']
//   );
//
//   body.industry.forEach((e, idx) => {
//     display.push(
//       ['g', tt(0, 6),
//         ['text', {
//           x: 2,
//           y: (idx + 1) * 6,
//           class: 'dataText'
//         }, e.abr +":" + e.status]
//       ]
//     );
//   });
//   Object.keys(body.store).forEach((e, idx) => {
//     display.push(
//       ['g', tt(0, 6),
//         ['text', {x: 2,
//           y: (body.industry.length + idx + 2) * 6,
//           class: 'dataText'}, e.toUpperCase() + ':' + body.store[e].toFixed(0)
//         ]
//       ]
//     );
//   });
//
//   return display;
// };
const drawBodyData = (bodyo) => {
  let dataDisp = ['g', {}];

  dataDisp.push(
    ['path', {d: 'M 0,0 L 10, -10 L 25, -10', class: 'dataLine'}],
    ['text', {x: 10, y: -11, class: 'dataText'}, bodyo.name]
    // ['text', {x: 10, y: 2, class: 'dataText'},
    //   (bodyo.x).toFixed(0) + ',' +
    //   (bodyo.y).toFixed(0) + ',' +
    //   (bodyo.z).toFixed(0)
    // ]
  );

  // if (bodyo.industry) { dataDisp.push(drawIndustryData(bodyo)); }

  return dataDisp;
};
const drawBodies = (bodies, options, mapPan) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  bodies.forEach (bodyo =>{
    let partBody = ['g', tt(bodyo.x * mapPan.zoom, bodyo.y * mapPan.zoom)];
    if (options.planetData) {partBody.push(drawBodyData(bodyo));}

    partBody.push(icons.body(bodyo, mapPan));
    bodiesDrawn.push(partBody);
  });
  return bodiesDrawn;
};
const drawStations = (stations, options, mapPan) => {
  if (stations.length < 1) {return ['g', {}];}
  const stationsDrawn = ['g', {}];
  stations.forEach(stationo => {
    for (let i = 0; i < stations.length; i++) {
      let partStation = ['g', tt((stationo.x * mapPan.zoom), (stationo.y * mapPan.zoom))];
      if (options.planetData) {partStation.push(['g', {}, drawBodyData(stationo),]);}

      partStation.push(icons.station(stationo, mapPan));
      stationsDrawn.push(partStation);
    }
  });


  return stationsDrawn;
};
const drawBelts = (belts, mapPan) => {
  let rocksDrawn = ['g', {}];

  belts.forEach(e => {
    e.rocks.forEach(rocko => {
      rocksDrawn.push(
        ['g', tt(rocko.x * mapPan.zoom, rocko.y * mapPan.zoom), icons.body(rocko, mapPan)]
      );
    });
  });

  return rocksDrawn;
};
// const drawHeader = (clock, options) => {
//   if (options.header) {
//     let header = ['g', tt(10, 20)];
//
//     for (let i = 0; i < lists.toDo().length; i++) {
//       let hShift = lists.toDo()[i][0] === '-' ? 10 : 0;
//       header.push(['g', tt( hShift,  10 * i), [ 'text', {class: 'dataText'}, lists.toDo(clock)[i] ]],);
//     }
//
//     return header;
//   }
//   if (options.headerKeys) {
//     let keys = ['g', tt(10, 20)];
//
//     for (let i = 0; i < lists.keys().length; i++) {
//       let hShift = lists.keys()[i][0] === '-' ? 10 : 0;
//       keys.push(['g', tt( hShift,  10 * i), [ 'text', {class: 'dataText'}, lists.keys(clock)[i] ]],);
//     }
//
//     return keys;
//   }
//   return;
//
// };
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
          {r : 1, class: 'vector'}
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
          tt((((bodyArr[j].x) + (bodyArr[i].x)) / 2 - 11) * mapPan.zoom,
            (((bodyArr[j].y) + (bodyArr[i].y)) / 2 - 2.25) * mapPan.zoom),
            ['rect', {
              width: 22,
              height: 6.5,
              class: 'rangeWindow'
            }],
            ['text', {
              x: 1,
              y: 5,
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
const drawScreenFrame = (options) => {
  let frame = ['g', {}];

  if (options.headerKeys) {
    let keys = ['g', tt(4, 4)];

    keys.push(['rect', {width: 68, height: lists.keys().length * 6 + 3, class: 'standardBox'}]);

    for (let i = 0; i < lists.keys().length; i++) {
      keys.push(['g', tt(2,  6 * i + 6), [ 'text', {class: 'dataText'}, lists.keys()[i] ]],);
    }

    frame.push(keys);
  }

  frame.push( ['g', tt(4,40),
    ['g', tt(0, 0, {id:'buttonSettings', class: 'standardBoxSelectable'}),
      ['rect', {width: 10, height: 10}]
      // icons.arrow(2, true),
    ]
  ]);

  frame.push(drawSimRateModule());

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
const drawSimRateModule = () => {
  return ['g', {id: 'simRateModule'},
    // ['rect', {width: 10, height: 2, class: 'standardBox'}],
    ['g', tt(4,28),
      ['g', tt(0, 0, {id:'buttonStop', class: 'standardBoxSelectable'}),
        ['rect', {width: 10, height: 10}],
        ['path', { d: 'M 4, 2 L 4, 8', class: 'standardLine'}],
        ['path', { d: 'M 6, 2 L 6, 8', class: 'standardLine'}],
        // icons.arrow(2, true),
      ],
      ['g', tt(12,0, {id:'buttonSlow', class: 'standardBoxSelectable'}),
        ['rect', {width: 10, height: 10}],
        icons.arrow(1, true)
      ],
      ['g', tt(24,0, {id:'simRateDisplay', class: 'standardBox'}),
        ['rect', {width: 20, height: 10}],
        ['g', {id: 'rateCounter'}]
      ],
      ['g', tt(46,0, {id:'buttonFast', class: 'standardBoxSelectable'}),
        ['rect', {width: 10, height: 10}],
        icons.arrow(-1, false)
      ],
      ['g', tt(58,0, {id:'buttonMax', class: 'standardBoxSelectable'}),
        ['rect', {width: 10, height: 10}],
        icons.arrow(-0.5, false),
        icons.arrow(-2.5, false),
      ]
    ]
  ];
};
exports.drawSimRateModule = drawSimRateModule;
exports.drawRateCounter = (options) => {
  return ['text', {x: 10 - ((options.rate.toString().length / 2) * 3.25), y: 7,class: 'dataText bold'}, options.rate];
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
    ['g', {id: 'frame'},
      drawScreenFrame(options)
    ]
  ]);
};
