'use strict';
// Industry manager
const indTemp = require('./industryTemp.json');

const industryStoreCheck = (body) => {
  body.industry && body.industry.forEach((bodyIndName) => {
    if (!body.storage[indTemp[bodyIndName].storage]) {
      Object.assign(body.storage, indTemp[bodyIndName].storage);
    }
    indWork(body, bodyIndName);
  });

};

const initInd = (body) => {
  industryStoreCheck(body);
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

exports.initInd = initInd;
exports.indWork = indWork;
