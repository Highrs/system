module.exports = {

  mining: () => ({
    name: 'Mining',
    abr: 'MNG',
    cycle: 1000,
    input: {},
    output: {
      ore: 1
    }
  }),

  refining: () => ({
    name: 'Refining',
    abr: 'REF',
    cycle: 2000,
    input: {
      ore: 10
    },
    output: {
      metal: 1
    }
  }),

  factory: () => ({
    name: 'Factory',
    abr: 'FRY',
    cycle: 3000,
    input: {
      metal: 5
    },
    output: {
      supplies: 1
    }
  })

};
