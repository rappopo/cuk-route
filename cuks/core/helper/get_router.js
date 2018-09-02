'use strict'

module.exports = function (cuk) {
  const { _, helper } = cuk.pkg.core.lib

  return name => {
    const names = name.split(':')
    if (names.length < 3) throw helper('core:makeError')(`Invalid route name (${name})`)
    const router = _.get(cuk.pkg, names[0] + '.cuks.route.router')
    if (!router) throw helper('core:makeError')(`No router for route ${name} found`)
    return router
  }
}