const tt = require('onml/tt.js');

module.exports = {

  body:         (bodyo) => {
    let tempBod = ['g', {}];

    if (bodyo.industry) {
      tempBod.push(
        ['g', {},
          ['circle', {
            r: 0,
            class: 'bodyZone'
          }]
        ]
      );
    }

    tempBod.push(
      ['circle', {
        r: bodyo.objectRadius * 8,
        fill: "url(#RadialGradient2)"
      }],
      ['circle', {
        r: bodyo.objectRadius * 2,
        class: bodyo.industry?'majorObject':'minorObject'
      }]
    );

    return tempBod;
  },
  star:         (staro, mapPan) => {
    let drawnStar = ['g', tt(staro.x * mapPan.zoom, staro.y * mapPan.zoom)];

    drawnStar.push(
      ['circle', {
        r: staro.objectRadius * 50 * mapPan.zoom,
        fill: "url(#RadialGradient1)"
      }],
      ['circle', {
        r: staro.objectRadius * 4 * mapPan.zoom,
        fill: "url(#RadialGradient3)"
      }],
      ['circle', {
        r: 20 * mapPan.zoom,
        class: 'minorOrbit'
      }],
      ['circle', {
        r: staro.objectRadius * mapPan.zoom,
        stroke: staro.color,
        fill: '#363636'
        // class: 'star'
      }]

    );

    return drawnStar;
  },
  intercept:    (x, y) => (
    ['g', tt(x, y),
      ['path', {d: 'M  5, 3 L  2, 2 L  3, 5 L  5, 5 Z', class: 'gridBold'}],
      ['path', {d: 'M  5,-3 L  2,-2 L  3,-5 L  5,-5 Z', class: 'gridBold'}],
      ['path', {d: 'M -5, 3 L -2, 2 L -3, 5 L -5, 5 Z', class: 'gridBold'}],
      ['path', {d: 'M -5,-3 L -2,-2 L -3,-5 L -5,-5 Z', class: 'gridBold'}]
    ]
  ),
  marker:       () => (
    ['g', {},
      ['path', {d: 'M  3, 3 L  1, 1', class: 'gridBold'}],
      ['path', {d: 'M  3,-3 L  1,-1', class: 'gridBold'}],
      ['path', {d: 'M -3, 3 L -1, 1', class: 'gridBold'}],
      ['path', {d: 'M -3,-3 L -1,-1', class: 'gridBold'}],
      ['circle',{r: 1, class: 'gridBold'}]
    ]
  ),
  apsis:        (m = '') => (
    ['g', {},
      ['path', {
        d: 'M -3,'+m+'10 L 0,0 L 3,'+m+'10 Z',
        class: 'symbolLine'
      }],
      ['circle', {
        r:2.5,
        class: 'symbolLine'
      }]
    ]
  ),
  craft:        (crafto) => {
    const icono = {
      Brick:
'M 0,0 L 2,-2 L 2,2 L 1,3 L -1,3 L -2,2 L -2,-2 Z',
      Boulder:
'M 0,-1 L 2,-3 L 3,-2 L 3,3 L 2,4 L -2,4 L -3,3 L -3,-2 L -2,-3 Z',
      Mountain:
'M 0,-2 L 2,-4 L 3,-4 L 4,-3 L 4,-1 L 3,0 L 4,1 L 4,3 L 3,4 L -3,4 L -4,3 L -4,1 L -3,0 L -4,-1 L -4,-3 L -3,-4 L -2,-4 Z',
      Barlog: 'M 0,-3 L 2,-5 L 3,-5 L 4,-4 L 4,-3 L 3,-2 L 4,-1 L 4, 1 L 3,2 L 4,3 L 4,4 L 3,5 L -3,5 L -4,4 L -4,3 L -3,2 L -4,1 L -4,-1 L -3,-2 L -4,-3 L -4,-4 L -3,-5 L -2,-5 Z',
      Menace: 'M 0,0 L 3,-3 L 0, 5 L -3,-3 Z'
    };

    let iconString =
      icono[crafto.class] ?
      icono[crafto.class] :
      'M 0,3 L 3,0 L 0,-3 L -3,0 Z';

    return ['g', {},

      ['circle', {
        r: 20,
        fill: "url(#EngineFlare)"
      }],
      ['path', {
        transform: 'scale(2, 2)',
        d: iconString,
        class: 'craft'
      }]
    ];
  },
  station:      (stationo, mapPan) => {
    let retStat = ['g', {}];

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
        ['circle', {
          r: stationo.sphereOfInfluence * mapPan.zoom,
          class: 'bodyZone'
        }]
      );
    }

    retStat.push(
      ['path', {
        id: stationo.mapID + '-ORIENT',
        transform: 'rotate(' + stationo.orient + '), scale(1.5, 1.5)',
        // , scale(2, 2)
        d: iconString,
        class: 'station'
      }]
    );

    return retStat;
  },
  gridCross:    (crossSize, x, y) => {
    return ['g', {},
      ['line', {
        x1: x - crossSize, y1: y,
        x2: x + crossSize, y2: y,
        class: 'grid'
      }],
      ['line', {
        x1: x, y1: y + crossSize,
        x2: x, y2: y - crossSize,
        class: 'grid'
      }]
    ];
  },
  arrow:        (hOffset = 0, mirror = false) => {
    return ['path', tt(15 + hOffset, 15, {d: ('M '+(mirror?'+':'-')+'5, 10 L '+(mirror?'-':'+')+'5, 0 L '+(mirror?'+':'-')+'5, -10'), class: 'UIcon'})];
  },
  brackets:     (iD, margin = 0, offsetY = 0) => {
    let corner = 10 + margin;
    let sides = corner - 5;
    return ['g', tt(0, offsetY, {class: 'standardSelector', id:iD}),
      ['rect', {
        x:-corner,
        y:-corner,
        height: corner*2,
        width: corner*2,
        class: 'invisibleBox'
      }],
      ['path', {d: 'M  '+corner+',  '+sides+' L  '+corner+',  '+corner+' L  '+sides+',  '+corner}],
      ['path', {d: 'M -'+corner+', -'+sides+' L -'+corner+', -'+corner+' L -'+sides+', -'+corner}],
      ['path', {d: 'M  '+corner+', -'+sides+' L  '+corner+', -'+corner+' L  '+sides+', -'+corner}],
      ['path', {d: 'M -'+corner+',  '+sides+' L -'+corner+',  '+corner+' L -'+sides+',  '+corner}]
    ];
  }
};
