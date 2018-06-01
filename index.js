'use strict'

module.exports = function(cuk) {
  const { path } = cuk.lib
  return Promise.resolve({
    id: 'route',
    tag: 'boot',
    level: 2
  })
}