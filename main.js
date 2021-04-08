'use strict';
// Initialization and run
const draw = require('./draw.js');
const renderer = require('onml/renderer.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const majorObjects = require('./majorObjects.json');
const hulls = require('./hulls.json');

const makePlanet = (planeto) => {
//name, a, e, t, t0, w, lang, inc, maz
  const planDat = mech.kepCalc(planeto, 0);
  ind.initInd(planeto);

  const planet = Object.assign(
    planeto,
    {
      focalShift: planDat.focalShift,
      x:          planDat.x,
      y:          planDat.y,
      z:          planDat.z
    }
  );

  return planet;
};

const makeCraft = (crafto) => {
  const craft = Object.assign(
    crafto,
    {
      x: 150000000,
      y: 0,
      z: 0
    }
  );

  return craft;
};

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
  console.log("Giant alien spiders are no joke!");
  const planets = [];
  const craft = [];

  Object.keys(majorObjects.planets).forEach((planetName) => {
    planets.push(makePlanet(majorObjects.planets[planetName]));
  });

  for (let i = 0; i < 1; i++) {
    craft.push(makeCraft(hulls.brick));
  }

  renderer(document.getElementById('content'))(draw.drawMap(planets));
  const render2 = renderer(document.getElementById('moving'));

  console.log(planets);
  while (Date.now()) {
    const clock = Date.now();
    const t = clock / Math.pow(10, 4);
    const clock2 = Date(clock);

    for (let i = 0; i < planets.length; i++) {
      let newData = mech.kepCalc(planets[i], t);
      planets[i].x = newData.x;
      planets[i].y = newData.y;
      planets[i].z = newData.z;
    }

    render2(draw.drawMoving(planets, clock2, craft));
    await delay(100);
  }
};

window.onload = main;
