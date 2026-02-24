const { prepareCoderunnerConfig } = require('../../coderunner')

module.exports = prepareCoderunnerConfig({
  marketplaceProduct: {
    name: 'Apollo',
  },

  app: {
    model: 'Apollo',
    exclude: [],
  },
})
