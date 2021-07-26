'use strict';
// Industry manager
const indTemp = require('./industryTemp.js');

const initInd = (bodyo) => {
  bodyo.store = bodyo.store || {};

  bodyo.industryList && bodyo.industryList.forEach(bodyoIndName => {
    bodyo.hold = bodyo.hold || {};
    bodyo.industry = bodyo.industry || [];

    let newInd = {};
    Object.assign(
      newInd,
      indTemp[bodyoIndName](),
      {
        status: 'NEW',
        cycles: 0,
        workProg: 0,
      }
    );

    bodyo.industry.push(newInd);

    Object.keys(newInd.output).forEach(resName => {
      bodyo.store[resName] |= 0;
      if (!bodyo.outputsList.find(e => e === resName)) {
        bodyo.outputsList.push(resName);
      }
    });
    Object.keys(newInd.input).forEach(resName => {
      bodyo.store[resName] |= 0;
      if (!bodyo.inputsList.find(e => e === resName)) {
        bodyo.inputsList.push(resName);
      }
    });
  });
};
const indWork = (bodyo, ind, workTime) => {

  if (ind.status === 'WORK') {

    ind.workProg += workTime;
    if (ind.workProg >= ind.cycle) {
      Object.keys(ind.output).forEach(outRes => {
        bodyo.store[outRes] += ind.output[outRes];
      });
      ind.workProg = 0;
      ind.status = 'IDLE';
    }

  } else {

    let workGo = true;
    Object.keys(ind.input).forEach(inRes => {
      if (
        (bodyo.store[inRes] === undefined) ||
        (bodyo.store[inRes] < ind.input[inRes])
      ) {
        workGo = false;
      }
    });
    if (workGo) {
      Object.keys(ind.input).forEach(inRes => {
        bodyo.store[inRes] -= ind.input[inRes];
      });
      ind.status = 'WORK';
    }

  }
};
const moveToHold = (bodyo, res, crafto) => {
  let quant = crafto.cargoCap;

  bodyo.hold[crafto.name] = bodyo.hold[crafto.name] || {};
  bodyo.hold[crafto.name][res] = bodyo.hold[crafto.name][res] || 0;

  bodyo.store[res] -= quant;
  bodyo.hold[crafto.name][res] += quant;
};
const transfCraftCargo = (crafto) => {
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
      let actualNeededGas = crafto.fuelCapacity - crafto.fuel;
      let gasSurplus = quant - actualNeededGas;
      if (gasSurplus > 0) {
        crafto.fuel += actualNeededGas;
        bodyo.hold[crafto.name][res] -= actualNeededGas;
        bodyo.store[res] += bodyo.hold[crafto.name][res];
        bodyo.hold[crafto.name][res] = 0;
      } else if (gasSurplus <= 0) {
        crafto.fuel += quant;
        bodyo.hold[crafto.name][res] -= quant;
        if (bodyo.store[res] > Math.abs(gasSurplus)) {
          bodyo.store[res] -= Math.abs(gasSurplus);
          crafto.fuel += Math.abs(gasSurplus);
        }
      }
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

exports.indWork = indWork;
exports.moveToHold = moveToHold;
exports.initInd = initInd;
exports.transfCraftCargo = transfCraftCargo;
