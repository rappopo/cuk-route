'use strict'

module.exports = function(cuk) {
  const { _, helper } = cuk.lib

  return function(middleware) {
    if (!helper('core:isSet')(middleware)) return []
    let mws = _.isArray(middleware) ? middleware : [middleware],
      deleted = []
    _.each(mws, (mw, i) => {
      if (_.isFunction(mw)) return
      if (_.isString(mw)) {
        mws[i] = helper('http:middleware')(mw)()
      } else if (_.isPlainObject(mw)) {
        mws[i] = helper('http:middleware')(mw.name)(mw.argument)
      } else {
        deleted.push(i)
      }
    })
    return mws
  }


}