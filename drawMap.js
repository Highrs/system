'use strict';
const majObj = require('./majorObjects2.json');
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
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
      let currCoord = mech.orbitCoords((i * 2 * PI) / points,
        body, majObj[body.primary]);
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
        class: 'minorOrbit'
      }]);
    retGroup.push(
      ['g', tt(divline1.x, divline1.y),
        ['path', {d: 'M -2,-5 L 0,0 L 2,-5 Z', class: 'symbolLine'}]
      ],
      ['g', tt(divline2.x, divline2.y),
        ['path', {d: 'M -2, 5 L 0,0 L 2, 5 Z', class: 'symbolLine'}]
      ]
    );
  }

  return retGroup;
};

const indDisplay = (body) => {
  let display = ['g', tt(0, 32),
    ['rect', {
      width: 90,
      height:
        body.industry.length * 10
          + Object.keys(body.store).length * 10 + 25,
      class: 'dataWindow'
    }]
  ];
  display.push(
    ['g', tt(0, 10),
    ['text', {x: 3, y: 0,
      class: 'dataText'}, 'INDUSTRY:'],
      ['text', {x: 3, y: (body.industry.length + 1)*10,
        class: 'dataText'}, 'STORE:']
    ]
  );
  body.industry.map((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9, y: (idx + 1) * 10, class: 'dataText'},
          e.abr +":" + e.status
        ]
      ]
    );
  });
  Object.keys(body.store).map((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9,
          y: (body.industry.length + idx + 2) * 10,
          class: 'dataText'}, e.toUpperCase() + ':' + body.store[e]
        ]
      ]
    );
  });

  return display;
};

const drawData = (bodyo) => {
  let dataDisp = ['g', {}];
  if (
    // bodyo.type === 'planet' ||
    bodyo.industry
  ) {
    dataDisp.push(
      ['rect', {
        // width: ((bodyo.name.length * 6.5) + 12),
        width: 90,
        height: 14,
        class: 'dataWindow'
      }],
      ['text', {x: 8, y: 10, class: 'dataText'}, bodyo.name]
    );
  }

  if (bodyo.industry) {
    dataDisp.push(
      ['g', tt(0, 16),
        ['rect', {
          width: 90,
          height: 14,
          class: 'dataWindow'
        }],
        ['text', {x: 3, y: 10, class: 'dataText'},
          // 'XYZ:' +
          (bodyo.x).toFixed(0) + ',' +
          (bodyo.y).toFixed(0) + ',' +
          (bodyo.z).toFixed(0)
        ]
      ]
    );
    dataDisp.push(indDisplay(bodyo, 4));
  }
  return dataDisp;
};

const drawBodies = (bodies) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  for (let i = 0; i < bodies.length; i++) {
    let tempBod = ['g', tt( (bodies[i].x), (bodies[i].y))];
    tempBod.push(
      drawData(bodies[i]),
      ['circle', { r: bodies[i].objectRadius, class: 'majorObject'}]
    );
    if (bodies[i].industry) {
      tempBod.push(
        ['circle', { r: bodies[i].soi, class: 'bodyZone'}]
      );
    }
    bodiesDrawn.push(tempBod);
  }
  return bodiesDrawn;
};

const drawBelts = (belts) => {
  let rocksDrawn = ['g', {}];

  belts.map(e => {
    e.rocks.map(r => {
      rocksDrawn.push(
        ['g', tt((r.x), (r.y)),
          ['circle', { r: r.objectRadius, class: 'minorObject'}]
        ]
      );
    });
  });

  return rocksDrawn;
};

const drawTime = (clock) => {
  return ['g', tt(10, 20), ['text', {class: 'dataText'}, clock]];
};

const drawStars = (stars) =>{
  let drawnStars = ['g', {}];
  stars.map((staro) => {
    let drawnStar = ['g', tt(staro.x, staro.y)];
    drawnStar.push(
      ['circle', {
        r: staro.objectRadius,
        class: 'majorObject'
      }]
    );

    for (let j = 0; j < 16; j++) {
      drawnStar.push(['line', {
        transform: 'rotate(' + ((360 / 16) * j) +')',
        x1: staro.objectRadius + 5,
        x2: staro.objectRadius + 15,
        class: 'minorOrbit'}]);
    }

    drawnStars.push(drawnStar);
  });
  return drawnStars;
};

const drawCraftIcon = (hullClass) => {
  let iconString = 'M 0,3 L 3,0 L 0,-3 L -3,0 Z';
  const icono = {
    Brick:    'M 0,0 L 2,-2 L 2,2 L 1,3 L -1,3 L -2,2 L -2,-2 Z',
    Boulder:  'M 0,-1 L 2,-3 L 3,-2 L 3,3 L 2,4 L -2,4 L -3,3 L -3,-2 L -2,-3 Z',
    Mountain: 'M 0,-2 L 2,-4 L 3,-4 L 4,-3 L 4,-1 L 3,0 L 4,1 L 4,3 L 3,4 L -3,4 L -4,3 L -4,1 L -3,0 L -4,-1 L -4,-3 L -3,-4 L -2,-4 Z'
  };
  if (icono[hullClass]) {iconString = icono[hullClass];}
  return ['path', {d: iconString, class: 'craft'}];
};

const drawCraft = (listOfCraft) => {
  let drawnCraft = ['g', {}];

  listOfCraft.map(crafto => {
    if (crafto.status !== 'parked') {
      let partCraft = ['g', tt(crafto.x, crafto.y)];
      if (crafto.status === 'traveling') {

        partCraft.push(
          ['line', {
            x1: 0,
            y1: 0,
            x2: crafto.vx * 100,
            y2: crafto.vy * 100,
            class: 'vector'
          }],
          ['g', tt(crafto.vx * 100, crafto.vy * 100), [
            'circle',
            {r : 1, class: 'vector'}
          ]]
        );

        partCraft.push(
          ['g', tt(-3, 16), ['text', {class: 'craftDataText'}, crafto.name]]
        );

        drawnCraft.push(
          ['g', tt(crafto.intercept.x, crafto.intercept.y),
            ['path', {d: 'M -5, 3 L -2, 2 L -3, 5 L -5, 5 Z', class: 'gridBold'}],
            ['path', {d: 'M  5, 3 L  2, 2 L  3, 5 L  5, 5 Z', class: 'gridBold'}],
            ['path', {d: 'M  5,-3 L  2,-2 L  3,-5 L  5,-5 Z', class: 'gridBold'}],
            ['path', {d: 'M -5,-3 L -2,-2 L -3,-5 L -5,-5 Z', class: 'gridBold'}]
          ]
        );
      }
      partCraft.push(
        ['g', {},
          ['g', {transform: 'rotate(' + crafto.course + ')'},
            drawCraftIcon(crafto.class)
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
            ['text', {
              x: 1, y: 5, class: 'rangeText'
            }, (dist).toFixed(2)]
          ]);
        }
      }
    }
  }
  rangesDrawn.push(linesDrawn, windowsDrawn);

  return rangesDrawn;
};

exports.drawMoving = (clock, planets, moons, ast, belts, craft) => {
  let rangeCandidates = [].concat(
    planets,
    moons,
    ast
  );

  return ['g', {},
    drawTime(clock),
    drawBelts(belts),
    drawOrbit(moons),
    drawRanges(rangeCandidates),
    drawBodies(moons),
    drawBodies(planets),
    drawBodies(ast),
    drawCraft(craft)
  ];
};

exports.drawStatic = (stars, planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['g', {},
      drawOrbit(planets),
      drawGrid(),
      drawStars(stars),
      ['g', {id: 'moving'}],
    ]
  ]);
};
