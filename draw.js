'use strict';

const getSvg = require('./get-svg.js');
const tt = (x, y) => Object.assign({transform:
  'translate(' + x + ', ' + y + ')'});


//properties-------------
const pageW = 600;
const pageH = 600;
const centerX = pageW/2;
const centerY = pageH/2;
//-----------------------

//Artistic properties-------------
const starRadius = 15;
//--------------------------------

const drawPlanet = (planet) => {
  return ['g', {},
    ['ellipse', {
      cx: - planet.focalShift / Math.pow(10, 9),
      cy: 0,
      rx: planet.a / Math.pow(10, 9),
      ry: planet.b / Math.pow(10, 9),
      class: 'majorOrbit'
    }],
    ['g', tt(planet.x, planet.y),
      ['circle', { r: planet.objectRadius, class: 'majorObject'}]
    ]
  ];
}

exports.drawMap = (planet1) => {
  const star = ['g', {},
    ['circle', { r: starRadius, class: 'majorObject'}]
  ];

  return getSvg({w:pageW, h:pageH}).concat([
    ['g', tt(centerX, centerY),
      star,
      drawPlanet(planet1),
    ]
  ]);
}
