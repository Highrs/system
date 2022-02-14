'use strict';

const stringify = require('onml/stringify.js');

exports.appendRend = (root, ml) => {
  const content = (typeof root === 'string')
    ? document.getElementById(root)
    : root;

  let str;
  try {
    str = stringify(ml);
    content.innerHTML += str;
  } catch (err) {
    console.log(ml);
  }
};

exports.normRend = (root, ml) => {
  const content = (typeof root === 'string')
    ? document.getElementById(root)
    : root;

  let str;
  try {
    str = stringify(ml);
    content.innerHTML = str;
  } catch (err) {
    console.log(ml);
  }
};
