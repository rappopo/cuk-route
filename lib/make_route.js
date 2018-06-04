'use strict'


module.exports = function(cuk) {
  const { _, helper } = cuk.lib

  const makeMiddleware = require('./make_middleware')(cuk)

  return function(file, cuksPkg, pkg, router, rootDir) {
    let routePath = file.replace(rootDir, '').replace('.js', ''),
      routes = require(file)(cuk)
    if (routes instanceof pkg.lib.Router) {
      router.use(routePath, routes.routes(), routes.allowedMethods())
      pkg.trace('Serve » Router -> %s%s', cuksPkg.cfg.mount === '/' ? '' : cuksPkg.cfg.mount, routePath)
      return
    }
    if (_.isPlainObject(routes))
      routes = [routes]
    _.each(routes, r => {
      let method = r.method || 'get',
        rpath = r.path || routePath,
        methods = helper('core:makeChoices')(method)
      let parts = rpath.split('/')
      parts.shift()
      if (pkg.cfg.trimIndex && _.last(parts) === 'index') {
        if (pkg.cfg.ext === '') {
          rpath = '/' + parts.join('/')
        } else {
          parts.pop()
          rpath = '/' + parts.join('/') + (parts.length === 0 ? '':'/')
        }
      } else {
        rpath = '/' + parts.join('/') + pkg.cfg.ext
      }
      let mws = makeMiddleware(r.middleware)
      _.each(methods, m => {
        let name = `${m}:${cuksPkg.id}:${routePath}`
        if (r.redirect) {
          let dest = _.isString(r.redirect) ? r.redirect : (r.destination || name)
          if (mws.length === 0)
            router.all(rpath, ctx =>{
              ctx.redirect(dest)
              ctx.status = 301
            })
          else
            router.all(rpath, pkg.lib.compose(mws), ctx =>{
              ctx.redirect(dest)
              ctx.status = 301
            })
          pkg.trace('Redirect » %s -> %s%s -> %s', m.toUpperCase(), cuksPkg.cfg.mount === '/' ? '' : cuksPkg.cfg.mount, rpath, dest)
        } else {
          if (_.isPlainObject(r.param)) {
            _.forOwn(r.param, (v, k) => {
              router.param(k, v)
            })
          }
          if (mws.length === 0)
            router[m](name, rpath, r.handler)
          else
            router[m](name, rpath, pkg.lib.compose(mws), r.handler)
          pkg.trace('Serve » %s -> %s%s', m.toUpperCase(), cuksPkg.cfg.mount === '/' ? '' : cuksPkg.cfg.mount, rpath)
        }
      })
    })
  }

}