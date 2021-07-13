'use strict';
// const majObj = require('./majorObjects2.json');
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const icons = require('./icons.js');
const lists = require('./lists.js');

// const cos = Math.cos;
// const sin = Math.sin;
const PI = Math.PI;
// const sqrt = Math.sqrt;
//properties-------------
// const sh = screen.width*(0.9);
// const sw = screen.height*(0.9);
const pageW = 1200;
const pageH = 1200;
// const pageW = (sh < 900) ? 800 : sh - (sh % 100);
// const pageH = (sw < 800) ? 700 : sw - (sw % 100);
// const centerX = pageW/2;
// const centerY = pageH/2;
//Artistic properties-------------
// const starRadius = 10;
// let windowWidth = 120; // width of planet data rectangles
// let windowHeight = 25;
// let distanceWindowLength = 44;
//--------------------------------

const drawGrid = () => {
  let grid = ['g', {}];
  let crossSize = 5;

  for (let x = 100; x < pageW; x += 100) {
    for (let y = 100; y < pageH; y += 100) {
      grid.push(
        ['line', { x1: x - crossSize, y1: y,
          x2: x + crossSize, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + crossSize,
          x2: x, y2: y - crossSize, class: 'grid'}]
      );
    }
  }
  let polarMap = ['g', tt(pageW/2, pageH/2)];

  for (let i = 1; i < 5; i++) {
    polarMap.push(['circle', {r: 150 * i, class: 'grid'}]);
    for (let j = 0; j < 16; j++) {
      polarMap.push(['line', {
        transform: 'rotate(' + ((360 / 16) * j) +')',
        x1: 150 * i + 15,
        x2: 150 * i - 5,
        class: 'grid'}]);
    }
  }

  grid.push(polarMap);

  return grid;
};

const drawOrbit = (bodies) => {
  if (bodies.length < 1) {return ['g', {}];}

  let divline1;
  let divline2;
  let retGroup = ['g', {}];

  for (let i = 0; i < bodies.length; i++) {
    let body = bodies[i];
    let coords = 'M ';
    let points = 128;
    if (body.type === 'moon') {
      points = 32;
    }

    for (let i = 0; i < points; i++) {
      let currCoord = mech.kepCalc(body, undefined, 's', ((i * 2 * PI) / points));
      if (i === 0) {
        divline1 = currCoord;
      } else if (Math.abs(points/2 - i) < 1) {
        divline2 = currCoord;
      }
      coords += currCoord.x + ',' + currCoord.y;
      (i === points - 1)?(coords += 'Z'):(coords += 'L');
    }

    retGroup.push(['path',
      { d: coords, class: 'majorOrbit' }]);
    retGroup.push(['line',
      {
        x1: divline1.x,
        y1: divline1.y,
        x2: divline2.x,
        y2: divline2.y,
        class: 'orbitDivLine'
      }]);
    retGroup.push(
      ['g', tt(divline1.x, divline1.y),
        icons.apsis('-')
      ],
      ['g', tt(divline2.x, divline2.y),
        icons.apsis()
      ]
    );
  }

  return retGroup;
};

const drawSimpleOrbit = (stations) => {
  if (stations.length < 1) {return ['g', {}];}

  let retGroup = ['g', {}];

  for (let i = 0; i < stations.length; i++) {
    retGroup.push(
      ['g', tt(stations[i].px, stations[i].py), [
        'circle',
        {r : stations[i].a, class: 'minorOrbit'}
      ]]
    );
  }

  return retGroup;
};

const drawIndustryData = (body) => {
  let display = ['g', tt(10, -10)];

  display.push(
    ['text', {x: 0, y: 6, class: 'dataText'}, 'IND:'],
    ['text', {x: 0, y: (body.industry.length + 2) * 6, class: 'dataText'}, 'STORE:']
  );

  body.industry.forEach((e, idx) => {
    display.push(
      ['g', tt(0, 6),
        ['text', {x: 2, y: (idx + 1) * 6, class: 'dataText'},
          e.abr +":" + e.status
        ]
      ]
    );
  });
  Object.keys(body.store).forEach((e, idx) => {
    display.push(
      ['g', tt(0, 6),
        ['text', {x: 2,
          y: (body.industry.length + idx + 2) * 6,
          class: 'dataText'}, e.toUpperCase() + ':' + body.store[e]
        ]
      ]
    );
  });

  return display;
};

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

  if (bodyo.industry) { dataDisp.push(drawIndustryData(bodyo)); }

  return dataDisp;
};

const drawBodies = (bodies, options) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  for (let i = 0; i < bodies.length; i++) {
    if (
      options.planetData
    ) {
      bodiesDrawn.push(
        ['g', tt(bodies[i].x, bodies[i].y), drawBodyData(bodies[i]),]
      );
    }

    bodiesDrawn.push(
      icons.body(bodies[i])
    );
  }
  return bodiesDrawn;
};

const drawStations = (stations, options) => {
  if (stations.length < 1) {return ['g', {}];}
  const stationsDrawn = ['g', {}];
  for (let i = 0; i < stations.length; i++) {
    if (
      options.planetData
    ) {
      stationsDrawn.push(
        ['g', tt(stations[i].x, stations[i].y), drawBodyData(stations[i]),]
      );
    }

    stationsDrawn.push(
      icons.station(stations[i])
    );
  }
  return stationsDrawn;
};

