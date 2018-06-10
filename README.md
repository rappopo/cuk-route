## @rappopo/cuk-route

### Route File

1. Raw body content

```javascript
module.exports = function(cuk) {
  return '<p>Your content here...</p>'
}
```

2. View content

```javascript
module.exports = function(cuk) {
  return 'view:root:/my/view'
}
```

3. One and only route object

```javascript
module.exports = function(cuk) {
  ...
  return {
    method: 'GET',
    middleware: 'root:routeMiddleware',
    path: '/my/custom/route/path',
    param: {
      routeParam: (routeParam, ctx, next) => {
        ...
        return next()
      }
      ...
    },
    handler: async (ctx, next) => {
      ...
      ctx.render('root:/my/view')
    }
  }
}
```

4. Array of many route objects

```javascript
module.exports = function(cuk) {
  ...
  return [{
    method: 'GET',
    middleware: 'root:routeMiddleware',
    path: '/my/custom/route/path',
    param: {
      routeParam: (routeParam, ctx, next) => {
        ...
        return next()
      }
      ...
    },
    handler: async (ctx, next) => {
      ...
      ctx.render('root:/my/view')
    }
  }, {
    ...
  }]
}
```

5. Complete with global options

```javascript
module.exports = function(cuk) {
  ...
  return {
    middleware: 'root:globalMiddleware',
    param: {
      globalParam: (globalParam, ctx, next) => {
        ...
        return next()
      },
      ...
    },
    route: [
      {
        method: 'GET',
        middleware: 'root:routeMiddleware',
        path: '/my/custom/route/path',
        param: {
          routeParam: (routeParam, ctx, next) => {
            ...
            return next()
          }
          ...
        },
        handler: async (ctx, next) => {
          ...
          ctx.render('root:/my/view')
        }
      },
      ...
    ]
  }
}
```

## Links

* [Documentation](https://docs.rappopo.com/cuk-route/)
* [Changelog](CHANGELOG.md)
* Donation: Bitcoin **16HVCkdaNMvw3YdBYGHbtt3K5bmpRmH74Y**

## License

[MIT](LICENSE.md)
