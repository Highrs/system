(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
const mech = require('./mechanics.js');
const majObj = require('./majorObjects2.json');
const ind = require('./industry.js');
const indTemp = require('./industryTemp.json');

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
      vx: 0,
      vy: 0,
      vz: 0,
      route: [],
      lastStop: []
    }
  );
  // console.log(crafto);
  return newCrafto;
}; exports.makeCraft = makeCraft;

const startCraftLife = (listOfcraft, indSites) => {
  Object.keys(listOfcraft).forEach((craftID) => {
    // console.log(craftID);
    listOfcraft[craftID].lastStop = majObj[listOfcraft[craftID].home];
    craftAI(listOfcraft[craftID], indSites);
  });
};
exports.startCraftLife = startCraftLife;

const craftAI = async (crafto, indSites) => {
  await delay(50);
  if (crafto.route.length === 0) {
    if (!deviseRoute(crafto, indSites)) {
      // console.log("No Route");
      // console.log(crafto.lastStop);
      crafto.x = crafto.lastStop.x;
      crafto.y = crafto.lastStop.y;
      crafto.z = crafto.lastStop.z;

      crafto.vx = 0;
      crafto.vy = 0;
      crafto.vz = 0;
      // await delay(50);
    }
  } else {
    if (mech.calcDist(crafto, crafto.route[0]) < crafto.speed) {
      if (crafto.route.length === 2) {
        ind.loadCraft(crafto.route[0], crafto, "ore", crafto.cargoCap);
      } else if (crafto.route.length === 1) {
        ind.unloadCraft(crafto.route[0], crafto, "ore", crafto.cargoCap);
        // ind.initInd(crafto.route[0]);
      } else {
        console.log("ERROR in craftAI");
      }
      crafto.lastStop = crafto.route[0];
      // console.log(crafto.lastStop.name);
      crafto.route.shift();
    } else {
      calcVector(crafto, crafto.route[0]);
    }
  }
  craftAI(crafto, indSites);
};

const deviseRoute = (crafto, indSites) => {
  if (indSites.length < 2) {
    console.log("ERROR at craft.deviseRoute: Too few industry sites.");
    return false;
  }
  //Forgive me for I have sinned
  return indSites.find((prodSite) => {
    return prodSite.industry.find((prodInd) => {
      return Object.keys(indTemp[prodInd].output).find((prodRes) => {
        return indSites.find((consSite) => {
          if (prodSite !== consSite) {
            return consSite.industry.find((consInd) => {
              return Object.keys(indTemp[consInd].input).find((consRes) => {
                if (
                  prodRes === consRes &&
                  prodSite.store[prodRes] > crafto.cargoCap
                ) {
                  // console.log(crafto.name + " route found!");
                  crafto.route = [prodSite, consSite];
                  ind.moveTohold(prodSite, crafto, prodRes, crafto.cargoCap);
                  return true;
                }
              });
            });
          }
        });
      });
    });
  });
};
//Replace this part later. Make it so each planet has exports and imports list.

