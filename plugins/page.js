module.exports = function(code, page, callback) {
  try {
    page.info = JSON.parse(code);
    callback(null, '');
  } catch (e) {
    callback(e);
  }
};
