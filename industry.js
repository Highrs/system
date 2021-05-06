'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const initInd = (body) => {
  body.store = body.store || {};
  body.industry && body.industry.forEach((bodyIndName) => {

    Object.keys(indTemp[bodyIndName].output).forEach((resName) => {
      body.store[resName] |= 0;
    });

    Object.keys(indTemp[bodyIndName].input).forEach((resName) => {
      body.store[resName] |= 0;
    });

    body.hold = body.hold || {};

    indWork(body, bodyIndName);
  });
};
exports.initInd = initInd;

const indWork = async (body, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).forEach((inRes) => {
  // for (const inRes of indTemp[industry].input) {
    if (
      (body.store[inRes] === undefined) ||
      (indTemp[industry].input[inRes] > body.store[inRes])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).forEach((inRes) => {
      body.store[inRes] -= indTemp[industry].input[inRes];
    });
    await delay(indTemp[industry].cycle);
    Object.keys(indTemp[industry].output).forEach((outRes) => {
      body.store[outRes] += indTemp[industry].output[outRes];
    });
  } else {
    await delay(1000);
  }

  indWork(body, industry);
};
exports.indWork = indWork;

const moveTohold = (bodyo, res, crafto) => {
  let quant = crafto.cargoCap;

  bodyo.hold[crafto.name] = bodyo.hold[crafto.name] || {};
  bodyo.hold[crafto.name][res] = bodyo.hold[crafto.name][res] || 0;

  bodyo.store[res] -= quant;
  bodyo.hold[crafto.name][res] += quant;
};
exports.moveTohold = moveTohold;

const unLoadCraft = (crafto) => {
  let bodyo = crafto.route[0].location;
  // let cargoCap = crafto.cargoCap;

  Object.keys(crafto.route[0].dropoff).forEach((res) => {
    const quant = crafto.route[0].dropoff[res];
    bodyo.store[res] |= 0;
    crafto.cargo[res] |= 0;
    console.log(crafto.name + " " + res + " " + crafto.cargo[res]);

    if (crafto.cargo[res] >= quant) {
      bodyo.store[res] += quant;
      crafto.cargo[res] -= quant;
    } else {
      console.log("ERROR AT UNLOAD");
      console.log(JSON.stringify(crafto, null, 2));
      // throw new Error();
    }
  });

  Object.keys(crafto.route[0].pickup).forEach((res) => {
    const quant = crafto.route[0].pickup[res];
    bodyo.store[res] |= 0;
    crafto.cargo[res] |= 0;

    if (
      (crafto.cargoCap >= quant) &&
      ( (crafto.cargo[res] + quant) <= crafto.cargoCap)
    ) {
      crafto.cargo[res] += quant;
      bodyo.hold[crafto.name][res] -= quant;
    } else {
      console.log("ERROR AT LOAD");
      console.log(JSON.stringify(crafto, null, 2));
      // throw new Error();
    }
    // console.log(crafto.name + " " + res + " " + crafto.cargo[res]);
  });

  console.log(crafto.cargo);
};
exports.unLoadCraft = unLoadCraft;
