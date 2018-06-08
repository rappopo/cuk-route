'use strict'


module.exports = function(cuk) {
  const { _, helper } = cuk.lib

  return function(file, cuksPkg, pkg, router, rootDir) {
    let routePath = file.replace(rootDir, '').replace('.js', ''),
      routes = require(file)(cuk)
    if (routes instanceof pkg.lib.Router) {
      router.use(routePath, routes.routes(), routes.allowedMethods())
      pkg.trace('Serve » Router -> %s:%s%s', cuksPkg.id, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, routePath)
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
      if (pkg.cfg.common.trimIndex && _.last(parts) === 'index') {
        if (pkg.cfg.common.ext === '') {
          rpath = '/' + parts.join('/')
        } else {
          parts.pop()
          rpath = '/' + parts.join('/') + (parts.length === 0 ? '':'/')
        }
      } else {
        rpath = '/' + parts.join('/') + pkg.cfg.common.ext
      }
      let mws = helper('http:composeMiddleware')(r.middleware, `${pkg.id}:${cuksPkg.id}:${routePath}:${_.map(methods, m => m.toUpperCase()).join(',')}`)
      _.each(methods, m => {
        let name = `${m}:${cuksPkg.id}:${routePath}`
        if (r.redirect) {
          let dest = _.isString(r.redirect) ? r.redirect : (r.destination || name)
          router.all(rpath, mws, ctx =>{
            ctx.redirect(dest)
            ctx.status = 301
          })
          pkg.trace('Redirect » %s -> %s:%s%s -> %s', m.toUpperCase(), cuksPkg.id, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, rpath, dest)
        } else {
          if (_.isPlainObject(r.param)) {
            _.forOwn(r.param, (v, k) => {
              router.param(k, v)
            })
          }
          router[m](name, rpath, mws, r.handler)
          pkg.trace('Serve » %s -> %s:%s%s', m.toUpperCase(), cuksPkg.id, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, rpath)
        }
      })
    })
  }

}