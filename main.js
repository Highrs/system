'use strict';
const majObj = require('./majorObjects2.json');
// Initialization and run
const drawMap = require('./drawMap.js');
const renderer = require('onml/renderer.js');
const mech = require('./mechanics.js');
const ind = require('./industry.js');
const hulls = require('./hulls.json');
const craft = require('./craft.js');

const makeStar = (staro) => {
  return staro;
};

const makeBody = (planeto) => {
  ind.initInd(planeto);
  const planDat = mech.kepCalc(0, planeto);
  const planet = Object.assign(
    planeto,
    {
      focalShift: planDat.focalShift,
      x: planDat.x,
      y: planDat.y,
      z: planDat.z
    }
  );
  return planet;
};

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const main = async () => {
  console.log("Giant alien spiders are no joke!");

  let stars = [];
  let planets = [];
  let moons = [];
  let ast = [];
  let indSites = [];

  const listOfcraft = [];

  Object.keys(majObj).forEach((objName) => {
    if (majObj[objName].industry && majObj[objName].industry.length > 0) {
      indSites.push(majObj[objName]);
    }

    if (majObj[objName].type === "star") {
      stars.push(makeStar(majObj[objName]));
    } else
    if (majObj[objName].type === "planet") {
      planets.push(makeBody(majObj[objName]));
    } else
    if (majObj[objName].type === "moon") {
      moons.push(makeBody(majObj[objName]));
    } else
    if (majObj[objName].type === "asteroid") {
      ast.push(makeBody(majObj[objName]));
    } else {
      console.log("ERROR at make. Skipping.");
    }
  });

  for (let i = 0; i < 1; i++) {
    listOfcraft.push(craft.makeCraft(hulls.brick));
  }

  // console.log(listOfcraft);

  renderer(document.getElementById('content'))(drawMap.drawStatic(stars, planets));
  const render2 = renderer(document.getElementById('moving'));

  let movBod = [];
  movBod = movBod.concat(planets, moons, ast);

  craft.startCraftLife(listOfcraft, indSites);

  while (Date.now()) {
    const clock = Date.now();
    const t = clock / Math.pow(10, 2);
    const clock2 = Date(clock);

    for (let i = 0; i < movBod.length; i++) {
      let newData = mech.kepCalc(t, movBod[i]);
      movBod[i].x = newData.x;
      movBod[i].y = newData.y;
      movBod[i].z = newData.z;
    }

    render2(drawMap.drawMoving(clock2, planets, moons, ast, listOfcraft));
    await delay(50);
  }
};

window.onload = main;
