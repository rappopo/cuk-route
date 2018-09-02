'use strict'

module.exports = function (cuk) {
  const { path } = cuk.pkg.core.lib
  return Promise.resolve({
    id: 'route',
    level: 30,
    lib: {
      Router: require('koa-router')
    }
  })
}