const calcVector =  (crafto, targeto) => {
  const dist = mech.calcDist(crafto, targeto);

  crafto.vx = crafto.speed * ((targeto.x - crafto.x) / dist );
  crafto.vy = crafto.speed * ((targeto.y - crafto.y) / dist );
  crafto.vz = crafto.speed * ((targeto.z - crafto.z) / dist );

  crafto.x += crafto.vx;
  crafto.y += crafto.vy;
  crafto.z += crafto.vz;
};

},{"./industry.js":5,"./industryTemp.json":6,"./majorObjects2.json":8,"./mechanics.js":9}],2:[function(require,module,exports){
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
          + Object.keys(body.store).length * 10 + 25,
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
  Object.keys(body.store).forEach((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9,
          y: (body.industry.length + idx + 2) * 10,
          class: 'dataText'}, e + " - " + body.store[e]
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

const drawCraftIcon = (hullClass) => {
  return ['path', {d: 'M 0,3 L 3,0 L 0,-3 L -3,0 Z', class: 'craft'}];
};

const drawCraft = (listOfCraft) => {
  let drawnCraft = ['g', {}];

  Object.keys(listOfCraft).forEach((craftID) => {
    let partCraft = ['g', {}];
    let crafto = listOfCraft[craftID];
    if (crafto.x !== 0 && crafto.y !== 0) {
      partCraft.push(['line', {
        x1: crafto.x,
        y1: crafto.y,
        x2: crafto.x + (crafto.vx * 10),
        y2: crafto.y + (crafto.vy * 10),
        class: 'vectorLine'
      }]);
    }
    partCraft.push(
      ['g', tt(crafto.x, crafto.y),
        drawCraftIcon(crafto.class),
        ['g', tt(crafto.vx * 10, crafto.vy * 10), ['circle', {r : 1, class: 'majorObject'}]]
      ]

    );
    drawnCraft.push(partCraft);
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
    "cargoCap": 5,
    "cargo": {},
    "speed": 2,
    "home": "alpha"
  },
  "mountain": {
    "class": "Mountain",
    "cargoCap": 15,
    "cargo": {},
    "speed": 1,
    "home": "alpha"
  }
}

},{}],5:[function(require,module,exports){
'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const initInd = (body) => {
  // console.log(body);
  body.industry && body.industry.forEach((bodyIndName) => {
    // console.log(bodyIndName);
    if (!body.store) {
      body.store = {};

      Object.keys(indTemp[bodyIndName].output).forEach((resName) => {
        if (!body.store[resName]) {
          body.store[resName] = 0;
        }
      });

      Object.keys(indTemp[bodyIndName].input).forEach((resName) => {
        if (!body.store[resName]) {
          body.store[resName] = 0;
        }
      });
    }

    if (!body.hold) {
      body.hold = {};
    }

    indWork(body, bodyIndName);
  });
};
exports.initInd = initInd;

const indWork = async (body, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).forEach((inRes) => {
    if (
      (!body.store[inRes]) ||
      (indTemp[industry].input[inRes] > body.store[inRes])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).forEach((inRes) => {
      body.store[inRes] -= indTemp[industry].input[inRes];
    });
    await delay(indTemp[industry].cycle);
    Object.keys(indTemp[industry].output).forEach((outRes) => {
      body.store[outRes] += indTemp[industry].output[outRes];
    });
  } else {
    await delay(1000);
  }

  indWork(body, industry);
};
exports.indWork = indWork;

const moveTohold = (bodyo, crafto, res, quant) => {
  bodyo.store[res] -= quant;
  if (!bodyo.hold[crafto.name]) {
    bodyo.hold[crafto.name] = {};
  }
  if (!bodyo.hold[crafto.name][res]) {
    bodyo.hold[crafto.name][res] = 0;
  }
  bodyo.hold[crafto.name][res] += quant;
};
exports.moveTohold = moveTohold;

const loadCraft = (bodyo, crafto, res, quant) => {
  if (!crafto.cargo[res]) {
    crafto.cargo[res] = 0;
  }
  crafto.cargo[res] += quant;
  bodyo.hold[res] -= quant;
};
exports.loadCraft = loadCraft;

const unloadCraft = (bodyo, crafto, res, quant) => {
  if (!bodyo.store[res]) {
    bodyo.store[res] = 0;
  }
  bodyo.store[res] += quant;
  crafto.cargo[res] -= quant;
};
exports.unloadCraft = unloadCraft;

},{"./industryTemp.json":6}],6:[function(require,module,exports){
module.exports={
  "mining": {
    "cycle": 1000,
    "input": {},
    "output": {
      "ore": 1
    }
  },

  "refining": {
    "cycle": 2000,
    "input": {
      "ore": 2
    },
    "output": {
      "metal": 1
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

  for (let i = 0; i < 5; i++) {
    listOfcraft.push(craft.makeCraft(hulls.brick));
  }
  for (let i = 0; i < 2; i++) {
    listOfcraft.push(craft.makeCraft(hulls.mountain));
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

  let clock = Date.now();

  while (Date.now()) {

    clock += 10;
    let t = clock / Math.pow(10, 2);
    let clock2 = Date(clock);

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
