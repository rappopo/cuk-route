'use strict'

module.exports = function(cuk) {
  const { _, helper } = cuk.pkg.core.lib

  return (name, ctx = {}, opts = {}) => {
    const [pkgId, routeName, pkg] = helper('core:pkgSplitToken')(name, 'Invalid route name (%s)')
    const router = _.get(cuk.pkg, pkgId + '.cuks.router')
    if (!router) throw helper('core:makeError')('Package doesn\\t have a router')
    let params = opts.params || {}
    if (ctx.i18n) {
      const cfg = cuk.pkg.i18n.cfg.common
      let p = {}
      if (cfg.detector.method.indexOf('path') > -1)
        p[cfg.detector.fieldName] = ctx.session[cfg.detector.fieldName]
      if (!_.isEmpty(p)) params = helper('core:merge')(params, p)
    }
    return router.url(routeName, params, opts.opts)
  }
}