var fs = require('fs');
var marked = require('marked');
var han = require('han');
var plugins = require('./plugins');

var rendererProto = marked.Renderer.prototype;

function Renderer(options, page) {
  marked.Renderer.call(this, options);
  this.page = page;
}
$inherit(Renderer, marked.Renderer, {
  heading: function(text, level, raw) {
    if (level == 1 && !this.page.title) {
      this.page.title = text;
    }
    raw = han.letter(raw, ' ');
    return rendererProto.heading.call(this, text, level, raw);
  },
  code: function(code, lang) {
    if (lang.startsWith('cms.'))
      return code;
    return rendererProto.code.call(this, code, lang);
  }
});

function Page(sourcePath) {
  this.title = null;
  this.author = null;
  this.ctime = null;
  this.mtime = null;
  this._sourcePath = sourcePath;
  this._html = null;
  this._dirty = true;
}
$declare(Page, {
  /**
   * Set a page's basic info
   * @private
   * @param {object} info info descriptor
   */
  set _info(info) {
    for (var key in this) {
      if (key[0] != '_' && info[key])
        this[key] = info[key];
    }
  },
  /**
   * get a page's basic info
   * @private
   * @return {[type]} [description]
   */
  get _info() {
    var info = {};
    for (var key in this)
      if (key[0] != '_')
        info[key] = this[key];
    return info;
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
