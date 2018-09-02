'use script'

module.exports = function (cuk) {
  const { helper } = cuk.pkg.core.lib

  return (url, err, ctx) => {
    url = helper('route:url')(url, ctx)
    ctx.redirect(url)
  }
}