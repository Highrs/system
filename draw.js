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
  for (let x = -pageW / 2 + 50; x < 700 / 2; x += 50) {
    for (let y = -pageH / 2 + 50; y < 700 / 2; y += 50) {
      grid.push(
        ['line', { x1: x - 1, y1: y, x2: x + 1, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + 1, x2: x, y2: y - 1, class: 'grid'}]
      );
    }
  }
  return grid;
}

const orbitCoords = (a, e, mat, w, lang, inc) => {
  // Kepler's Equasion: M = E - e * sin(E)= with M(at t) and e(ccentricity)
  console.log(a, e, mat, w, lang, inc);
  const itter = 3;
  const calcEAT = (e, mat) => {
    let eat = mat;
    for (let i = 0; i < itter; i++) {
      eat = eat - ( (eat - ( e * Math.sin(eat) ) - mat) / ( 1 - e * Math.cos(eat) ) );
    }
    return eat;
  } // Eccentric anomaly at time E(t)
  const eat = calcEAT(e, mat); // Eccentric anomaly at time

  const calcTAT = (e, eat) => {
    return ( 2 * Math.atan2(
      ( Math.sqrt(1 + e) * Math.sin(eat / 2) ),
      ( Math.sqrt(1 - e) * Math.cos(eat / 2) )
    ) );
  } // True Anomaly at Time v(t)
  const tat = calcTAT(e, eat);

  const calcDisanceToCentral = (a, e, eat) => {
    return ( a * ( 1 - ( e * Math.cos(eat) ) ) );
  }
  const dist = calcDisanceToCentral(a, e, eat);

  // Positional vectors in orbital frame o(t)
  const ox = dist * Math.cos(tat);
  const oy = dist * Math.sin(tat);
  // const oz = 0;

  const x = ( ox * ( (Math.cos(w) * Math.cos(lang)) - (Math.sin(w) * Math.cos(inc) * Math.sin(lang)) ) - oy * ( (Math.sin(w) * Math.cos(lang)) + (Math.cos(w) * Math.cos(inc) * Math.sin(lang)) ) );
  const y = ( ox * ( (Math.cos(w) * Math.sin(lang)) + (Math.sin(w) * Math.cos(inc) * Math.cos(lang)) ) + oy * ( (Math.cos(w) * Math.cos(inc) * Math.cos(lang)) - (Math.sin(w) * Math.sin(lang)) ) );
  const z = ( ox * ( Math.sin(w) * Math.sin(inc) ) + oy * ( Math.cos(w) * Math.sin(inc) ) );

  console.log(x, y, z);
  return { x: x, y: y, z: z};
}



const drawOrbit = (planet) => {
  let coords = 'M ';
  let points = 64;
  for (let i = 0; i < points; i++) {
    let currCoord = orbitCoords(planet.a, planet.e, (i * 2 * Math.PI)/points, planet.w, planet.lang, planet.inc);
    coords += currCoord.x;
    coords += ',';
    coords += currCoord.y;
    if (i === points - 1) {
      coords += 'Z';
    } else {
      coords += 'L';
    }
  }
  return ['path', { d: coords, class: 'majorOrbit' }];
}

const drawPlanet = (planets) => {
  let drawnPlanets = ['g', {}];
  for (let i = 0; i < planets.length; i++) {
    drawnPlanets.push(
      ['g', tt( (planets[i].x / Math.pow(10, 9)), (planets[i].y / Math.pow(10, 9))),
        ['circle', { r: planets[i].objectRadius, class: 'majorObject'}]
      ],
      drawOrbit(planets[i])
    )
  }
  return drawnPlanets;
}

exports.drawMap = (planets) => {
  const star = ['g', {},
    ['circle', { r: starRadius, class: 'majorObject'}]
  ];

  return getSvg({w:pageW, h:pageH}).concat([
    ['g', tt(centerX, centerY),
      drawGrid(),
      star,
      drawPlanet(planets),
    ]
  ]);
}
