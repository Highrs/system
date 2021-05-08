'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const initInd = (body) => {
  body.store = body.store || {};
  body.industry && body.industry.map(bodyIndName => {

    Object.keys(indTemp[bodyIndName].output).map(resName => {
      body.store[resName] |= 0;
    });
    Object.keys(indTemp[bodyIndName].input).map(resName => {
      body.store[resName] |= 0;
    });
    body.hold = body.hold || {};

    indWork(body, bodyIndName);
  });
};
exports.initInd = initInd;

const indWork = async (body, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).map(inRes => {
    if (
      (body.store[inRes] === undefined) ||
      (indTemp[industry].input[inRes] > body.store[inRes])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).map(inRes => {
      body.store[inRes] -= indTemp[industry].input[inRes];
    });
    await delay(indTemp[industry].cycle);
    Object.keys(indTemp[industry].output).map(outRes => {
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

  Object.keys(crafto.route[0].dropoff).map(res => {
    const quant = crafto.route[0].dropoff[res];
    bodyo.store[res] |= 0;
    crafto.cargo[res] |= 0;

    if (crafto.cargo[res] >= quant) {
      bodyo.store[res] += quant;
      crafto.cargo[res] -= quant;
    } else {
      console.log('ERROR AT UNLOAD');
    }
  });

  Object.keys(crafto.route[0].pickup).map(res => {
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
      console.log('ERROR AT LOAD');
    }
  });
};
exports.unLoadCraft = unLoadCraft;
