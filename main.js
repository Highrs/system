'use strict';

const draw = require('./draw.js');
const onml = require('onml');



const renderer = root => ml => {
  try {
    const html = onml.stringify(ml);
    root.innerHTML = html;
  } catch (err) {
    console.error(ml);
  }
};

const main = () => {

  let time = 0;

  const render = renderer(document.getElementById('content'));

  render(draw.drawMap(time));
}

window.onload = main;
