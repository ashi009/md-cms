var fs = require('fs');
var marked = require('marked');
var han = require('han');
var plugins = require('./plugins');

var rendererProto = marked.Renderer.prototype;

function TocEntry(level, title, anchor) {
  this.level = level;
  this.title = title;
  this.anchor = anchor;
  this.entries = [];
}

function Renderer(options, page) {
  marked.Renderer.call(this, options);
  this.page = page;
  this.tocStack = [];
}
$inherit(Renderer, marked.Renderer, {
  heading: function(text, level, raw) {
    var anchor = this.options.headerPrefix + han.letter(raw, ' ')
        .replace(/[^\w]+/g, '-');
    var tocEntry = new TocEntry(level, text, anchor);
    if (level == 1) {
      var info = this.page.info;
      info.title = text;
      info.toc = tocEntry;
    } else {
      while (this.tocStack.back.level >= level)
        this.tocStack.pop();
      while (this.tocStack.back.level < level - 1) {
        var psudoEntry = new TocEntry(this.tocStack.back.level + 1);
        this.tocStack.back.entries.push(psudoEntry);
        this.tocStack.push(psudoEntry);
      }
      this.tocStack.back.entries.push(tocEntry);
    }
    this.tocStack.push(tocEntry);
    return '<h' + level +
        ' id="' + anchor + '">' + text +
        '</h' + level + '>';
  },
  code: function(code, lang) {
    if (lang.startsWith('cms.'))
      return code;
    return rendererProto.code.apply(this, arguments);
  }
});

function Page(sourcePath) {
  this._info = {
    title: null,
    author: null,
    ctime: Date.now(),
    mtime: Date.now(),
    toc: null
  };
  this._sourcePath = sourcePath;
  this._html = null;
  this._dirty = true;
}
$declare(Page, {
  /**
   * Set a page's basic info
   * @param {object} info info descriptor
   */
  set info(info) {
    $extend(this._info, info, true);
  },
  /**
   * get a page's basic info
   * @return {[type]} [description]
   */
  get info() {
    return this._info;
  },
  /**
   * Render a page
   * @private
   * @param  {Function} callback(err, html)
   */
  _render: function(callback) {
    var content = fs.readFileSync(this._sourcePath);
    var self = this;
    // Using highlightErr to store generated error as marked ignores them
    var highlightErr = null;
    marked(content.toString(), {
      highlight: function(code, lang, callback) {
        if (!lang.startsWith('cms.'))
          return callback(null, code);
        plugin = lang.substr(4);
        if (plugin in plugins)
          return plugins[plugin](code, self, function(err, res) {
            highlightErr = highlightErr || err;
            callback(err, res);
          });
        highlightErr = $error('Failed to find plugin %s', JSON.stringify(plugin));
        callback(highlightErr);
      },
      renderer: new Renderer(null, this)
    }, function(err, html) {
      callback(err || highlightErr, html);
    });
  },
  /**
   * Get html of the page, which will automatically cache the result.
   * @param  {Function} callback(err, html)
   */
  getHtml: function(callback) {
    if (!this._dirty)
      return callback(null, this._html);
    var self = this;
    this._render(function(err, html) {
      if (err)
        return callback(err);
      self._dirty = false;
      self._html = html;
      callback(null, html);
    });
  },
  /**
   * Get info of the page
   * @return {Object} info descriptor
   */
  getInfo: function(callback) {
    var self = this;
    this.getHtml(function(err) {
      if (err)
        return callback(err);
      callback(null, self._info);
    });
  }
});

module.exports = Page;
