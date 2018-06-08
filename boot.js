'use strict'

const Router = require('koa-router')

module.exports = function(cuk){
  let pkgId = 'route',
    pkg = cuk.pkg[pkgId]
  const { _, helper, path, fs, globby } = cuk.lib
  const app = cuk.pkg.http.lib.app
  const makeRoute = require('./lib/make_route')(cuk)

  pkg.trace('Initializing...')

  pkg.lib.Router = Router

  return new Promise((resolve, reject) => {
    app.use(helper('http:composeMiddleware')('route:catchAll, route:defMiddleware', 'route:*'))

    _.each(helper('core:pkgs')(), p => {
      p.cuks[pkgId] = {}
      let opt = p.cfg.common.mount === '/' ? null : { prefix: p.cfg.common.mount }
      let router = new Router(opt)
      let dir = path.join(p.dir, 'cuks', pkgId)
      if (!fs.existsSync(dir)) return
      var files = globby.sync(`${dir}/**/*.js`, {
        ignore: [`${dir}/**/_*.js`]
      })
      if (files.length > 0) {
        app.use(helper('http:composeMiddleware')(_.get(pkg.cfg, 'cuks.http.middleware', []), `route:${p.id}`))
        _.each(files, f => {
          makeRoute(f, p, pkg, router, dir)
        })
        app
          .use(router.routes())
          .use(router.allowedMethods())
      }
    })
    resolve(true)
  })
}