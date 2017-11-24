var tools = require("tools");
module.exports = function (config, callback) {
  config = config ? tools.extend(true, {
    title: "",
    icon: "tips",
    isarray: false,
    duration: 1500,
    status: "show",
    mask: false
  }, config) : {};
  if (config.icon == "loading") {
    config.duration = 30000;
    wx.showLoading ? wx.showLoading(config) : wx.showToast(config);
  } else if (config.icon == "success") {
    if (config.title) {
      wx.showToast(config);
      config.time__ && clearTimeout(config.time__);
      config.time__ = setTimeout(function () {
        tools.isFunction(callback) && callback(config.icon, "hide");
      }, config.duration);
    } else {
      wx.hideToast();
    }
  } else {
    wx.hideToast();
    if (!config.title) {
      return;
    }
    config.time_ && clearTimeout(config.time_);
    var pageobj = tools.getPage();
    config.isarray = tools.isArray(config.title);
    pageobj.setData({ toastData: config });
    config.time_ = setTimeout(function () {
      pageobj.setData(
        { "toastData.status": "hide" }
      );
      tools.isFunction(callback) && callback(config.icon, "hide");
    }, config.duration);

  }
}