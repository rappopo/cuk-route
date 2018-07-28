'use strict'


module.exports = function(cuk) {
  const { _, helper } = cuk.pkg.core.lib

  return function(file, cuksPkg, pkg, router, appDir) {
    const disabled = _.get(cuk.pkg.route, 'cfg.common.disabled', [])
    let routePath = file.replace(appDir, '').replace('.js', ''),
      routes = require(file)(cuk)
    if (routes instanceof pkg.lib.Router) {
      let name = cuksPkg.id + ':router:' + _.camelCase(routePath)
      if (disabled.indexOf(name) > -1) {
        helper('core:trace')('|  |  |- Disabled => %s', name)
        return
      }
      router.use(routePath, routes.routes(), routes.allowedMethods())
      helper('core:trace')('|  |  |- Enabled => %s -> %s%s', name, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, routePath)
      return
    }
    if (_.isString(routes)) {
      let name = cuksPkg.id + ':get:' + _.camelCase(routePath)
      if (disabled.indexOf(name) > -1) {
        helper('core:trace')('|  |  |- Disabled => %s', name)
        return
      }
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
      helper('core:trace')('|  |  |- Enabled => %s -> [GET] %s%s', name, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, routePath)
      return
    }
    let mws = []
    if (_.isPlainObject(routes)) {
      if (routes.route) {
        if (routes.middleware) {
          if (_.isArray(routes.middleware))
            mws = _.concat(mws, routes.middleware)
          else if (_.isString(routes.middleware))
            mws = _.concat(mws, helper('core:makeChoices')(routes.middleware))
        }
        if (routes.param)
          _.forOwn(routes.param, (v, k) => {
            router.param(k, v)
          })
        routes = routes.route
      } else {
        routes = [routes]
      }
    }
    _.each(routes, r => {
      let method = r.method || 'get',
        realPath = r.path || routePath,
        methods = helper('core:makeChoices')(method.toUpperCase())
      let parts = realPath.split('/')
      parts.shift()
      if (pkg.cfg.common.trimIndex && _.last(parts) === 'index') {
        if (pkg.cfg.common.ext === '') {
          realPath = '/' + parts.join('/')
        } else {
          parts.pop()
          realPath = '/' + parts.join('/') + (parts.length === 0 ? '':'/')
        }
      } else {
        realPath = '/' + parts.join('/') + pkg.cfg.common.ext
      }
      if (_.isArray(r.middleware))
        mws = _.concat(mws, r.middleware)
      else if (_.isString(r.middleware))
        mws = _.concat(mws, helper('core:makeChoices')(r.middleware))
      _.each(methods, m => {
        let mw = []
        if (['POST', 'PUT', 'PATCH'].indexOf(m) > -1)
          mw.push('http:bodyParser')
        mw = helper('http:composeMiddleware')(_.concat(mw, mws), '', true)
        let name = cuksPkg.id + ':' + m.toLowerCase() + ':' + _.camelCase(routePath)
        if (disabled.indexOf(name) > -1) {
          helper('core:trace')('|  |  |- Disabled => %s', name)
          return
        }
        if (r.redirect) {
          const dest = _.isFunction(r.redirect) ? r.redirect(ctx) : helper('route:url')(r.redirect, ctx)
          router.all(realPath, mw, ctx =>{
            ctx.redirect(dest)
            ctx.status = 301
          })
          helper('core:trace')('|  |  |- Enabled => %s -> [%s:Redirect] %s%s -> %s', name, m.toUpperCase(), cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, realPath, dest)
        } else {
          if (_.isPlainObject(r.param)) {
            _.forOwn(r.param, (v, k) => {
              router.param(k, v)
            })
          }
          router[m.toLowerCase()](name, realPath, mw, ctx => {
            Promise.resolve(r.handler(ctx))
            .then(async result => {
              if (ctx.body) return
              if (_.isEmpty(result)) {
                if (ctx.render)
                  await ctx.render('view:/empty')
                else
                  ctx.body = ''
              } else {
                if (ctx.render) {
                  if (result.substr(0, 1) === '/') result = 'app:' + result
                  const parts = result.split(':')
                  if (parts.length === 2 && parts[1].substr(0, 1) === '/')
                    ctx.render(result)
                  else {
                    ctx.body = await ctx.renderString(result)
                  }
                } else {
                  ctx.body = result
                }
              }
            })
          })
          let layer = router.route(name)
          if (layer) {
            layer._role = r.role || {
              customHandling: false,
              resourcePossession: 'any',
              resourceName: _.last(name.split(':'))
            }
          }
          helper('core:trace')('|  |  |- Enabled => %s -> [%s] %s%s', name, m.toUpperCase(), cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, realPath)
        }
      })
    })
  }

}