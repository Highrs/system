(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
const mech = require('./mechanics.js');
const majObj = require('./majorObjects2.json');
const ind = require('./industry.js');

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
  //The maximum is exclusive and the minimum is inclusive
} //Thanks stock

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const makeCraft = (crafto) => {
  let newCrafto = {};
  Object.assign(
    newCrafto,
    crafto,
    {
      name: getRandomInt(1000, 9999),
      x: 0,
      y: 0,
      z: 0,
      route: []
    }
  );
  // console.log(crafto);
  return newCrafto;
}; exports.makeCraft = makeCraft;

const startCraftLife = (listOfcraft, indSites) => {
  Object.keys(listOfcraft).forEach((craftID) => {
    // console.log(craftID);
    craftAI(listOfcraft[craftID], indSites);
  });
};
exports.startCraftLife = startCraftLife;

const craftAI = async (crafto, indSites) => {
  await delay(50);
  if (crafto.route.length === 0) {
    if (deviseRoute(crafto, indSites)) {
      craftAI(crafto, indSites);
    } else {
      await delay(1000);
      craftAI(crafto, indSites);
    }
  } else {
    if (mech.calcDist(crafto, crafto.route[0]) < crafto.speed) {
      if (crafto.route.length === 2) {
        ind.loadCraft(crafto.route[0], crafto, "ore", crafto.cargoCap);
      } else if (crafto.route.length === 1) {
        ind.unloadCraft(crafto.route[0], crafto, "ore", crafto.cargoCap);
        ind.initInd(crafto.route[0]);
      } else {
        console.log("ERROR in craftAI");
      }
      crafto.route.shift();
      craftAI(crafto, indSites);
    } else {
      calcVector(crafto, crafto.route[0]);
      craftAI(crafto, indSites);
    }
  }
};

const deviseRoute = (crafto, indSites) => {
  if (indSites.length < 2) {
    console.log("ERROR at craft.deviseRoute: Too few industry sites.");
    return false;
  }

  // console.log("Generating route (deviseRoute)");
  crafto.route = [indSites[0], indSites[1]];
  return true;
};

const calcVector =  (crafto, targeto) => {
  const dist = mech.calcDist(crafto, targeto);
  crafto.x += crafto.speed * ((targeto.x - crafto.x) / dist );
  crafto.y += crafto.speed * ((targeto.y - crafto.y) / dist );
  crafto.z += crafto.speed * ((targeto.z - crafto.z) / dist );
};

},{"./industry.js":5,"./majorObjects2.json":8,"./mechanics.js":9}],2:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
// const cos = Math.cos;
// const sin = Math.sin;
const PI = Math.PI;
// const sqrt = Math.sqrt;
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
        ['line', { x1: x - crossSize, y1: y,
          x2: x + crossSize, y2: y, class: 'grid'}],
        ['line', { x1: x, y1: y + crossSize,
          x2: x, y2: y - crossSize, class: 'grid'}]
      );
    }
  }

  return grid;
};

const drawOrbit = (bodies) => {
  if (bodies.length < 1) {return ['g', {}];}

  let divline1;
  let divline2;
  let retGroup = ['g', {}];

  for (let i = 0; i < bodies.length; i++) {
    let body = bodies[i];
    let coords = 'M ';
    let points = 128;
    if (body.type === "moon") {
      points = 32;
    }

    for (let i = 0; i < points; i++) {
      let currCoord = mech.orbitCoords((i * 2 * PI) / points,
        body, majObj[body.primary]);
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

const indDisplay = (body) => {
  let display = ['g', tt(0, 30),
    ['rect', {
      width: 100,
      height:
        body.industry.length * 10
          + Object.keys(body.storage).length * 10 + 25,
      class: 'dataWindow'
    }]
  ];
  display.push(
    ['g', tt(0, 10),
    ['text', {x: 3, y: 0,
      class: 'dataText'}, "Industry:"],
      ['text', {x: 3, y: (body.industry.length + 1)*10,
        class: 'dataText'}, "Storage:"]
    ]
  );
  body.industry.forEach((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9, y: (idx + 1) * 10, class: 'dataText'}, e]
      ]
    );
  });
  Object.keys(body.storage).forEach((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9,
          y: (body.industry.length + idx + 2) * 10,
          class: 'dataText'}, e + " - " + body.storage[e]
        ]
      ]
    );
  });

  return display;
};

