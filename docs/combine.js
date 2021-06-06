(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';
const mech = require('./mechanics.js');
const majObj = require('./majorObjects2.json');
const ind = require('./industry.js');
// const indTemp = require('./industryTemp.js');

const rate = 50;
const getRate = () => {
  return rate;
};
exports.getRate = getRate;

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
      lastStop: [],
      status: 'parked',
      course: 0,
      intercept: {}
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
  await delay(rate);
  if (crafto.route.length === 0) {
    crafto.intercept = {};
    if (!deviseRoute(crafto, indSites)) {
      crafto.status = 'parked';
      ['x', 'y', 'z'].map(e => {
        crafto[e] = crafto.lastStop[e];
      });
      ['vx', 'vy', 'vz'].map(e => {
        crafto[e] = 0;
      });
    }
  } else {
    if (mech.calcDist(
      crafto,
      crafto.route[0].location) < crafto.route[0].location.soi
    ) {
      ['x', 'y', 'z'].map(e => {
        crafto['v' + e] = 0;
      });
      ind.unLoadCraft(crafto);
      crafto.lastStop = crafto.route[0].location;
      crafto.route.shift();
      if (crafto.route.length != 0) {
        crafto.intercept = calcIntercept(crafto, crafto.route[0].location);
      }
    } else {
      calcMotion(crafto, crafto.intercept);
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
      Object.keys(prodInd.output).find(prodRes =>
        indSites.find(consSite => {
          if (prodSite !== consSite) {
            return consSite.industry.find(consInd =>
              Object.keys(consInd.input).find(consRes => {
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

                  crafto.status = 'traveling';

                  crafto.intercept = calcIntercept(crafto, crafto.route[0].location);

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

const calcMotion =  (crafto, targeto) => {
  const dist = mech.calcDist(crafto, targeto);

  //Determine the direction of acceleration based on midpoint of travel.
  let dir = (dist < targeto.turn) ? -1 : 1;

  ['x', 'y', 'z'].map(e => {
    let displacement = crafto['v' + e] * (rate / 1000);
    let deltaVelocity = (
      (crafto.accel) * ((targeto[e] - crafto[e]) / (dist)) *
      (rate / 1000)
    );
    let deltaDisplacement = dir * deltaVelocity * (rate / 1000) / 2;

    crafto[e] += displacement + deltaDisplacement;
    crafto['v' + e] += deltaVelocity * dir;
  });

  crafto.course = (Math.atan2(crafto.vy, crafto.vx) * 180 / Math.PI) - 90;
};

const calcIntercept = (crafto, bodyo) => {
  let intercept = {x: bodyo.x, y: bodyo.y, z: bodyo.z, turn: 0};
  let travelTime = 0;
  let distance = 0;

  for (let i = 0; i < 5; i++) {
    distance   = mech.calcDist(crafto, intercept);
    travelTime = mech.calcTravelTime(distance, crafto.accel);
    intercept  = mech.kepCalc(bodyo, bodyo.t + travelTime);
  } // Optimization of intercept, very imperfect, re-work later.

  intercept.turn = distance / 2;

  return intercept;
};

},{"./industry.js":6,"./majorObjects2.json":9,"./mechanics.js":10}],2:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const icons = require('./icons.js');

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
// let distanceWindowLength = 44;
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
      coords += currCoord.x + ',' + currCoord.y;
      (i === points - 1)?(coords += 'Z'):(coords += 'L');
    }

    retGroup.push(['path',
      { d: coords, class: 'majorOrbit' }]);
    retGroup.push(['line',
      {
        x1: divline1.x,
        y1: divline1.y,
        x2: divline2.x,
        y2: divline2.y,
        class: 'minorOrbit'
      }]);
    retGroup.push(
      ['g', tt(divline1.x, divline1.y),
        icons.apsis('-')
      ],
      ['g', tt(divline2.x, divline2.y),
        icons.apsis()
      ]
    );
  }

  return retGroup;
};

const indDisplay = (body) => {
  let display = ['g', tt(0, 32),
    ['rect', {
      width: 90,
      height:
        body.industry.length * 10
          + Object.keys(body.store).length * 10 + 25,
      class: 'dataWindow'
    }]
  ];
  display.push(
    ['g', tt(0, 10),
    ['text', {x: 3, y: 0,
      class: 'dataText'}, 'INDUSTRY:'],
      ['text', {x: 3, y: (body.industry.length + 1)*10,
        class: 'dataText'}, 'STORE:']
    ]
  );
  body.industry.map((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9, y: (idx + 1) * 10, class: 'dataText'},
          e.abr +":" + e.status
        ]
      ]
    );
  });
  Object.keys(body.store).map((e, idx) => {
    display.push(
      ['g', tt(0, 10),
        ['text', {x: 9,
          y: (body.industry.length + idx + 2) * 10,
          class: 'dataText'}, e.toUpperCase() + ':' + body.store[e]
        ]
      ]
    );
  });

  return display;
};

const drawData = (bodyo) => {
  let dataDisp = ['g', {}];
  if (
    // bodyo.type === 'planet' ||
    bodyo.industry
  ) {
    dataDisp.push(
      ['rect', {
        // width: ((bodyo.name.length * 6.5) + 12),
        width: 90,
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
          width: 90,
          height: 14,
          class: 'dataWindow'
        }],
        ['text', {x: 3, y: 10, class: 'dataText'},
          // 'XYZ:' +
          (bodyo.x).toFixed(0) + ',' +
          (bodyo.y).toFixed(0) + ',' +
          (bodyo.z).toFixed(0)
        ]
      ]
    );
    dataDisp.push(indDisplay(bodyo));
  }
  return dataDisp;
};

