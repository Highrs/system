(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
// const cos = Math.cos;
// const sin = Math.sin;
const PI = Math.PI;
const sqrt = Math.sqrt;
//properties-------------
// const sh = screen.width*(0.9);
// const sw = screen.height*(0.9);
const pageW = 1200;
const pageH = 1200;
// const pageW = (sh < 900) ? 800 : sh - (sh % 100);
// const pageH = (sw < 800) ? 700 : sw - (sw % 100);
// const centerX = pageW/2;
// const centerY = pageH/2;
//Artistic properties-------------
// const starRadius = 10;
let windowWidth = 120; // width of planet data rectangles
let windowHeight = 25;
let distanceWindowLength = 44;
//--------------------------------

const drawGrid = () => {
  let grid = ['g', {}];
  let crossSize = 5;

  for (let x = 100; x < pageW; x += 100) {
    for (let y = 100; y < pageH; y += 100) {
      grid.push(
        ['line', { x1: x - crossSize, y1: y, x2: x + crossSize, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + crossSize, x2: x, y2: y - crossSize, class: 'grid'}]
      );
    }
  }

  return grid;
};

const drawOrbit = (planets) => {
  if (planets.length < 1) {return ['g', {}];}

  let divline1;
  let divline2;
  let retGroup = ['g', {}];

  for (let i = 0; i < planets.length; i++) {
    let planet = planets[i];
    let coords = 'M ';
    let points = 128;

    for (let i = 0; i < points; i++) {
      let currCoord = mech.orbitCoords((i * 2 * PI) / points,
        planet, majObj[planet.primary]);
      if (i === 0) {
        divline1 = currCoord;
      } else if (Math.abs(points/2 - i) < 1) {
        divline2 = currCoord;
      }
      coords += currCoord.x;
      coords += ',';
      coords += currCoord.y;
      (i === points - 1)?(coords += 'Z'):(coords += 'L');
    }

    retGroup.push(['path',
      { d: coords, class: 'majorOrbit' }]);
    retGroup.push(['line',
      {x1: divline1.x,
        y1: divline1.y,
        x2: divline2.x,
        y2: divline2.y,
        class: 'minorOrbit'}]);
    retGroup.push(['path', {
      d: 'M ' + (divline1.x - 2) + ',' + (divline1.y - 5) + 'L' + (divline1.x)
      + ',' + (divline1.y) + 'L' + (divline1.x + 2) + ',' + (divline1.y - 5)
      + 'Z', class: 'symbolLine'
    }]);
    retGroup.push(['path', {
      d: 'M ' + (divline2.x - 2) + ',' + (divline2.y + 5) + 'L' + (divline2.x)
      + ',' + (divline2.y) + 'L' + (divline2.x + 2) + ',' + (divline2.y + 5)
      + 'Z', class: 'symbolLine'
    }]);
  }

  return retGroup;
};

const calcDist = (planet1, planet2) => {
  return sqrt( Math.pow( (planet1.x - planet2.x), 2 )
  + Math.pow( (planet1.y - planet2.y), 2 )
  + Math.pow( (planet1.z - planet2.z), 2 ) );
};

const indDisplay = (planet) => {
  let display = ['g', tt(0, 30),
    ['rect', {
      width: 100,
      height:
        planet.industry.length * 10 + Object.keys(planet.storage).length * 10 + 25,
      class: 'dataWindow'
    }]
  ];
  display.push(
    ['g', tt(0, 10),
    ['text', {x: 3, y: 0,
      class: 'dataText'}, "Industry:"],
      ['text', {x: 3, y: (planet.industry.length + 1)*10,
        class: 'dataText'}, "Storage:"]
    ]
  );
  planet.industry.forEach((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9, y: (idx + 1) * 10, class: 'dataText'}, e]
      ]
    );
  });
  Object.keys(planet.storage).forEach((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9,
          y: (planet.industry.length + idx + 2) * 10,
          class: 'dataText'}, e + " - " + planet.storage[e]
        ]
      ]
    );
  });

  return display;
};

