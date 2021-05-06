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
  listOfcraft.forEach((crafto) => {
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
  return indSites.find((prodSite) =>
    prodSite.industry.find((prodInd) =>
      Object.keys(indTemp[prodInd].output).find((prodRes) =>
        indSites.find((consSite) => {
          if (prodSite !== consSite) {
            return consSite.industry.find((consInd) =>
              Object.keys(indTemp[consInd].input).find((consRes) => {
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
