'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');

const industryStoreCheck = (planet) => {
  if (planet.industry) {
    planet.industry.forEach((planetIndName) => {
      if (!planet.storage[indTemp[planetIndName].storage]) {
        Object.assign(planet.storage, indTemp[planetIndName].storage);
      }
    });
  }
};


exports.initInd = (planet) => {
  industryStoreCheck(planet);
};
