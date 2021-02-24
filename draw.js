'use strict';

const getSvg = require('./get-svg.js');
const tt = (x, y) => Object.assign({transform:
  'translate(' + x + ', ' + y + ')'});

//properties-------------
const pageW = 700;
const pageH = 700;
const centerX = pageW/2;
const centerY = pageH/2;
//-----------------------

//Artistic properties-------------
const starRadius = 10;
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
}

const orbitCoords = (a, e, mat, w, lang, inc) => {
  // Kepler's Equasion: M = E - e * sin(E)= with M(at t) and e(ccentricity)
  const itter = 3;
  const calcEAT = (e, mat) => {
    let eat = mat;
    for (let i = 0; i < itter; i++) {
      eat = eat - ( (eat - ( e * Math.sin(eat) ) - mat) / ( 1 - e * Math.cos(eat) ) );
    }
    return eat;
  } // Eccentric anomaly at time E(t)
  const eat = calcEAT(e, mat); // Eccentric anomaly at time

  const tat = ( 2 * Math.atan2(
    ( Math.sqrt(1 + e) * Math.sin(eat / 2) ),
    ( Math.sqrt(1 - e) * Math.cos(eat / 2) )
  ) );

  const dist = ( a * ( 1 - ( e * Math.cos(eat) ) ) );

  // Positional vectors in orbital frame o(t)
  const ox = dist * Math.cos(tat);
  const oy = dist * Math.sin(tat);
  // const oz = 0;

  const x = ( ox * ( (Math.cos(w) * Math.cos(lang)) - (Math.sin(w) * Math.cos(inc) * Math.sin(lang)) ) - oy * ( (Math.sin(w) * Math.cos(lang)) + (Math.cos(w) * Math.cos(inc) * Math.sin(lang)) ) );
  const y = ( ox * ( (Math.cos(w) * Math.sin(lang)) + (Math.sin(w) * Math.cos(inc) * Math.cos(lang)) ) + oy * ( (Math.cos(w) * Math.cos(inc) * Math.cos(lang)) - (Math.sin(w) * Math.sin(lang)) ) );
  const z = ( ox * ( Math.sin(w) * Math.sin(inc) ) + oy * ( Math.cos(w) * Math.sin(inc) ) );

  return { x: x, y: y, z: z};
}

const drawOrbits = (planets) => {
  let divline1;
  let divline2;
  let retGroup = ['g', {}];
  for (let i = 0; i < planets.length; i++) {
    let planet = planets[i];
    let coords = 'M ';
    let points = 128;
    for (let i = 0; i < points; i++) {
      let currCoord = orbitCoords( planet.a, planet.e, (i * 2 * Math.PI)/points, planet.w, planet.lang, planet.inc );
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
    retGroup.push(['line', {x1: divline1.x, y1: divline1.y, x2: divline2.x, y2: divline2.y, class: 'minorOrbit'}])
  }
  return retGroup;
}

const drawMoving = (planets, t) => {
  let drawn = ['g', {}];
  drawn.push(
    ['g', tt( -centerX, -centerY ),
      ['circle', {cx: 25, cy: 25, r: 20, class: 'updateIcon'}],
      ['text', {x: 55, y: 15, class: 'dataText'}, t]
    ]
  )
  for (let i = 0; i < planets.length; i++) {
    let windowWidth = 70;
    let xWindShift = 0;
    if (planets[i].x / Math.pow(10, 9) > 250) {
      xWindShift = -windowWidth;
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
    )
  }
  return drawn;
}

const star = ['g', {},
  ['circle', { r: starRadius, class: 'majorObject'}]
];

const drawStatic = (planets) => {
  return ['g', {},
    drawGrid(),
    drawOrbits(planets),
    star
  ]
}

exports.drawMap = (planets, t) => {

  return getSvg({w:pageW, h:pageH}).concat([
    ['g', tt(centerX, centerY),
      drawStatic(planets),
      drawMoving(planets, t)
    ]
  ]);
}
