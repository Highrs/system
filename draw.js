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

//properties-------------
const starRadius = 20;
//-----------------------

const coordConv = (altitude, degrees, letter) => {
  if (letter === 'x') {
    let x = altitude * (Math.sin(degrees * Math.PI / 180));
    return x;
  } else {
    let y = altitude * (Math.cos(degrees * Math.PI / 180));
    return y;
  }
}

const drawPlanet = (altitude, degrees, objectRadius) => {
  let x = coordConv(altitude, degrees, 'x');
  let y = coordConv(altitude, degrees, 'y');
  return ['g', {},
    ['circle', { r: altitude, class: 'majorOrbit'}],
    ['g', tt(x, y),
      ['circle', { r: objectRadius, class: 'majorObject'}]
    ]

  ];
}

exports.drawMap = () => {
  const star = ['g', {},
    ['circle', { r: starRadius, class: 'majorObject'}]
  ];

  return getSvg({w:pageW, h:pageH}).concat([
    ['g', tt(centerX, centerY),
      star,
      drawPlanet(150, 80, 10),
      drawPlanet(250, 20, 10)
    ]
  ]);
}
