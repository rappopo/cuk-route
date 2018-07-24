'use strict'

module.exports = function(cuk){
  let pkgId = 'route',
    pkg = cuk.pkg[pkgId]
  const { _, helper, path, fs, globby } = cuk.pkg.core.lib
  const { Router } = cuk.pkg.route.lib
  const app = cuk.pkg.http.lib.app
  const makeRoute = require('./lib/make_route')(cuk)

  return new Promise((resolve, reject) => {
    let defMw = ['http:responseTime'],
      cfgMw = _.get(pkg.cfg, 'common.defaultMiddleware')
    if (_.isArray(cfgMw))
      defMw = _.concat(defMw, cfgMw)
    else if (_.isString(cfgMw) && !_.isEmpty(cfgMw))
      defMw = _.concat(defMw, helper('core:makeChoices')(cfgMw))

    app.use(helper('http:composeMiddleware')(defMw, ''))

    helper('core:trace')('|  |- Loading routes...')
    helper('core:bootDeep')({
      pkgId: pkgId,
      name: '',
      parentAction: opts => {
        let opt = opts.pkg.cfg.common.mount === '/' ? null : { prefix: opts.pkg.cfg.common.mount }
        let router = new Router(opt)
        router.pkgId = opts.pkg.id
        _.set(opts.pkg.cuks, 'router', router)
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