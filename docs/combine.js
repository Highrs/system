(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
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
const pageW = 1000;
const pageH = 1000;
// const pageW = (sh < 900) ? 800 : sh - (sh % 100);
// const pageH = (sw < 800) ? 700 : sw - (sw % 100);
const centerX = pageW/2;
const centerY = pageH/2;
//Artistic properties-------------
const starRadius = 10;
let windowWidth = 120; // width of planet data rectangles
let windowHeight = 25;
let distanceWindowLength = 44;
//--------------------------------

const drawGrid = () => {
  let grid = ['g', {}];
  let crossSize = 5;

  for (let x = -pageW / 2 + 50; x < pageW / 2; x += 50) {
    for (let y = -pageH / 2 + 50; y < pageH / 2; y += 50) {
      grid.push(
        ['line', { x1: x - crossSize, y1: y, x2: x + crossSize, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + crossSize, x2: x, y2: y - crossSize, class: 'grid'}]
      );
    }
  }
  return grid;
};

const drawOrbits = (planets) => {
  let divline1;
  let divline2;
  let retGroup = ['g', {}];

  for (let i = 0; i < planets.length; i++) {
    let planet = planets[i];
    let coords = 'M ';
    let points = 128;

    for (let i = 0; i < points; i++) {
      let currCoord = mech.orbitCoords( planet.a, planet.e, (i * 2 * PI)/points, planet.w, planet.lang, planet.inc );
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
      {x1: divline1.x, y1: divline1.y, x2: divline2.x, y2: divline2.y, class: 'minorOrbit'}]);
    retGroup.push(['path',
      { d: 'M ' + (divline1.x - 2) + ',' + (divline1.y - 5)  + 'L' + (divline1.x) + ',' + (divline1.y) + 'L' + (divline1.x + 2) + ',' + (divline1.y - 5) + 'Z', class: 'symbolLine'}]);
    retGroup.push(['path',
      { d: 'M ' + (divline2.x - 2) + ',' + (divline2.y + 5)  + 'L' + (divline2.x) + ',' + (divline2.y) + 'L' + (divline2.x + 2) + ',' + (divline2.y + 5) + 'Z', class: 'symbolLine'}]);
  }
  return retGroup;
};

const calcDist = (planet1, planet2) => {
  return sqrt(Math.pow( (planet1.x - planet2.x), 2 ) + Math.pow( (planet1.y - planet2.y), 2 ) + Math.pow( (planet1.z - planet2.z), 2 ) );
};

exports.drawMoving = (planets, clock) => {
  const drawn = ['g', {}];
  drawn.push(
    ['g', tt( -centerX, -centerY ),
      // ['circle', {cx: 25, cy: 25, r: 20, class: 'updateIcon'}],
      ['text', {x: 55, y: 15, class: 'dataText'}, clock]
    ]
  );

  for (let i = 0; i < planets.length; i++) {
    let xWindShift = 0;
    if (planets[i].x / Math.pow(10, 9) > pageW - 100) {
      xWindShift = -windowWidth;
    }

    for (let j = i + 1; j < planets.length; j++) {
      let dist = calcDist(planets[i], planets[j] );
      drawn.push(['line',{
        x1: planets[i].x / Math.pow(10, 9),
        y1: planets[i].y / Math.pow(10, 9),
        x2: planets[j].x / Math.pow(10, 9),
        y2: planets[j].y / Math.pow(10, 9), class: 'rangeLine' } ]);
      drawn.push(['g',
      tt((((planets[j].x / Math.pow(10, 9)) + (planets[i].x / Math.pow(10, 9))) / 2 - 22),
         (((planets[j].y / Math.pow(10, 9)) + (planets[i].y / Math.pow(10, 9))) / 2 - 4.5)),
        ['rect', {width: distanceWindowLength, height: 10, class: 'dataWindow'}],
        ['text', {
          x: 2, y: 9, class: 'rangeText'}, (dist / Math.pow(10, 9)).toFixed(2)]
      ]);
    }

    let indDisplay = (planet, line) => {

      let display = ['g', {}];
      // let numOfStorage = 0;
      display.push(
        ['text', {x: 3, y: (line)*10, class: 'dataText'}, "Industry:"],
        ['text', {x: 3, y: (line + planet.industry.length + 1)*10,
          class: 'dataText'},
          "Storage:"]
      );
      planet.industry.forEach((e, idx) => {
        display.push(['text', {x: 9, y: (line + idx + 1) * 10,
          class: 'dataText'}, e]);
      });
      Object.keys(planet.storage).forEach((e, idx) => {
        display.push(['text', {x: 9,
          y: (line + planet.industry.length + idx + 2) * 10,
          class: 'dataText'}, e + " - " + planet.storage[e]]);
      });

      return display;
    };
    drawn.push(
      ['g', tt( (planets[i].x / Math.pow(10, 9)), (planets[i].y / Math.pow(10, 9))),
        ['g', tt(xWindShift, 0),
          ['rect', {width: windowWidth,
            height: windowHeight + 20 + (planets[i].industry.length * 10) + (Object.keys(planets[i].storage).length * 10),
            class: 'dataWindow'}],
          ['text', {x: 8, y: 10, class: 'dataText'}, planets[i].name],
          ['text', {x: 3, y: 20, class: 'dataText'},
            'XYZ:' +
            (planets[i].x / Math.pow(10, 9)).toFixed(0) +
            ' ' +
            (planets[i].y / Math.pow(10, 9)).toFixed(0) +
            ' ' +
            (planets[i].z / Math.pow(10, 9)).toFixed(0)
          ],
          indDisplay(planets[i], 3)
        ],
        ['circle', { r: planets[i].objectRadius, class: 'majorObject'}]
      ]
    );

  }
  return drawn;
};

