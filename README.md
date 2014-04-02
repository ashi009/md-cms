# md-cms

md-cms is a markdown based CMS, which can be embedded in express as a route.

## Features

- Folder based content organization
- Built-in TOC generation
- Plug-ins

## Install

You may install md-cms from npm registry.

```shell
npm install md-cms
```

## Sample configuration

Please check out demo folder in the repository for details.

```js
var MdCms = require('md-cms');
var cms = new MdCms({
  root: path.join(__dirname, 'content')
});

app.get('/', function(req, res, next) {
  cms.getPageList(function(err, list) {
    if (err)
      return next(err);
    res.render('blog-list', {
      list: list
    });
  });
});

app.use('/', function(req, res, next) {
  cms.getPage(req.path, function(err, page, html) {
    if (err || !page)
      return next(err);
    res.render('blog-page', {
      page: page,
      html: html
    });
  });
});

```

## Plug-in

md-cms supports plug-in to make markdown even more powerful.

plug-in uses markdown code block syntax, you may specify language as
`cms.[plugin-name]` and the content in the code block will be forwarded to the corresponding plug-in handler.

```markdown
```cms.[plug-in name]
[plug-in configuration]
``
```

### Example

```markdown
```cms.page
{
  "ctime": 1393427527217,
  "author": "ashi009"
}
``
```

Which will set meta of the page. In the above case, it includes create time and author.

This info could be accessed via `page.info` in `cms.getPage` callback.

### Create New Plug-in

Creating a new plug-in is fairly simple, just create a js file in *plugins* folder, and Md-cms will automatically loaded it. Note that *filename* will be used as plug-in name, and exports a function as plug-in handler.

You may also add a plug-in handler to `MdCms.plugins` at runtime, the *property name* will be used as plug-in name, and the `value` should be the handler.

```js
function(code, page, callback) {
  try {
    page.info = JSON.parse(code);
    callback(null, '');
  } catch (e) {
    callback(e);
  }
};
```

The handler will take 3 parameters:
- `code` is the *plug-in configuration*, do whatever you want with that
- `page` is a reference to `page`
- `callback(err, html)` html is the final output.
