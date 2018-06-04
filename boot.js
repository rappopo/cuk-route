'use strict'

const Router = require('koa-router')

module.exports = function(cuk){
  let pkgId = 'route',
    pkg = cuk.pkg[pkgId]
  const { _, helper, path, fs, globby } = cuk.lib
  const app = cuk.pkg.http.lib.app
  const makeMiddleware = require('./lib/make_middleware')(cuk)
  const makeRoute = require('./lib/make_route')(cuk)

  pkg.trace('Initializing...')

  pkg.lib.Router = Router
  pkg.lib.compose = require('koa-compose')

  return new Promise((resolve, reject) => {
    _.each(helper('core:pkgs')(), p => {
      p.cuks[pkgId] = {}
      let opt = p.cfg.mount === '/' ? null : { prefix: p.cfg.mount }
      let router = new Router(opt)
      let dir = path.join(p.dir, 'cuks', pkgId)
      if (!fs.existsSync(dir)) return
      var files = globby.sync(`${dir}/**/*.js`, {
        ignore: [`${dir}/**/_*.js`]
      })
      if (files.length > 0) {
        let mws = makeMiddleware(_.get(p.cfg, 'cuks.route.middleware'))
        mws.unshift(helper('http:middleware')('route:defMiddleware')())
        if (mws.length > 0) router.use(pkg.lib.compose(mws))
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