const star = ['g', {},
  ['circle', { r: starRadius, class: 'majorObject'}]
];

const drawStatic = (planets) => {
  return ['g', {},
    drawGrid(),
    drawOrbits(planets),
    star
  ];
};

exports.drawMap = (planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['g', tt(centerX, centerY),
      drawStatic(planets),
      ['g', {id: 'moving'}]
    ]
  ]);
};

},{"./get-svg.js":2,"./mechanics.js":7,"onml/tt.js":10}],2:[function(require,module,exports){
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

exports.initInd = (planet) => {
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
// Initialization and run
const draw = require('./draw.js');
const renderer = require('onml/renderer.js');
const majorObjects = require('./majorObjects.json');
const mech = require('./mechanics.js');
const ind = require('./industry.js');

const makePlanet = (planeto) => {
//name, a, e, t, t0, w, lang, inc, maz
  const planDat = mech.kepCalc(planeto, 0);
  ind.initInd(planeto);

  const planet = Object.assign(
    planeto,
    {
      focalShift: planDat.focalShift,
      x:          planDat.x,
      y:          planDat.y,
      z:          planDat.z,
    }
  );

  return planet;
};

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
  console.log("Giant alien spiders are no joke!");
  const planets = [];

  Object.keys(majorObjects.planets).forEach((k) => {
    planets.push(makePlanet(majorObjects.planets[k]));
  });

  renderer(document.getElementById('content'))(draw.drawMap(planets));
  const render2 = renderer(document.getElementById('moving'));

  console.log(planets);
  while (Date.now()) {
    const clock = Date.now();
    const t = clock / Math.pow(10, 4);
    const clock2 = Date(clock);

    for (let i = 0; i < planets.length; i++) {
      let newData = mech.kepCalc(planets[i], t);
      planets[i].x = newData.x;
      planets[i].y = newData.y;
      planets[i].z = newData.z;
    }

    render2(draw.drawMoving(planets, clock2));
    await delay(100);
  }
};

window.onload = main;

},{"./draw.js":1,"./industry.js":3,"./majorObjects.json":6,"./mechanics.js":7,"onml/renderer.js":8}],6:[function(require,module,exports){
module.exports={
  "planets": {
    "alpha": {
      "name": "Alpha",
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
    "beta": {
      "name": "Beta",
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
    }
  }
}

},{}],7:[function(require,module,exports){
'use strict';

const cos = Math.cos;
const sin = Math.sin;
const PI = Math.PI;
const sqrt = Math.sqrt;

exports.kepCalc = (planeto, t) => {

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
  const mass = 2 * Math.pow(10, 30); // Central object mass, approximately sol
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

  return { x: x, y: y, z: z, focalShift: focalShift };
};


exports.orbitCoords = (a, e, mat, w, lang, inc) => {
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

  return { x: x, y: y, z: z};
};

},{}],8:[function(require,module,exports){
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