const drawData = (body) => {
  let dataDisp = ['g', {}];
  if (body.type === 'planet') {
    dataDisp.push(
      ['rect', {
        width: windowWidth,
        height: windowHeight,
        class: 'dataWindow'
      }],
      ['text', {x: 8, y: 10, class: 'dataText'}, body.name],
      ['text', {x: 3, y: 20, class: 'dataText'},
        'XYZ:' +
        (body.x).toFixed(0) +
        ' ' +
        (body.y).toFixed(0) +
        ' ' +
        (body.z).toFixed(0)
      ]
    );
  }
  if (body.industry.length > 0) {
    dataDisp.push(indDisplay(body, 4));
  }
  return dataDisp;
};

const drawBodies = (bodies) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].type === "planet") {
      for (let j = i + 1; j < bodies.length; j++) {
        if (bodies[j].type === "planet") {
          let dist = calcDist(bodies[i], bodies[j]);
          bodiesDrawn.push(['line', {
            x1: bodies[i].x,
            y1: bodies[i].y,
            x2: bodies[j].x,
            y2: bodies[j].y,
            class: 'rangeLine'
          }]);
          bodiesDrawn.push(['g',
          tt((((bodies[j].x) + (bodies[i].x)) / 2 - 22),
            (((bodies[j].y) + (bodies[i].y)) / 2 - 4.5)),
            ['rect', {width: distanceWindowLength, height: 10, class: 'dataWindow'}],
            ['text', {
              x: 2, y: 9, class: 'rangeText'}, (dist).toFixed(2)]
          ]);
        }
      }
    }

    bodiesDrawn.push(
      ['g', tt( (bodies[i].x), (bodies[i].y)),
        drawData(bodies[i]),
        ['circle', { r: bodies[i].objectRadius, class: 'majorObject'}]
      ]
    );

  }
  return bodiesDrawn;
};

const drawTime = (clock) => {
  return ['g', tt(10, 20),
        ['text', {class: 'dataText'}, clock]];
};

const drawStar = (staro) =>{
  let star = ['g', {}, ];

  Object.keys(staro).forEach((starName) => {
    star.push(['g', tt(staro[starName].x, staro[starName].y), ['circle', {
      r: staro[starName].objectRadius,
      class: 'majorObject'
    }]]);
  });

  return star;
};

exports.drawMoving = (clock, planets, moons, ast) => {
  return ['g', {},
    drawTime(clock),
    drawOrbit(moons),
    drawBodies(moons),
    drawBodies(planets),
    drawBodies(ast)
  ];
};

