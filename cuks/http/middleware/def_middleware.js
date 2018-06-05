'use strict'

module.exports = function(cuk) {
  const { _ } = cuk.lib

  return {
    handler: () => {
      return async (ctx, next) => {
        let hostname = ctx.request.hostname
        if (hostname.substr(0, 4) === 'www.')
          hostname = hostname.substr(4)

        let skin = 'bootswatch'
        if (!cuk.pkg[skin]) skin = 'view'

        ctx.state.site = {
          hostname: hostname,
          skin: skin
        }

        ctx.state.site.theme = 'minty'

        return next()
      }
    }
  }
}