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

const drawPlanet = (planets) => {
  let drawnPlanets = ['g', {}];
  for (let i = 0; i < planets.length; i++) {
    console.log('here');
    drawnPlanets.push(
      // ['g', {transform: 'rotate(' + ( planets[i].w * 180 / Math.PI ) + ')'},
      //   ['ellipse', {
      //     transform: 'rotate(' + ( planets[i].w * 180 / Math.PI ) + ')',
      //     cx: - planets[i].focalShift / Math.pow(10, 9),
      //     cy: 0,
      //     rx: ( planets[i].a / Math.pow(10, 9) ),
      //     ry: ( planets[i].b / Math.pow(10, 9) ),
      //     class: 'majorOrbit',
      //   }]
      // ],
      ['g', tt( (planets[i].x / Math.pow(10, 9)), (planets[i].y / Math.pow(10, 9))),
        ['circle', { r: planets[i].objectRadius, class: 'majorObject'}]
      ],
      ['circle', { r: 240, class: 'majorOrbit'}]
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
      star,
      drawPlanet(planets),
    ]
  ]);
}
