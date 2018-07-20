'use strict'

const Router = require('koa-router')

module.exports = function(cuk){
  let pkgId = 'route',
    pkg = cuk.pkg[pkgId]
  const { _, helper, path, fs, globby } = cuk.pkg.core.lib
  const app = cuk.pkg.http.lib.app
  const makeRoute = require('./lib/make_route')(cuk)
  const makeDefHandler = require('./lib/make_def_handler')(cuk)

  pkg.lib.Router = Router

  return new Promise((resolve, reject) => {
    require('./lib/session')(cuk)
    .then(() => {
  //    app.use(makeDefHandler())
      app.use(helper('http:composeMiddleware')('http:responseTime', `${pkgId}:*`))

      helper('core:trace')('|  |- Loading routes...')
      helper('core:bootDeep')({
        pkgId: pkgId,
        name: '',
        parentAction: opts => {
          let opt = opts.pkg.cfg.common.mount === '/' ? null : { prefix: opts.pkg.cfg.common.mount }
          let router = new Router(opt)
          app.use(helper('http:composeMiddleware')(_.get(pkg.cfg, 'cuks.http.middleware', []), `${pkgId}:${opts.pkg.id}`, true))
          _.each(opts.files, f => {
            makeRoute(f, opts.pkg, pkg, router, opts.dir)
          })
          app
          .use(router.routes())
          .use(router.allowedMethods())
        }
      })
      resolve(true)
    })
    .catch(reject)
  })
}