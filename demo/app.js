
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');
var MdCms = require('../');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

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

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
