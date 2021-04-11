'use strict';
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const majObj = require('./majorObjects.json');
// const cos = Math.cos;
// const sin = Math.sin;
const PI = Math.PI;
const sqrt = Math.sqrt;
//properties-------------
// const sh = screen.width*(0.9);
// const sw = screen.height*(0.9);
const pageW = 1000;
const pageH = 1000;
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

  for (let x = 50; x < pageW; x += 50) {
    for (let y = 50; y < pageH; y += 50) {
      grid.push(
        ['line', { x1: x - crossSize, y1: y, x2: x + crossSize, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + crossSize, x2: x, y2: y - crossSize, class: 'grid'}]
      );
    }
  }

  return grid;
};

const drawOrbit = (planets) => {
  let divline1;
  let divline2;
  let retGroup = ['g', {}];

  for (let i = 0; i < planets.length; i++) {
    let planet = planets[i];
    let coords = 'M ';
    let points = 128;

    for (let i = 0; i < points; i++) {
      let currCoord = mech.orbitCoords((i * 2 * PI) / points,
        planet, majObj[planet.primary]);
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

const calcDist = (planet1, planet2) => {
  return sqrt( Math.pow( (planet1.x - planet2.x), 2 )
  + Math.pow( (planet1.y - planet2.y), 2 )
  + Math.pow( (planet1.z - planet2.z), 2 ) );
};

const indDisplay = (planet, line) => {
  let display = ['g', {}];
  display.push(
    ['text', {x: 3, y: line * 10,
      class: 'dataText'}, "Industry:"],
    ['text', {x: 3, y: (line + planet.industry.length + 1)*10,
      class: 'dataText'}, "Storage:"]
  );
  planet.industry.forEach((e, idx) => {
    display.push(['text', {x: 9, y: (line + idx + 1) * 10,
      class: 'dataText'}, e]);
  });
  Object.keys(planet.storage).forEach((e, idx) => {
    display.push(['text', {x: 9,
      y: (line + planet.industry.length + idx + 2) * 10,
      class: 'dataText'}, e + " - " + planet.storage[e]]);
  });

  return display;
};

const drawPlanets = (planets) => {
  const planetsDrawn = ['g', {}];
  for (let i = 0; i < planets.length; i++) {
    let xWindShift = 0;
    if (planets[i].x / Math.pow(10, 9) > pageW - 100) {
      xWindShift = -windowWidth;
    }

    // for (let j = i + 1; j < planets.length; j++) {
    //   let dist = calcDist(planets[i], planets[j]);
    //   planetsDrawn.push(['line', {
    //     x1: planets[i].x,
    //     y1: planets[i].y,
    //     x2: planets[j].x,
    //     y2: planets[j].y,
    //     class: 'rangeLine'
    //   }]);
    //   planetsDrawn.push(['g',
    //   tt((((planets[j].x) + (planets[i].x)) / 2 - 22),
    //     (((planets[j].y) + (planets[i].y)) / 2 - 4.5)),
    //     ['rect', {width: distanceWindowLength, height: 10, class: 'dataWindow'}],
    //     ['text', {
    //       x: 2, y: 9, class: 'rangeText'}, (dist).toFixed(2)]
    //   ]);
    // }

    planetsDrawn.push(
      ['g', tt( (planets[i].x), (planets[i].y)),
        // ['g', tt(xWindShift, 0),
        //   ['rect', {width: windowWidth,
        //     height: windowHeight + 20
        //     + (planets[i].industry.length * 10)
        //     + (Object.keys(planets[i].storage).length * 10),
        //     class: 'dataWindow'}],
        //   ['text', {x: 8, y: 10, class: 'dataText'}, planets[i].name],
        //   ['text', {x: 3, y: 20, class: 'dataText'},
        //     'XYZ:' +
        //     (planets[i].x).toFixed(0) +
        //     ' ' +
        //     (planets[i].y).toFixed(0) +
        //     ' ' +
        //     (planets[i].z).toFixed(0)
        //   ],
        //   indDisplay(planets[i], 3)
        // ],
        ['circle', { r: planets[i].objectRadius, class: 'majorObject'}]
      ]
    );

  }
  return planetsDrawn;
};

const drawTime = (clock) => {
  return ['g', tt(10, 20),
        ['text', {class: 'dataText'}, clock]];
};

const drawStar = (staro) =>{
  let star = ['g', {}, ];

  Object.keys(staro).forEach((starName) => {
    star.push(['g', tt(staro[starName].x, staro[starName].y), ['circle', {
      r: staro[starName].objectRadius,
      class: 'majorObject'
    }]]);
  });

  return star;
};

exports.drawMoving = (clock, planets, moons, ast) => {
  return ['g', {},
    drawTime(clock),
    drawOrbit(moons),
    drawPlanets(planets),
    drawPlanets(moons)
  ];
};

exports.drawStatic = (stars, planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['g', {},
      drawGrid(),
      drawStar(stars),
      drawOrbit(planets),
      ['g', {id: 'moving'}]
    ]
  ]);
};
