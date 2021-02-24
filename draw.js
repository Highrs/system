'use strict';

const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const cos = Math.cos;
const sin = Math.sin;
const PI = Math.PI;
const sqrt = Math.sqrt;

//properties-------------
const pageW = 700;
const pageH = 700;
const centerX = pageW/2;
const centerY = pageH/2;
//-----------------------

//Artistic properties-------------
const starRadius = 10;
let windowWidth = 70; // width of planet data rectangles
//--------------------------------

const drawGrid = () => {
  let grid = ['g', {}];
  let crossSize = 5;
  for (let x = -pageW / 2 + 50; x < 700 / 2; x += 50) {
    for (let y = -pageH / 2 + 50; y < 700 / 2; y += 50) {
      grid.push(
        ['line', { x1: x - crossSize, y1: y, x2: x + crossSize, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + crossSize, x2: x, y2: y - crossSize, class: 'grid'}]
      );
    }
  }
  return grid;
};

const orbitCoords = (a, e, mat, w, lang, inc) => {
  // Kepler's Equasion: M = E - e * sin(E)= with M(at t) and e(ccentricity)
  const itter = 3;
  const calcEAT = (e, mat) => {
    let eat = mat;
    for (let i = 0; i < itter; i++) {
      eat = eat - ( (eat - ( e * sin(eat) ) - mat) / ( 1 - e * cos(eat) ) );
    }
    return eat;
  }; // Eccentric anomaly at time E(t)
  const eat = calcEAT(e, mat); // Eccentric anomaly at time

  const tat = ( 2 * Math.atan2(
    ( sqrt(1 + e) * sin(eat / 2) ),
    ( sqrt(1 - e) * cos(eat / 2) )
  ) );

  const dist = ( a * ( 1 - ( e * cos(eat) ) ) );

  // Positional vectors in orbital frame o(t)
  const ox = dist * cos(tat);
  const oy = dist * sin(tat);
  // const oz = 0;

  const x = ( ox * ( (cos(w) * cos(lang)) - (sin(w) * cos(inc) * sin(lang)) ) - oy * ( (sin(w) * cos(lang)) + (cos(w) * cos(inc) * sin(lang)) ) );
  const y = ( ox * ( (cos(w) * sin(lang)) + (sin(w) * cos(inc) * cos(lang)) ) + oy * ( (cos(w) * cos(inc) * cos(lang)) - (sin(w) * sin(lang)) ) );
  const z = ( ox * ( sin(w) * sin(inc) ) + oy * ( cos(w) * sin(inc) ) );

  return { x: x, y: y, z: z};
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
      let currCoord = orbitCoords( planet.a, planet.e, (i * 2 * PI)/points, planet.w, planet.lang, planet.inc );
      if (i === 0) {
        divline1 = currCoord;
      } else if (Math.abs(points/2 - i) < 1) {
        divline2 = currCoord;
      }
      coords += currCoord.x;
      coords += ',';
      coords += currCoord.y;
      if (i === points - 1) {
        coords += 'Z';
      } else {
        coords += 'L';
      }
    }
    retGroup.push(['path', { d: coords, class: 'majorOrbit' }]);
    retGroup.push(['line', {x1: divline1.x, y1: divline1.y, x2: divline2.x, y2: divline2.y, class: 'minorOrbit'}]);
    retGroup.push(['path', { d: 'M ' + (divline1.x - 2) + ',' + (divline1.y - 5)  + 'L' + (divline1.x) + ',' + (divline1.y) + 'L' + (divline1.x + 2) + ',' + (divline1.y - 5) + 'Z', class: 'symbolLine'}]);
    retGroup.push(['path', { d: 'M ' + (divline2.x - 2) + ',' + (divline2.y + 5)  + 'L' + (divline2.x) + ',' + (divline2.y) + 'L' + (divline2.x + 2) + ',' + (divline2.y + 5) + 'Z', class: 'symbolLine'}]);
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
      ['circle', {cx: 25, cy: 25, r: 20, class: 'updateIcon'}],
      ['text', {x: 55, y: 15, class: 'dataText'}, clock]
    ]
  );
  for (let i = 0; i < planets.length; i++) {
    let xWindShift = 0;
    if (planets[i].x / Math.pow(10, 9) > 250) {
      xWindShift = -windowWidth;
    }

    // for (let j = 0; j < planets.length; j++) {
    //   if (i !== j) {
    //     let dist = calcDist(planets[i], planets[j] );
    //     if (dist / Math.pow(10, 9) < (windowWidth * 2) && dist / Math.pow(10, 9) > 0) {
    //       console.log('here');
    //       xWindShift = -windowWidth;
    //     }
    //   }
    // }
    for (let j = i + 1; j < planets.length; j++) {
      let dist = calcDist(planets[i], planets[j] );
      // console.log(dist);
    }

    drawn.push(
      ['g', tt( (planets[i].x / Math.pow(10, 9)), (planets[i].y / Math.pow(10, 9))),
        ['g', tt(xWindShift, 0),
          ['rect', {width: windowWidth, height: 45, class: 'dataWindow'}],
          ['text', {x: 8, y: 10, class: 'dataText'}, planets[i].name],
          ['text', {x: 3, y: 20, class: 'dataText'},
            'X:' + (planets[i].x / Math.pow(10, 9)).toFixed(2)
          ],
          ['text', {x: 3, y: 30, class: 'dataText'},
            'Y:' + (planets[i].y / Math.pow(10, 9)).toFixed(2)
          ],
          ['text', {x: 3, y: 40, class: 'dataText'},
            'Z:' + (planets[i].z / Math.pow(10, 9)).toFixed(2)
          ]
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
      // drawMoving(planets, t)
    ]
  ]);
};
