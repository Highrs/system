'use strict';

const draw = require('./draw.js');
const renderer = require('onml/renderer.js');
const majorObjects = require('./majorObjects.json');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
// const cos  = Math.cos;
// const sin  = Math.sin;
// const PI   = Math.PI;
// const sqrt = Math.sqrt;

const makePlanet = (planeto) => {
//name, a, e, t, t0, w, lang, inc, maz
  const planDat = mech.kepCalc(planeto, 0);
  ind.initInd(planeto);

  const planet = Object.assign(
    planeto,
    {
      focalShift:    planDat.focalShift,
      x:             planDat.x,
      y:             planDat.y,
      z:             planDat.z,
    }
  );

  return planet;
};

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
  console.log("Giant alien spiders are no joke!");
  // 1 AU = 150 million km
  const planets = [];

  Object.keys(majorObjects.planets).forEach((k) => {
    planets.push(makePlanet(majorObjects.planets[k]));
  });

  renderer(document.getElementById('content'))(draw.drawMap(planets));
  const render2 = renderer(document.getElementById('moving'));

  while (Date.now()) {
    const clock = Date.now();
    const t = clock / Math.pow(10, 3);
    const clock2 = Date(clock);

    for (let i = 0; i < planets.length; i++) {
      let newData = mech.kepCalc(planets[i], t);
      planets[i].x = newData.x;
      planets[i].y = newData.y;
      planets[i].z = newData.z;
    }

    render2(draw.drawMoving(planets, clock2));
    await delay(100);
  }
};

window.onload = main;
