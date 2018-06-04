'use strict'

module.exports = function(cuk) {
  const { _ } = cuk.lib

  return {
    handler: () => {
      return async (ctx, next) => {
        let hostname = ctx.request.hostname
        if (hostname.substr(0, 4) === 'www.')
          hostname = hostname.substr(4)

        ctx.state.domain = 'test'
        return next()
      }
    }
  }
}