'use strict'

module.exports = function (cuk) {
  const { _, helper } = cuk.pkg.core.lib

  return name => {
    const router = helper('route:getRouter')(name)
    return router.route(name)
  }
}