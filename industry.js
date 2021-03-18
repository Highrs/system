'use strict';
// industry manager

const industryStoreCheck = (planet) => {
  let listOfIndustries = planet.industry;
  console.log(listOfIndustries);
  return {};
};


exports.initInd = (planet) => {
  planet.storage = industryStoreCheck(planet);
};
