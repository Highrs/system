module.exports = {

  brick: () => ({
    class: 'Brick',
    abr: 'BRK',
    cargoCap: 10,
    fuelCapacity: 100,
    fuelConsumption: 1,
    accel: 3,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    abr: 'BLD',
    cargoCap: 20,
    fuelCapacity: 200,
    fuelConsumption: 2,
    accel: 2,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    abr: 'MNT',
    cargoCap: 30,
    fuelCapacity: 300,
    fuelConsumption: 3,
    accel: 1,
    home: 'beta'
  })

};