exports.drawStatic = (stars, planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['g', {},
      drawOrbit(planets),
      ['g', {id: 'moving'}],
      drawGrid(),
      drawStar(stars)
    ]
  ]);
};

},{"./get-svg.js":2,"./majorObjects2.json":6,"./mechanics.js":7,"onml/tt.js":10}],2:[function(require,module,exports){
module.exports = cfg => {
  cfg = cfg || {};
  cfg.w = cfg.w || 880;
  cfg.h = cfg.h || 256;
  return ['svg', {
   xmlns: 'http://www.w3.org/2000/svg',
    width: cfg.w + 1,
    height: cfg.h + 1,
    viewBox: [0, 0, cfg.w + 1, cfg.h + 1].join(' '),
    class: 'panel'
  }];
}

},{}],3:[function(require,module,exports){
'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');

const industryStoreCheck = (planet) => {
  if (planet.industry) {
    planet.industry.forEach((planetIndName) => {
      if (!planet.storage[indTemp[planetIndName].storage]) {
        Object.assign(planet.storage, indTemp[planetIndName].storage);
      }
      indWork(planet, planetIndName);
    });
  }
};

const initInd = (planet) => {
  industryStoreCheck(planet);
};

const indWork = (planet, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).forEach((inputResource) => {
    if (
      (!planet.storage[inputResource]) ||
      (indTemp[industry].input[inputResource] > planet.storage[inputResource])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).forEach((inputResource) => {
      planet.storage[inputResource] -= indTemp[industry].input[inputResource];
    });

    setTimeout(
      function(){
        Object.keys(indTemp[industry].output).forEach((outputResource) => {
          planet.storage[outputResource] += indTemp[industry].output[outputResource];
        });
        indWork(planet, industry);
      },
      indTemp[industry].cycle);
  }
};

exports.initInd = initInd;
exports.indWork = indWork;

},{"./industryTemp.json":4}],4:[function(require,module,exports){
module.exports={
  "mining": {
    "cycle": 1000,
    "input": {},
    "output": {
      "ore": 1
    },
    "storage": {
      "ore": 10
    }
  },

  "refining": {
    "cycle": 2000,
    "input": {
      "ore": 2
    },
    "output": {
      "metal": 1
    },
    "storage": {
      "ore": 100,
      "metal": 0
    }
  }
}

},{}],5:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');
// Initialization and run
const draw = require('./draw.js');
const renderer = require('onml/renderer.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
// const hulls = require('./hulls.json');

const makeStar = (staro) => {
  return staro;
};

const makeBody = (planeto) => {
  ind.initInd(planeto);
  const planDat = mech.kepCalc(0, planeto);
  const planet = Object.assign(
    planeto,
    {
      focalShift: planDat.focalShift,
      x: planDat.x,
      y: planDat.y,
      z: planDat.z
    }
  );
  return planet;
};

// const makeCraft = (crafto) => {
//   const craft = Object.assign(
//     crafto,
//     {x: 150000000, y: 0, z: 0}
//   );
//   return craft;
// };

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
  console.log("Giant alien spiders are no joke!");
  let stars = [];
  let planets = [];
  let moons = [];
  let ast = [];

  // const craft = [];

  Object.keys(majObj).forEach((objName) => {
    // console.log(el);
    if (majObj[objName].type === "star") {
      stars.push(makeStar(majObj[objName]));
    } else
    if (majObj[objName].type === "planet") {
      planets.push(makeBody(majObj[objName]));
    } else
    if (majObj[objName].type === "moon") {
      moons.push(makeBody(majObj[objName]));
    } else
    if (majObj[objName].type === "asteroid") {
      ast.push(makeBody(majObj[objName]));
    } else {
      console.log("ERROR at make. Skipping.");
    }
  });
  // for (let i = 0; i < 1; i++) {
  //   craft.push(makeCraft(hulls.brick));
  // }

  renderer(document.getElementById('content'))(draw.drawStatic(stars, planets));
  const render2 = renderer(document.getElementById('moving'));

  let movBod = [];
  movBod = movBod.concat(planets, moons, ast);
  while (Date.now()) {
    const clock = Date.now();
    const t = clock / Math.pow(10, 2);
    const clock2 = Date(clock);

    for (let i = 0; i < movBod.length; i++) {
      let newData = mech.kepCalc(t, movBod[i]);
      movBod[i].x = newData.x;
      movBod[i].y = newData.y;
      movBod[i].z = newData.z;
    }

    render2(draw.drawMoving(clock2, planets, moons, ast));
    await delay(50);
  }
};

window.onload = main;

},{"./draw.js":1,"./industry.js":3,"./majorObjects2.json":6,"./mechanics.js":7,"onml/renderer.js":8}],6:[function(require,module,exports){
module.exports={
  "prime": {
    "name": "Prime",
    "type": "star",
    "mass": 20000000000,
    "x": 600,
    "y": 600,
    "z": 0,
    "objectRadius": 5
  },
  "beta": {
    "name": "Beta",
    "type": "planet",
    "primary": "prime",
    "mass": 60000000,
    "a":    400,
    "e":    0.01,
    "t":    0,
    "t0":   0,
    "w":    2,
    "lang": 1.6,
    "inc":  0.2,
    "maz":  0,
    "objectRadius": 5,
    "industry": ["refining"],
    "storage": {}
  },
  "alpha": {
    "name": "Alpha",
    "type": "planet",
    "primary": "prime",
    "mass": 60000000,
    "a":    250,
    "e":    0.05,
    "t":    0,
    "t0":   0,
    "w":    2,
    "lang": 0,
    "inc":  0.1,
    "maz":  0,
    "objectRadius": 5,
    "industry": ["mining", "mining"],
    "storage": {}
  },
  "delta": {
    "name": "Delta",
    "type": "planet",
    "primary": "prime",
    "mass": 60000000,
    "a":    100,
    "e":    0.01,
    "t":    0,
    "t0":   0,
    "w":    4,
    "lang": 1.6,
    "inc":  0.2,
    "maz":  0,
    "objectRadius": 5,
    "industry": [],
    "storage": {}
  },
  "bMinB": {
    "name": "Beta Minor B",
    "type": "moon",
    "primary": "beta",
    "mass": 10000,
    "a":    40,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "objectRadius": 2,
    "industry": [],
    "storage": {}
  },
  "bMinA": {
    "name": "Beta Minor A",
    "type": "moon",
    "primary": "beta",
    "mass": 10000,
    "a":    20,
    "e":    .5,
    "t":    0,
    "t0":   0,
    "w":    2,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "objectRadius": 2,
    "industry": [],
    "storage": {}
  },
  "aMinA": {
    "name": "Alpha Minor A",
    "type": "moon",
    "primary": "alpha",
    "mass": 10000,
    "a":    20,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "objectRadius": 2,
    "industry": [],
    "storage": {}
  },
  "astroDelta": {
    "name": "Asteroid Delta",
    "type": "asteroid",
    "primary": "prime",
    "mass": 1,
    "a":    550,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "objectRadius": 1,
    "industry": [],
    "storage": {}
  }
}

},{}],7:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');

