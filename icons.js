const tt = require('onml/tt.js');

module.exports = {

  body: (bodyo) => {
    let tempBod = ['g', tt(bodyo.x, bodyo.y)];

    if (bodyo.industry) {
      tempBod.push(
        ['circle', { r: bodyo.sphereOfInfluence, class: 'bodyZone'}]
      );
    }

    tempBod.push(
      ['circle', {
        r: bodyo.objectRadius * 2,
        fill: "url(#RadialGradient2)"
      }],
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
        r: staro.objectRadius * 50,
        fill: "url(#RadialGradient1)"
      }],
      ['circle', {
        r: staro.objectRadius * 2,
        fill: "url(#RadialGradient2)"
      }],
      ['circle', {
        r: 20,
        class: 'minorOrbit'
      }],
      ['circle', {
        r: staro.objectRadius,
        stroke: staro.color,
        fill: '#363636'
        // class: 'star'
      }]

    );

    return drawnStar;
  },

  intercept: (x, y) => (
    ['g', tt(x, y),
      ['path', {d: 'M  5, 3 L  2, 2 L  3, 5 L  5, 5 Z', class: 'gridBold'}],
      ['path', {d: 'M  5,-3 L  2,-2 L  3,-5 L  5,-5 Z', class: 'gridBold'}],
      ['path', {d: 'M -5, 3 L -2, 2 L -3, 5 L -5, 5 Z', class: 'gridBold'}],
      ['path', {d: 'M -5,-3 L -2,-2 L -3,-5 L -5,-5 Z', class: 'gridBold'}]
    ]
  ),

  marker: (x, y) => (
    ['g', tt(x, y),
      ['path', {d: 'M  3, 3 L  1, 1', class: 'gridBold'}],
      ['path', {d: 'M  3,-3 L  1,-1', class: 'gridBold'}],
      ['path', {d: 'M -3, 3 L -1, 1', class: 'gridBold'}],
      ['path', {d: 'M -3,-3 L -1,-1', class: 'gridBold'}],
      ['circle',{r: 1, class: 'gridBold'}]
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
'M 0,-2 L 2,-4 L 3,-4 L 4,-3 L 4,-1 L 3,0 L 4,1 L 4,3 L 3,4 L -3,4 L -4,3 L -4,1 L -3,0 L -4,-1 L -4,-3 L -3,-4 L -2,-4 Z',
      Barlog: 'M 0,-3 L 2,-5 L 3,-5 L 4,-4 L 4,-3 L 3,-2 L 4,-1 L 4, 1 L 3,2 L 4,3 L 4,4 L 3,5 L -3,5 L -4,4 L -4,3 L -3,2 L -4,1 L -4,-1 L -3,-2 L -4,-3 L -4,-4 L -3,-5 L -2,-5 Z'
    };

    let iconString =
      icono[crafto.class] ?
      icono[crafto.class] :
      'M 0,3 L 3,0 L 0,-3 L -3,0 Z';

    return ['path', {d: iconString, class: 'craft'}];
  },

  station: (stationo) => {
    let retStat = ['g', tt(stationo.x, stationo.y)];

    const icono = {
      extractor:
'M 2,2 L 6,0 L 2,-2 L 0,-8 L -2,-2 L -6,0 L -2,2 Z M -8,-1 L -7,0 L -6,0 M 8,-1 L 7,0 L 6,0',
      small:
'M 1,4 L 3, 0 L 1,-4 L -1,-4 L -3,0 L -1,4 Z M 0,7 L 0, 4 M 0,-7 L 0,-4'
    };

    let iconString =
      icono[stationo.size] ?
      icono[stationo.size] :
      'M 0,3 L 3,0 L 0,-3 L -3,0 Z';

    if (stationo.industry) {
      retStat.push(
        ['circle', { r: stationo.sphereOfInfluence, class: 'bodyZone'}]
      );
    }

    retStat.push(
      ['path', {transform: 'rotate(' + stationo.orient + ')', d: iconString, class: 'station'}]
    );

    return retStat;
  }

};
