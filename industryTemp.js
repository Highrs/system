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
    cycle: 5000,
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
    cycle: 10000,
    input: {
      metal: 5
    },
    output: {
      parts: 1
    }
  })

};
