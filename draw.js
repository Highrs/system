'use strict';
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
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
const centerX = pageW/2;
const centerY = pageH/2;
//Artistic properties-------------
const starRadius = 10;
let windowWidth = 160; // width of planet data rectangles
let windowHeight = 25;
let distanceWindowLength = 44;
//--------------------------------

const drawGrid = () => {
  let grid = ['g', {}];
  let crossSize = 5;

  for (let x = -pageW / 2 + 50; x < pageW / 2; x += 50) {
    for (let y = -pageH / 2 + 50; y < pageH / 2; y += 50) {
      grid.push(
        ['line', { x1: x - crossSize, y1: y, x2: x + crossSize, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + crossSize, x2: x, y2: y - crossSize, class: 'grid'}]
      );
    }
  }
  return grid;
};

const drawOrbits = (planets) => {
  let divline1;
  let divline2;
  let retGroup = ['g', {}];

  for (let i = 0; i < planets.length; i++) {
    let planet = planets[i];
    let coords = 'M ';
    let points = 128;

    for (let i = 0; i < points; i++) {
      let currCoord = mech.orbitCoords( planet.a, planet.e, (i * 2 * PI)/points, planet.w, planet.lang, planet.inc );
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
      {x1: divline1.x, y1: divline1.y, x2: divline2.x, y2: divline2.y, class: 'minorOrbit'}]);
    retGroup.push(['path',
      { d: 'M ' + (divline1.x - 2) + ',' + (divline1.y - 5)  + 'L' + (divline1.x) + ',' + (divline1.y) + 'L' + (divline1.x + 2) + ',' + (divline1.y - 5) + 'Z', class: 'symbolLine'}]);
    retGroup.push(['path',
      { d: 'M ' + (divline2.x - 2) + ',' + (divline2.y + 5)  + 'L' + (divline2.x) + ',' + (divline2.y) + 'L' + (divline2.x + 2) + ',' + (divline2.y + 5) + 'Z', class: 'symbolLine'}]);
  }
  return retGroup;
};

const calcDist = (planet1, planet2) => {
  return sqrt(Math.pow( (planet1.x - planet2.x), 2 ) + Math.pow( (planet1.y - planet2.y), 2 ) + Math.pow( (planet1.z - planet2.z), 2 ) );
};

exports.drawMoving = (planets, clock) => {
  const drawn = ['g', {}];
  drawn.push(
    ['g', tt( -centerX, -centerY ),
      // ['circle', {cx: 25, cy: 25, r: 20, class: 'updateIcon'}],
      ['text', {x: 55, y: 15, class: 'dataText'}, clock]
    ]
  );

  for (let i = 0; i < planets.length; i++) {
    let xWindShift = 0;
    if (planets[i].x / Math.pow(10, 9) > pageW - 100) {
      xWindShift = -windowWidth;
    }

    for (let j = i + 1; j < planets.length; j++) {
      let dist = calcDist(planets[i], planets[j] );
      drawn.push(['line',{
        x1: planets[i].x / Math.pow(10, 9),
        y1: planets[i].y / Math.pow(10, 9),
        x2: planets[j].x / Math.pow(10, 9),
        y2: planets[j].y / Math.pow(10, 9), class: 'rangeLine' } ]);
      drawn.push(['g',
      tt((((planets[j].x / Math.pow(10, 9)) + (planets[i].x / Math.pow(10, 9))) / 2 - 22),
         (((planets[j].y / Math.pow(10, 9)) + (planets[i].y / Math.pow(10, 9))) / 2 - 4.5)),
        ['rect', {width: distanceWindowLength, height: 10, class: 'dataWindow'}],
        ['text', {
          x: 2, y: 9, class: 'rangeText'}, (dist / Math.pow(10, 9)).toFixed(2)]
      ]);
    }

    let indDisplay = (planet, line) => {
      let display = ['g', {}];
      // let numOfStorage = 0;
      let counter = 0;
      display.push(
        ['text', {x: 3, y: (line)*10, class: 'dataText'}, "Industry:"],
        ['text', {x: 3, y: (line + planet.industry.length + 1)*10,
          class: 'dataText'},
          "Storage:"]
      );
      planet.industry.forEach((e) => {
        counter ++;
        display.push(['text', {x: 9, y: (line + counter) * 10,
          class: 'dataText'}, e]);
      });
      counter = 0;
      Object.keys(planet.storage).forEach((e) => {
        counter ++;
        display.push(['text', {x: 9,
          y: (line + planet.industry.length + counter + 1) * 10,
          class: 'dataText'}, e + " - " + planet.storage[e]]);
      });


      return display;
    };
    drawn.push(
      ['g', tt( (planets[i].x / Math.pow(10, 9)), (planets[i].y / Math.pow(10, 9))),
        ['g', tt(xWindShift, 0),
          ['rect', {width: windowWidth,
            height: windowHeight + 20 + (planets[i].industry.length * 10) + (Object.keys(planets[i].storage).length * 10),
            class: 'dataWindow'}],
          ['text', {x: 8, y: 10, class: 'dataText'}, planets[i].name],
          ['text', {x: 3, y: 20, class: 'dataText'},
            'XYZ:' +
            (planets[i].x / Math.pow(10, 9)).toFixed(0) +
            ' ' +
            (planets[i].y / Math.pow(10, 9)).toFixed(0) +
            ' ' +
            (planets[i].z / Math.pow(10, 9)).toFixed(0)
          ],
          indDisplay(planets[i], 3)
        ],
        ['circle', { r: planets[i].objectRadius, class: 'majorObject'}]
      ]
    );

  }
  return drawn;
};

const star = ['g', {},
  ['circle', { r: starRadius, class: 'majorObject'}]
];

const drawStatic = (planets) => {
  return ['g', {},
    drawGrid(),
    drawOrbits(planets),
    star
  ];
};

exports.drawMap = (planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['g', tt(centerX, centerY),
      drawStatic(planets),
      ['g', {id: 'moving'}]
    ]
  ]);
};
