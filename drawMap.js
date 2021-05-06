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
let windowWidth = 120; // width of planet data rectangles
let windowHeight = 25;
let distanceWindowLength = 44;
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
      coords += currCoord.x;
      coords += ',';
      coords += currCoord.y;
      (i === points - 1)?(coords += 'Z'):(coords += 'L');
    }

    retGroup.push(['path',
      { d: coords, class: 'majorOrbit' }]);
    retGroup.push(['line',
      {x1: divline1.x,
        y1: divline1.y,
        x2: divline2.x,
        y2: divline2.y,
        class: 'minorOrbit'}]);
    retGroup.push(['path', {
      d: 'M ' + (divline1.x - 2) + ',' + (divline1.y - 5) + 'L' + (divline1.x)
      + ',' + (divline1.y) + 'L' + (divline1.x + 2) + ',' + (divline1.y - 5)
      + 'Z', class: 'symbolLine'
    }]);
    retGroup.push(['path', {
      d: 'M ' + (divline2.x - 2) + ',' + (divline2.y + 5) + 'L' + (divline2.x)
      + ',' + (divline2.y) + 'L' + (divline2.x + 2) + ',' + (divline2.y + 5)
      + 'Z', class: 'symbolLine'
    }]);
  }

  return retGroup;
};

const indDisplay = (body) => {
  let display = ['g', tt(0, 30),
    ['rect', {
      width: 100,
      height:
        body.industry.length * 10
          + Object.keys(body.store).length * 10 + 25,
      class: 'dataWindow'
    }]
  ];
  display.push(
    ['g', tt(0, 10),
    ['text', {x: 3, y: 0,
      class: 'dataText'}, 'Industry:'],
      ['text', {x: 3, y: (body.industry.length + 1)*10,
        class: 'dataText'}, 'Storage:']
    ]
  );
  body.industry.forEach((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9, y: (idx + 1) * 10, class: 'dataText'}, e]
      ]
    );
  });
  Object.keys(body.store).forEach((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9,
          y: (body.industry.length + idx + 2) * 10,
          class: 'dataText'}, e + ' - ' + body.store[e]
        ]
      ]
    );
  });

  return display;
};

const drawData = (body) => {
  let dataDisp = ['g', {}];
  if (body.type === 'planet' || body.industry) {
    dataDisp.push(
      ['rect', {
        width: windowWidth,
        height: windowHeight,
        class: 'dataWindow'
      }],
      ['text', {x: 8, y: 10, class: 'dataText'}, body.name],
      ['text', {x: 3, y: 20, class: 'dataText'},
        'XYZ:' +
        (body.x).toFixed(0) +
        ' ' +
        (body.y).toFixed(0) +
        ' ' +
        (body.z).toFixed(0)
      ]
    );
  }
  if (body.industry) {
    dataDisp.push(indDisplay(body, 4));
  }
  return dataDisp;
};

const drawBodies = (bodies) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].type === 'planet') {
      for (let j = i + 1; j < bodies.length; j++) {
        if (bodies[j].type === 'planet') {
          let dist = mech.calcDist(bodies[i], bodies[j]);
          bodiesDrawn.push(['line', {
            x1: bodies[i].x,
            y1: bodies[i].y,
            x2: bodies[j].x,
            y2: bodies[j].y,
            class: 'rangeLine'
          }]);
          bodiesDrawn.push(['g',
          tt((((bodies[j].x) + (bodies[i].x)) / 2 - 22),
            (((bodies[j].y) + (bodies[i].y)) / 2 - 4.5)),
            ['rect', {
              width: distanceWindowLength,
              height: 10,
              class: 'dataWindow'
            }],
            ['text', {
              x: 2, y: 9, class: 'rangeText'
            }, (dist).toFixed(2)]
          ]);
        }
      }
    }

    bodiesDrawn.push(
      ['g', tt( (bodies[i].x), (bodies[i].y)),
        drawData(bodies[i]),
        ['circle', { r: bodies[i].objectRadius, class: 'majorObject'}]
      ]
    );

  }
  return bodiesDrawn;
};

const drawTime = (clock) => {
  return ['g', tt(10, 20), ['text', {class: 'dataText'}, clock]];
};

const drawStar = (staro) =>{
  let star = ['g', {}, ];
  Object.keys(staro).forEach((starName) => {
    star.push(['g', tt(staro[starName].x, staro[starName].y),
      ['circle', {
        r: staro[starName].objectRadius,
        class: 'majorObject'
      }]
    ]);
  });
  return star;
};

const drawCraftIcon = (hullClass) => {
  let iconString = 'M 0,3 L 3,0 L 0,-3 L -3,0 Z';
  const icono = {
    Mountain: 'M 5,3 L 5,-3 L -5,-3 L -5,3 Z',
    Brick: 'M 3,3 L 3,-3 L -3,-3 L -3,3 Z'
  };
  if (icono[hullClass]) {iconString = icono[hullClass];}
  return ['path', {d: iconString, class: 'craft'}];
};

const drawCraft = (listOfCraft) => {
  let drawnCraft = ['g', {}];

  Object.keys(listOfCraft).forEach((craftID) => {
    let partCraft = ['g', {}];
    let crafto = listOfCraft[craftID];
    if (crafto.x !== 0 && crafto.y !== 0) {
      partCraft.push(['line', {
        x1: crafto.x,
        y1: crafto.y,
        x2: crafto.x + (crafto.vx * 10),
        y2: crafto.y + (crafto.vy * 10),
        class: 'vectorLine'
      }]);
    }
    partCraft.push(
      ['g', tt(crafto.x, crafto.y),
        drawCraftIcon(crafto.class),
        ['g', tt(crafto.vx * 10, crafto.vy * 10), ['circle', {r : 1, class: 'majorObject'}]]
      ]

    );
    drawnCraft.push(partCraft);
  });

  return drawnCraft;

};

exports.drawMoving = (clock, planets, moons, ast, craft) => {
  return ['g', {},
    drawTime(clock),
    drawOrbit(moons),
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
      drawStar(stars),
      ['g', {id: 'moving'}],
    ]
  ]);
};