const drawBelts = (belts) => {
  let rocksDrawn = ['g', {}];

  belts.forEach(e => {
    e.rocks.forEach(r => {
      rocksDrawn.push(
        icons.body(r)
      );
    });
  });

  return rocksDrawn;
};

const drawHeader = (clock, options) => {
  if (options.header) {
    let header = ['g', tt(10, 20)];

    for (let i = 0; i < lists.toDo().length; i++) {
      let hShift = lists.toDo()[i][0] === '-' ? 10 : 0;
      header.push(['g', tt( hShift,  10 * i), [ 'text', {class: 'dataText'}, lists.toDo(clock)[i] ]],);
    }

    return header;
  } else {
    return;
  }
};

const drawStars = (stars) =>{
  let drawnStars = ['g', {}];
  stars.forEach((staro) => {
    drawnStars.push(icons.star(staro));
  });
  return drawnStars;
};

const drawCraftData = (crafto) =>{
  let drawnData = ['g', {}];

  drawnData.push(
    ['path', {d: 'M 0,0 L 10, -10 L 25, -10', class: 'dataLine'}],
    ['text', {x: 10, y: -11, class: 'dataText'}, crafto.name + ' ' + crafto.abr],
    ['text', {x: 10, y: -4, class: 'dataText'}, 'F:' + ((crafto.fuel / crafto.fuelCapacity) * 100).toFixed(0) + '%']
  );

  let offset = 0;
  Object.keys(crafto.cargo).forEach(specCargo => {
    if (crafto.cargo[specCargo] > 0) {
      drawnData.push(
        ['text', {x: 10, y: 8 * offset, class: 'dataText'}, specCargo + ':' + crafto.cargo[specCargo]]
      );
      offset++;
    }
  });

  return drawnData;
};

const drawCraft = (listOfCraft, options) => {
  let drawnCraft = ['g', {}];

  listOfCraft.forEach(crafto => {
    if (crafto.status === 'traveling') {
      let partCraft = ['g', tt(crafto.x, crafto.y)];

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

const drawRanges = (bodyArr) => {
  let rangesDrawn = ['g', {}];
  let linesDrawn = ['g', {}];
  let windowsDrawn = ['g', {}];

  for (let i = 0; i < bodyArr.length; i++) {
    if (bodyArr[i].industry) {
      for (let j = i + 1; j < bodyArr.length; j++) {
        if (bodyArr[j].industry) {
          linesDrawn.push(['line', {
            x1: bodyArr[i].x,
            y1: bodyArr[i].y,
            x2: bodyArr[j].x,
            y2: bodyArr[j].y,
            class: 'rangeLine'
          }]);

          let dist = mech.calcDist(bodyArr[i], bodyArr[j]);

          windowsDrawn.push(['g',
          tt((((bodyArr[j].x) + (bodyArr[i].x)) / 2 - 11),
            (((bodyArr[j].y) + (bodyArr[i].y)) / 2 - 2.25)),
            ['rect', {
              width: 22,
              height: 6.5,
              class: 'rangeWindow'
            }],
            ['text', {x: 1, y: 5, class: 'rangeText'}, (dist).toFixed(2)]
          ]);
        }
      }
    }
  }
  rangesDrawn.push(linesDrawn, windowsDrawn);

  return rangesDrawn;
};

exports.drawMoving = (options, clock, planets, moons, ast, belts, craft, stations, rendererMovingOrbits) => {
  let rangeCandidates = [...planets, ...moons, ...ast];

  rendererMovingOrbits(drawMovingOrbits(moons));

  return ['g', {},
    drawHeader(clock, options),
    drawBelts(belts),
    drawSimpleOrbit(stations),
    drawRanges(rangeCandidates),
    drawBodies(moons, options),
    drawBodies(planets, options),
    drawBodies(ast, options),
    drawStations(stations, options),
    drawCraft(craft, options)
  ];
};

exports.drawIntercepts = (listOfcraft) => {
  let intercepts = ['g', {}];

  listOfcraft.forEach(e => {
    if (e.intercept && (e.status === 'traveling')) {
      intercepts.push(icons.marker(e.intercept.x, e.intercept.y));
    }
  });

  return intercepts;
};

const drawMovingOrbits = (moons) => {
  return ['g', {}, drawOrbit(moons)];
};

exports.drawStatic = (options, stars, planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['defs',
      ['radialGradient', {id: "RadialGradient1", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "0%", 'stop-color': stars[0].color, 'stop-opacity': 0.5 }],
        ['stop', {offset: "100%", 'stop-color': "#000000", 'stop-opacity': 0 }]
      ],
      ['radialGradient', {id: "RadialGradient2", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "50%", 'stop-color': "#000000", 'stop-opacity': 0.25 }],
        ['stop', {offset: "100%", 'stop-color': "#000000", 'stop-opacity': 0 }]
      ]
    ],
    ['g', {},
      drawOrbit(planets),
      ['g', {id: 'movingOrbits'}],
      drawStars(stars),
      drawGrid(),
      ['g', {id: 'moving'}],
      ['g', {id: 'intercept'}]
    ]
  ]);
};