const cos = Math.cos;
const sin = Math.sin;
const PI = Math.PI;
const sqrt = Math.sqrt;

exports.kepCalc = (t, planeto) => {
  let primaryo = majObj[planeto.primary];

  let a    = planeto.a;    // semi-major axis (a)
  let e    = planeto.e;    // eccentricity (e)
  let t0   = planeto.t0;   // epoch (days) (t0)
  let w    = planeto.w;    // argument of periapsis (w)
  let lang = planeto.lang; // longitude of ascention node (lang)
  let inc  = planeto.inc;  // inclanation (inc)
  let maz  = planeto.maz;  // mean anomaly at zero (maz)
  // time (days) (t)

  a = a * Math.pow(10, 9);
  const g = 6.674 * Math.pow(10, -11); // Gravitational constant G
  const mass = primaryo.mass * Math.pow(10, 20); // Central object mass, approximately sol
  const u = g * mass; // Standard gravitational parameter u

  const calcMinorAxis = (a, e) => {return ( a * sqrt(1 - e * e) );};
  const b = (calcMinorAxis(a, e)); // minorAxis b[m]

  const calcFocalShift = (a, b) => {
    return ( sqrt(Math.pow(a, 2) - Math.pow(b, 2)) );};
  const focalShift = (calcFocalShift(a, b)); // distance of focus from center

  const epoch = t0; //epoch (given) (days)

  const calcMat = (t, epoch) => {
    let tdiff = ( 86400 * ( t - epoch ) );
    let mat = maz + ( tdiff * sqrt( u / Math.pow(a, 3) ) );
    while (mat < 0) {
      mat += PI * 2;
    }
    mat = mat % (PI * 2);
    return mat;
  }; // Mean anomaly at epoch M(t)
  const mat = calcMat(t, epoch); // Mean Anomaly at Time

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

  const calcTAT = (e, eat) => {
    return ( 2 * Math.atan2(
      ( sqrt(1 + e) * sin(eat / 2) ),
      ( sqrt(1 - e) * cos(eat / 2) )
    ) );
  }; // True Anomaly at Time v(t)
  const tat = calcTAT(e, eat);

  const calcDisanceToCentral = (a, e, eat) => {
    return ( a * ( 1 - ( e * cos(eat) ) ) );
  };
  const dist = calcDisanceToCentral(a, e, eat);

  // Positional vectors in orbital frame o(t)
  const ox = dist * cos(tat);
  const oy = dist * sin(tat);
  // const oz = 0;

  const x = ( ox * ( (cos(w) * cos(lang)) - (sin(w) * cos(inc) * sin(lang)) )
    - oy * ( (sin(w) * cos(lang)) + (cos(w) * cos(inc) * sin(lang)) ) );
  const y = ( ox * ( (cos(w) * sin(lang)) + (sin(w) * cos(inc) * cos(lang)) )
    + oy * ( (cos(w) * cos(inc) * cos(lang)) - (sin(w) * sin(lang)) ) );
  const z = ( ox * ( sin(w) * sin(inc) ) + oy * ( cos(w) * sin(inc) ) );

  return {
    x: (x / Math.pow(10, 9)) + primaryo.x,
    y: (y / Math.pow(10, 9)) + primaryo.y,
    z: (z / Math.pow(10, 9)) + primaryo.z,
    focalShift: focalShift };
};


