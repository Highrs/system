'use strict';
// Industry manager
const indTemp = require('./industryTemp.js');

async function delay(ms) {
  return await new Promise(resolve => setTimeout(resolve, ms));
}

const initInd = (body) => {
  body.store = body.store || {};





  body.industryList && body.industryList.map(bodyIndName => {
    body.hold = body.hold || {};
    body.industry = body.industry || [];

    let newInd = {};
    Object.assign(
      newInd,
      indTemp[bodyIndName](),
      {
        status: 'New',
        cycles: 0
      }
    );

    body.industry.push(newInd);

    Object.keys(newInd.output).map(resName => {body.store[resName] |= 0;});

    Object.keys(newInd.input ).map(resName => {body.store[resName] |= 0;});

    indWork(body, newInd);
  });
};
exports.initInd = initInd;

const indWork = async (body, ind) => {
  let workGo = true;

  Object.keys(ind.input).map(inRes => {
    if (
      (body.store[inRes] === undefined) ||
      (ind.input[inRes] > body.store[inRes])
    ) {
      workGo = false;
      ind.status = 'Idle';
    }
  });

  if (workGo === true) {
    ind.status = 'Working';
    Object.keys(ind.input).map(inRes => {
      body.store[inRes] -= ind.input[inRes];
    });
    await delay(ind.cycle);
    Object.keys(ind.output).map(outRes => {
      body.store[outRes] += ind.output[outRes];
    });
  } else {
    await delay(1000);
  }

  indWork(body, ind);
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
