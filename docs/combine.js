(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
const mech = require('./mechanics.js');
const majObj = require('./majorObjects2.json');
const ind = require('./industry.js');
const indTemp = require('./industryTemp.json');

const genNamer = () => {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
};

const namer = genNamer();

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const makeCraft = (crafto) => {
  let newCrafto = {};
  Object.assign(
    newCrafto,
    crafto,
    {
      name: namer(),
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

  return newCrafto;
};
exports.makeCraft = makeCraft;

const startCraftLife = (listOfcraft, indSites) => {
  listOfcraft.map(crafto => {
    crafto.lastStop = majObj[crafto.home];
    craftAI(crafto, indSites);
  });
};
exports.startCraftLife = startCraftLife;

const craftAI = async (crafto, indSites) => {
  await delay(50);
  if (crafto.route.length === 0) {
    if (!deviseRoute(crafto, indSites)) {
      ['x', 'y', 'z'].map(e => {
        crafto[e] = crafto.lastStop[e];
      });
      ['vx', 'vy', 'vz'].map(e => {
        crafto[e] = 0;
      });
    }
  } else {
    if (mech.calcDist(crafto, crafto.route[0].location) < crafto.speed) {
      ind.unLoadCraft(crafto);
      crafto.lastStop = crafto.route[0].location;
      crafto.route.shift();
    } else {
      calcVector(crafto, crafto.route[0].location);
    }
  }
  craftAI(crafto, indSites);
};

const buildWaypoint = (bodyo) => {
  let waypoint = {
    location: bodyo,
    pickup: {},
    dropoff: {}
  };

  return waypoint;
};

const deviseRoute = (crafto, indSites) => {
  if (crafto.route.length > 0) {
    console.log('ERROR at craft.deviseRoute: Route not empty!');
    crafto.route = [];
  }
  if (indSites.length < 2) {
    console.log('ERROR at craft.deviseRoute: Too few industry sites.');
    return false;
  }
  //Forgive me for I have sinned
  return indSites.find(prodSite =>
    prodSite.industry.find(prodInd =>
      Object.keys(indTemp[prodInd].output).find(prodRes =>
        indSites.find(consSite => {
          if (prodSite !== consSite) {
            return consSite.industry.find(consInd =>
              Object.keys(indTemp[consInd].input).find(consRes => {
                if (
                  prodRes === consRes &&
                  prodSite.store[prodRes] >= crafto.cargoCap
                ) {
                  crafto.route.push(buildWaypoint(prodSite));
                  crafto.route.push(buildWaypoint(consSite));

                  crafto.route[0].pickup = {
                    [prodRes]: crafto.cargoCap
                  };
                  crafto.route[1].dropoff = {
                    [prodRes]: crafto.cargoCap
                  };
                  ind.moveTohold(prodSite, prodRes, crafto);

                  return true;
                }
              })
            );
          }
        })
      )
    )
  );
};
//Replace this part later. Make it so each planet has exports and imports list.

const calcVector =  (crafto, targeto) => {
  const dist = mech.calcDist(crafto, targeto);

  ['x', 'y', 'z'].map(e => {
    crafto['v' + e] = crafto.speed * ((targeto[e] - crafto[e]) / dist );
    crafto[e] += crafto['v' + e];
  });
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
// let windowWidth = 120; // width of planet data rectangles
// let windowHeight = 25;
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
  let polarMap = ['g', tt(pageW/2, pageH/2)];

  for (let i = 1; i < 5; i++) {
    polarMap.push(['circle', {r: 150 * i, class: 'grid'}]);
    for (let j = 0; j < 16; j++) {
      polarMap.push(['line', {
        transform: 'rotate(' + ((360 / 16) * j) +')',
        x1: 150 * i + 15,
        x2: 150 * i - 5,
        class: 'grid'}]);
    }
  }

  grid.push(polarMap);

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
    if (body.type === 'moon') {
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
  let display = ['g', tt(0, 32),
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
      class: 'dataText'}, 'Industry:'],
      ['text', {x: 3, y: (body.industry.length + 1)*10,
        class: 'dataText'}, 'Storage:']
    ]
  );
  body.industry.map((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9, y: (idx + 1) * 10, class: 'dataText'}, e]
      ]
    );
  });
  Object.keys(body.store).map((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9,
          y: (body.industry.length + idx + 2) * 10,
          class: 'dataText'}, e + ' - ' + body.store[e]
        ]
      ]
    );
  });

  return display;
};

