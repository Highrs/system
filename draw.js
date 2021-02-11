'use strict';

const getSvg = require('./get-svg.js');
const tt = (x, y, obj) => Object.assign({transform:
  'translate(' + x + ', ' + y + ')'}, obj);


//properties-------------
const pageW = 600;
const pageH = 600;
const centerX = pageW/2;
const centerY = pageH/2;
//-----------------------

//properties-------------
const starRadius = 20;
//-----------------------

exports.drawMap = () => {
  const star = ['g', tt(centerX, centerY, {}),
    ['circle', { r: starRadius, class: 'majorObject'}]
  ];

  return getSvg({w:pageW, h:pageH}).concat(
    [star]
  );
}
