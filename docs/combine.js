(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

const stringify = require('onml/stringify.js');

exports.appendRend = (root, ml) => {
  const content = (typeof root === 'string')
    ? document.getElementById(root)
    : root;

  let str;
  try {
    str = stringify(ml);
    content.innerHTML += str;
  } catch (err) {
    console.log(ml);
  }
};

exports.normRend = (root, ml) => {
  const content = (typeof root === 'string')
    ? document.getElementById(root)
    : root;

  let str;
  try {
    str = stringify(ml);
    content.innerHTML = str;
  } catch (err) {
    console.log(ml);
  }
};

},{"onml/stringify.js":15}],2:[function(require,module,exports){
module.exports={
  "stationBA": {
    "name": "Beta Extract",
    "type": "station",
    "size": "extractor",
    "primary": "beta",
    "mass": 60,
    "a":    14,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0,
    "industryList": ["gasStation", "gasStation"]
  },
  "stationBB": {
    "name": "Beta Orbital",
    "type": "station",
    "size": "small",
    "primary": "beta",
    "mass": 100,
    "a":    25,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0
  },
  "stationP": {
    "name": "Prime Orbital",
    "type": "station",
    "size": "small",
    "primary": "prime",
    "mass": 100,
    "a":    110,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0
  },
  "stationO": {
    "name": "Outer Orbital",
    "type": "station",
    "size": "small",
    "primary": "prime",
    "mass": 90,
    "a":    540,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0
  },
  "stationP": {
    "name": "Portal Orbital",
    "type": "station",
    "size": "small",
    "primary": "prime",
    "mass": 90,
    "a":    310,
    "e":    0,
    "t":    0,
    "t0":   0,
    "w":    0,
    "lang": 0,
    "inc":  0,
    "maz":  0
  }
}

},{}],3:[function(require,module,exports){
'use strict';
const mech = require('./mechanics.js');
const ind = require('./industry.js');
// const drawMap = require('./drawMap.js');

// Bezier Curve:
// B(t) = (1-t) * ((1-t) * p0 + t * p1) + t * ((1-t) * p1 + t * p2)

const makeCraft = (crafto, name, id, owner = 'EMPIRE') => {
  // const initWait = id % 10;
  const initWait = 10;
  const mapID = id + '-MID';

  const newCrafto = Object.assign(
    crafto,
    {
      name: name,
      id: id,
      type: 'craft',
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      speed: 0,
      course: 0,
      accelStat: 0,
      intercept: {},
      status: 'new',
      route: [],
      lastStop: [],
      cargo: {},
      fuel: crafto.fuelCapacity,
      owner: owner,
      waitCycle: 0 + initWait,
      render: false,
      renderer: undefined,
      mapID: mapID,
      visible: true
    }
  );

  return newCrafto;
};
const craftAI = (crafto, indSites, listOfcraft, timeDelta, staro, sysObjects, mapPan) => {
  //             crafto, indSites, craftList, workTime, stars[0], sysObjects, mapPan
  switch(crafto.status) {
    case 'new':
      updateParking(crafto, sysObjects[crafto.home]);
      crafto.status = 'parked';
      break;
    case 'parked':
      if (attemptSearchChecker(crafto, timeDelta)) {
        tryToMakeRoute(crafto, indSites, staro, listOfcraft, mapPan);
      }
      break;
    case 'traveling':
      calcActiveMotion(crafto, crafto.intercept, timeDelta);
      if (checkProxToTarget(crafto)) {
        manageArrival(crafto, listOfcraft, staro, mapPan);
      }
      break;
    case 'drifting':
      calcDriftMotion(crafto, timeDelta);
      break;
    default:
      console.log('[!] UNKNOWN CRAFT STATUS');
      break;
  }
};
const attemptSearchChecker = (crafto, timeDelta) => {
  crafto.waitCycle += timeDelta;
  if (crafto.waitCycle >= 1) {
    crafto.waitCycle = 0;
    return true;
  }
  return false;
};
const updateParking = (crafto, parkingSpot) => {
  ['x', 'y', 'z'].forEach(e => {
    crafto[e] = parkingSpot[e];
  });
};
const calcActiveMotion = (crafto, targeto, timeDelta) => {
  const distToTarget = mech.calcDistSq(crafto, targeto);
  const dir = (distToTarget < (targeto.turn * targeto.turn)) ? -1 : 1;

  ['x', 'y', 'z'].forEach(e => {
    const dV = (dir * (crafto.accel) * (targeto['p' + e]) * timeDelta);
    crafto[e] += (crafto['v' + e] * timeDelta) + (dV * timeDelta / 2);
    crafto['v' + e] += dV;
  });

  crafto.fuel = crafto.fuel - crafto.fuelConsumption * timeDelta;
  if (crafto.fuel <= 0) {
    console.log(crafto.name + ' has run out of gas and is drifting.');
    crafto.status = 'drifting';
    crafto.accelStat = 0;
  } else {
    crafto.accelStat = dir;
  }
  // console.log(crafto.accelStat);
};
const calcDriftMotion = (crafto, timeDelta) => {
  // timeDelta passed down in SECONDS not ms
  ['x', 'y', 'z'].forEach(e => {
    crafto[e] += crafto['v' + e] * timeDelta;
  });
};
const manageArrival = (crafto, listOfcraft, staro, mapPan) => {
  fullStop(crafto);
  ind.transfCraftCargo(crafto);
  crafto.lastStop = crafto.route[0].location;
  crafto.route.shift();
  if (crafto.route.length === 0) {
    crafto.status = 'parked';
  } else {
    crafto.intercept = calcIntercept(crafto, crafto.route[0].location, staro);
  }
  // rendererIntercept(drawMap.drawIntercepts(listOfcraft, mapPan));
  mapPan.interceptUpdated = true;
};
const checkProxToTarget = (crafto) => {
  let tsoi = crafto.route[0].location.sphereOfInfluence;
  if (
    mech.calcDistSq(crafto, crafto.route[0].location) < tsoi * tsoi
  ) {
    return true;
  }
  return false;
};
const fullStop = (crafto) => {
  ['x', 'y', 'z'].forEach(e => {
    crafto['v' + e] = 0;
  });
};
const calcIntercept = (crafto, bodyo, staro) => {
  let intercepto = {
    x: bodyo.x, y: bodyo.y, z: bodyo.z,
    px: 0, py: 0, pz: 0,
    turn: 0
  };
  let travelTime = 0;
  let distance = 0;

// C ---P
//   \  |
//    \ |
//      I
  for (let i = 0; i < 5; i++) {
    distance   = mech.calcDist(crafto, intercepto);
    travelTime = mech.calcTravelTime(distance, crafto.accel);
    intercepto  = {...mech.kepCalc(bodyo, bodyo.t + travelTime)};
  }

  intercepto.turn = distance / 2;

//   \|/
//   -O-
//   /|\
  if (calcSolarDanger(crafto, intercepto, staro) < staro.nopeZone) {
    console.log(crafto.name + ' WILL BE PASSING DANGEROUSLY CLOSE TO STAR!');
  }

  ['x', 'y', 'z'].forEach(e => {
    intercepto['p' + e] = (intercepto[e] - crafto[e]) / (distance);
  });
  calcCourse(crafto, intercepto);

  return intercepto;
};
const calcCourse = (crafto, intercepto) => {
  crafto.course = (Math.atan2(intercepto.py, intercepto.px) * 180 / Math.PI) + 90;
};
const buildWaypoint = (bodyo) => {
  let waypoint = {
    location: bodyo,
    pickup: {},
    dropoff: {}
  };

  return waypoint;
};
const tryToMakeRoute = (crafto, indSites, staro, listOfcraft, mapPan) => {
  crafto.intercept = {};
  if (!deviseRoute(crafto, indSites, staro)) {
    crafto.status = 'parked';
    ['x', 'y', 'z'].forEach(e => {
      crafto[e] = crafto.lastStop[e];
      crafto['v' + e] = 0;
    });
  } else {
    mapPan.interceptUpdated = true;
  }
};
const calcFuelNeeded = (crafto, routeArr = []) => {
  if (routeArr.length === 0) { return 0; }
  let projectedFuelUse = 0;
  let counter = 0;
  let lastEl = {};
  routeArr.forEach(e => {
    if (e === undefined || !e.x) {
      console.log('[!] ERROR IN CALCFUEL ARR');
    } else if (counter === 0) {
      projectedFuelUse +=
        mech.calcTravelTime(mech.calcDist(crafto, e), crafto.accel) *
        crafto.fuelConsumption *
        1.1;
      lastEl = e;
      counter++;
    } else {
      projectedFuelUse +=
        mech.calcTravelTime(mech.calcDist(lastEl, e), crafto.accel) *
        crafto.fuelConsumption *
        1.1;
      lastEl = e;
      counter++;
    }
  });
  return projectedFuelUse;
};
const enoughFuelCheck = (crafto, fuelNeeded) => {
  if (crafto.fuel > fuelNeeded * 1.1) {
    return true;
  }
  return false;
};
const findNearestGasStation = (crafto, indSites, startPoint = crafto) => {
  let baseFuelNeeded = crafto.fuelCapacity - crafto.fuel;
  let rangeToGasStation = Infinity;
  let nearestGasStation = undefined;
  indSites.forEach(site => {
    site.outputsList.forEach(output => {
      if (
        output === 'fuel' &
        site.store.fuel >= baseFuelNeeded
      ) {
        let distToSite = mech.calcDist(startPoint, site);
        if (distToSite < rangeToGasStation) {
          rangeToGasStation = distToSite;
          nearestGasStation = site;
        }
      }
    });
  });
  return nearestGasStation;
};
const plotToNearestGasStation = (crafto, indSites, staro) => {
  let nearestGasStation = findNearestGasStation(crafto, indSites);
  crafto.route.push(buildWaypoint(nearestGasStation));

  crafto.route[0].pickup = {
    fuel: crafto.fuelCapacity - crafto.fuel + calcFuelNeeded(crafto, [nearestGasStation])
  };
  ind.moveToHold(nearestGasStation, 'fuel', crafto);

  crafto.status = 'traveling';

  crafto.intercept = calcIntercept(crafto, crafto.route[0].location, staro);

  return true;
};
const plotSimpleRoute = (crafto, prodSite, prodRes, consSite, staro) => {
  crafto.route.push(buildWaypoint(prodSite));
  crafto.route.push(buildWaypoint(consSite));

  crafto.route[0].pickup = {
    [prodRes]: crafto.cargoCap
  };
  crafto.route[1].dropoff = {
    [prodRes]: crafto.cargoCap
  };
  ind.moveToHold(prodSite, prodRes, crafto);

  crafto.status = 'traveling';

  crafto.intercept = calcIntercept(crafto, crafto.route[0].location, staro);

  return true;
};
const findSimpleRoute = (crafto, indSites, staro) => {
  return indSites.find(prodSite => {
    return prodSite.outputsList.find(prodRes => {
      return indSites.find(consSite => {
        if (prodSite !== consSite) {
          return consSite.inputsList.find(consRes => {
            if (
              (prodRes === consRes) &&
              (prodSite.store[prodRes] >= crafto.cargoCap)
            ) {
              if (
                // , findNearestGasStation(crafto, indSites, consRes)
                !enoughFuelCheck(crafto, calcFuelNeeded(crafto, [prodSite, consSite]))
              ) {
                return plotToNearestGasStation(crafto, indSites, staro);
              } else {
                return plotSimpleRoute(crafto, prodSite, prodRes, consSite, staro);
              }
            }
          });
        }
      });
    });
  });
};
const deviseRoute = (crafto, indSites, staro) => {
  if (crafto.route.length > 0) {
    console.log('ERROR at craft.deviseRoute: Route not empty!');
    crafto.route = [];
  }
  if (indSites.length < 2) {
    console.log('ERROR at craft.deviseRoute: Too few industry sites.');
    // return false;
  }
  // if (!enoughFuelCheck(crafto)) {
  //
  // }
  return findSimpleRoute(crafto, indSites, staro);
};
const calcSolarDanger = (crafto, icpto, staro) => {
// C-----S
//  \   /
//   \^/
//    T
//     \
//      I
  let coordC = {x: 0, y: 0, z: 0};
  let coordS = {x: staro.x - crafto.x, y: staro.y - crafto.y, z: staro.z - crafto.z};
  let coordI = {x: icpto.x - crafto.x, y: icpto.y - crafto.y, z: icpto.z - crafto.z};

  let distCS = mech.calcDist(coordC, coordS);
  let distCI = mech.calcDist(coordC, coordI);

  let dot = ( v1, v2 ) => {
		return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
	};
  let lengthSq = ( v ) => {
    return v.x * v.x + v.y * v.y + v.z * v.z;
  };

  const denominator = Math.sqrt( lengthSq(coordS) * lengthSq(coordI) );
  if ( denominator === 0 ) {return Math.PI / 2;}
  const theta = dot( coordS, coordI ) / denominator;
  let angleICS = (Math.acos( Math.max( theta, Math.min( - 1, 1 ) ) ));

  let distCT = Math.cos(angleICS) * distCS;
  let distST = Math.sin(angleICS) * distCS;

  if (distCT > distCI) {return Infinity;} else {return distST;}

};

exports.makeCraft = makeCraft;
exports.craftAI = craftAI;

},{"./industry.js":8,"./mechanics.js":13}],4:[function(require,module,exports){
'use strict';
//What are you doing here? How did you get here? Leave.

const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const icons = require('./icons.js');
const lists = require('./lists.js');

function getPageWidth() {return document.body.clientWidth;}
function getPageHeight() {return document.body.clientHeight;}

const drawGrid = (mapPan, options, reReRenderScaleBar) => {
  let grid = ['g', {}];
  let actualGridStep = options.gridStep * mapPan.zoom;
  if (actualGridStep < 100) {actualGridStep *= 10;}

  let gridRectStartX = - mapPan.x + (mapPan.x) % (actualGridStep) - actualGridStep;
  let gridRectStartY = - mapPan.y + (mapPan.y) % (actualGridStep) - actualGridStep;
  let gridRectEndX = gridRectStartX + getPageWidth() + actualGridStep * 2;
  let gridRectEndY = gridRectStartY + getPageHeight() + actualGridStep * 2;

  for (let x = gridRectStartX; x < (gridRectEndX); x += actualGridStep) {
    for (let y = gridRectStartY; y < (gridRectEndY); y += actualGridStep) {
      grid.push(
        icons.gridCross(options.gridCrossSize,  x,  y)
      );
    }
  }

  reReRenderScaleBar(options, mapPan);

  return grid;
};
exports.drawGrid = drawGrid;
exports.drawGridScaleBar = (options, mapPan) => {
  let actualGridStep = options.gridStep * mapPan.zoom;
  let gridStep = actualGridStep;
  let label = "10";
  if (actualGridStep < 100) {
    gridStep = actualGridStep *= 10;
    label = "100";
  }
  let stepTenth = gridStep / 10;
  let bar = ['g', tt(5, (getPageHeight()-30-5))];

  bar.push(['rect', {y: 10, height: 20, width: gridStep + 10, class:'standardBox'}]);


  for (let i = 0; i < 10; i+= 2) {
    bar.push(['g', tt(i * (stepTenth) + 5, 15),
      ['path', {
        d: 'M 0,0 L '+ (stepTenth) + ', 0 L '+ (stepTenth) + ', 7 L 0, 7 Z',
        class:'scaleEmpty',
      }]
    ]);
    bar.push(['g', tt((i + 1) * (stepTenth) + 5, 20),
      ['path', {
        d: 'M 0,-2 L '+ (stepTenth) + ', -2 L '+ (stepTenth) + ', 5 L 0, 5 Z',
        class:'scaleFull',
      }]
    ]);
  }

  bar.push(['g', tt(0,-10),
    ['rect', {height: 20, width: 20, class:'standardBox'}],
    ['text', {y: 15.5, x: 4.5, class:'craftDataText'}, "0"]
  ]);
  bar.push(['g', tt(20,-10),
    ['rect', {height: 20, width: 40, class:'standardBox'}],
    ['text', {y: 15.5, x: 4.5, class:'craftDataText'}, "Mkm"]
  ]);
  bar.push(['g', tt(gridStep - 30, -10),
    ['rect', {height: 20, width: 40, class:'standardBox'}],
    ['text', {y: 15.5, x: 4.5, class:'craftDataText'}, label]
  ]);

  return bar;
};
const drawOrbits = (bodies, mapPan) => {
  if (bodies.length < 1) {return ['g', {}];}

  let retGroup = ['g', {}];
  const zoom = mapPan.zoom;

  bodies.forEach(bodyo => {
    // console.log(bodyo);
    let partOrbit = ['g', {id: bodyo.mapID + '-ORB'}];
    let coords = 'M ';

    for (let i = 0; i < bodyo.orbitPointsArr.length; i++) {
      let currCoord = bodyo.orbitPointsArr[i];
      let currX = currCoord.ax * zoom;
      let currY = currCoord.ay * zoom;

      coords += currX + ',' + currY;
      (i === bodyo.orbitPointsArr.length - 1)?(coords += 'Z'):(coords += 'L');
    }

    partOrbit.push(['path', { d: coords, class: 'majorOrbit' }]);
    partOrbit.push(['line',
      {
        x1: bodyo.orbitDivLine[0].ax * zoom,
        y1: bodyo.orbitDivLine[0].ay * zoom,
        x2: bodyo.orbitDivLine[1].ax * zoom,
        y2: bodyo.orbitDivLine[1].ay * zoom,
        class: 'orbitDivLine'
      }]);
    partOrbit.push(
      ['g', tt(bodyo.orbitDivLine[0].ax * zoom, bodyo.orbitDivLine[0].ay * zoom),
        icons.apsis('-')
      ],
      ['g', tt(bodyo.orbitDivLine[1].ax * zoom, bodyo.orbitDivLine[1].ay * zoom),
        icons.apsis()
      ]
    );
    retGroup.push(partOrbit);
  });

  return retGroup;
};
exports.drawOrbits = drawOrbits;
const drawStars = (stars, mapPan) =>{
  let drawnStars = ['g', {}];
  stars.forEach((staro) => {
    drawnStars.push(icons.star(staro, mapPan));
    // drawnStars.push(drawPolarGrid(staro));
  });
  return drawnStars;
};
exports.drawStars = drawStars;
exports.drawScreenFrame = () => {
  let frame = ['g', {}];

  frame.push( ['g', tt(4,4),
    ['g', tt(0, 0, {id:'buttonSettings', class: 'standardBoxSelectable'}),
      ['rect', {width: 30, height: 30}],
      ['g', tt(15,15),
        ['path', {d:'M 8 -9 A 12 12 0 1 1 -8 -9', class:'UIcon'}],
        ['path', {d:'M 0, 0 L 0, -13', class:'UIcon'}]
      ]
    ]
  ]);
  frame.push( ['g', tt(4,38),
    ['g', tt(0, 0, {id:'button', class: 'standardBoxSelectable'}),
      ['rect', {width: 30, height: 30}],
    ]
  ]);
  frame.push( ['g', tt(4,72),
    ['g', tt(0, 0, {id:'button', class: 'standardBoxSelectable'}),
      ['rect', {width: 30, height: 30}],
    ]
  ]);

  frame.push( ['g', {},
    ['path',
      { d: 'M 40, 2 L 2, 2 L 2, 40',
      class: 'frame' }],
    ['path',
      { d: 'M ' + (getPageWidth() - 40) + ', 2 L ' + (getPageWidth() - 2) + ', 2 L ' + (getPageWidth() - 2) + ', 40',
      class: 'frame' }],
    ['path',
      { d: 'M ' + (getPageWidth() - 40) + ', ' + (getPageHeight() - 2) + ' L ' + (getPageWidth() - 2) + ', ' + (getPageHeight() - 2) + ' L ' + (getPageWidth() - 2) + ', ' + (getPageHeight() - 40) + '',
      class: 'frame' }],
    ['path',
      { d: 'M 40, ' + (getPageHeight() - 2) + ' L 2, ' + (getPageHeight() - 2) + ' L 2, ' + (getPageHeight() - 40) + '',
      class: 'frame' }]
  ]);

  return frame;
};
const drawSimRateModule = (x, y) => {
  let btSz = 30;
  let mrgn = 3;
  return ['g', {id: 'simRateModule'},
    // ['rect', {width: 10, height: 2, class: 'standardBox'}],
    ['g', tt(x,y),
      ['rect', {width: btSz*6+mrgn*4+8, height: btSz+24, class: 'standardBox'}],
      ['text', {class: 'dataText', x: 4, y:15}, 'Simulation rate:']
    ],
    ['g', tt(x+4,y+20),
      ['g', tt(0, 0, {id:'buttonStop', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        ['path', { d: 'M 11, 4 L 11, 26', class: 'UIcon'}],
        ['path', { d: 'M 19, 4 L 19, 26', class: 'UIcon'}],
        // icons.arrow(2, true),
      ],
      ['g', tt(btSz+mrgn,0, {id:'buttonSlow', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(0, true)
      ],
      ['g', tt((btSz+mrgn)*2,0, {id:'simRateDisplay', class: 'standardBox'}),
        ['rect', {width: btSz*2, height: btSz}],
        ['g', {id: 'rateCounter'}]
      ],
      ['g', tt((btSz*4)+(mrgn*3),0, {id:'buttonFast', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(0, false)
      ],
      ['g', tt((btSz*5)+(mrgn*4),0, {id:'buttonMax', class: 'standardBoxSelectable'}),
        ['rect', {width: btSz, height: btSz}],
        icons.arrow(4, false),
        icons.arrow(-4, false),
      ]
    ]
  ];
};
exports.drawSimRateModule = drawSimRateModule;
exports.drawRateCounter = (options) => {
  return ['text', {x: 4, y: 19,class: 'dataText bold'}, 'X ' + options.rate];
  //options.rate.toString().length
};
exports.drawBoxSettings = () => {
  let box = ['g', {}];

  box.push(['rect', {height: 160, width: 238, class:'standardBox'}]);
  box.push(['rect', {height: 20, width: 208, class:'standardBoxSelectable', id:'boxSettingsDragger'}]);
  box.push(['g', tt(208, 0, {id: 'boxSettingsCloser', class:'standardBoxSelectable'}),
    ['rect', {height: 30, width: 30}],
    ['path', {d: 'M 4, 4 L 26, 26', class: 'UIcon'}],
    ['path', {d: 'M 4, 26 L 26, 4', class: 'UIcon'}]
  ]);
  // box.push(['g', tt(208, 0, {id: 'boxSettingsCloser', class:'standardBoxSelectable'})]);

  let keys = ['g', tt(4, 24)];
  let keysHeight = lists.keys().length * 15 + 4;
  keys.push(['rect', {width: 30*6+3*4+8, height: keysHeight, class: 'standardBox'}]);
  for (let i = 0; i < lists.keys().length; i++) {
    keys.push(['g', tt(2,  16 * i + 14), [ 'text', {class: 'dataText'}, lists.keys()[i] ]],);
  }
  box.push(keys);

  box.push(drawSimRateModule(4, 24 + keysHeight + 4));

  return box;
};

//Moving elements rendered in /main
exports.drawMovingOrbits = (moons, mapPan) => {
  return ['g', {}, drawOrbits(moons, mapPan)];
};
exports.drawSimpleOrbit = (stationo, mapPan) => {

  let retGroup = ['g', {}];

  retGroup.push(
    ['g', tt(stationo.primaryo.x * mapPan.zoom, stationo.primaryo.y * mapPan.zoom),
      ['circle', {
        r : stationo.a * mapPan.zoom,
        class: 'minorOrbit'}
      ]
    ]
  );

  return retGroup;
};
exports.drawRanges = (bodyArr, mapPan) => {
  let rangesDrawn = ['g', {}];
  let linesDrawn = ['g', {}];
  let windowsDrawn = ['g', {}];

  for (let i = 0; i < bodyArr.length; i++) {
    if (bodyArr[i].industry) {
      for (let j = i + 1; j < bodyArr.length; j++) {
        if (bodyArr[j].industry) {
          linesDrawn.push(['line', {
            x1: bodyArr[i].x * mapPan.zoom,
            y1: bodyArr[i].y * mapPan.zoom,
            x2: bodyArr[j].x * mapPan.zoom,
            y2: bodyArr[j].y * mapPan.zoom,
            class: 'rangeLine'
          }]);

          let dist = mech.calcDist(bodyArr[i], bodyArr[j]);

          windowsDrawn.push(['g',
          tt((((bodyArr[j].x) + (bodyArr[i].x)) / 2) * mapPan.zoom,
            (((bodyArr[j].y) + (bodyArr[i].y)) / 2) * mapPan.zoom),
            ['circle', {r: 2, class: 'rangeWindow'}],
            ['rect', {
              width: 42,
              height: 10,
              class: 'rangeWindow'
            }],
            ['text', {
              x: 2,
              y: 8.5,
              class: 'rangeText'}, (dist).toFixed(2)]
          ]);
        }
      }
    }
  }
  rangesDrawn.push(linesDrawn, windowsDrawn);

  return rangesDrawn;
};
exports.drawBody = (bodyo) => {
  let drawnBody = ['g', {}];
  // drawnBody.push(drawBodyData(bodyo));

  if (bodyo.shadow) {drawnBody.push(drawShadow(bodyo));}
  drawnBody.push(icons.body(bodyo));
  drawnBody.push(icons.brackets(bodyo.id, bodyo.objectRadius));

  return drawnBody;
};
const drawShadow = (bodyo) => {
  let shadow = ['g', {
    id: bodyo.mapID + '-SHAD',
    transform: 'rotate(0)'
  }];

  let rad = bodyo.objectRadius * 2;
  let shadLeng = rad*100;
  let shadWidth = rad*10;


  let coords1 = 'M '+rad+',0 L 0,'+shadLeng+' L -'+rad+',0 Z';
  let coords2 = 'M '+rad+',0 L '+shadWidth+','+shadLeng+' L -'+shadWidth+','+shadLeng+' L -'+rad+',0 Z';


  shadow.push(
    ['path', {
      d: coords1,
      // class: 'shadow',
      fill: 'url(#ShadowGrad)'
    }]
  );

  shadow.push(
    ['path', {
      d: coords2,
      // class: 'shadow',
      fill: 'url(#ShadowGrad)'
    }]
  );


  return shadow;
};
exports.drawStation = (stationo) => {
  const drawnStation = ['g', {}];

  // drawnStation.push(['g', {}, drawBodyData(stationo),]);

  drawnStation.push(icons.station(stationo));
  drawnStation.push(icons.brackets(stationo.id, 5));

  return drawnStation;
};
exports.drawCraft = (crafto) => {
  const drawnCraft = ['g', {},
    ['g', {
      transform: 'rotate(' + crafto.course + ')',
      id: crafto.mapID + '-ROT'
    },
    ['path', {
      d: 'M 0,0 L -2, '+(-crafto.accel*8)+' L 2, '+(-crafto.accel*8)+' Z',
      class: 'vector'
    }],
    icons.craft(crafto),
    ]
  ];

  //
  //
  //   // ['g', {
  //   //   transform: 'rotate(' + (crafto.accelStat === 1 ? crafto.course : crafto.course + 180) + ')'
  //   // }, [
  //   // ]],
  //
  //   ['line', {
  //     x1: 0,
  //     y1: 0,
  //     x2: crafto.vx,
  //     y2: crafto.vy,
  //     class: 'vector'
  //   }],
  //   ['g', {
  //     transform: 'translate('+crafto.vx+', '+crafto.vy+')'
  //   }, [
  //     'circle',
  //     {r : 2, class: 'vector'}
  //   ]],
  //   icons.brackets(crafto.id)
  // ]];

  return drawnCraft;
};
exports.updateCraft = (crafto) => {
  if (crafto.type === 'craft' && crafto.render) {
    if (crafto.status === 'new' || crafto.status === 'parked') {
      if (crafto.visible) {
        document.getElementById(crafto.mapID).style.visibility = "hidden";
        crafto.visible = false;
      }
    } else if (crafto.status === 'traveling' || crafto.status === 'drifting') {
      if (!crafto.visible) {
        document.getElementById(crafto.mapID).style.visibility = "visible";
        crafto.visible = true;
        // console.log('here');
      }
      let rotation = crafto.accelStat === -1 ? crafto.course : crafto.course + 180;

      document.getElementById(crafto.mapID + '-ROT').setAttribute(
        'transform', 'rotate(' + (rotation) + ')'
      );
    }
  }
};
exports.drawIntercepts = (listOfcraft, mapPan) => {
  let intercepts = ['g', {}];

  listOfcraft.forEach(crafto => {
    if (crafto.intercept && (crafto.status === 'traveling')) {
      intercepts.push(
        ['g',
        tt(crafto.intercept.x * mapPan.zoom, crafto.intercept.y * mapPan.zoom),
        ['g', {transform: 'scale(2,2)'},
          icons.marker()]
        ]
      );
    }
  });

  return intercepts;
};
exports.drawStatic = () => {
  let starColor = '#ff7800';
  let shadowColor = "#363636";
  return getSvg({w:getPageWidth(), h:getPageHeight(), i:'allTheStuff'}).concat([
    ['defs',
      ['radialGradient', {id: "RadialGradient1", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "0%", 'stop-color': starColor, 'stop-opacity': 0.5 }],
        ['stop', {offset: "100%", 'stop-color': "#363636", 'stop-opacity':    0 }]
      ],
      ['radialGradient', {id: "RadialGradient2", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': "#000000", 'stop-opacity':   0.25 }],
        ['stop', {offset: "50%", 'stop-color': "#000000", 'stop-opacity':   0.1 }],
        ['stop', {offset: "100%", 'stop-color': "#363636", 'stop-opacity':  0 }]
      ],
      ['radialGradient', {id: "RadialGradient3", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': starColor, 'stop-opacity':  1 }],
        ['stop', {offset: "35%", 'stop-color': starColor, 'stop-opacity':  0.3 }],
        ['stop', {offset: "50%", 'stop-color': starColor, 'stop-opacity':  0.1 }],
        ['stop', {offset: "100%", 'stop-color': starColor, 'stop-opacity': 0 }]
      ],
      ['radialGradient', {id: "EngineFlare",     cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': "#ffffff", 'stop-opacity':  0.1 }],
        ['stop', {offset: "90%", 'stop-color': "#ffffff", 'stop-opacity':  0.01 }],
        ['stop', {offset: "100%", 'stop-color': "#ffffff", 'stop-opacity': 0 }]
      ],
      ['linearGradient', {id: "ShadowGrad",     x1: 0, x2: 0, y1: 0, y2: 1 },
        ['stop', {offset: "0%", 'stop-color': shadowColor, 'stop-opacity':  0.5 }],
        ['stop', {offset: "50%", 'stop-color': shadowColor, 'stop-opacity': 0 }]
      ],
    ],
    ['g', {id: 'map'},
      ['g', {id: 'staticOrbits'}],
      ['g', {id: 'movingOrbits'}],
      ['g', {id: 'simpleOrbits'}],
      ['g', {id: 'stars'}],
      ['g', {id: 'grid'}],
      ['g', {id: 'moving'},
        // ['g', {id: 'majorOrbits'}],
        ['g', {id: 'simpleOrbits'}],
        ['g', {id: 'ranges'}],
        ['g', {id: 'belts'}],
        ['g', {id: 'bodies'}],
        // ['g', {id: 'bodiesMoons'}],
        // ['g', {id: 'bodiesPlanets'}],
        // ['g', {id: 'bodiesAsts'}],
        // ['g', {id: 'stations'}],
        ['g', {id: 'crafts'}],
      ],
      ['g', {id: 'intercept'}]
    ],
    ['g', {id: 'screenFrame'}],
    ['g', {id: 'gridScaleBar'}],
    ['g', {id: 'boxes'},
      ['g', {id: 'boxMainSettings'}]
    ]
  ]);
};

},{"./get-svg.js":5,"./icons.js":7,"./lists.js":10,"./mechanics.js":13,"onml/tt.js":16}],5:[function(require,module,exports){
module.exports = cfg => {
  cfg = cfg || {};
  cfg.w = cfg.w || 880;
  cfg.h = cfg.h || 256;
  cfg.i = cfg.i || 'sveg';
  return ['svg', {
   xmlns: 'http://www.w3.org/2000/svg',
    width: cfg.w + 1,
    height: cfg.h + 1,
    id: cfg.i,
    viewBox: [0, 0, cfg.w + 1, cfg.h + 1].join(' '),
    class: 'panel'
  }];
};

},{}],6:[function(require,module,exports){
module.exports = {

  brick: () => ({
    class: 'Brick',
    abr: 'BRK',
    type: 'freighter',
    cargoCap: 10,
    fuelCapacity: 10,
    fuelConsumption: 0.1,
    accel: 3,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    abr: 'BLD',
    type: 'freighter',
    cargoCap: 20,
    fuelCapacity: 20,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    abr: 'MNT',
    type: 'freighter',
    cargoCap: 30,
    fuelCapacity: 30,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  }),

  barlog: () => ({
    class: 'Barlog',
    abr: 'BRL',
    type: 'freighter',
    cargoCap: 40,
    fuelCapacity: 40,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  }),

  menace: () => ({
    class: 'Menace',
    abr: 'MNC',
    type: 'combat',
    cargoCap: 2,
    fuelCapacity: 50,
    fuelConsumption: 0.1,
    accel: 5,
    home: 'astroDeltaB'
  })

};

},{}],7:[function(require,module,exports){
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

},{"onml/tt.js":16}],8:[function(require,module,exports){
'use strict';
// Industry manager
const indTemp = require('./industryTemp.js');

const initInd = (bodyo) => {
  bodyo.store = bodyo.store || {};

  bodyo.industryList && bodyo.industryList.forEach(bodyoIndName => {
    bodyo.hold = bodyo.hold || {};
    bodyo.industry = bodyo.industry || [];

    let newInd = {};
    Object.assign(
      newInd,
      indTemp[bodyoIndName](),
      {
        status: 'NEW',
        cycles: 0,
        workProg: 0,
      }
    );

    bodyo.industry.push(newInd);

    Object.keys(newInd.output).forEach(resName => {
      bodyo.store[resName] |= 0;
      if (!bodyo.outputsList.find(e => e === resName)) {
        bodyo.outputsList.push(resName);
      }
    });
    Object.keys(newInd.input).forEach(resName => {
      bodyo.store[resName] |= 0;
      if (!bodyo.inputsList.find(e => e === resName)) {
        bodyo.inputsList.push(resName);
      }
    });
  });
};
const indWork = (bodyo, ind, workTime) => {

  if (ind.status === 'WORK') {

    ind.workProg += workTime;
    if (ind.workProg >= ind.cycle) {
      Object.keys(ind.output).forEach(outRes => {
        bodyo.store[outRes] += ind.output[outRes];
      });
      ind.workProg = 0;
      ind.status = 'IDLE';
    }

  } else {

    let workGo = true;
    Object.keys(ind.input).forEach(inRes => {
      if (
        (bodyo.store[inRes] === undefined) ||
        (bodyo.store[inRes] < ind.input[inRes])
      ) {
        workGo = false;
      }
    });
    if (workGo) {
      Object.keys(ind.input).forEach(inRes => {
        bodyo.store[inRes] -= ind.input[inRes];
      });
      ind.status = 'WORK';
    }

  }
};
const moveToHold = (bodyo, res, crafto) => {
  let quant = crafto.cargoCap;

  bodyo.hold[crafto.name] = bodyo.hold[crafto.name] || {};
  bodyo.hold[crafto.name][res] = bodyo.hold[crafto.name][res] || 0;

  bodyo.store[res] -= quant;
  bodyo.hold[crafto.name][res] += quant;
};
const transfCraftCargo = (crafto) => {
  let bodyo = crafto.route[0].location;

  Object.keys(crafto.route[0].dropoff).forEach(res => {
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

  Object.keys(crafto.route[0].pickup).forEach(res => {
    const quant = crafto.route[0].pickup[res];
    // bodyo.store[res] |= 0;
    crafto.cargo[res] |= 0;

    if (res === 'fuel') {
      let actualNeededGas = crafto.fuelCapacity - crafto.fuel;
      let gasSurplus = quant - actualNeededGas;
      if (gasSurplus > 0) {
        crafto.fuel += actualNeededGas;
        bodyo.hold[crafto.name][res] -= actualNeededGas;
        bodyo.store[res] += bodyo.hold[crafto.name][res];
        bodyo.hold[crafto.name][res] = 0;
      } else if (gasSurplus <= 0) {
        crafto.fuel += quant;
        bodyo.hold[crafto.name][res] -= quant;
        if (bodyo.store[res] > Math.abs(gasSurplus)) {
          bodyo.store[res] -= Math.abs(gasSurplus);
          crafto.fuel += Math.abs(gasSurplus);
        }
      }
      console.log(crafto.name + ' refueled.');
    } else if (
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

exports.indWork = indWork;
exports.moveToHold = moveToHold;
exports.initInd = initInd;
exports.transfCraftCargo = transfCraftCargo;

},{"./industryTemp.js":9}],9:[function(require,module,exports){
module.exports = {

  mining: () => ({
    name: 'Mining',
    abr: 'MNG',
    cycle: 1,
    input: {},
    output: {
      ore: 1
    }
  }),

  refining: () => ({
    name: 'Refining',
    abr: 'REF',
    cycle: 5,
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
    cycle: 10,
    input: {
      metal: 5
    },
    output: {
      parts: 1
    }
  }),

  gasStation: () => ({
    name: 'Gas Station',
    abr: 'GAS',
    cycle: 1,
    input: {},
    output: {
      fuel: 10
    }
  })

};

},{}],10:[function(require,module,exports){
module.exports = {

  toDo: (clock = 0) => {return [
    clock,
    " ",
    "Unnamed System Project",
    " ",
    "Things that work:",
    "- 3D, 2-body Kepler orbits for all bodies (that innermost orbit is valid in 3D, but looks odd in 2D.);",
    "- Basic production of 3 resources on some bodies (but no one gets paid);",
    "- Basic logistics chain (ore -> metal -> parts);",
    "- Randomly generated asteroid belts (it was easier to make them this way);",
    "- 3 types of spacecraft (Brick, Boulder, Mountain);",
    "- Craft reserve, pick up, and drop off cargo down the logistics chain;",
    "- Variable acceleration with halfway breaking for spacecraft;",
    "- Intecept calculation for craft heading to planets.",
    "Things to be added in the immediate future:",
    "- Buttons to hide this list, planet information, hull IDs and cargo, range lines;",
    "- A pass to optimize (especially with drawing intercepts);",
    "- Invent capitalism (Buy and sell cost for resources);",
    "- Supply/demand-based cost drift;",
    "- Fuel consumption, production and refueling for craft;",
    "- Invent greed (Craft AI descision-making based on profit);",
    "- A nice lighting gradient from the sun.",
    "Things to be added in the non-immediate future:",
    "- Scrolling and zooming;",
    "- Nearby solar systems, FTL travel;",
    "- Human resources;",
    "- Profit-driven piracy and anti-piracy;",
    "- Overlay to show gravity wells.",
    "Bugs:",
    "- Planets keep producing when program is out of focus;",
    "- Craft can and will go through the sun;",
    "- Strange long tasks at random."
  ];},

  veryLiterateAndNescscessaryRefuelignCheckCheckList: () => {return [
    "Nozzle not inserted up-side down",
    "Refueling station has best price for fuel within travel distance",
    "Refueling station contains enough fuel",
    "GasolineFight variable = negative",
    "Refueling station actually carries correct type of fuel",
    "Fill nozzle is on correct side of ship when docked",
    "Captain has appropriate points card for this refueling station",
    "Cupon for this station in ship armor",
    "Gasoline station has self-service",
    "Gasoline station lacks self-defense",
    "Gasoline station is outside of fast-response range of navy assets",
    "Gasoline station has no navy craft refueling at it",
    "Gasoline station does not belong to warlord sponsor",
    "Station carries day-old hotdogs and scratch-off tickets"
  ];},

  keys: () => {return [
    "System Project V2.6a",
    "RMB + Drag to pan.",
    "Scroll to zoom."
  ];},

};

},{}],11:[function(require,module,exports){
'use strict';
const renderer = require('onml/renderer.js');
const advRenderer = require('./advRenderer.js');
const drawMap = require('./drawMap.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hullTemps = require('./hullTemp.js');
const constructs = require('./constructs.json');
const craft = require('./craft.js');
const majObj = require('./majorObjects2.json');
const ui = require('./ui.js');
const PI = Math.PI;

function getPageWidth() {return document.body.clientWidth;}
function getPageHeight() {return document.body.clientHeight;}
const boundsCheck = (x, y, margin = 10) => {
  if (
    x + margin > 0 &&
    x - margin < getPageWidth() &&
    y + margin > 0 &&
    y - margin < getPageHeight()
  ) {
    return true;
  } else {
    return false;
  }
};

Window.options = {
  rate: 1,
  rateSetting: 3,
  simRates: [0, 0.1, 0.5, 1, 2, 3, 4],
  targetFrames: 30,
  header: false,
  grid: true,
  gridStep: 10,
  gridCrossSize: 5,
  headerKeys: true,
  planetData: true,
  craftData: true,
  stop: false,
  intercepts: true,
  keyPanStep: 50,
  isPaused: false,
};
const options = Window.options;
let mapPan = {
  x: 0,
  y: 0,
  xLast: 0,
  yLast: 0,
  zoom: 1,
  zoomLast: 1,
  cursOriginX: 0,
  cursOriginY: 0,
  mousePosX: 0,
  mousePosY: 0,
  zoomChange: 0,
  interceptUpdated: true,
  boxes: {
    boxSettings: false,
  },
  // selectIDs: {
  //
  // }
};

const makeStar = (staro) => {
  return staro;
};
const makeBody = (inBodyo) => {
  const id = bodyIDer();
  const mapID = id + '-MID';
  advRenderer.appendRend('bodies', (['g', {id: mapID}]));
  const bodyo = Object.assign(
    inBodyo,
    {
      x: 0, y: 0, z: 0,
      sphereOfInfluence: 10,
      orient: 90,
      shouldOrient: false,
      inputsList: [],
      outputsList: [],
      owner: 'EMPIRE',
      orbitPointsArr: [],
      orbitDivLine: [],
      primaryo: majObj[inBodyo.primary],
      id: id,
      render: false,
      renderer: undefined,
      mapID: mapID,
      shadow: true
    }
  );

  let drwr = undefined;
  if (bodyo.type === 'station') {
    bodyo.shadow = false;
    drwr = drawMap.drawStation(bodyo);
    bodyo.shouldOrient = true;
  } else {
    drwr = drawMap.drawBody(bodyo);
  }

  bodyo.renderer = function (drw = drwr) {
    advRenderer.normRend(mapID, drw);
  };


  ind.initInd(bodyo);

  let points = 128;
  if (bodyo.type === 'moon') {points = 32;}

  for (let i = 0; i < points; i++) {
    let currCoord = mech.kepCalc(bodyo, undefined, 's', ((i * 2 * PI) / points));

    bodyo.orbitPointsArr[i] = currCoord;

    if (i === 0) {
      bodyo.orbitDivLine[0] = currCoord;
    } else if (Math.abs(points/2 - i) < 1) {
      bodyo.orbitDivLine[1] = currCoord;
    }
  }

  return bodyo;
};
const iDerGenGen = (prefix) => {
  let id = 0;
  return () => {
    id += 1;
    return prefix + '-' + id;
  };
};
const craftNamer  = iDerGenGen('HULL');
const craftIDer   = iDerGenGen('C');
const bodyIDer    = iDerGenGen('O');
const rockIDer    = iDerGenGen('R');
const rockNamer   = iDerGenGen('ASTR');
function rand(mean, deviation, prec = 0, upper = Infinity, lower = 0) {
  let max = mean + deviation > upper ? upper : mean + deviation;
  let min = mean - deviation < lower ? lower : mean - deviation;

  return (
    ( Math.round(
      (Math.random() * (max - min) + min) * Math.pow(10, prec)
      ) / Math.pow(10, prec)
    )
  );
}
const rock = (belto) => {
  const id = rockIDer();
  const mapID = id + '-MID';
  advRenderer.appendRend('belts', (['g', {id: mapID}]));
  let rocko = {
    name: rockNamer(),
    id: id,
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
    x: 0, y: 0, z: 0,
    render: false,
    renderer: undefined,
    mapID: mapID
  };
  let drwr = drawMap.drawBody(rocko);
  rocko.renderer = function (drw = drwr) {
    advRenderer.normRend(mapID, drw);
  };

  return rocko;
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
const craftStart = (craftList) => {
  craftList.forEach(crafto => {
    ['x', 'y', 'z'].forEach(e => {
      crafto[e] = majObj[crafto.home][e];
    });
    crafto.lastStop = majObj[crafto.home];
  });
};
const orientOnPrimary = (bodyo) => {
  if (bodyo.shouldOrient) {
    bodyo.orient = (Math.atan2(bodyo.primaryo.y - bodyo.y, bodyo.primaryo.x - bodyo.x) * 180 / Math.PI) + 90;
    document.getElementById(bodyo.mapID + '-ORIENT').setAttribute(
      'transform', 'rotate(' + bodyo.orient + '), scale(1.5, 1.5)'
    );
  }
};
const makeManyCraft = (craftType, numberToMake, craftList, owner = undefined) => {
  for (let i = 0; i < numberToMake; i++) {
    const baseTemplate = hullTemps[craftType]();
    const name = craftNamer();
    const id = craftIDer();
    const mapID = id + '-MID';

    advRenderer.appendRend('crafts', (['g', {id: mapID}]));
    let newCrafto = craft.makeCraft(baseTemplate, name, id, owner);
    let drwr = drawMap.drawCraft(newCrafto);
    newCrafto.renderer = function (drw = drwr) {
      advRenderer.normRend(newCrafto.mapID, drw);
    };
    craftList.push(newCrafto);
    // mapPan.selectIDs[id] = newCrafto;
    console.log('Made ' + name + ' (' + id + ')');
  }
};
const changeElementTT = (id, x, y) => {
  document.getElementById(id).setAttribute(
    'transform', 'translate(' + x + ', ' + y + ')'
  );
};
const updatePan = (mapPan) => {
  // Update Pan here, who woulda guessed
  if ((mapPan.x != mapPan.xLast) || (mapPan.y != mapPan.yLast)) {
    changeElementTT('map', mapPan.x, mapPan.y);
    mapPan.xLast = mapPan.x;
    mapPan.yLast = mapPan.y;
    return true;
  }
  return false;
};
const updateZoom = (mapPan) => {
  // Updates Zoom (WHO WHOULDA THOUGHT?)
  if (mapPan.zoomChange != 0) {
    if (mapPan.zoom + mapPan.zoomChange < 1) {
      mapPan.zoom = 1;
    } else if (mapPan.zoom + mapPan.zoomChange > 20) {
      mapPan.zoom = 20;
    } else {
      mapPan.zoom += mapPan.zoomChange;
    }
    mapPan.x = mapPan.mousePosX + (mapPan.x - mapPan.mousePosX) * (mapPan.zoom / mapPan.zoomLast);
    mapPan.y = mapPan.mousePosY + (mapPan.y - mapPan.mousePosY) * (mapPan.zoom / mapPan.zoomLast);

    mapPan.zoomChange = 0;
    mapPan.zoomLast = mapPan.zoom;
    return true;
  }
  return false;
};
const updateMovingOrbits = (moons, mapPan) => {
  moons.forEach(bodyo => {
    let id = bodyo.id + '-MID-ORB';
    document.getElementById(id, changeElementTT(id, bodyo.primaryo.x * mapPan.zoom, bodyo.primaryo.y * mapPan.zoom));
  });
};
const mkRndr = (place) => {
  return renderer(document.getElementById(place));
};
const reDrawSimpOrbs = (stations) => {
  [...stations].forEach(e => {
    advRenderer.appendRend('simpleOrbits', (['g', {id: e.mapID + '-ORB'}]));
    advRenderer.normRend(e.mapID + '-ORB', drawMap.drawSimpleOrbit(e, mapPan));
  });
};
const main = async () => {
  console.log('Giant alien spiders are no joke!');
  console.log('Use \' Window.options \' to modify settings.');

  let stars = [];
  let planets = [];
  let moons = [];
  let asteroids = [];
  let indSites = [];
  let belts = [];
  let beltRocks = [];
  let stations = [];

  let craftList = [];

  let renderRateCounter     = undefined;
  const initRateRenderer = () => {
    renderRateCounter     = mkRndr('rateCounter');
  };

  let renderStatic          = mkRndr('content');
  renderStatic(drawMap.drawStatic());

  let renderStaticOrbits    = mkRndr('staticOrbits');
  let renderStars           = mkRndr('stars');
  let renderGrid            = mkRndr('grid');

  let rendererIntercept     = mkRndr('intercept');

  let rendererMovingOrbits  = mkRndr('movingOrbits');
  let renderScreenFrame     = mkRndr('screenFrame');
  let renderBoxSettings     = mkRndr('boxMainSettings');
  let renderGridScaleBar    = mkRndr('gridScaleBar');
  let renderRanges          = mkRndr('ranges');


  let sysObjects = {...majObj,...constructs};

  Object.keys(sysObjects).forEach(objName => {
    let theObj = sysObjects[objName];

    switch(theObj.type){
      case 'star': stars.push(makeStar(theObj)); break;
      case 'planet' : planets.push(makeBody(theObj)); break;
      case 'moon': moons.push(makeBody(theObj)); break;
      case 'asteroid': asteroids.push(makeBody(theObj)); break;
      case 'belt': belts.push(makeBelt(theObj)); break;
      case 'station': stations.push(makeBody(theObj)); break;
      default: console.log('ERROR at make. Skipping.');
    }

    if (theObj.industry) { indSites.push(theObj); }
  });

  belts.forEach(belt => {
    belt.rocks.forEach(rok => {
      beltRocks.push(rok);
    });
  });

  let movBod = [].concat(planets, moons, asteroids, stations);
  belts.forEach(e => (movBod = movBod.concat(e.rocks)));
  let rangeCandidates = [...planets, ...moons, ...asteroids];

  // makeManyCraft('menace', 1, craftList, 'Pirate');
  makeManyCraft('brick', 4, craftList);
  makeManyCraft('boulder', 4, craftList);
  makeManyCraft('mountain', 2, craftList);
  makeManyCraft('barlog', 1, craftList);

  // console.log(mapPan.selectIDs);

  craftStart(craftList);

  mapPan.x = getPageWidth() / 2;
  mapPan.y = getPageHeight() / 2;

  function reReRenderScaleBar(options, mapPan) {
    renderGridScaleBar(drawMap.drawGridScaleBar(options, mapPan));
  }
  const renderAllResizedStatics = (options, stars, planets, mapPan) => {
    renderStaticOrbits(drawMap.drawOrbits(planets, mapPan));
    renderStars(drawMap.drawStars(stars, mapPan));
    renderGrid(drawMap.drawGrid(mapPan, options, reReRenderScaleBar));
  };
  const updateRateCounter = (options) => {
    renderRateCounter(drawMap.drawRateCounter(options));
  };
  const interceptDraw = () => {
    rendererIntercept(drawMap.drawIntercepts(craftList, mapPan));
    mapPan.interceptUpdated = false;
  };
  const reRendScreenFrame = (mapPan, renderers) => {
    renderScreenFrame(drawMap.drawScreenFrame());
    ui.addFrameListeners(mapPan, renderers);
  };

  renderAllResizedStatics(options, stars, planets, mapPan);

  const resizeWindow = () => {
    document.getElementById('allTheStuff').setAttribute('width', getPageWidth());
    document.getElementById('allTheStuff').setAttribute('height', getPageHeight());
    document.getElementById('allTheStuff').setAttribute('viewBox',
      [0, 0, getPageWidth() + 1, getPageHeight() + 1].join(' ')
    );
    reRendScreenFrame(mapPan, renderers);
  };
  const placecheckBoxSettings = () => {
    if (mapPan.boxes.boxSettings) {
      renderBoxSettings(drawMap.drawBoxSettings());
      ui.addBoxSettingsListeners(mapPan, renderBoxSettings);
      ui.addRateListeners(options, updateRateCounter);
      initRateRenderer();
      updateRateCounter(options);
    }
    else {
      renderBoxSettings([]);
    }
  };
  let renderers = {
    resizeWindow: resizeWindow,
    boxSettings: placecheckBoxSettings
  };

  reRendScreenFrame(mapPan, renderers);
  reDrawSimpOrbs(stations);
  ui.addListeners(options, mapPan, renderers);

// <---------LOOP---------->
  let simpRate = 1 / 1000;

  let clockZero = performance.now();
  let currentTime = Date.now();

  rendererMovingOrbits(drawMap.drawMovingOrbits(moons, mapPan));
  const loop = () => {
    let time = performance.now();
    let timeDelta = time - clockZero;
    clockZero = time;

    if ( !(options.isPaused) ) {
      let workTime = (timeDelta * options.rate * simpRate);
      currentTime += workTime;

      movBod.forEach(bod => {
        bod.t = currentTime;
        let newData = mech.kepCalc(bod);
        ['x', 'y', 'z'].forEach(e => {bod[e] = newData[e];});
      });

      if (updateZoom(mapPan)) {
        mapPan.interceptUpdated = true;
        renderAllResizedStatics(options, stars, planets, mapPan);
        rendererMovingOrbits(drawMap.drawMovingOrbits(moons, mapPan));
        reDrawSimpOrbs(stations);
      }

      if (updatePan(mapPan)) {
        renderGrid(drawMap.drawGrid(mapPan, options, reReRenderScaleBar));
      }


      updateMovingOrbits(moons, mapPan);
      renderRanges(drawMap.drawRanges(rangeCandidates, mapPan));

      craftList.forEach(crafto => {
        craft.craftAI(crafto, indSites, craftList, workTime, stars[0], sysObjects, mapPan);
      });

      //render checker
      [
        ...planets,
        ...moons,
        ...asteroids,
        ...beltRocks,
        ...stations,
        ...craftList
      ].forEach(e => {
        const inBounds = boundsCheck(e.x * mapPan.zoom + mapPan.x, e.y * mapPan.zoom + mapPan.y, 30);

        if (!e.render && inBounds) {
          e.render = true;
          e.renderer();
        } else if (e.render && !inBounds) {
          e.render = false;
          e.renderer([]);
        } else if (e.render && inBounds) {
          changeElementTT(e.mapID, e.x * mapPan.zoom, e.y * mapPan.zoom);
        } else if (!e.render && !inBounds) {
          // do nothing
        } else {
          console.log('Unknown render state for:');
          console.log(e);
        }

        if (e.type === 'station' && e.primary !== 'prime') {
          advRenderer.normRend(e.mapID + '-ORB', drawMap.drawSimpleOrbit(e, mapPan));
          // console.log('here');
        }

        if (e.shadow && e.render) {
          // console.log('here');
          let angle = (Math.atan2(0 - e.y, 0 - e.x) * 180 / Math.PI) + 90;
          document.getElementById(e.mapID + '-SHAD').setAttribute(
            'transform', 'rotate(' + angle + ')'
          );
        }

        drawMap.updateCraft(e);
      });

      movBod.forEach(bod => {
        if (bod.render) {
          orientOnPrimary(bod);
        }
      });

      if (mapPan.interceptUpdated) {interceptDraw();}

      indSites.forEach(bodyo => {
        bodyo.industry.forEach(industyo => {
          ind.indWork(bodyo, industyo, workTime);
        });
      });
    }

    if (options.stop) {return;}

    setTimeout(loop, 1000/options.targetFrames);
  };
  loop();
};

window.onload = main;

},{"./advRenderer.js":1,"./constructs.json":2,"./craft.js":3,"./drawMap.js":4,"./hullTemp.js":6,"./industry.js":8,"./majorObjects2.json":12,"./mechanics.js":13,"./ui.js":17,"onml/renderer.js":14}],12:[function(require,module,exports){
module.exports={
  "prime": {
    "name": "Prime",
    "type": "star",
    "mass": 20000000000,
    "x": 0,
    "y": 0,
    "z": 0,
    "objectRadius": 15,
    "color": "#ff7800",
    "nopeZone": 30
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
    "e":    0.5,
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
    "name":     "Belt Prime",
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

},{}],13:[function(require,module,exports){
'use strict';
//The comments might all lies, don't trust them.

const cos   = Math.cos;
const sin   = Math.sin;
const PI    = Math.PI;
const sqrt  = Math.sqrt;

const kepCalc = (bodyo, time = bodyo.t, mode = 'n', mat  = 0) => {
  if(!bodyo){throw 'kepCalc() err: no bodyo given.';}

  let primaryo = bodyo.primaryo;

  let a    = bodyo.a;    // semi-major axis (a)
  let e    = bodyo.e;    // eccentricity (e)
  let t0   = bodyo.t0;   // epoch (days) (t0)
  let w    = bodyo.w;    // argument of periapsis (w)
  let lang = bodyo.lang; // longitude of ascention node (lang)
  let inc  = bodyo.inc;  // inclanation (inc)
  let maz  = bodyo.maz;
  // let focalShift = 0;
  // let maz  = bodyo.maz;  // mean anomaly at zero (maz)
  // time (days) (t)

  const calcMAT = () => {
    a = a * Math.pow(10, 9);
    const g = 6.674 * Math.pow(10, -11); // Gravitational constant G
    const mass = primaryo.mass * Math.pow(10, 20); // Central object mass, approximately sol
    const u = g * mass; // Standard gravitational parameter u

    // const calcMinorAxis = (a, e) => {return ( a * sqrt(1 - e * e) );};
    // const b = (calcMinorAxis(a, e)); // minorAxis b[m]

    // distance of focus from center
    // focalShift = ( sqrt(Math.pow(a, 2) - Math.pow(b, 2)) );

    // const epoch = t0; //epoch (given) (days)

    let tdiff = ( 86400 * ( time - t0 ) );
    mat = maz + ( tdiff * sqrt( u / Math.pow(a, 3) ) );
    while (mat < 0) {
      mat += PI * 2;
    }
    mat = mat % (PI * 2);
    // console.log(mat);
  };

  if (mode === 'n') {calcMAT();} // Mean Anomaly at Time

  // Kepler's Equasion: M = E - e * sin(E)= with M(at t) and e(ccentricity)

  const itter = 3;
  let eat = mat;
  for (let i = 0; i < itter; i++) {
    eat = eat - ( (eat - ( e * sin(eat) ) - mat) / ( 1 - e * cos(eat) ) );
  }

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

  let bodyCoords = {
    x: x,
    y: y,
    z: z
  };

  if (mode === 'n') {
    ['x', 'y', 'z'].forEach(e => {
      bodyCoords[e] = bodyCoords[e] / Math.pow(10, 9);
    });
  }

  let primaryCoords = {};

  if (primaryo.type !== 'star') {
    primaryCoords = kepCalc(primaryo, time);
  } else {
    primaryCoords = {
      x: primaryo.x,
      y: primaryo.y,
      z: primaryo.z
    };
  }

  return {
    // Cooridnates with origin on star
    x: bodyCoords.x + primaryCoords.x,
    y: bodyCoords.y + primaryCoords.y,
    z: bodyCoords.z + primaryCoords.z,
    // Coordinates of primary
    px: primaryo.x,
    py: primaryo.y,
    pz: primaryo.z,
    // Adjusted with origin on primary
    ax: bodyCoords.x,
    ay: bodyCoords.y,
    az: bodyCoords.z,

    // focalShift: focalShift
  };
};
const calcDist = (body1, body2) => {
  return sqrt(
            Math.pow( (body1.x - body2.x), 2 )
          + Math.pow( (body1.y - body2.y), 2 )
          + Math.pow( (body1.z - body2.z), 2 ) );
};
const calcDistSq = (body1, body2) => {
  return (  Math.pow( (body1.x - body2.x), 2 )
          + Math.pow( (body1.y - body2.y), 2 )
          + Math.pow( (body1.z - body2.z), 2 )
         );
};
const calcTravelTime = (dist, accel) => {
  return sqrt( dist / accel ) * 2;
};

exports.kepCalc = kepCalc;
exports.calcDist = calcDist;
exports.calcDistSq = calcDistSq;
exports.calcTravelTime = calcTravelTime;

},{}],14:[function(require,module,exports){
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

},{"./stringify.js":15}],15:[function(require,module,exports){
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

},{}],16:[function(require,module,exports){
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

},{}],17:[function(require,module,exports){
'use strict';

const addRateListeners = (options, updateRateCounter) => {
  document.getElementById('buttonStop').addEventListener('click', function () {
    options.rateSetting = 0;
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter(options);
  });
  document.getElementById('buttonSlow').addEventListener('click', function () {
    if (options.rateSetting > 0) {options.rateSetting--;}
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter(options);
  });
  document.getElementById('buttonFast').addEventListener('click', function () {
    if (options.rateSetting < options.simRates.length - 1) {options.rateSetting++;}
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter(options);
  });
  document.getElementById('buttonMax').addEventListener('click', function () {
    options.rateSetting = options.simRates.length - 1;
    options.rate = options.simRates[options.rateSetting];
    updateRateCounter(options);
  });
};
exports.addRateListeners = addRateListeners;
exports.addBoxSettingsListeners = (mapPan, renderBoxSettings) => {
  let boxSettingsSettings = {
    isDragging: false,
    xTransform: 40,
    yTransform: 10,
    xTransformPast: 0,
    yTransformPast: 0,
  };
  document.getElementById('boxMainSettings').setAttribute(
    'transform', 'translate(' + boxSettingsSettings.xTransform + ', ' + boxSettingsSettings.yTransform + ')'
  );
  document.getElementById('boxSettingsDragger').addEventListener('mousedown', e => {
    if (e.which === 1 || e.which === 3) {
      boxSettingsSettings.xTransformPast = e.offsetX;
      boxSettingsSettings.yTransformPast = e.offsetY;
      boxSettingsSettings.isDragging = true;
    }
  });
  document.getElementById('content').addEventListener('mousemove', e => {
    if (boxSettingsSettings.isDragging) {
      boxSettingsSettings.xTransform += e.offsetX - boxSettingsSettings.xTransformPast;
      boxSettingsSettings.yTransform += e.offsetY - boxSettingsSettings.yTransformPast;
      if (boxSettingsSettings.xTransform > document.body.clientWidth - 160) {boxSettingsSettings.xTransform = document.body.clientWidth - 160;}
      if (boxSettingsSettings.yTransform > document.body.clientHeight - 80) {boxSettingsSettings.yTransform = document.body.clientHeight - 80;}
      if (boxSettingsSettings.xTransform < 0) {boxSettingsSettings.xTransform = 0;}
      if (boxSettingsSettings.yTransform < 0) {boxSettingsSettings.yTransform = 0;}
      boxSettingsSettings.xTransformPast = e.offsetX;
      boxSettingsSettings.yTransformPast = e.offsetY;
      document.getElementById('boxMainSettings').setAttribute(
        'transform', 'translate(' + boxSettingsSettings.xTransform + ', ' + boxSettingsSettings.yTransform + ')'
      );
    }
  });
  window.addEventListener('mouseup', function () {
    boxSettingsSettings.isDragging = false;
  });
  document.getElementById('boxSettingsCloser').addEventListener('click', function () {
    mapPan.boxes.boxSettings = false;
    renderBoxSettings([]);
  });
};
exports.addFrameListeners = (mapPan, renderers) => {
  document.getElementById('buttonSettings').addEventListener('click', function () {
    if (mapPan.boxes.boxSettings === false) {
      mapPan.boxes.boxSettings = true;
      renderers.boxSettings();
    } else {
      mapPan.boxes.boxSettings = false;
      renderers.boxSettings();
    }
  });
};
exports.addListeners = (options, mapPan, renderers) => {
  const checkKey = (e) => {
    if      (e.keyCode == '38') {/* up arrow */     mapPan.y += options.keyPanStep;}
    else if (e.keyCode == '40') {/* down arrow */   mapPan.y -= options.keyPanStep;}
    else if (e.keyCode == '37') {/* left arrow */   mapPan.x += options.keyPanStep;}
    else if (e.keyCode == '39') {/* right arrow */  mapPan.x -= options.keyPanStep;}
  };
  function pause() { options.isPaused = true; console.log('|| Paused');}
  function play() { options.isPaused = false; console.log('>> Unpaused');}

  window.addEventListener('blur', pause);
  window.addEventListener('focus', play);
  window.addEventListener('resize', function() {renderers.resizeWindow();});

  document.onkeydown = checkKey;
  let isPanning = false;
  let pastOffsetX = 0;
  let pastOffsetY = 0;
  document.getElementById('content').addEventListener('mousedown', e => {
    if (e.which === 3) {
      pastOffsetX = e.offsetX;
      pastOffsetY = e.offsetY;
      isPanning = true;
    }
  });
  document.getElementById('content').addEventListener('mousemove', e => {
    if (isPanning) {
      mapPan.x += e.offsetX - pastOffsetX;
      mapPan.y += e.offsetY - pastOffsetY;
      pastOffsetX = e.offsetX;
      pastOffsetY = e.offsetY;
    }
    mapPan.mousePosX = e.offsetX;
    mapPan.mousePosY = e.offsetY;
  });
  window.addEventListener('mouseup', function () {
    isPanning = false;
  });
  document.getElementById('content').addEventListener('wheel', function (e) {
    const zoomStep = 10**(0.05*mapPan.zoom)-1;
    mapPan.cursOriginX = e.offsetX - mapPan.x;
    mapPan.cursOriginY = e.offsetY - mapPan.y;
    if (e.deltaY < 0) {
      mapPan.zoomChange += zoomStep;
    }
    if (e.deltaY > 0) {
      mapPan.zoomChange -= zoomStep;
    }
  }, {passive: true});
  // document.
};

},{}]},{},[11]);
