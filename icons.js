const tt = require('onml/tt.js');

module.exports = {

  template: () => (
    ['g', {},

    ]
  ),

  body: (bodyo) => {
    let tempBod = ['g', tt(bodyo.x, bodyo.y)];

    if (bodyo.industry) {
      tempBod.push(
        ['circle', { r: bodyo.soi, class: 'bodyZone'}]
      );
    }

    tempBod.push(
      ['g', {},
        ['circle', { r: bodyo.objectRadius, class: bodyo.industry?'majorObject':'minorObject'}]
      ]
    );

    return tempBod;
  },

  star: (staro) => {
    let drawnStar = ['g', tt(staro.x, staro.y)];
    drawnStar.push(
      ['circle', {
        r: staro.objectRadius,
        class: 'majorObject'
      }]
    );

    for (let j = 0; j < 16; j++) {
      drawnStar.push(
        ['line', {
          transform: 'rotate(' + ((360 / 16) * j) +')',
          x1: staro.objectRadius + 5,
          x2: staro.objectRadius + 25,
          class: 'grid'}
        ],
        ['line', {
          transform: 'rotate(' + ((360 / 16) * j) +')',
          x1: staro.objectRadius + 40,
          x2: staro.objectRadius + 50,
          class: 'grid'}
        ],
        ['line', {
          transform: 'rotate(' + ((360 / 16) * j) +')',
          x1: staro.objectRadius + 65,
          x2: staro.objectRadius + 70,
          class: 'grid'}
        ]
      );
    }

    return drawnStar;
  },

  intercept: (crafto) => (
    ['g', tt(crafto.intercept.x, crafto.intercept.y),
      ['path', {d: 'M -5, 3 L -2, 2 L -3, 5 L -5, 5 Z', class: 'gridBold'}],
      ['path', {d: 'M  5, 3 L  2, 2 L  3, 5 L  5, 5 Z', class: 'gridBold'}],
      ['path', {d: 'M  5,-3 L  2,-2 L  3,-5 L  5,-5 Z', class: 'gridBold'}],
      ['path', {d: 'M -5,-3 L -2,-2 L -3,-5 L -5,-5 Z', class: 'gridBold'}]
    ]
  ),

  apsis: (m = '') => (
    ['g', {},
      ['path', {d: 'M -2,'+m+'5 L 0,0 L 2,'+m+'5 Z', class: 'symbolLine'}]
    ]
  ),

  craft: (crafto) => {
    const icono = {
      Brick:
'M 0,0 L 2,-2 L 2,2 L 1,3 L -1,3 L -2,2 L -2,-2 Z',
      Boulder:
'M 0,-1 L 2,-3 L 3,-2 L 3,3 L 2,4 L -2,4 L -3,3 L -3,-2 L -2,-3 Z',
      Mountain:
'M 0,-2 L 2,-4 L 3,-4 L 4,-3 L 4,-1 L 3,0 L 4,1 L 4,3 L 3,4 L -3,4 L -4,3 L -4,1 L -3,0 L -4,-1 L -4,-3 L -3,-4 L -2,-4 Z'
    };

    let iconString = 'M 0,3 L 3,0 L 0,-3 L -3,0 Z';

    if (icono[crafto.class]) {iconString = icono[crafto.class];}
    return ['path', {d: iconString, class: 'craft'}];
  }

};