const drawBodies = (bodies) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  for (let i = 0; i < bodies.length; i++) {
    bodiesDrawn.push(
      // ['g', tt(bodies[i].x, bodies[i].y),
      //   drawData(bodies[i]),
      // ],
      icons.body(bodies[i])
    );
  }
  return bodiesDrawn;
};

const drawBelts = (belts) => {
  let rocksDrawn = ['g', {}];

  belts.map(e => {
    e.rocks.map(r => {
      rocksDrawn.push(
        icons.body(r)
      );
    });
  });

  return rocksDrawn;
};

const drawTime = (clock) => {
  return ['g', tt(10, 20), ['text', {class: 'dataText'}, clock]];
};

const drawStars = (stars) =>{
  let drawnStars = ['g', {}];
  stars.map((staro) => {
    drawnStars.push(icons.star(staro));
  });
  return drawnStars;
};

const drawCraft = (listOfCraft) => {
  let drawnCraft = ['g', {}];

  listOfCraft.map(crafto => {
    if (crafto.status !== 'parked') {
      let partCraft = ['g', tt(crafto.x, crafto.y)];
      if (crafto.status === 'traveling') {

        partCraft.push(
          ['line', {
            x1: 0,
            y1: 0,
            x2: crafto.vx,
            y2: crafto.vy,
            class: 'vector'
          }],
          ['g', tt(crafto.vx, crafto.vy), [
            'circle',
            {r : 1, class: 'vector'}
          ]]
        );

        partCraft.push(
          ['g', tt(-3, 16), ['text', {class: 'craftDataText'}, crafto.name]]
        );

        drawnCraft.push(
          icons.intercept(crafto)
        );
      }
      partCraft.push(
        ['g', {},
          ['g', {transform: 'rotate(' + crafto.course + ')'},
            icons.craft(crafto)
          ]
        ]
      );
      drawnCraft.push(partCraft);
    }
  });

  return drawnCraft;
};

const drawRanges = (bodyArr) => {
  let rangesDrawn = ['g', {}];
  let linesDrawn = ['g', {}];
  let windowsDrawn = ['g', {}];

  for (let i = 0; i < bodyArr.length; i++) {
    if (bodyArr[i].industry) {
      for (let j = i + 1; j < bodyArr.length; j++) {
        if (bodyArr[j].industry) {
          linesDrawn.push(['line', {
            x1: bodyArr[i].x,
            y1: bodyArr[i].y,
            x2: bodyArr[j].x,
            y2: bodyArr[j].y,
            class: 'rangeLine'
          }]);

          let dist = mech.calcDist(bodyArr[i], bodyArr[j]);

          windowsDrawn.push(['g',
          tt((((bodyArr[j].x) + (bodyArr[i].x)) / 2 - 11),
            (((bodyArr[j].y) + (bodyArr[i].y)) / 2 - 2.25)),
            ['rect', {
              width: 22,
              height: 6.5,
              class: 'rangeWindow'
            }],
            ['text', {x: 1, y: 5, class: 'rangeText'}, (dist).toFixed(2)]
          ]);
        }
      }
    }
  }
  rangesDrawn.push(linesDrawn, windowsDrawn);

  return rangesDrawn;
};

