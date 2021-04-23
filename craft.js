'use strict';
const mech = require('./mechanics.js');
const majObj = require('./majorObjects2.json');
const ind = require('./industry.js');

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
      route: []
    }
  );
  // console.log(crafto);
  return newCrafto;
}; exports.makeCraft = makeCraft;

const startCraftLife = (listOfcraft, indSites) => {
  Object.keys(listOfcraft).forEach((craftID) => {
    // console.log(craftID);
    craftAI(listOfcraft[craftID], indSites);
  });
};
exports.startCraftLife = startCraftLife;

const craftAI = async (crafto, indSites) => {
  await delay(50);
  if (crafto.route.length === 0) {
    if (deviseRoute(crafto, indSites)) {
      craftAI(crafto, indSites);
    } else {
      await delay(1000);
      craftAI(crafto, indSites);
    }
  } else {
    if (mech.calcDist(crafto, crafto.route[0]) < crafto.speed) {
      if (crafto.route.length === 2) {
        ind.loadCraft(crafto.route[0], crafto, "ore", crafto.cargoCap);
      } else if (crafto.route.length === 1) {
        ind.unloadCraft(crafto.route[0], crafto, "ore", crafto.cargoCap);
      } else {
        console.log("ERROR in craftAI");
      }
      crafto.route.shift();
      craftAI(crafto, indSites);
    } else {
      calcVector(crafto, crafto.route[0]);
      craftAI(crafto, indSites);
    }
  }
};

const deviseRoute = (crafto, indSites) => {
  if (indSites.length < 2) {
    console.log("ERROR at craft.deviseRoute: Too few industry sites.");
    return false;
  }

  // console.log("Generating route (deviseRoute)");
  crafto.route = [indSites[0], indSites[1]];
  return true;
};

const calcVector =  (crafto, targeto) => {
  const dist = mech.calcDist(crafto, targeto);
  crafto.x += crafto.speed * ((targeto.x - crafto.x) / dist );
  crafto.y += crafto.speed * ((targeto.y - crafto.y) / dist );
  crafto.z += crafto.speed * ((targeto.z - crafto.z) / dist );
};