const drawData = (body) => {
  let dataDisp = ['g', {}];
  if (body.type === "planet" || body.industry) {
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
  if (body.industry) {
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
          let dist = mech.calcDist(bodies[i], bodies[j]);
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
            ['rect', {
              width: distanceWindowLength,
              height: 10,
              class: 'dataWindow'
            }],
            ['text', {
              x: 2, y: 9, class: 'rangeText'
            }, (dist).toFixed(2)]
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
  return ['g', tt(10, 20), ['text', {class: 'dataText'}, clock]];
};

const drawStar = (staro) =>{
  let star = ['g', {}, ];

  Object.keys(staro).forEach((starName) => {
    star.push(['g', tt(staro[starName].x, staro[starName].y),
      ['circle', {
        r: staro[starName].objectRadius,
        class: 'majorObject'
      }]
    ]);
  });

  return star;
};

const drawCraft = (craft) => {
  let drawnCraft = ['g', {}];

  Object.keys(craft).forEach((craftID) => {
    drawnCraft.push(['g', tt(craft[craftID].x, craft[craftID].y),
      ['path', {d: 'M 0,3 L 3,0 L 0,-3 L -3,0 Z', class: 'craft'}]
    ]);
  });

  return drawnCraft;

};

exports.drawMoving = (clock, planets, moons, ast, craft) => {
  return ['g', {},
    drawTime(clock),
    drawOrbit(moons),
    drawBodies(moons),
    drawBodies(planets),
    drawBodies(ast),
    drawCraft(craft)
  ];
};

exports.drawStatic = (stars, planets) => {
  return getSvg({w:pageW, h:pageH}).concat([
    ['g', {},
      drawOrbit(planets),
      drawGrid(),
      drawStar(stars),
      ['g', {id: 'moving'}],
    ]
  ]);
};

},{"./get-svg.js":3,"./majorObjects2.json":8,"./mechanics.js":9,"onml/tt.js":12}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
module.exports={
  "brick": {
    "class": "Brick",
    "cargoCap": 10,
    "cargo": {},
    "speed": 5,
    "home": "alpha"
  }
}

},{}],5:[function(require,module,exports){
'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');


const initInd = (body) => {
  industryStoreCheck(body);
};
exports.initInd = initInd;

const industryStoreCheck = (body) => {
  // console.log(body.name);
  body.industry && body.industry.forEach((bodyIndName) => {
    // console.log(bodyIndName);
    if (!body.storage) {
      body.storage = indTemp[bodyIndName].storage;
    }
    // Object.keys(indTemp[bodyIndName].storage).forEach((resource) => {
    //   console.log(resource);
    //   if (!body.storage[resource]) {
    //     console.log("Here");
    //     Object.assign(body.storage, indTemp[bodyIndName].storage[resource]);
    //   }
    // });
    if (!body.holding) {
      body.holding = {};
    }
    indWork(body, bodyIndName);
  });

};

const indWork = (body, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).forEach((inRes) => {
    if (
      (!body.storage[inRes]) ||
      (indTemp[industry].input[inRes] > body.storage[inRes])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).forEach((inRes) => {
      body.storage[inRes] -= indTemp[industry].input[inRes];
    });

    setTimeout(
      function(){
        Object.keys(indTemp[industry].output).forEach((outRes) => {
          body.storage[outRes] += indTemp[industry].output[outRes];
        });
        indWork(body, industry);
      },
      indTemp[industry].cycle);
  }
};
exports.indWork = indWork;

const moveToHolding = (bodyo, crafto, resource, quant) => {
  bodyo.storage[resource] -= quant;
  if (!bodyo.holding[crafto.name]) {
    bodyo.holding[crafto.name] = {};
  }
  if (!bodyo.holding[crafto.name][resource]) {
    bodyo.holding[crafto.name][resource] = 0;
  }
  bodyo.holding[crafto.name][resource] += quant;
};
exports.moveToHolding = moveToHolding;

const loadCraft = (bodyo, crafto, resource, quant) => {
  if (!crafto.cargo[resource]) {
    crafto.cargo[resource] = 0;
  }
  crafto.cargo[resource] += quant;
  bodyo.storage[resource] -= quant;
};
exports.loadCraft = loadCraft;

const unloadCraft = (bodyo, crafto, resource, quant) => {
  if (!bodyo.storage[resource]) {
    bodyo.storage[resource] = 0;
  }
  bodyo.storage[resource] += quant;
  crafto.cargo[resource] -= quant;
};
exports.unloadCraft = unloadCraft;

},{"./industryTemp.json":6}],6:[function(require,module,exports){
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
      "ore": 10,
      "metal": 0
    }
  }
}

},{}],7:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');
// Initialization and run
const drawMap = require('./drawMap.js');
const renderer = require('onml/renderer.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hulls = require('./hulls.json');
const craft = require('./craft.js');

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

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
  console.log("Giant alien spiders are no joke!");

  let stars = [];
  let planets = [];
  let moons = [];
  let ast = [];
  let indSites = [];

  const listOfcraft = [];

  Object.keys(majObj).forEach((objName) => {
    if (majObj[objName].industry && majObj[objName].industry.length > 0) {
      indSites.push(majObj[objName]);
    }

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


  renderer(document.getElementById('content'))(drawMap.drawStatic(stars, planets));
  const render2 = renderer(document.getElementById('moving'));

  let movBod = [];
  movBod = movBod.concat(planets, moons, ast);

  for (let i = 0; i < 1; i++) {
    listOfcraft.push(craft.makeCraft(hulls.brick));
  }
  // console.log(listOfcraft);

  const craftStart = () => {
    Object.keys(listOfcraft).forEach((craftID) => {
      listOfcraft[craftID].x = majObj[listOfcraft[0].home].x;
      listOfcraft[craftID].y = majObj[listOfcraft[0].home].y;
      listOfcraft[craftID].z = majObj[listOfcraft[0].home].z;
    });

    craft.startCraftLife(listOfcraft, indSites);
  };



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

    if (!listOfcraft[0].x) {craftStart();}

    render2(drawMap.drawMoving(clock2, planets, moons, ast, listOfcraft));
    await delay(50);
  }

};

window.onload = main;

},{"./craft.js":1,"./drawMap.js":2,"./hulls.json":4,"./industry.js":5,"./majorObjects2.json":8,"./mechanics.js":9,"onml/renderer.js":10}],8:[function(require,module,exports){
module.exports={
  "prime": {
    "name": "Prime",
    "type": "star",
    "mass": 20000000000,
    "x": 600,
    "y": 600,
    "z": 0,
    "objectRadius": 20
  },
  "gamma": {
    "name": "Gamma",
    "type": "planet",
    "primary": "prime",
    "mass": 60000000,
    "a":    450,
    "e":    0.01,
    "t":    0,
    "t0":   0,
    "w":    2,
    "lang": 1.6,
    "inc":  0.2,
    "maz":  0,
    "objectRadius": 5
  },
  "beta": {
    "name": "Beta",
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
    "industry": ["mining", "mining"]
  },
  "alpha": {
    "name": "Alpha",
    "type": "planet",
    "primary": "prime",
    "mass": 60000000,
    "a":    70,
    "e":    0.4,
    "t":    0,
    "t0":   0,
    "w":    4,
    "lang": 1.6,
    "inc":  0.9,
    "maz":  0,
    "objectRadius": 5
  },
  "gMinB": {
    "name": "Gamma Minor B",
    "type": "moon",
    "primary": "gamma",
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
    "industry": ["refining"]
  },
  "gMinA": {
    "name": "Gamma Minor A",
    "type": "moon",
    "primary": "gamma",
    "mass": 10000,
    "a":    20,
    "e":    .5,
    "t":    0,
    "t0":   0,
    "w":    2,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "objectRadius": 2
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
    "w":    2,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "objectRadius": 2
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
    "objectRadius": 1
  }
}

},{}],9:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');

