require('apollojs');

var Path = require('path');
var MatchFiles = require('match-files');
var marked = require('marked');
var async = require('async');

var Page = require('./page');

function MdCms(options) {
  this._root = Path.resolve(options.root);
  this._pages = null;
  this._list = null;
  this._options = options;
}
$declare(MdCms, {
  /**
   * get Pages of the CMS
   * @param  {Function} callback(err, pages)
   */
  _getPages: function(callback) {
    if (this._pages)
      return callback(null, this._pages);
    var self = this;
    MatchFiles.find(this._root, {
      fileFilters: [function(filename) {
        return filename.endsWith('.md');
      }]
    }, function(err, files) {
      if (err)
        return callback(err);
      var pages = {};
      files.forEach(function(filename) {
        var path = filename.substring(self._root.length, filename.length - 3);
        pages[path] = new Page(filename);
      });
      self._pages = pages;
      callback(null, pages);
    });
  },

  getPageList: function(callback) {
    if (this._list)
      return callback(null, this._list);
    var self = this;
    this._getPages(function(err, pages) {
      var alist = [];
      async.forEach(Object.keys(pages), function(path, callback) {
        pages[path].getInfo(function(err, info) {
          if (err)
            return callback(err);
          alist.push({
            path: path,
            info: info
          });
          callback(null);
        });
      }, function(err) {
        if (err)
          return callback(err);
        var sorter = self._options.sorter || ctimeSorter;
        alist.sort(function(lhv, rhv) {
          return sorter(lhv.info, rhv.info);
        });
        var list = {};
        for (var i = 0; i < alist.length; i++)
          list[alist[i].path] = alist[i].info;

        self._list = list;
        callback(null, list);
      });

    });
  },

  refresh: function(callback) {
    this._pages = null;
    this._list = null;
    this._getPages(function(err) {
      if (err)
        return callback(err);
    });
  },

  getPage: function(path, callback) {
    var page = this._pages && this._pages[path];
    if (page)
      return page.getHtml(function(err, html) {
        callback(err, page, html);
      });
    callback(null);
  }

});

function ctimeSorter(lhp, rhp) {
  if (lhp.ctime == rhp.ctime) {
    if (lhp.title < rhp.title)
      return -1;
    if (lhp.title > rhp.title)
      return 1;
    return 0;
  }
  return lhp.ctime - rhp.ctime;
}

module.exports = MdCms;
