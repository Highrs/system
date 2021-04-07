'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');

const industryStoreCheck = (planet) => {
  if (planet.industry) {
    planet.industry.forEach((planetIndName) => {
      if (!planet.storage[indTemp[planetIndName].storage]) {
        Object.assign(planet.storage, indTemp[planetIndName].storage);
      }
      indWork(planet, planetIndName);
    });
  }
};

exports.initInd = (planet) => {
  industryStoreCheck(planet);
};

const indWork = (planet, industry) => {
  let workGo = true;

  Object.keys(indTemp[industry].input).forEach((inputResource) => {
    if (
      (!planet.storage[inputResource]) ||
      (indTemp[industry].input[inputResource] > planet.storage[inputResource])
    ) {
      workGo = false;
    }
  });

  if (workGo === true) {
    Object.keys(indTemp[industry].input).forEach((inputResource) => {
      planet.storage[inputResource] -= indTemp[industry].input[inputResource];
    });

    setTimeout(
      function(){
        Object.keys(indTemp[industry].output).forEach((outputResource) => {
          planet.storage[outputResource] += indTemp[industry].output[outputResource];
        });
        indWork(planet, industry);
      },
      indTemp[industry].cycle);
  }
};