const cos = Math.cos;
const sin = Math.sin;
const PI = Math.PI;
const sqrt = Math.sqrt;

exports.kepCalc = (t, bodyo) => {
  let primaryo = majObj[bodyo.primary];

  let a    = bodyo.a;    // semi-major axis (a)
  let e    = bodyo.e;    // eccentricity (e)
  let t0   = bodyo.t0;   // epoch (days) (t0)
  let w    = bodyo.w;    // argument of periapsis (w)
  let lang = bodyo.lang; // longitude of ascention node (lang)
  let inc  = bodyo.inc;  // inclanation (inc)
  let maz  = bodyo.maz;  // mean anomaly at zero (maz)
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

exports.orbitCoords = (mat, bodyo) => {
  let primaryo = majObj[bodyo.primary];

  let a    = bodyo.a;    // semi-major axis (a)
  let e    = bodyo.e;    // eccentricity (e)
  let w    = bodyo.w;    // argument of periapsis (w)
  let lang = bodyo.lang; // longitude of ascention node (lang)
  let inc  = bodyo.inc;  // inclanation (inc)

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

const calcDist = (body1, body2) => {
  return sqrt(
    Math.pow( (body1.x - body2.x), 2 )
  + Math.pow( (body1.y - body2.y), 2 )
  + Math.pow( (body1.z - body2.z), 2 ) );
};
exports.calcDist = calcDist;

},{"./majorObjects2.json":8}],10:[function(require,module,exports){
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

},{"./stringify.js":11}],11:[function(require,module,exports){
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

},{}],12:[function(require,module,exports){
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

},{}]},{},[7]);
