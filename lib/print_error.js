'use script'

module.exports = function (cuk) {

  const transformError = function (err, ctx) {
    let result = {
      success: false,
      statusCode: err.statusCode || err.status || 500
    }
    if (err.name === 'SequelizeValidationError') {
      result.message = ctx.i18n.__('Validation error')
      let details = {}
      _.each(err.errors, e => {
        if (!details[e.path]) details[e.path] = []
        details[e.path].push(e.validatorKey)
      })
      result.details = details
    } else if (err.message === ctx.i18n.__('Validation error')) {
      result.message = err.message
      result.details = err.details || {}
    } else {
      result.message = ctx.i18n.__(err.message)
    }
    return helper.createError(result.message, {
      status: result.statusCode,
      details: result.details
    })
  }

}