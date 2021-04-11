(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const majObj = require('./majorObjects.json');
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

  for (let x = 50; x < pageW; x += 50) {
    for (let y = 50; y < pageH; y += 50) {
      grid.push(
        ['line', { x1: x - crossSize, y1: y, x2: x + crossSize, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + crossSize, x2: x, y2: y - crossSize, class: 'grid'}]
      );
    }
  }

  return grid;
};

const drawOrbit = (planets) => {
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

const indDisplay = (planet, line) => {
  let display = ['g', {}];
  display.push(
    ['text', {x: 3, y: line * 10,
      class: 'dataText'}, "Industry:"],
    ['text', {x: 3, y: (line + planet.industry.length + 1)*10,
      class: 'dataText'}, "Storage:"]
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

const drawPlanets = (planets) => {
  const planetsDrawn = ['g', {}];
  for (let i = 0; i < planets.length; i++) {
    let xWindShift = 0;
    if (planets[i].x / Math.pow(10, 9) > pageW - 100) {
      xWindShift = -windowWidth;
    }

    // for (let j = i + 1; j < planets.length; j++) {
    //   let dist = calcDist(planets[i], planets[j]);
    //   planetsDrawn.push(['line', {
    //     x1: planets[i].x,
    //     y1: planets[i].y,
    //     x2: planets[j].x,
    //     y2: planets[j].y,
    //     class: 'rangeLine'
    //   }]);
    //   planetsDrawn.push(['g',
    //   tt((((planets[j].x) + (planets[i].x)) / 2 - 22),
    //     (((planets[j].y) + (planets[i].y)) / 2 - 4.5)),
    //     ['rect', {width: distanceWindowLength, height: 10, class: 'dataWindow'}],
    //     ['text', {
    //       x: 2, y: 9, class: 'rangeText'}, (dist).toFixed(2)]
    //   ]);
    // }

    planetsDrawn.push(
      ['g', tt( (planets[i].x), (planets[i].y)),
        // ['g', tt(xWindShift, 0),
        //   ['rect', {width: windowWidth,
        //     height: windowHeight + 20
        //     + (planets[i].industry.length * 10)
        //     + (Object.keys(planets[i].storage).length * 10),
        //     class: 'dataWindow'}],
        //   ['text', {x: 8, y: 10, class: 'dataText'}, planets[i].name],
        //   ['text', {x: 3, y: 20, class: 'dataText'},
        //     'XYZ:' +
        //     (planets[i].x).toFixed(0) +
        //     ' ' +
        //     (planets[i].y).toFixed(0) +
        //     ' ' +
        //     (planets[i].z).toFixed(0)
        //   ],
        //   indDisplay(planets[i], 3)
        // ],
        ['circle', { r: planets[i].objectRadius, class: 'majorObject'}]
      ]
    );

  }
  return planetsDrawn;
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
    drawPlanets(planets),
    drawPlanets(moons)
  ];
};

exports.drawStatic = (stars, planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['g', {},
      drawGrid(),
      drawStar(stars),
      drawOrbit(planets),
      ['g', {id: 'moving'}]
    ]
  ]);
};

},{"./get-svg.js":2,"./majorObjects.json":4,"./mechanics.js":5,"onml/tt.js":8}],2:[function(require,module,exports){
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
// Initialization and run
const draw = require('./draw.js');
const renderer = require('onml/renderer.js');
const mech = require('./mechanics.js');
// const ind = require('./industry.js');
const majObj = require('./majorObjects.json');
// const hulls = require('./hulls.json');

const makeStar = (staro) => {
  return staro;
};

const makeBody = (planeto) => {
  // ind.initInd(planeto);
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

// const makeMoon = (moono) => {
//   const planDat = mech.kepCalc(moono, 0, majObj[moono.primary]);
//   const moon = Object.assign(
//     moono,
//     {focalShift: planDat.focalShift, x: planDat.x, y: planDat.y, z: planDat.z}
//   );
//   return moon;
// };
//
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
    }
    if (majObj[objName].type === "planet") {
      planets.push(makeBody(majObj[objName]));
    }
    if (majObj[objName].type === "moon") {
      moons.push(makeBody(majObj[objName]));
    }
    // if (majObj[objName].type === "asteroid") {
    //   ast.     push(makeAst(majObj[objName]));
    // }
    else {console.log("ERROR at make. Skipping.");}
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

},{"./draw.js":1,"./majorObjects.json":4,"./mechanics.js":5,"onml/renderer.js":6}],4:[function(require,module,exports){
module.exports={
  "prime": {
    "name": "Prime",
    "type": "star",
    "mass": 20000000000,
    "x": 500,
    "y": 500,
    "z": 0,
    "objectRadius": 5
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
  "bMinA": {
    "name": "Beta Minor A",
    "type": "moon",
    "primary": "beta",
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
  "bMinb": {
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
  "astroDelta": {
    "name": "Asteroid Delta",
    "type": "asteroid",
    "primary": "alpha",
    "mass": 1,
    "a":    100,
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

},{}],5:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects.json');

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

},{"./majorObjects.json":4}],6:[function(require,module,exports){
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

},{"./stringify.js":7}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{}]},{},[3]);
