'use strict'

const Router = require('koa-router')
const session = require('koa-session')

module.exports = function(cuk){
  let pkgId = 'route',
    pkg = cuk.pkg[pkgId]
  const { _, helper, path, fs, globby } = cuk.lib
  const app = cuk.pkg.http.lib.app
  const makeRoute = require('./lib/make_route')(cuk)
  const makeDefHandler = require('./lib/make_def_handler')(cuk)

  pkg.lib.Router = Router

  return new Promise((resolve, reject) => {
    app.use(session(pkg.cfg.common.session, app))
    app.use(makeDefHandler())
    app.use(helper('http:composeMiddleware')('http:responseTime, route:defMiddleware', `${pkgId}:*`))

    helper('core:bootTrace')('%A Loading routes...', null)
    helper('core:bootDeep')({
      pkgId: pkgId,
      name: '',
      parentAction: opts => {
//        opts.pkg.cuks[pkgId] = {}
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
}