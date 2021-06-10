'use strict';
const mech = require('./mechanics.js');
const majObj = require('./majorObjects2.json');
const ind = require('./industry.js');
// const indTemp = require('./industryTemp.js');

const rate = 20;
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
