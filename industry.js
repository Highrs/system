'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');


const initInd = (body) => {
  industryStoreCheck(body);
};
exports.initInd = initInd;

const industryStoreCheck = (body) => {
  // console.log(body.name);
  body.industry && body.industry.forEach((bodyIndName) => {
    // console.log(bodyIndName);
    if (!body.storage) {
      body.storage = indTemp[bodyIndName].storage;
    }
    // Object.keys(indTemp[bodyIndName].storage).forEach((resource) => {
    //   console.log(resource);
    //   if (!body.storage[resource]) {
    //     console.log("Here");
    //     Object.assign(body.storage, indTemp[bodyIndName].storage[resource]);
    //   }
    // });
    if (!body.holding) {
      body.holding = {};
    }
    indWork(body, bodyIndName);
  });

};

const indWork = (body, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).forEach((inRes) => {
    if (
      (!body.storage[inRes]) ||
      (indTemp[industry].input[inRes] > body.storage[inRes])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).forEach((inRes) => {
      body.storage[inRes] -= indTemp[industry].input[inRes];
    });

    setTimeout(
      function(){
        Object.keys(indTemp[industry].output).forEach((outRes) => {
          body.storage[outRes] += indTemp[industry].output[outRes];
        });
        indWork(body, industry);
      },
      indTemp[industry].cycle);
  }
};
exports.indWork = indWork;

const moveToHolding = (bodyo, crafto, resource, quant) => {
  bodyo.storage[resource] -= quant;
  if (!bodyo.holding[crafto.name]) {
    bodyo.holding[crafto.name] = {};
  }
  if (!bodyo.holding[crafto.name][resource]) {
    bodyo.holding[crafto.name][resource] = 0;
  }
  bodyo.holding[crafto.name][resource] += quant;
};
exports.moveToHolding = moveToHolding;

const loadCraft = (bodyo, crafto, resource, quant) => {
  if (!crafto.cargo[resource]) {
    crafto.cargo[resource] = 0;
  }
  crafto.cargo[resource] += quant;
  bodyo.storage[resource] -= quant;
};
exports.loadCraft = loadCraft;

const unloadCraft = (bodyo, crafto, resource, quant) => {
  if (!bodyo.storage[resource]) {
    bodyo.storage[resource] = 0;
  }
  bodyo.storage[resource] += quant;
  crafto.cargo[resource] -= quant;
};
exports.unloadCraft = unloadCraft;