const drawData = (bodyo) => {
  let dataDisp = ['g', {}];
  if (bodyo.type === 'planet' || bodyo.industry) {
    dataDisp.push(
      ['rect', {
        width: ((bodyo.name.length * 6.5) + 12),
        height: 14,
        class: 'dataWindow'
      }],
      ['text', {x: 8, y: 10, class: 'dataText'}, bodyo.name]
    );
  }

  if (bodyo.industry) {
    dataDisp.push(
      ['g', tt(0, 16),
        ['rect', {
          width: 120,
          height: 14,
          class: 'dataWindow'
        }],
        ['text', {x: 3, y: 10, class: 'dataText'},
          'XYZ:' +
          (bodyo.x).toFixed(0) +
          ' ' +
          (bodyo.y).toFixed(0) +
          ' ' +
          (bodyo.z).toFixed(0)
        ]
      ]
    );
    dataDisp.push(indDisplay(bodyo, 4));
  }
  return dataDisp;
};

const drawBodies = (bodies) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  for (let i = 0; i < bodies.length; i++) {
    if (bodies[i].type === 'planet') {
      for (let j = i + 1; j < bodies.length; j++) {
        if (bodies[j].type === 'planet') {
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

const drawBelts = (belts) => {
  let rocksDrawn = ['g', {}];

  belts.map(e => {
    e.rocks.map(r => {
      rocksDrawn.push(
        ['g', tt((r.x), (r.y)),
          ['circle', { r: r.objectRadius, class: 'minorObject'}]
        ]
      );
    });
  });

  return rocksDrawn;
};

const drawTime = (clock) => {
  return ['g', tt(10, 20), ['text', {class: 'dataText'}, clock]];
};

const drawStar = (staro) =>{
  let star = ['g', {}, ];
  Object.keys(staro).map((starName) => {
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
  let iconString = 'M 0,3 L 3,0 L 0,-3 L -3,0 Z';
  const icono = {
    Mountain: 'M 5,3 L 5,-3 L -5,-3 L -5,3 Z',
    Brick: 'M 3,3 L 3,-3 L -3,-3 L -3,3 Z'
  };
  if (icono[hullClass]) {iconString = icono[hullClass];}
  return ['path', {d: iconString, class: 'craft'}];
};

const drawCraft = (listOfCraft) => {
  let drawnCraft = ['g', {}];

  listOfCraft.map(crafto => {
    let partCraft = ['g', {}];
    // let crafto = listOfCraft[craftID];
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

exports.drawMoving = (clock, planets, moons, ast, belts, craft) => {
  return ['g', {},
    drawTime(clock),
    drawBelts(belts),
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
module.exports = {

  brick: () => ({
    class: 'Brick',
    cargoCap: 10,
    cargo: {},
    speed: 3,
    home: 'alpha'
  }),
  mountain: () => ({
    class: 'Mountain',
    cargoCap: 20,
    cargo: {},
    speed: 1.5,
    home: 'alpha'
  })

};

},{}],5:[function(require,module,exports){
'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const initInd = (body) => {
  body.store = body.store || {};
  body.industry && body.industry.map(bodyIndName => {

    Object.keys(indTemp[bodyIndName].output).map(resName => {
      body.store[resName] |= 0;
    });
    Object.keys(indTemp[bodyIndName].input).map(resName => {
      body.store[resName] |= 0;
    });
    body.hold = body.hold || {};

    indWork(body, bodyIndName);
  });
};
exports.initInd = initInd;

const indWork = async (body, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).map(inRes => {
    if (
      (body.store[inRes] === undefined) ||
      (indTemp[industry].input[inRes] > body.store[inRes])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).map(inRes => {
      body.store[inRes] -= indTemp[industry].input[inRes];
    });
    await delay(indTemp[industry].cycle);
    Object.keys(indTemp[industry].output).map(outRes => {
      body.store[outRes] += indTemp[industry].output[outRes];
    });
  } else {
    await delay(1000);
  }

  indWork(body, industry);
};
exports.indWork = indWork;

const moveTohold = (bodyo, res, crafto) => {
  let quant = crafto.cargoCap;

  bodyo.hold[crafto.name] = bodyo.hold[crafto.name] || {};
  bodyo.hold[crafto.name][res] = bodyo.hold[crafto.name][res] || 0;

  bodyo.store[res] -= quant;
  bodyo.hold[crafto.name][res] += quant;
};
exports.moveTohold = moveTohold;

const unLoadCraft = (crafto) => {
  let bodyo = crafto.route[0].location;

  Object.keys(crafto.route[0].dropoff).map(res => {
    const quant = crafto.route[0].dropoff[res];
    bodyo.store[res] |= 0;
    crafto.cargo[res] |= 0;

    if (crafto.cargo[res] >= quant) {
      bodyo.store[res] += quant;
      crafto.cargo[res] -= quant;
    } else {
      console.log('ERROR AT UNLOAD');
    }
  });

  Object.keys(crafto.route[0].pickup).map(res => {
    const quant = crafto.route[0].pickup[res];
    bodyo.store[res] |= 0;
    crafto.cargo[res] |= 0;

    if (
      (crafto.cargoCap >= quant) &&
      ( (crafto.cargo[res] + quant) <= crafto.cargoCap)
    ) {
      crafto.cargo[res] += quant;
      bodyo.hold[crafto.name][res] -= quant;
    } else {
      console.log('ERROR AT LOAD');
    }
  });
};
exports.unLoadCraft = unLoadCraft;

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
  },

  "factory": {
    "cycle": 3000,
    "input": {
      "metal": 5
    },
    "output": {
      "supplies": 1
    }
  }
}

},{}],7:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');
const drawMap = require('./drawMap.js');
const renderer = require('onml/renderer.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hulls = require('./hulls.js');
const craft = require('./craft.js');

const makeStar = (staro) => {
  return staro;
};

const makeBody = (bodyo) => {
  ind.initInd(bodyo);
  const bodyDat = mech.kepCalc(0, bodyo);
  const body = Object.assign(
    bodyo,
    {
      focalShift: bodyDat.focalShift,
      x: bodyDat.x,
      y: bodyDat.y,
      z: bodyDat.z
    }
  );
  return body;
};

const rockNamer = () => {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
};
const namer = rockNamer();

function rand(mean, deviation, prec = 0, upper = Infinity, lower = 0) {
  let max = mean + deviation;
  if (max > upper) {max = upper;}
  let min = mean - deviation;
  if (min < lower) {min = lower;}

  return (
    ( Math.round(
      (Math.random() * (max - min) + min) * Math.pow(10, prec)
      ) / Math.pow(10, prec)
    )
  );
}

let rock = (belto) => {
  return {
    name: namer(),
    type: 'asteroid',
    primary: 'prime',
    mass: rand(belto.mass, belto.massd),
    a:    rand(belto.a, belto.ad),
    e:    rand(belto.e, belto.ed, 2),
    t:    0,
    t0:   0,
    w:    rand(belto.w, belto.wd, 2),
    lang: rand(belto.lang, belto.langd, 2),
    inc:  rand(belto.inc, belto.incd, 2),
    maz:  rand(belto.maz, belto.mazd, 2),
    objectRadius: rand(belto.objectRadius, belto.objectRadiusD, 1),
  };
};

const makeBelt = (belto) => {
  const belt = Object.assign(
    belto,
    {rocks: []}
  );
  for (let i = 0; i < belto.count; i++) {
    belt.rocks.push(makeBody(rock(belto)));
  }

  return belt;
};

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const craftStart = (listOfcraft, indSites) => {
  listOfcraft.map(crafto => {
    ['x', 'y', 'z'].map(e => {
      crafto[e] = majObj[crafto.home][e];
    });
  });

  craft.startCraftLife(listOfcraft, indSites);
};

const main = async () => {
  console.log('Giant alien spiders are no joke!');

  let stars = [];
  let planets = [];
  let moons = [];
  let ast = [];
  let indSites = [];
  let belts = [];

  const listOfcraft = [];

  Object.keys(majObj).map(objName => {
    if (majObj[objName].industry && majObj[objName].industry.length > 0) {
      indSites.push(majObj[objName]);
    }

    if (majObj[objName].type === 'star') {
      stars.push(makeStar(majObj[objName]));
    } else
    if (majObj[objName].type === 'planet') {
      planets.push(makeBody(majObj[objName]));
    } else
    if (majObj[objName].type === 'moon') {
      moons.push(makeBody(majObj[objName]));
    } else
    if (majObj[objName].type === 'asteroid') {
      ast.push(makeBody(majObj[objName]));
    } else
    if (majObj[objName].type === 'belt') {
      belts.push(makeBelt(majObj[objName]));
    } else
    {
      console.log('ERROR at make. Skipping.');
    }
  });


  renderer(document.getElementById('content'))(drawMap.drawStatic(stars, planets));
  const render2 = renderer(document.getElementById('moving'));

  let movBod = [];
  movBod = movBod.concat(planets, moons, ast);
  belts.map(e => movBod = movBod.concat(e.rocks));

  for (let i = 0; i < 2; i++) {
    listOfcraft.push(craft.makeCraft(hulls.brick()));
  }
  for (let i = 0; i < 8; i++) {
    listOfcraft.push(craft.makeCraft(hulls.mountain()));
  }

  let clock = Date.now();
  // let clock = 1;

  while (Date.now()) {

    clock += 10;
    let t = clock / Math.pow(10, 2);
    let clock2 = Date(clock);
    // let clock2 = clock;

    for (let i = 0; i < movBod.length; i++) {
      let newData = mech.kepCalc(t, movBod[i]);
      ['x', 'y', 'z'].map(e => {
        movBod[i][e] = newData[e];
      });
    }

    if (!listOfcraft[0].x) {
      craftStart(listOfcraft, indSites);
    }

    render2(drawMap.drawMoving(clock2, planets, moons, ast, belts, listOfcraft));
    await delay(50);
  }
};

window.onload = main;

},{"./craft.js":1,"./drawMap.js":2,"./hulls.js":4,"./industry.js":5,"./majorObjects2.json":8,"./mechanics.js":9,"onml/renderer.js":10}],8:[function(require,module,exports){
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
    "a":    375,
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
    "a":    225,
    "e":    0.05,
    "t":    0,
    "t0":   0,
    "w":    2,
    "lang": 0,
    "inc":  0.1,
    "maz":  0,
    "objectRadius": 5,
    "industry": ["mining", "mining", "mining"]
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
    "a":    475,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "objectRadius": 3,
    "industry": ["factory"]
  },
  "beltDelta": {
    "name":     "Belt Delta",
    "type":     "belt",
    "primary":  "prime",
    "count":  300,
    "mass":   10,
    "massd":  9,
    "t":      0,
    "a":      500,
    "ad":     5,
    "e":      0,
    "ed":     0.15,
    "t0":     0,
    "w":      0,
    "wd":     6,
    "lang":   0,
    "langd":  6,
    "inc":    0,
    "incd":   0.5,
    "maz":    0,
    "mazd":   6,
    "objectRadius": 1.5,
    "objectRadiusD": 1
  },
  "beltAlpha": {
    "name":     "Alpha Delta",
    "type":     "belt",
    "primary":  "prime",
    "count":  50,
    "mass":   10,
    "massd":  9,
    "t":      0,
    "a":      150,
    "ad":     5,
    "e":      0,
    "ed":     0.1,
    "t0":     0,
    "w":      0,
    "wd":     6,
    "lang":   0,
    "langd":  6,
    "inc":    3,
    "incd":   0.5,
    "maz":    0,
    "mazd":   6,
    "objectRadius": 1.5,
    "objectRadiusD": 1
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
