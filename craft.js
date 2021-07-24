'use strict';
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const drawMap = require('./drawMap.js');

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
const craftAI = (crafto, indSites, rendererIntercept, listOfcraft, timeDelta, staro, sysObjects) => {
  switch(crafto.status) {
    case 'new':
      updateParking(crafto, sysObjects[crafto.home]);
      crafto.status = 'parked';
      break;
    case 'parked':
      if (attemptSearchChecker(crafto, timeDelta)) {
        tryToMakeRoute(crafto, indSites, staro, rendererIntercept, listOfcraft);
      }
      break;
    case 'traveling':
      calcActiveMotion(crafto, crafto.intercept, timeDelta);
      checkProxToTarget(crafto, listOfcraft, staro, rendererIntercept);
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
  if (crafto.fuel <= 0) {crafto.status = 'drifting';}
};
const calcDriftMotion = (crafto, timeDelta) => {
  // timeDelta passed down in SECONDS not ms
  ['x', 'y', 'z'].forEach(e => {
    crafto[e] += crafto['v' + e] * timeDelta;
  });
};
const checkProxToTarget = (crafto, listOfcraft, staro, rendererIntercept) => {
  let tsoi = crafto.route[0].location.sphereOfInfluence;
  if (
    mech.calcDistSq(crafto, crafto.route[0].location) < tsoi * tsoi
  ) {
    fullStop(crafto);
    ind.transfCraftCargo(crafto);
    crafto.lastStop = crafto.route[0].location;
    crafto.route.shift();
    if (crafto.route.length === 0) {
      crafto.status = 'parked';
    } else {
      crafto.intercept = calcIntercept(crafto, crafto.route[0].location, staro);
    }
    rendererIntercept(drawMap.drawIntercepts(listOfcraft));
  }
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
const tryToMakeRoute = (crafto, indSites, staro, rendererIntercept, listOfcraft) => {
  crafto.intercept = {};
  if (!deviseRoute(crafto, indSites, staro)) {
    crafto.status = 'parked';
    ['x', 'y', 'z'].forEach(e => {
      crafto[e] = crafto.lastStop[e];
      crafto['v' + e] = 0;
    });
  } else {
    // console.log('here');
    rendererIntercept(drawMap.drawIntercepts(listOfcraft));
  }
};
const enoughFuelCheck = (crafto) => {
  if (
    crafto.fuel < crafto.fuelConsumption * 30
    // crafto.fuel < 11
  ) {
    console.log(crafto.name + ' low on gas.');
    return false;
  }
  return true;
};
const findNearestGasStation = (crafto, indSites, staro) => {
  let fuelNeeded = crafto.fuelCapacity - crafto.fuel;
  return indSites.find(site => {
    return site.outputsList.find(output => {
      if (
        output === 'fuel' &
        site.store.fuel >= fuelNeeded
      ) {

        crafto.route.push(buildWaypoint(site));

        crafto.route[0].pickup = {
          fuel: fuelNeeded
        };
        ind.moveTohold(site, 'fuel', crafto);

        crafto.status = 'traveling';

        crafto.intercept = calcIntercept(crafto, crafto.route[0].location, staro);

        return true;
      }
    });
  });
};
const findSimpleRoute = (crafto, indSites, staro) => {
  //   \|/
  //  --I--
  //   /|\
  //  /-A-\
  // /-----\
  return indSites.find(prodSite => {
    return prodSite.outputsList.find(prodRes => {
      return indSites.find(consSite => {
        if (prodSite !== consSite) {
          return consSite.outputsList.find(consRes => {
            if (
              prodRes === consRes &&
              prodSite.store[prodRes] >= crafto.cargoCap
            ) {
              // console.log('here');
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

              crafto.intercept = calcIntercept(crafto, crafto.route[0].location, staro);

              return true;
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
  if (!enoughFuelCheck(crafto)) {
    return findNearestGasStation(crafto, indSites, staro);
  }
  // console.log('here');
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
