'use strict';
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const drawMap = require('./drawMap.js');

const hullNamer = () => {
  let id = 0;
  return () => {
    id += 1;
    return id;
  };
};

const namer = hullNamer();

const makeCraft = (crafto) => {
  let newCrafto = {};
  Object.assign(
    newCrafto,
    crafto,
    {
      name: namer(),
      x: 0, y: 0, z: 0,
      vx: 0, vy: 0, vz: 0,
      speed: 0,
      course: 0,
      intercept: {},
      status: 'parked',
      route: [],
      lastStop: [],
      cargo: {},
      fuel: crafto.fuelCapacity
    }
  );

  return newCrafto;
};
exports.makeCraft = makeCraft;

const calcCourse = (crafto, intercepto) => {
  crafto.course = (Math.atan2(intercepto.py, intercepto.px) * 180 / Math.PI) - 90;
};

const craftAI = (crafto, indSites, rendererIntercept, listOfcraft, timeDelta, staro) => {
  if (crafto.route.length === 0) {
    crafto.intercept = {};
    if (!deviseRoute(crafto, indSites, staro)) {
      crafto.status = 'parked';
      ['x', 'y', 'z'].forEach(e => {
        crafto[e] = crafto.lastStop[e];
        crafto['v' + e] = 0;
      });
    } else {
      rendererIntercept(drawMap.drawIntercepts(listOfcraft));
    }
  } else {
    if (
      mech.calcDistSq(crafto, crafto.route[0].location) <
      (crafto.route[0].location.sphereOfInfluence *
        crafto.route[0].location.sphereOfInfluence)
    ) {

      ['x', 'y', 'z'].forEach(e => {
        crafto['v' + e] = 0;
      });

      ind.unLoadCraft(crafto);


      crafto.lastStop = crafto.route[0].location;
      crafto.route.shift();
      crafto.fuel = crafto.fuelCapacity;

      if (crafto.route.length != 0) {
        crafto.intercept = calcIntercept(crafto, crafto.route[0].location, staro);
      } else {
        crafto.status = 'parked';
      }

      rendererIntercept(drawMap.drawIntercepts(listOfcraft));
    } else {
      calcMotion(crafto, crafto.intercept, timeDelta);
    }
  }
};
exports.craftAI = craftAI;

const buildWaypoint = (bodyo) => {
  let waypoint = {
    location: bodyo,
    pickup: {},
    dropoff: {}
  };

  return waypoint;
};

const deviseRoute = (crafto, indSites, staro) => {
  if (crafto.route.length > 0) {
    console.log('ERROR at craft.deviseRoute: Route not empty!');
    crafto.route = [];
  }
  if (indSites.length < 2) {
    console.log('ERROR at craft.deviseRoute: Too few industry sites.');
    return false;
  }
//   \|/
//  --I--
//   /|\
//  /-A-\
// /-----\
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

                  crafto.intercept = calcIntercept(crafto, crafto.route[0].location, staro);

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

const calcMotion = (crafto, targeto, timeDelta) => {
  // timeDelta passed down in SECONDS not ms

  //Determine the direction of acceleration based on midpoint of travel.
  const distToTarget = mech.calcDistSq(crafto, targeto);
  const dir = (distToTarget < (targeto.turn * targeto.turn)) ? -1 : 1;

  // Bezier Curve:
  // B(t) = (1-t) * ((1-t) * p0 + t * p1) + t * ((1-t) * p1 + t * p2)

  ['x', 'y', 'z'].forEach(e => {
    const deltaVelocity = (
      dir * (crafto.accel) * (targeto['p' + e]) * timeDelta
    );

    crafto[e] += crafto['v' + e] * timeDelta + deltaVelocity * timeDelta / 2;
    crafto['v' + e] += deltaVelocity;
  });

  crafto.fuel = (crafto.fuel - crafto.fuelConsumption * timeDelta).toFixed(2);
};

const calcSolarDanger = (crafto, icpto, staro = {x: 600, y: 600, z: 0}) => {
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
