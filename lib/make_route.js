'use strict'


module.exports = function(cuk) {
  const { _, helper } = cuk.pkg.core.lib

  return function(file, cuksPkg, pkg, router, appDir) {
    const disabled = _.get(cuk.pkg.route, 'cfg.common.disabled', [])
    let routePath = file.replace(appDir, '').replace('.js', ''),
      routes = require(file)(cuk)
    let _name = `${cuksPkg.id}:${routePath}`
    if (disabled.indexOf(_name) > -1) {
      helper('core:trace')('|  |  |- Disabled => %s', _name)
      return
    }
    if (routes instanceof pkg.lib.Router) {
      router.use(routePath, routes.routes(), routes.allowedMethods())
      helper('core:trace')('|  |  |- Enabled => %s -> [Router] %s%s', _name, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, routePath)
      return
    }
    if (_.isString(routes)) {
      let name = `GET:${_name}`
      if (cuk.pkg.view) {
        const parts = routes.split(':')
        const match = cuk.pkg[parts[0]]
        router.get(name, routePath, ctx => {
          if (match)
            ctx.render(routes)
          else
            ctx.body = content
        })
      } else {
        router.get(name, routePath, ctx => {
          ctx.body = content
        })
      }

      helper('core:trace')('|  |  |- Enabled => %s -> [GET] %s%s', _name, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, routePath)
      return
    }
    if (_.isPlainObject(routes))
      if (routes.route) {
        if (routes.middleware)
          router.use(helper('http:composeMiddleware')(routes.middleware, 'router', true))
        if (routes.param)
          _.forOwn(routes.param, (v, k) => {
            router.param(k, v)
          })
        routes = routes.route
      } else {
        routes = [routes]
      }
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
      let mws = helper('http:composeMiddleware')(r.middleware, `${pkg.id}:${cuksPkg.id}:${routePath}:${_.map(methods, m => m.toUpperCase()).join(',')}`, true)
      _.each(methods, m => {
        let name = `${m}:${cuksPkg.id}:${routePath}`
        if (r.redirect) {
          let dest = _.isString(r.redirect) ? r.redirect : (r.destination || name)
          router.all(rpath, mws, ctx =>{
            ctx.redirect(dest)
            ctx.status = 301
          })
          helper('core:trace')('|  |  |- Enabled => %s -> [%s:Redirect] %s%s -> %s', _name, m.toUpperCase(), cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, rpath, dest)
        } else {
          if (_.isPlainObject(r.param)) {
            _.forOwn(r.param, (v, k) => {
              router.param(k, v)
            })
          }
          router[m](name, rpath, mws, r.handler)
          helper('core:trace')('|  |  |- Enabled => %s -> [%s] %s%s', _name, m.toUpperCase(), cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, rpath)
        }
      })
    })
  }

}