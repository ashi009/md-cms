module.exports = function(code, page, callback) {
  try {
    var info = JSON.parse(code);
    page._info = info;
    callback(null, '');
  } catch (e) {
    callback(e);
  }
};
