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
  crafto.x += crafto.speed * ((targeto.x - crafto.x) / dist );
  crafto.y += crafto.speed * ((targeto.y - crafto.y) / dist );
  crafto.z += crafto.speed * ((targeto.z - crafto.z) / dist );
};
