'use strict';
// const majObj = require('./majorObjects2.json');
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const icons = require('./icons.js');

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
        class: 'minorOrbit'
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
    dataDisp.push(indDisplay(bodyo));
  }
  return dataDisp;
};

const drawBodies = (bodies) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  for (let i = 0; i < bodies.length; i++) {
    bodiesDrawn.push(
      ['g', tt(bodies[i].x, bodies[i].y),
        drawData(bodies[i]),
      ],
      icons.body(bodies[i])
    );
  }
  return bodiesDrawn;
};

const drawBelts = (belts) => {
  let rocksDrawn = ['g', {}];

  belts.map(e => {
    e.rocks.map(r => {
      rocksDrawn.push(
        icons.body(r)
      );
    });
  });

  return rocksDrawn;
};

const drawHeader = (clock) => {
  let header = ['g', tt(10, 20)];

  const list = [
    clock,
    " ",
    "Unnamed System Project",
    " ",
    "Things that work:",
    "- 3D, 2-body Kepler orbits for all bodies (that innermost orbit is valid in 3D, but looks odd in 2D.);",
    "- Basic production of 3 resources on some bodies (but no one gets paid);",
    "- Basic logistics chain (ore -> metal -> parts);",
    "- Randomly generated asteroid belts (it was easier to make them this way);",
    "- 3 types of spacecraft (Brick, Boulder, Mountain);",
    "- Craft reserve, pick up, and drop off cargo down the logistics chain;",
    "- Variable acceleration with halfway breaking for spacecraft;",
    "- Intecept calculation for craft heading to planets.",
    "Things to be added in the immediate future:",
    "- Buttons to hide this list, planet information, hull IDs and cargo, range lines;",
    "- A pass to optimize (especially with drawing intercepts);",
    "- Invent capitalism (Buy and sell cost for resources);",
    "- Supply/demand-based cost drift;",
    "- Fuel consumption, production and refueling for craft;",
    "- Invent greed (Craft AI descision-making based on profit);",
    "- A nice lighting gradient from the sun.",
    "Things to be added in the non-immediate future:",
    "- Scrolling and zooming;",
    "- Nearby solar systems, FTL travel;",
    "- Human resources;",
    "- Profit-driven piracy and anti-piracy.",
    "Bugs:",
    "- Planets keep producing when program is out of focus.",
    "- Craft can and will go through the sun;"
  ];

  for (let i = 0; i < list.length; i++) {
    let hShift = list[i][0] === '-' ? 10 : 0;
    header.push(['g', tt( hShift,  10 * i), [ 'text', {class: 'dataText'}, list[i] ]],);
  }

  return header;
};

const drawStars = (stars) =>{
  let drawnStars = ['g', {}];
  stars.map((staro) => {
    drawnStars.push(icons.star(staro));
  });
  return drawnStars;
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
            x2: crafto.vx,
            y2: crafto.vy,
            class: 'vector'
          }],
          ['g', tt(crafto.vx, crafto.vy), [
            'circle',
            {r : 1, class: 'vector'}
          ]]
        );

        partCraft.push(
          ['g', tt(-3, 16), ['text', {class: 'craftDataText'}, crafto.name]]
        );

        let offset = 0;
        Object.keys(crafto.cargo).map(specCargo => {
          if (crafto.cargo[specCargo] > 0) {
            offset++;
            partCraft.push(
              ['g', tt(-6, (16 + 8 * offset)),
                ['text', {class: 'craftDataText'}, specCargo + ':' + crafto.cargo[specCargo]]
              ]
            );
          }
        });

        drawnCraft.push(
          icons.intercept(crafto)
        );
      }
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

exports.drawMoving = (clock, planets, moons, ast, belts, craft) => {
  let rangeCandidates = [].concat(
    planets,
    moons,
    ast
  );

  return ['g', {},
    drawHeader(clock),
    drawBelts(belts),
    drawOrbit(moons),
    drawRanges(rangeCandidates),
    drawBodies(moons),
    drawBodies(planets),
    drawBodies(ast),
    drawCraft(craft)
  ];
};

exports.drawIntercepts = (craft) => {
  let intercepts = ['g', {}];

  craft.map(e => {
    if (e.intercept && e.statsus === 'traveling') {
      intercepts.push(icons.intercept(e));
    }
  });

  return intercepts;
};

exports.drawStatic = (stars, planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['g', {},
      drawOrbit(planets),
      drawGrid(),
      drawStars(stars),
      ['g', {id: 'moving'}],
      ['g', {id: 'intercept'}]
    ]
  ]);
};
