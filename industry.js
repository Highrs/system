'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');


const initInd = (body) => {
  industryStoreCheck(body);
};
exports.initInd = initInd;

const industryStoreCheck = (body) => {
  // console.log(body);
  body.industry && body.industry.forEach((bodyIndName) => {
    // console.log(bodyIndName);
    if (!body.store) {
      body.store = {};
      Object.keys(indTemp[bodyIndName].input).forEach((resName) => {
        // console.log(resName);
        if (!body.store[resName]) {
          body.store[resName] = 0;
        }
      });
      Object.keys(indTemp[bodyIndName].output).forEach((resName) => {
        if (!body.store[resName]) {
          body.store[resName] = 0;
        }
      });
    }
    if (!body.hold) {
      body.hold = {};
    }
    indWork(body, bodyIndName);
  });

};

const indWork = (body, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).forEach((inRes) => {
    if (
      (!body.store[inRes]) ||
      (indTemp[industry].input[inRes] > body.store[inRes])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).forEach((inRes) => {
      body.store[inRes] -= indTemp[industry].input[inRes];
    });

    setTimeout(
      function(){
        Object.keys(indTemp[industry].output).forEach((outRes) => {
          body.store[outRes] += indTemp[industry].output[outRes];
        });
        indWork(body, industry);
      },
      indTemp[industry].cycle);
  }
};
exports.indWork = indWork;

const moveTohold = (bodyo, crafto, res, quant) => {
  bodyo.store[res] -= quant;
  if (!bodyo.hold[crafto.name]) {
    bodyo.hold[crafto.name] = {};
  }
  if (!bodyo.hold[crafto.name][res]) {
    bodyo.hold[crafto.name][res] = 0;
  }
  bodyo.hold[crafto.name][res] += quant;
};
exports.moveTohold = moveTohold;

const loadCraft = (bodyo, crafto, res, quant) => {
  if (!crafto.cargo[res]) {
    crafto.cargo[res] = 0;
  }
  crafto.cargo[res] += quant;
  bodyo.store[res] -= quant;
};
exports.loadCraft = loadCraft;

const unloadCraft = (bodyo, crafto, res, quant) => {
  if (!bodyo.store[res]) {
    bodyo.store[res] = 0;
  }
  bodyo.store[res] += quant;
  crafto.cargo[res] -= quant;
};
exports.unloadCraft = unloadCraft;