exports.orbitCoords = (mat, planeto) => {
  let primaryo = majObj[planeto.primary];

  let a    = planeto.a;    // semi-major axis (a)
  let e    = planeto.e;    // eccentricity (e)
  let w    = planeto.w;    // argument of periapsis (w)
  let lang = planeto.lang; // longitude of ascention node (lang)
  let inc  = planeto.inc;  // inclanation (inc)

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

  const x = ( ox * ( (cos(w) * cos(lang)) - (sin(w) * cos(inc) * sin(lang)) )
    - oy * ( (sin(w) * cos(lang)) + (cos(w) * cos(inc) * sin(lang)) ) );
  const y = ( ox * ( (cos(w) * sin(lang)) + (sin(w) * cos(inc) * cos(lang)) )
    + oy * ( (cos(w) * cos(inc) * cos(lang)) - (sin(w) * sin(lang)) ) );
  const z = ( ox * ( sin(w) * sin(inc) ) + oy * ( cos(w) * sin(inc) ) );

  return {
    x: x + primaryo.x,
    y: y + primaryo.y,
    z: z + primaryo.z
  };
};

},{"./majorObjects2.json":6}],8:[function(require,module,exports){
'use strict';

const stringify = require('./stringify.js');

const renderer = root => {
  const content = (typeof root === 'string')
    ? document.getElementById(root)
    : root;

  return ml => {
    let str;
    try {
      str = stringify(ml);
      content.innerHTML = str;
    } catch (err) {
      console.log(ml);
    }
  };
};

module.exports = renderer;

/* eslint-env browser */

},{"./stringify.js":9}],9:[function(require,module,exports){
'use strict';

const isObject = o => o && Object.prototype.toString.call(o) === '[object Object]';

function indenter (indentation) {
  if (!(indentation > 0)) {
    return txt => txt;
  }
  var space = ' '.repeat(indentation);
  return txt => {

    if (typeof txt !== 'string') {
      return txt;
    }

    const arr = txt.split('\n');

    if (arr.length === 1) {
      return space + txt;
    }

    return arr
      .map(e => (e.trim() === '') ? e : space + e)
      .join('\n');
  };
}

const clean = txt => txt
  .split('\n')
  .filter(e => e.trim() !== '')
  .join('\n');

function stringify (a, indentation) {
  const cr = (indentation > 0) ? '\n' : '';
  const indent = indenter(indentation);

  function rec(a) {
    let body = '';
    let isFlat = true;

    let res;
    const isEmpty = a.some((e, i, arr) => {
      if (i === 0) {
        res = '<' + e;
        return (arr.length === 1);
      }

      if (i === 1) {
        if (isObject(e)) {
          Object.keys(e).map(key => {
            let val = e[key];
            if (Array.isArray(val)) {
              val = val.join(' ');
            }
            res += ' ' + key + '="' + val + '"';
          });
          if (arr.length === 2) {
            return true;
          }
          res += '>';
          return;
        }
        res += '>';
      }

      switch (typeof e) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'undefined':
        body += e + cr;
        return;
      }

      isFlat = false;
      body += rec(e);
    });

    if (isEmpty) {
      return res + '/>' + cr; // short form
    }

    return isFlat
      ? res + clean(body) + '</' + a[0] + '>' + cr
      : res + cr + indent(body) + '</' + a[0] + '>' + cr;
  }

  return rec(a);
}

module.exports = stringify;

},{}],10:[function(require,module,exports){
'use strict';

module.exports = (x, y, obj) => {
  let objt = {};
  if (x || y) {
    const tt = [x || 0].concat(y ? [y] : []);
    objt = {transform: 'translate(' + tt.join(',') + ')'};
  }
  obj = (typeof obj === 'object') ? obj : {};
  return Object.assign(objt, obj);
};

},{}]},{},[5]);
