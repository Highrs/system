(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
'use strict';
const mech = require('./mechanics.js');
const ind = require('./industry.js');
// const drawMap = require('./drawMap.js');

// Bezier Curve:
// B(t) = (1-t) * ((1-t) * p0 + t * p1) + t * ((1-t) * p1 + t * p2)

const hullNamer = () => {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
};
const namer = hullNamer();
const makeCraft = (crafto) => {
  const id = namer();
  const initWait = id % 10;
  let newCrafto = {};
  Object.assign(
    newCrafto,
    crafto,
    {
      name: id,
      id: id,
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
      owner: 'EMPIRE',
      waitCycle: 0 + initWait
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
  crafto.course = (Math.atan2(intercepto.py, intercepto.px) * 180 / Math.PI) - 90;
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
    // console.log('here');
    // rendererIntercept(drawMap.drawIntercepts(listOfcraft, mapPan));
    mapPan.interceptUpdated = true;
  }
};
const calcFuelNeeded = (crafto, routeArr = []) => {
  if (routeArr.length === 0) { return 0; }
  let projectedFuelUse = 0;
  let counter = 0;
  let lastEl = {};
  routeArr.forEach(e => {
    // console.log(e);
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

  // console.log(distST);

  if (distCT > distCI) {return Infinity;} else {return distST;}

};

exports.makeCraft = makeCraft;
exports.craftAI = craftAI;

},{"./industry.js":7,"./mechanics.js":12}],3:[function(require,module,exports){
'use strict';
// const majObj = require('./majorObjects2.json');
const getSvg = require('./get-svg.js');
const tt = require('onml/tt.js');
const mech = require('./mechanics.js');
const icons = require('./icons.js');
const lists = require('./lists.js');

const PI = Math.PI;
function getPageWidth() {
  return document.body.clientWidth;
}
function getPageHeight() {
  return document.body.clientHeight;
}

// const drawPolarGrid = (staro) => {
//   let polarGrid = ['g', tt(staro.x, staro.y)];
//
//   for (let i = 1; i < 5; i++) {
//     polarGrid.push(['circle', {r: 150 * i, class: 'grid'}]);
//     for (let j = 0; j < 16; j++) {
//       polarGrid.push(['line', {
//         transform: 'rotate(' + ((360 / 16) * j) +')',
//         x1: 150 * i + 15,
//         x2: 150 * i - 5,
//         class: 'grid'}]);
//     }
//   }
//   return polarGrid;
// };

const drawGrid = (staro, mapPan) => {
  let grid = ['g', {}];
  let crossSize = 5 * mapPan.zoom;
  if (crossSize < 1) {crossSize = 1;}

  for (let x = 0 + staro.x%100; ((x <= getPageWidth()) && (x <= 1000 * mapPan.zoom)); x += 100 * mapPan.zoom) {
    for (let y = 0 + staro.y%100; ((y <= getPageHeight()) && (y <= 1000 * mapPan.zoom) ); y += 100 * mapPan.zoom) {
      grid.push(
        icons.gridCross(crossSize,  x,  y),
        icons.gridCross(crossSize, -x,  y),
        icons.gridCross(crossSize,  x, -y),
        icons.gridCross(crossSize, -x, -y)
      );
    }

    grid.push(
      ['line', {
        x1: staro.x,
        y1: x + 10 * mapPan.zoom,
        x2: staro.x,
        y2: x + 90 * mapPan.zoom,
        class: 'grid'}],
      ['line', {
        x1: x + 10 * mapPan.zoom,
        y1: staro.y,
        x2: x + 90 * mapPan.zoom,
        y2: staro.y,
        class: 'grid'}],
    );
  }

  return grid;
};
exports.drawGrid = drawGrid;
const drawOrbits = (bodies, mapPan) => {
  if (bodies.length < 1) {return ['g', {}];}

  let divline1;
  let divline2;
  let retGroup = ['g', {}];

  bodies.forEach(bodyo => {
    let coords = 'M ';
    let points = 128;
    if (bodyo.type === 'moon') {
      points = 32;
    }

    for (let i = 0; i < points; i++) {
      let currCoord = mech.kepCalc(bodyo, undefined, 's', ((i * 2 * PI) / points));
      currCoord.x = currCoord.x * mapPan.zoom;
      currCoord.y = currCoord.y * mapPan.zoom;
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
        class: 'orbitDivLine'
      }]);
    retGroup.push(
      ['g', tt(divline1.x, divline1.y),
        icons.apsis('-')
      ],
      ['g', tt(divline2.x, divline2.y),
        icons.apsis()
      ]
    );
  });

  return retGroup;
};
exports.drawOrbits = drawOrbits;
// const drawSimpleOrbit = (stations, mapPan) => {
//   if (stations.length < 1) {return ['g', {}];}
//
//   let retGroup = ['g', {}];
//
//   for (let i = 0; i < stations.length; i++) {
//     retGroup.push(
//       ['g', tt(stations[i].px, stations[i].py), [
//         'circle',
//         {
//           r : stations[i].a * mapPan.zoom,
//           class: 'minorOrbit'
//         }
//       ]]
//     );
//   }
//
//   return retGroup;
// };
// const drawIndustryData = (body) => {
//   let display = ['g', tt(10, -10)];
//
//   display.push(
//     ['text', {
//       x: 0,
//       y: 6,
//       class: 'dataText'
//     }, 'IND:'],
//     ['text', {
//       x: 0,
//       y: (body.industry.length + 2) * 6,
//       class: 'dataText'
//     }, 'STORE:']
//   );
//
//   body.industry.forEach((e, idx) => {
//     display.push(
//       ['g', tt(0, 6),
//         ['text', {
//           x: 2,
//           y: (idx + 1) * 6,
//           class: 'dataText'
//         }, e.abr +":" + e.status]
//       ]
//     );
//   });
//   Object.keys(body.store).forEach((e, idx) => {
//     display.push(
//       ['g', tt(0, 6),
//         ['text', {x: 2,
//           y: (body.industry.length + idx + 2) * 6,
//           class: 'dataText'}, e.toUpperCase() + ':' + body.store[e].toFixed(0)
//         ]
//       ]
//     );
//   });
//
//   return display;
// };
const drawBodyData = (bodyo) => {
  let dataDisp = ['g', {}];

  dataDisp.push(
    ['path', {d: 'M 0,0 L 10, -10 L 25, -10', class: 'dataLine'}],
    ['text', {x: 10, y: -11, class: 'dataText'}, bodyo.name]
    // ['text', {x: 10, y: 2, class: 'dataText'},
    //   (bodyo.x).toFixed(0) + ',' +
    //   (bodyo.y).toFixed(0) + ',' +
    //   (bodyo.z).toFixed(0)
    // ]
  );

  // if (bodyo.industry) { dataDisp.push(drawIndustryData(bodyo)); }

  return dataDisp;
};
const drawBodies = (bodies, options, mapPan) => {
  if (bodies.length < 1) {return ['g', {}];}
  const bodiesDrawn = ['g', {}];
  bodies.forEach (bodyo =>{
    let partBody = ['g', tt(bodyo.x * mapPan.zoom, bodyo.y * mapPan.zoom)];
    if (
      options.planetData
    ) {
      partBody.push(
        drawBodyData(bodyo),
      );
    }

    partBody.push(
      icons.body(bodyo, mapPan)
    );
    bodiesDrawn.push(partBody);
  });
  return bodiesDrawn;
};
const drawStations = (stations, options, mapPan) => {
  if (stations.length < 1) {return ['g', {}];}
  const stationsDrawn = ['g', {}];
  stations.forEach(stationo => {
    for (let i = 0; i < stations.length; i++) {
      let partStation = ['g', tt((stationo.x * mapPan.zoom), (stationo.y * mapPan.zoom))];
      if (
        options.planetData
      ) {
        partStation.push(
          ['g', {}, drawBodyData(stationo),]
        );
      }

      partStation.push(
        icons.station(stationo)
      );
      stationsDrawn.push(partStation);
    }
  });


  return stationsDrawn;
};
const drawBelts = (belts, mapPan) => {
  let rocksDrawn = ['g', {}];

  belts.forEach(e => {
    e.rocks.forEach(rocko => {
      rocksDrawn.push(
        ['g', tt(rocko.x * mapPan.zoom, rocko.y * mapPan.zoom), icons.body(rocko, mapPan)]
      );
    });
  });

  return rocksDrawn;
};
// const drawHeader = (clock, options) => {
//   if (options.header) {
//     let header = ['g', tt(10, 20)];
//
//     for (let i = 0; i < lists.toDo().length; i++) {
//       let hShift = lists.toDo()[i][0] === '-' ? 10 : 0;
//       header.push(['g', tt( hShift,  10 * i), [ 'text', {class: 'dataText'}, lists.toDo(clock)[i] ]],);
//     }
//
//     return header;
//   }
//   if (options.headerKeys) {
//     let keys = ['g', tt(10, 20)];
//
//     for (let i = 0; i < lists.keys().length; i++) {
//       let hShift = lists.keys()[i][0] === '-' ? 10 : 0;
//       keys.push(['g', tt( hShift,  10 * i), [ 'text', {class: 'dataText'}, lists.keys(clock)[i] ]],);
//     }
//
//     return keys;
//   }
//   return;
//
// };
const drawStars = (stars, mapPan) =>{
  let drawnStars = ['g', {}];
  stars.forEach((staro) => {
    drawnStars.push(icons.star(staro, mapPan));
    // drawnStars.push(drawPolarGrid(staro));
  });
  return drawnStars;
};
exports.drawStars = drawStars;
const drawCraftData = (crafto) =>{
  let drawnData = ['g', {}];

  drawnData.push(
    ['path', {d: 'M 0,0 L 10, -10 L 25, -10', class: 'dataLine'}],
    ['text', {x: 10, y: -11, class: 'dataText'}, crafto.name + ' ' + crafto.abr],
    // ['text', {x: 10, y: -4, class: 'dataText'}, 'F:' + ((crafto.fuel / crafto.fuelCapacity) * 100).toFixed(0) + '%']
  );

  // let offset = 0;
  // Object.keys(crafto.cargo).forEach(specCargo => {
  //   if (crafto.cargo[specCargo] > 0) {
  //     drawnData.push(
  //       ['text', {x: 10, y: 8 * offset, class: 'dataText'}, specCargo + ':' + crafto.cargo[specCargo]]
  //     );
  //     offset++;
  //   }
  // });

  return drawnData;
};
const drawCraft = (listOfCraft, options, mapPan) => {
  let drawnCraft = ['g', {}];

  listOfCraft.forEach(crafto => {
    if (crafto.status === 'traveling' || crafto.status === 'drifting') {
      let partCraft = ['g', tt((crafto.x * mapPan.zoom), (crafto.y * mapPan.zoom))];

      // Accel Indicator
      partCraft.push(
        icons.thrustVector(crafto)
      );

      // Vector Line
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

      // Data Display
      if (options.craftData) { partCraft.push(drawCraftData(crafto)); }

      // Craft Icon Itself
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
const drawRanges = (bodyArr, mapPan) => {
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
          tt((((bodyArr[j].x) + (bodyArr[i].x)) / 2 - 11) * mapPan.zoom,
            (((bodyArr[j].y) + (bodyArr[i].y)) / 2 - 2.25) * mapPan.zoom),
            ['rect', {
              width: 22,
              height: 6.5,
              class: 'rangeWindow'
            }],
            ['text', {
              x: 1,
              y: 5,
              class: 'rangeText'}, (dist).toFixed(2)]
          ]);
        }
      }
    }
  }
  rangesDrawn.push(linesDrawn, windowsDrawn);

  return rangesDrawn;
};
// const drawMovingOrbits = (moons, mapPan) => {
//   return ['g', {}, drawOrbits(moons, mapPan)];
// };
const drawScreenFrame = (options) => {
  let frame = ['g', {}];

    if (options.headerKeys) {
      let keys = ['g', tt(20, 6)];

      for (let i = 0; i < lists.keys().length; i++) {
        let hShift = lists.keys()[i][0] === '-' ? 10 : 0;
        keys.push(['g', tt( hShift,  10 * i), [ 'text', {class: 'dataText'}, lists.keys()[i] ]],);
      }

      frame.push(keys);
    }

  frame.push( ['g', {},
    ['path',
      { d: 'M 40, 20 L 20, 20 L 20, 40',
      class: 'frame' }],
    ['path',
      { d: 'M ' + (getPageWidth() - 40) + ', 20 L ' + (getPageWidth() - 20) + ', 20 L ' + (getPageWidth() - 20) + ', 40',
      class: 'frame' }],
    ['path',
      { d: 'M ' + (getPageWidth() - 40) + ', ' + (getPageHeight() - 20) + ' L ' + (getPageWidth() - 20) + ', ' + (getPageHeight() - 20) + ' L ' + (getPageWidth() - 20) + ', ' + (getPageHeight() - 40) + '',
      class: 'frame' }],
    ['path',
      { d: 'M 40, ' + (getPageHeight() - 20) + ' L 20, ' + (getPageHeight() - 20) + ' L 20, ' + (getPageHeight() - 40) + '',
      class: 'frame' }]
  ]);

  return frame;
};