exports.drawMoving = (clock, planets, moons, ast, belts, craft) => {
  let rangeCandidates = [].concat(
    planets,
    moons,
    ast
  );

  return ['g', {},
    drawTime(clock),
    drawBelts(belts),
    drawOrbit(moons),
    drawRanges(rangeCandidates),
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
      drawStars(stars),
      ['g', {id: 'moving'}],
    ]
  ]);
};

},{"./get-svg.js":3,"./icons.js":5,"./majorObjects2.json":9,"./mechanics.js":10,"onml/tt.js":13}],3:[function(require,module,exports){
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
    // speed: 30,
    accel: 3,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    cargoCap: 20,
    cargo: {},
    // speed: 25,
    accel: 2,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    cargoCap: 30,
    cargo: {},
    // speed: 20,
    accel: 1,
    home: 'beta'
  })

};

},{}],5:[function(require,module,exports){
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

},{"onml/tt.js":13}],6:[function(require,module,exports){
'use strict';
// Industry manager
const indTemp = require('./industryTemp.js');

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const initInd = (body) => {
  body.store = body.store || {};





  body.industryList && body.industryList.map(bodyIndName => {
    body.hold = body.hold || {};
    body.industry = body.industry || [];

    let newInd = {};
    Object.assign(
      newInd,
      indTemp[bodyIndName](),
      {
        status: 'NEW',
        cycles: 0
      }
    );

    body.industry.push(newInd);

    Object.keys(newInd.output).map(resName => {body.store[resName] |= 0;});

    Object.keys(newInd.input ).map(resName => {body.store[resName] |= 0;});

    indWork(body, newInd);
  });
};
exports.initInd = initInd;

const indWork = async (body, ind) => {
  let workGo = true;

  Object.keys(ind.input).map(inRes => {
    if (
      (body.store[inRes] === undefined) ||
      (ind.input[inRes] > body.store[inRes])
    ) {
      workGo = false;
      ind.status = 'IDLE';
    }
  });

  if (workGo === true) {
    ind.status = 'WORK';
    Object.keys(ind.input).map(inRes => {
      body.store[inRes] -= ind.input[inRes];
    });
    await delay(ind.cycle);
    Object.keys(ind.output).map(outRes => {
      body.store[outRes] += ind.output[outRes];
    });
  } else {
    await delay(1000);
  }

  indWork(body, ind);
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

},{"./industryTemp.js":7}],7:[function(require,module,exports){
module.exports = {

  mining: () => ({
    name: 'Mining',
    abr: 'MNG',
    cycle: 1000,
    input: {},
    output: {
      ore: 1
    }
  }),

  refining: () => ({
    name: 'Refining',
    abr: 'REF',
    cycle: 5000,
    input: {
      ore: 10
    },
    output: {
      metal: 1
    }
  }),

  factory: () => ({
    name: 'Factory',
    abr: 'FRY',
    cycle: 10000,
    input: {
      metal: 5
    },
    output: {
      parts: 1
    }
  })

};

},{}],8:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');
const drawMap = require('./drawMap.js');
const renderer = require('onml/renderer.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hulls = require('./hulls.js');
const craft = require('./craft.js');

const rate = craft.getRate();

const makeStar = (staro) => {
  return staro;
};

const makeBody = (bodyo) => {
  ind.initInd(bodyo);
  const bodyDat = mech.kepCalc(bodyo, 0);
  const body = Object.assign(
    bodyo,
    {
      focalShift: bodyDat.focalShift,
      x: bodyDat.x,
      y: bodyDat.y,
      z: bodyDat.z,
      soi: 10
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
    primary: belto.primary,
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

const craftStart = (craftList, indSites) => {
  craftList.map(crafto => {
    ['x', 'y', 'z'].map(e => {
      crafto[e] = majObj[crafto.home][e];
    });
  });

  craft.startCraftLife(craftList, indSites);
};

const main = async () => {
  console.log('Giant alien spiders are no joke!');

  let stars = [];
  let planets = [];
  let moons = [];
  let ast = [];
  let indSites = [];
  let belts = [];

  const craftList = [];

  Object.keys(majObj).map(objName => {
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

    if (majObj[objName].industry) {
      indSites.push(majObj[objName]);
    }
  });


  renderer(document.getElementById('content'))(drawMap.drawStatic(stars, planets));
  const render2 = renderer(document.getElementById('moving'));

  let movBod = [];
  movBod = movBod.concat(planets, moons, ast);
  belts.map(e => movBod = movBod.concat(e.rocks));

  for (let i = 0; i < 8; i++) {
    craftList.push(craft.makeCraft(hulls.brick()));
  }
  for (let i = 0; i < 4; i++) {
    craftList.push(craft.makeCraft(hulls.boulder()));
  }
  for (let i = 0; i < 2; i++) {
    craftList.push(craft.makeCraft(hulls.mountain()));
  }

  let clock = Date.now();
  // let clock = 1;

  while (Date.now()) {

    clock += (rate / 10) * 2;
    let t = clock / Math.pow(10, 2);
    let clock2 = Date(clock);
    // let clock2 = clock;

    for (let i = 0; i < movBod.length; i++) {
      movBod[i].t = t;
      let newData = mech.kepCalc(movBod[i]);
      ['x', 'y', 'z'].map(e => {
        movBod[i][e] = newData[e];
      });
    }

    if (!craftList[0].x) {
      craftStart(craftList, indSites);
    }

    render2(drawMap.drawMoving(clock2, planets, moons, ast, belts, craftList));
    await delay(rate);
  }
};

window.onload = main;

},{"./craft.js":1,"./drawMap.js":2,"./hulls.js":4,"./industry.js":6,"./majorObjects2.json":9,"./mechanics.js":10,"onml/renderer.js":11}],9:[function(require,module,exports){
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
    "mass": 600000000,
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
    "objectRadius": 5
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
    "objectRadius": 5,
    "industryList": ["refining", "refining", "refining"]
  },
  "gMinB": {
    "name": "Gamma B",
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
    "industryList": ["factory"]
  },
  "gMinA": {
    "name": "Gamma A",
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
    "name": "Beta A",
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
  "astroDeltaA": {
    "name": "Ast. Delta A",
    "type": "asteroid",
    "primary": "prime",
    "mass": 1,
    "a":    475,
    "e":    0.01,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  2.45,
    "objectRadius": 3,
    "industryList": ["mining"]
  },
  "astroDeltaB": {
    "name": "Ast. Delta B",
    "type": "asteroid",
    "primary": "prime",
    "mass": 1,
    "a":    475,
    "e":    0.05,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "objectRadius": 3,
    "industryList": ["mining"]
  },
  "astroAlphaA": {
    "name": "Ast. Alpha A",
    "type": "asteroid",
    "primary": "prime",
    "mass": 1,
    "a":    150,
    "e":    0.045,
    "t":    0,
    "t0":   0,
    "w":    6,
    "lang": 0,
    "inc":  3,
    "maz":  4,
    "objectRadius": 3,
    "industryList": ["mining"]
  },
  "beltDelta": {
    "name":     "Belt Delta",
    "type":     "belt",
    "primary":  "prime",
    "count":  100,
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
    "count":  30,
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

},{}],10:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');
// const craft = require('./craft.js');

const cos = Math.cos;
const sin = Math.sin;
const PI = Math.PI;
const sqrt = Math.sqrt;

const kepCalc = (bodyo, t = bodyo.t) => {
  // console.log(t);
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

  let bodyCoords = {
    x: (x / Math.pow(10, 9)),
    y: (y / Math.pow(10, 9)),
    z: (z / Math.pow(10, 9))
  };

  let primaryCoords = {
    x: primaryo.x,
    y: primaryo.y,
    z: primaryo.z
  };

  if (primaryo.type !== 'star') {
    primaryCoords = kepCalc(primaryo, t);
  }

  return {
    x: bodyCoords.x + primaryCoords.x,
    y: bodyCoords.y + primaryCoords.y,
    z: bodyCoords.z + primaryCoords.z,
    focalShift: focalShift
  };
};
exports.kepCalc = kepCalc;

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

const calcTravelTime = (dist, accel) => {
  let time = sqrt( dist / accel ) * 2;
  // console.log(time);
  return time * 2;
};
exports.calcTravelTime = calcTravelTime;

// const calcTravelTime = (dist, speed) => {
//   return ( dist / speed ) * 2;
// };
// exports.calcTravelTime = calcTravelTime;

},{"./majorObjects2.json":9}],11:[function(require,module,exports){
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

},{"./stringify.js":12}],12:[function(require,module,exports){
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

},{}],13:[function(require,module,exports){
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

},{}]},{},[8]);
