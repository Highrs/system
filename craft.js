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
      cargo: {},
      route: [],
      lastStop: [],
      status: 'parked',
      course: 0,
      intercept: {},
      fuel: crafto.fuelCapacity
    }
  );

  return newCrafto;
};
exports.makeCraft = makeCraft;

const calcCourse = (crafto, intercepto) => {
  crafto.course = (Math.atan2(intercepto.py, intercepto.px) * 180 / Math.PI) - 90;
};

const craftAI = (crafto, indSites, rendererIntercept, listOfcraft, timeDelta) => {
  if (crafto.route.length === 0) {
    crafto.intercept = {};
    if (!deviseRoute(crafto, indSites)) {
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
      mech.calcDist(
        crafto,
        crafto.route[0].location
      ) < crafto.route[0].location.sphereOfInfluence
    ) {

      ['x', 'y', 'z'].forEach(e => {
        crafto['v' + e] = 0;
      });

      ind.unLoadCraft(crafto);

      crafto.lastStop = crafto.route[0].location;
      crafto.route.shift();
      crafto.fuel = crafto.fuelCapacity;

      if (crafto.route.length != 0) {
        crafto.intercept = calcIntercept(crafto, crafto.route[0].location);
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
                  // calcCourse(crafto);

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
  const dist = mech.calcDist(crafto, targeto);

  //Determine the direction of acceleration based on midpoint of travel.
  let dir = (dist < targeto.turn) ? -1 : 1;

  ['x', 'y', 'z'].forEach(e => {
    let deltaVelocity = (
      dir * (crafto.accel) * (targeto['p' + e]) * timeDelta
    );

    crafto[e] += crafto['v' + e] * timeDelta + deltaVelocity * timeDelta / 2;
    crafto['v' + e] += deltaVelocity;
  });

  crafto.fuel = (crafto.fuel - crafto.fuelConsumption * timeDelta).toFixed(2);
};

const calcIntercept = (crafto, bodyo) => {
  let intercept = {
    x: bodyo.x, y: bodyo.y, z: bodyo.z,
    px: 0, py: 0, pz: 0,
    turn: 0
  };
  let travelTime = 0;
  let distance = 0;

  for (let i = 0; i < 5; i++) {
    distance   = mech.calcDist(crafto, intercept);
    travelTime = mech.calcTravelTime(distance, crafto.accel);
    intercept  = {...mech.kepCalc(bodyo, bodyo.t + travelTime)};
  }

  intercept.turn = distance / 2;

  ['x', 'y', 'z'].forEach(e => {
    intercept['p' + e] = (intercept[e] - crafto[e]) / (distance);
  });

  calcCourse(crafto, intercept);

  return intercept;
};