exports.drawMoving = (options, clock, planets, moons, ast, belts, craft, stations, rendererMovingOrbits, mapPan) => {
  let rangeCandidates = [...planets, ...moons, ...ast];

  // rendererMovingOrbits(drawMovingOrbits(moons, mapPan));

  return ['g', {},
    // drawHeader(clock, options),
    drawBelts(belts, mapPan),
    // drawSimpleOrbit(stations, mapPan),
    drawRanges(rangeCandidates, mapPan),
    drawBodies(moons, options, mapPan),
    drawBodies(planets, options, mapPan),
    drawBodies(ast, options, mapPan),
    drawStations(stations, options, mapPan),
    drawCraft(craft, options, mapPan)
  ];
};
exports.drawIntercepts = (listOfcraft, mapPan) => {
  let intercepts = ['g', {}];

  listOfcraft.forEach(crafto => {
    if (crafto.intercept && (crafto.status === 'traveling')) {
      intercepts.push(['g', tt(crafto.intercept.x * mapPan.zoom, crafto.intercept.y * mapPan.zoom), icons.marker()]);
    }
  });

  return intercepts;
};
exports.drawStatic = (options, stars) => {
  return getSvg({w:getPageWidth(), h:getPageHeight()}).concat([
    ['defs',
      ['radialGradient', {id: "RadialGradient1", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "0%", 'stop-color': stars[0].color, 'stop-opacity': 0.5 }],
        ['stop', {offset: "100%", 'stop-color': "#363636", 'stop-opacity':    0 }]
      ],
      ['radialGradient', {id: "RadialGradient2", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': "#000000", 'stop-opacity':   0.25 }],
        ['stop', {offset: "50%", 'stop-color': "#000000", 'stop-opacity':   0.1 }],
        ['stop', {offset: "100%", 'stop-color': "#363636", 'stop-opacity':  0 }]
      ],
      ['radialGradient', {id: "RadialGradient3", cx: 0.5, cy: 0.5, r: .5, fx: 0.5, fy: 0.5},
        ['stop', {offset: "25%", 'stop-color': stars[0].color, 'stop-opacity':  1 }],
        ['stop', {offset: "35%", 'stop-color': stars[0].color, 'stop-opacity':  0.3 }],
        ['stop', {offset: "50%", 'stop-color': stars[0].color, 'stop-opacity':  0.1 }],
        ['stop', {offset: "100%", 'stop-color': stars[0].color, 'stop-opacity': 0 }]
      ]
    ],
    ['g', {id: 'map'},
      ['g', {id: 'staticOrbits'}],
      // ['g', {id: 'movingOrbits'}],
      ['g', {id: 'stars'}],
      ['g', {id: 'grid'}],
      ['g', {id: 'moving'}],
      ['g', {id: 'intercept'}]
    ],
    ['g', {},
      drawScreenFrame(options)
    ],
  ]);
};

},{"./get-svg.js":4,"./icons.js":6,"./lists.js":9,"./mechanics.js":12,"onml/tt.js":15}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
module.exports = {

  brick: () => ({
    class: 'Brick',
    abr: 'BRK',
    cargoCap: 10,
    fuelCapacity: 10,
    fuelConsumption: 0.1,
    accel: 3,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    abr: 'BLD',
    cargoCap: 20,
    fuelCapacity: 20,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    abr: 'MNT',
    cargoCap: 30,
    fuelCapacity: 30,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  }),

  barlog: () => ({
    class: 'Barlog',
    abr: 'BRL',
    cargoCap: 40,
    fuelCapacity: 40,
    fuelConsumption: 0.1,
    accel: 2,
    home: 'beta'
  })

};

},{}],6:[function(require,module,exports){
const tt = require('onml/tt.js');

module.exports = {

  body: (bodyo, mapPan) => {
    let tempBod = ['g', {}];

    if (bodyo.industry) {
      tempBod.push(
        ['circle', {
          r: bodyo.sphereOfInfluence * mapPan.zoom,
          class: 'bodyZone'
        }]
      );
    }

    tempBod.push(
      ['circle', {
        r: bodyo.objectRadius * 4,
        fill: "url(#RadialGradient2)"
      }],
      ['g', {},
        ['circle', {
          r: bodyo.objectRadius,
          class: bodyo.industry?'majorObject':'minorObject'
        }]
      ]
    );

    return tempBod;
  },

  star: (staro, mapPan) => {
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

  intercept: (x, y) => (
    ['g', tt(x, y),
      ['path', {d: 'M  5, 3 L  2, 2 L  3, 5 L  5, 5 Z', class: 'gridBold'}],
      ['path', {d: 'M  5,-3 L  2,-2 L  3,-5 L  5,-5 Z', class: 'gridBold'}],
      ['path', {d: 'M -5, 3 L -2, 2 L -3, 5 L -5, 5 Z', class: 'gridBold'}],
      ['path', {d: 'M -5,-3 L -2,-2 L -3,-5 L -5,-5 Z', class: 'gridBold'}]
    ]
  ),

  marker: () => (
    ['g', {},
      ['path', {d: 'M  3, 3 L  1, 1', class: 'gridBold'}],
      ['path', {d: 'M  3,-3 L  1,-1', class: 'gridBold'}],
      ['path', {d: 'M -3, 3 L -1, 1', class: 'gridBold'}],
      ['path', {d: 'M -3,-3 L -1,-1', class: 'gridBold'}],
      ['circle',{r: 1, class: 'gridBold'}]
    ]
  ),

  apsis: (m = '') => (
    ['g', {},
      ['path', {
        d: 'M -2,'+m+'5 L 0,0 L 2,'+m+'5 Z',
        class: 'symbolLine'
      }]
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

    return ['path', {
      transform: 'rotate( ' + (crafto.accelStat === 1 ? 0 : 180) + ')',
      d: iconString,
      class: 'craft'
    }];
  },

  station: (stationo) => {
    let retStat = ['g', {}];

    const icono = {
      extractor:
'M 2,2 L 6,0 L 2,-2 L 0,-8 L -2,-2 L -6,0 L -2,2 Z M -8,-1 L -7,0 L -6,0 M 8,-1 L 7,0 L 6,0',
      small:
'M 1,4 L 3, 0 L 1,-4 L -1,-4 L -3,0 L -1,4 Z M 0,7 L 0, 4 M 0,-10 L 0,-4'
    };

    let iconString =
      icono[stationo.size] ?
      icono[stationo.size] :
      'M 0,3 L 3,0 L 0,-3 L -3,0 Z';

    if (stationo.industry) {
      retStat.push(
        ['circle', {
          r: stationo.sphereOfInfluence,
          class: 'bodyZone'
        }]
      );
    }

    retStat.push(
      ['path', {
        transform: 'rotate(' + stationo.orient + ')',
        d: iconString,
        class: 'station'
      }]
    );

    return retStat;
  },

  thrustVector: (crafto) => {
    let drawnVector = ['g', {
      transform: 'rotate(' + (crafto.accelStat === 1 ? crafto.course : crafto.course + 180) + ')'
    }];

    drawnVector.push(
      ['path', {
        d: 'M 0,0 L -1, '+(-crafto.accel*4)+' L 1, '+(-crafto.accel*4)+' Z',
        class: 'vector'
      }],
    );

    return drawnVector;
  },

  gridCross: (crossSize, x, y) => {
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
  }
};

},{"onml/tt.js":15}],7:[function(require,module,exports){
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

},{"./industryTemp.js":8}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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
    "RMB + Drag to pan.",
    "Scroll to zoom"
  ];},

};

},{}],10:[function(require,module,exports){
'use strict';
const renderer = require('onml/renderer.js');
const drawMap = require('./drawMap.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hullTemps = require('./hullTemp.js');
const constructs = require('./constructs.json');
const craft = require('./craft.js');
const majObj = require('./majorObjects2.json');

const makeStar = (staro) => {
  return staro;
};
const makeBody = (inBodyo) => {
  // const bodyDat = mech.kepCalc(bodyo, 0);
  const bodyo = Object.assign(
    inBodyo,
    {
      // focalShift: bodyDat.focalShift,
      x: 0, y: 0, z: 0,
      sphereOfInfluence: 10,
      orient: 90,
      inputsList: [],
      outputsList: [],
      owner: 'EMPIRE',
      orbitPointsArr: []
    }
  );
  ind.initInd(bodyo);
  return bodyo;
};
const rockNamer = () => {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
};
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
  return {
    name: rockNamer(),
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
const craftStart = (craftList) => {
  craftList.forEach(crafto => {
    ['x', 'y', 'z'].forEach(e => {
      crafto[e] = majObj[crafto.home][e];
    });
    crafto.lastStop = majObj[crafto.home];
  });
};
const orientOnSun = (bodyo, newData) => {
  if (bodyo.orient) {
    ['x', 'y', 'z'].forEach(e => {bodyo['p' + e] = newData['p' + e];});
    bodyo.orient = (Math.atan2(bodyo.py - bodyo.y, bodyo.px - bodyo.x) * 180 / Math.PI) + 90;
  }
};
const makeManyCraft = (craftType, numberToMake, craftList) => {
  for (let i = 0; i < numberToMake; i++) {
    const baseTemplate = hullTemps[craftType]();
    craftList.push(craft.makeCraft(baseTemplate));
  }
};
Window.options = {
  rate: 2,
  targetFrames: 30,
  header: false,
  headerKeys: true,
  planetData: true,
  craftData: true,
  stop: false,
  intercepts: true
};
const options = Window.options;
const main = async () => {
  console.log('Giant alien spiders are no joke!');
  console.log('V 0.1.006');
  console.log('Use \' Window.options \' to modify settings.');

  let stars = [];
  let planets = [];
  let moons = [];
  let asteroids = [];
  let indSites = [];
  let belts = [];
  let stations = [];

  let craftList = [];

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

  let movBod = [];
  movBod = movBod.concat(planets, moons, asteroids, stations);
  belts.forEach(e => (movBod = movBod.concat(e.rocks)));

  makeManyCraft('brick', 8, craftList);
  makeManyCraft('boulder', 4, craftList);
  makeManyCraft('mountain', 2, craftList);
  makeManyCraft('barlog', 1, craftList);

  craftStart(craftList);

  let isPaused = false;
  function pause() { isPaused = true; console.log('|| Paused');}
  function play() { isPaused = false; console.log('>> Unpaused');}

  window.addEventListener('blur', pause);
  window.addEventListener('focus', play);

  const updateMap = () => {console.log('Resized.');};

  window.addEventListener('resize', updateMap);

  let simpRate = 1 / 1000;

  let clockZero = performance.now();
  let currentTime = Date.now();

  let mapPan = {
    x: document.body.clientWidth / 2,
    y: document.body.clientHeight / 2,
    xLast: 0,
    yLast: 0,
    zoom: 1,
    zoomLast: 1,
    cursOriginX: 0,
    cursOriginY: 0,
    zoomChange: 0,
    interceptUpdated: false
  };

  const renderStatic          = renderer(document.getElementById('content'));
  renderStatic(drawMap.drawStatic(options, stars));
  const renderStaticOrbits    = renderer(document.getElementById('staticOrbits'));
  const renderStars           = renderer(document.getElementById('stars'));
  const renderGrid            = renderer(document.getElementById('grid'));
  const renderMoving          = renderer(document.getElementById('moving'));
  const rendererIntercept     = renderer(document.getElementById('intercept'));
  const rendererMovingOrbits  = renderer(document.getElementById('movingOrbits'));

  const render = (options, stars, planets, mapPan) => {
    // renderStatic(drawMap.drawStatic(options, stars));
    renderStaticOrbits(drawMap.drawOrbits(planets, mapPan));
    renderStars(drawMap.drawStars(stars, mapPan));
    renderGrid(drawMap.drawGrid(stars[0], mapPan));
  };

  render(options, stars, planets, mapPan);

  const updatePan = (mapPan) => {
    // Update Pan here

    // if (mapPan.x > document.body.clientWidth) {mapPan.x = document.body.clientWidth;}
    // if (mapPan.x < 0) {mapPan.x = 0;}
    // if (mapPan.y > document.body.clientHeight) {mapPan.y = document.body.clientHeight;}
    // if (mapPan.y < 0) {mapPan.y = 0;}

    if ((mapPan.x != mapPan.xLast) || (mapPan.y != mapPan.yLast)) {
      document.getElementById('map').setAttribute(
        'transform', 'translate(' + mapPan.x + ', ' + mapPan.y + ')'
      );
      mapPan.xLast = mapPan.x;
      mapPan.yLast = mapPan.y;
    }
  };

  const updateZoom = (mapPan) => {
    // Update Zoom here
    if (mapPan.zoom != mapPan.zoomLast) {

      if (mapPan.zoom < 0.3) {
        mapPan.zoom = 0.3;
      } else {
        mapPan.x -= (mapPan.cursOriginX * (mapPan.zoomChange));
        mapPan.y -= (mapPan.cursOriginY * (mapPan.zoomChange));
      }
      mapPan.zoomLast = mapPan.zoom;
      // console.log('here');
      return true;
    }
    return false;
  };



  document.getElementById('content').addEventListener('click', function () {console.log('Click!');});
  document.onkeydown = checkKey;
  function checkKey(e) {
    if      (e.keyCode == '38') {/* up arrow */     mapPan.y += 10;}
    else if (e.keyCode == '40') {/* down arrow */   mapPan.y -= 10;}
    else if (e.keyCode == '37') {/* left arrow */   mapPan.x += 10;}
    else if (e.keyCode == '39') {/* right arrow */  mapPan.x -= 10;}
  }

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
    if (isPanning === true) {
      mapPan.x += e.offsetX - pastOffsetX;
      mapPan.y += e.offsetY - pastOffsetY;
      pastOffsetX = e.offsetX;
      pastOffsetY = e.offsetY;
    }
  });
  window.addEventListener('mouseup', function () {
    isPanning = false;
  });

  document.getElementById('content').addEventListener('wheel', function (e) {
    const zoomStep = 0.05;
    mapPan.cursOriginX = e.offsetX - mapPan.x;
    mapPan.cursOriginY = e.offsetY - mapPan.y;
    if (e.deltaY < 0) {
      // console.log('Zooming in ... ' + e.offsetX + ' ' + e.offsetY);
      mapPan.zoom += zoomStep;
      mapPan.zoomChange = zoomStep;
    }
    if (e.deltaY > 0) {
      // console.log('Zooming out... ' + e.offsetX + ' ' + e.offsetY);
      mapPan.zoom -= zoomStep;
      mapPan.zoomChange = -zoomStep;
    }
    // updateZoom(mapPan);
  }, {passive: true});



// <---------LOOP---------->

  const loop = () => {
    let time = performance.now();
    let timeDelta = time - clockZero;
    clockZero = time;

    if ( !isPaused ) {
      let workTime = (timeDelta * options.rate * simpRate);
      currentTime += workTime;

      for (let i = 0; i < movBod.length; i++) {
        movBod[i].t = currentTime;
        let newData = mech.kepCalc(movBod[i]);
        ['x', 'y', 'z'].forEach(e => {movBod[i][e] = newData[e];});
        orientOnSun(movBod[i], newData);
      }

      if ((mapPan.zoom != mapPan.zoomLast) || (mapPan.interceptUpdated)) {
        rendererIntercept(drawMap.drawIntercepts(craftList, mapPan));
        mapPan.interceptUpdated = false;
      }

      if (updateZoom(mapPan)) render(options, stars, planets, mapPan);
      updatePan(mapPan);

      renderMoving(
        drawMap.drawMoving(options, Date(currentTime), planets, moons, asteroids, belts,
        craftList, stations, rendererMovingOrbits, mapPan)
      );

      craftList.forEach(crafto => {
        craft.craftAI(crafto, indSites, craftList, workTime, stars[0], sysObjects, mapPan);
      });

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

},{"./constructs.json":1,"./craft.js":2,"./drawMap.js":3,"./hullTemp.js":5,"./industry.js":7,"./majorObjects2.json":11,"./mechanics.js":12,"onml/renderer.js":13}],11:[function(require,module,exports){
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
    "e":    .5,
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

},{}],12:[function(require,module,exports){
'use strict';
const majObj = require('./majorObjects2.json');

const cos   = Math.cos;
const sin   = Math.sin;
const PI    = Math.PI;
const sqrt  = Math.sqrt;

const kepCalc = (bodyo, time = bodyo.t, mode = 'n', mat  = 0) => {
  if(!bodyo){throw 'kepCalc() err: no bodyo given.';}

  let primaryo = majObj[bodyo.primary];

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
    x: bodyCoords.x + primaryCoords.x,
    y: bodyCoords.y + primaryCoords.y,
    z: bodyCoords.z + primaryCoords.z,
    px: primaryo.x,
    py: primaryo.y,
    pz: primaryo.z
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

},{"./majorObjects2.json":11}],13:[function(require,module,exports){
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

},{"./stringify.js":14}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
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

},{}]},{},[10]);
