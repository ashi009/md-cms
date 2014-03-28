md-cms
======

md-cms is a markdown based CMS, which can be embedded in express as a route.

Example:

```js
var cms = new MdCms({
  root: path.join(__dirname, 'content')
});

app.get('/blog', function(req, res, next) {
  cms.getPageList(function(err, list) {
    if (err)
      return next(err);
    res.render('blog-list', {
      list: list
    });
  });
});

app.use('/blog', function(req, res, next) {
  cms.getPage(req.path, function(err, page, html) {
    if (err)
      return next(err);
    if (!page)
      return res.send(404);
    res.render('blog-page', {
      page: page,
      html: html
    });
  });
});
```
