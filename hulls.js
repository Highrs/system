module.exports = {

  brick: () => ({
    class: 'Brick',
    cargoCap: 10,
    fuelCapacity: 100,
    fuelComsumption: 1,
    accel: 3,
    home: 'beta'
  }),

  boulder: () => ({
    class: 'Boulder',
    cargoCap: 20,
    fuelCapacity: 200,
    fuelComsumption: 2,
    accel: 2,
    home: 'beta'
  }),

  mountain: () => ({
    class: 'Mountain',
    cargoCap: 30,
    fuelCapacity: 300,
    fuelComsumption: 3,
    accel: 1,
    home: 'beta'
  })

};
