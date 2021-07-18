'use strict';
// Industry manager
const indTemp = require('./industryTemp.js');

const initInd = (body) => {

  body.store = body.store || {};

  body.industryList && body.industryList.forEach(bodyIndName => {
    body.hold = body.hold || {};
    body.industry = body.industry || [];

    let newInd = {};
    Object.assign(
      newInd,
      indTemp[bodyIndName](),
      {
        status: 'NEW',
        cycles: 0,
        workProg: 0,
      }
    );

    body.industry.push(newInd);

    Object.keys(newInd.output).forEach(resName => {body.store[resName] |= 0;});
    Object.keys(newInd.input ).forEach(resName => {body.store[resName] |= 0;});
  });
};
exports.initInd = initInd;

const indWork = (body, ind, workTime) => {

  if (ind.status === 'WORK') {

    ind.workProg += workTime;
    if (ind.workProg >= ind.cycle) {
      Object.keys(ind.output).forEach(outRes => {
        body.store[outRes] += ind.output[outRes];
      });
      ind.workProg = 0;
      ind.status = 'IDLE';
    }

  } else {

    let workGo = true;
    Object.keys(ind.input).forEach(inRes => {
      if (
        (body.store[inRes] === undefined) ||
        (body.store[inRes] < ind.input[inRes])
      ) {
        workGo = false;
      }
    });
    if (workGo) {
      Object.keys(ind.input).forEach(inRes => {
        body.store[inRes] -= ind.input[inRes];
      });
      ind.status = 'WORK';
    }

  }
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

const loadCraft = (crafto) => {
  let bodyo = crafto.route[0].location;

  Object.keys(crafto.route[0].dropoff).forEach(res => {
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

  Object.keys(crafto.route[0].pickup).forEach(res => {
    const quant = crafto.route[0].pickup[res];
    // bodyo.store[res] |= 0;
    crafto.cargo[res] |= 0;

    if (res === 'fuel') {
      crafto.fuel += quant;
      bodyo.hold[crafto.name][res] -= quant;
      console.log(crafto.name + ' refueled.');
    } else if (
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
exports.loadCraft = loadCraft;
