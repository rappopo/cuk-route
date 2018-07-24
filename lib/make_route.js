'use strict'


module.exports = function(cuk) {
  const { _, helper } = cuk.pkg.core.lib

  return function(file, cuksPkg, pkg, router, appDir) {
    const disabled = _.get(cuk.pkg.route, 'cfg.common.disabled', [])
    let routePath = file.replace(appDir, '').replace('.js', ''),
      routes = require(file)(cuk)
    if (routes instanceof pkg.lib.Router) {
      let name = _.camelCase(`${routePath}`),
        fullName = cuksPkg.id + ':' + name
      router.use(routePath, routes.routes(), routes.allowedMethods())
      helper('core:trace')('|  |  |- Enabled => %s -> [Router] %s%s', fullName, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, routePath)
      return
    }
    if (_.isString(routes)) {
      let name = _.camelCase(`GET:${routePath}`),
        fullName = cuksPkg.id + ':' + name
      if (disabled.indexOf(fullName) > -1) {
        helper('core:trace')('|  |  |- Disabled => %s', fullName)
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

      helper('core:trace')('|  |  |- Enabled => %s -> [GET] %s%s', fullName, cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, routePath)
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
        rpath = r.path || routePath,
        methods = helper('core:makeChoices')(method.toUpperCase())
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
      if (_.isArray(r.middleware))
        mws = _.concat(mws, r.middleware)
      else if (_.isString(r.middleware))
        mws = _.concat(mws, helper('core:makeChoices')(r.middleware))
      // todo: rearrange middleware
      // let mws = helper('http:composeMiddleware')(r.middleware, `${pkg.id}:${cuksPkg.id}:${routePath}:${_.map(methods, m => m.toUpperCase()).join(',')}`, true)
      _.each(methods, m => {
        let mw = []
        if (['POST', 'PUT', 'PATCH'].indexOf(m.toUpperCase()) > -1)
          mw.push('http:bodyParser')
        mw = helper('http:composeMiddleware')(_.concat(mw, mws), '', true)
        let name = _.camelCase(`${m}:${routePath}`),
          fullName = cuksPkg.id + ':' + name
        if (disabled.indexOf(fullName) > -1) {
          helper('core:trace')('|  |  |- Disabled => %s', fullName)
          return
        }
        if (r.redirect) {
          let dest = _.isString(r.redirect) ? r.redirect : (r.destination || fullName)
          router.all(rpath, mw, ctx =>{
            ctx.redirect(dest)
            ctx.status = 301
          })
          helper('core:trace')('|  |  |- Enabled => %s -> [%s:Redirect] %s%s -> %s', fullName, m.toUpperCase(), cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, rpath, dest)
        } else {
          if (_.isPlainObject(r.param)) {
            _.forOwn(r.param, (v, k) => {
              router.param(k, v)
            })
          }
//          router[m.toLowerCase()](name, rpath, mws, r.handler)
          router[m.toLowerCase()](name, rpath, mw, ctx => {
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
          helper('core:trace')('|  |  |- Enabled => %s -> [%s] %s%s', fullName, m.toUpperCase(), cuksPkg.cfg.common.mount === '/' ? '' : cuksPkg.cfg.common.mount, rpath)
        }
      })
    })
  }

}