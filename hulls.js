module.exports = {

  brick: () => ({
    class: 'Brick',
    cargoCap: 10,
    cargo: {},
    // speed: 30,
    accel: 3,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    cargoCap: 20,
    cargo: {},
    // speed: 25,
    accel: 2,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    cargoCap: 30,
    cargo: {},
    // speed: 20,
    accel: 1,
    home: 'beta'
  })

};
