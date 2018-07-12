'use strict'

module.exports = function(cuk) {
  const { _, helper } = cuk.pkg.core.lib

  return () => {
    return async (ctx, next) => {
      try {
        await next()
        console.log('route:', ctx.status)
        if (ctx.status === 404 && cuk.pkg.view) {
          ctx.render('view:/not_found')
          const err = helper('core:makeError')({
            msg: 'Resource not found',
            status: 404
          })
//          ctx.app.emit('error', err, ctx)
        }
      } catch (err) {
        ctx.status = err.status || 500
        if (cuk.pkg.view)
          ctx.render('view:/server_error')
        else
          ctx.body = err.message
//        ctx.app.emit('error', err, ctx)
      }
    }
  }
}