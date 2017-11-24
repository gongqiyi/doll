'use strict';
var appconfig = require("../config"),
  tempData = {};
/** 
 * tool - 合并json数组
 * @params true|{},[{}...]
 *  */
function extend() {
  var src, copyIsArray, copy, name, options, clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false;
  if (typeof target === "boolean") {
    deep = target;
    target = arguments[i] || {};
    i++;
  }
  if (typeof target !== "object" && typeof target !== "function") {
    target = {};
  }
  if (i === length) {
    target = this;
    i--;
  }
  for (; i < length; i++) {
    if ((options = arguments[i]) != null) {
      for (name in options) {
        src = target[name];
        copy = options[name];
        if (target === copy) {
          continue;
        }
        if (deep && copy && (isJson(copy) || (copyIsArray = isArray(copy)))) {
          if (copyIsArray) {
            copyIsArray = false;
            clone = src && isArray(src) ? src : [];
          } else {
            clone = src && isJson(src) ? src : {};
          }
          target[name] = extend(deep, clone, copy);
        } else if (copy !== undefined) {
          target[name] = copy;
        }
      }
    }
  }
  return target;
}

/** 
 * tool - 序列化json数组
 * @params json {}
 * @params limit 剔除限制参数 array[]
*  */
function serialize(params, limit, isfilter) {
  if (!params) {
    return "";
  }
  var dataArray = [];
  for (var k in params) {
    if (limit && inArray(k, limit)) {
      continue;
    }
    if (isArray(params[k]) || isJson(params[k])) {
      dataArray.push(k + "=" + encodeURIComponent(JSON.stringify(params[k])));
    } else {
      // if (isfilter) {  //文本过滤
      //   params[k] = textFilter(params[k]);
      // }
      dataArray.push(k + "=" + params[k]);
    }
  }
  return dataArray.join("&");
}
/**
 * tool - 拼接URL
 */
function urlSplice(url, params, limit, isfilter) {
  if (isJson(params)) {
    var options = serialize(params, limit, isfilter);
    return url + (options ? ((url.indexOf("?") < 0 ? "?" : "&") + options) : "");
  } else {
    return url;
  }
}
/**
 * 文本过滤
*/
function textFilter(text, config) {
  config = extend(true, {
    reg: /\&|\#|\$|\<|\>/g,
    istrim: true,
    reby: "*"
  }, config);
  if (typeof text == "string") {
    text = text.trim();
    text = text.replace(config.reg, config.reby);
  }
  return text;
}

function isFunction(fun) {
  return typeof fun == "function" ? true : false;
}
function isArray(arr) {
  return (arr instanceof Array);
}
/**
 * tool 判断元素是否在数据中
 * @str 字符串
 * @arr 目标数组
 * @isindex 是否返回索引
 */
function inArray(str, arr, isindex) {
  if (!arr) { return isindex ? -1 : false; }
  var arrLen = arr.length;
  for (var i = 0; i < arrLen; i++) {
    if (arr[i] == str) {
      return isindex ? i : true;
    } else {
      continue;
    }
  }
  return isindex ? -1 : false;
}
/**
 * 判断元素是否为json对象
 */
function isJson(obj) {
  var len = arguments.length;
  if (len > 1) {
    for (var i = 0; i < len; i++) {
      if (!isJson(arguments[i])) {
        return false;
      }
    }
    return true;
  } else {
    return typeof (obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
  }
  // return (typeof obj == "object" && !(obj instanceof Array));
}
/**
 * 数组或json对象是否为空
 */
function isEmpty(params) {
  var key;
  if (isArray(params)) {
    return params.length > 0 ? false : true;
  } else if (isJson(params)) {
    for (key in params) {
      return false;
    }
    return true;
  } else {
    return true;
  }
}

/**
 * 日期过滤
 */
function dateFilter(date) {
  var dateArr, reg = /\d{4}(-|\/)\d{1,2}(-|\/)\d{1,2}\s(\d{1,2}:?){3}/, date_;
  if (!date) {
    date_ = "";
  } else {
    dateArr = date.match(reg);
    if (dateArr) {
      date = dateArr[0];
      date = date.replace(/\-/g, "/");
      date_ = Date.parse(date);
    }
  }
  return date_;
}

/**
 * 日期格式化
 */
function formatDate(date) {
  date = dateFilter(date);
  var nowDate = new Date(), fDate_, nTs, fTs, aday = 24 * 3600 * 1000, reg = /\-/g, fDateArr;
  date = date ? date : nowDate.getTime();
  date = new Date(date);
  var ts = date.getTime(),
    year = date.getFullYear(),
    month = date.getMonth() + 1,
    day = date.getDate(),
    hour = date.getHours(),
    minute = date.getMinutes(),
    second = date.getSeconds(),
    fDate = [year, month, day].map(addZero).join('-'),
    fTime = [hour, minute].map(addZero).join(':'),
    ny = nowDate.getFullYear(),
    nm = nowDate.getMonth() + 1,
    nd = nowDate.getDate(),
    nDate = [ny, nm, nd].map(addZero).join('-');
  fTs = Date.parse(fDate.replace(reg, "/"));
  nTs = Date.parse(nDate.replace(reg, "/"));
  if (fTs == nTs) {
    fDate_ = "今天";
  } else if (nTs - fTs >= aday && nTs - fTs < 2 * aday) {
    fDate_ = "昨天";
  } else if (fTs - nTs >= aday && fTs - nTs < 2 * aday) {
    fDate_ = "明天";
  } else {
    fDateArr = ny == year ? [month, day] : [year, month, day];
    fDate_ = fDateArr.map(addZero).join('-');
  }
  return {
    "date": fDate_ + " " + fTime,
    "date_": fDate + " " + fTime,
    "second": second,
    "ts": ts
  };
}

function addZero(n) { //补0
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 数组排序  type[as(升序)||de(降序)]
 * key
 */
function arrSort(arr, ag1, ag2) {
  var type = "as", key = "", res = 1, k, jArr, kArr;
  if (ag1 && ag1 == "as" || ag1 == "de") {
    type = ag1;
  } else {
    key = ag1;
  }
  if (ag2) {
    key = ag2;
  }
  res = type == "as" ? 1 : -1;
  if (isJson(arr)) {
    arr = extendJson(true, {}, arr);
    kArr = [];
    jArr = [];
    for (k in arr) {
      jArr.push(arr[k]);
      kArr.push(k);
    }
    arr = jArr;
  }
  if (key) {
    arr.sort(function (a, b) {
      return a[key] > b[key] ? res : -res;
    });
  } else {
    arr.sort(function (a, b) {
      return a > b ? res : -res;
    });
  }
  return {
    arr: arr,
    legth: arr.length,
    key: kArr
  };
}

/**
 * 去除首位空格 //isall == true 去除所有空格
 */
function trim(str, isall) {
  if (typeof str == 'string') {
    var reg = /\s/g;
    return isall ? str.replace(reg, '') : str.trim();
  } else {
    return str || '';
  }

}

/**
 * 日期比较
 */
function dateCompare(a, b) {
  var time = /^\d{1,2}:\d{1,2}$/,
    reg_ = /\-/g;
  if (time.test(a) && time.test(b)) { //时间比较
    a = a.split(':');
    b = b.split(':');
    return (a[0] * 60 + a[1]) - (b[0] * 60 + b[1]);
  } else {
    a = new Date(a.replace(reg_, '/'));
    b = new Date(b.replace(reg_, '/'));
    return a_ts - b_ts;
  }
}

/**
 * 首字母大写 [string,boolean]，是否将其他字符小写
 */
function wordHump(str, islower) {
  var reg = /\b(\w)|\s(\w)/g;
  str = islower ? str.toLowerCase() : str;
  return str.replace(reg, function (m) { return m.toUpperCase() })
}

/**
 * 导航
 */
function onNavigator(config) {
  config = extend(true, {
    url: "",
    target: "blank",
    ischeck: true,                  //是否检查登录状态
    iscallback: true,               //登录是否跳转回当前页面
    delta: 1,
    options: {}
  }, config);
  var intervalTimer, nowts = formatDate().ts;
  tempData.jumpDelay = tempData.jumpDelay || 0;
  intervalTimer = 1 * nowts - tempData.jumpDelay;
  tempData.jumpDelay = nowts;
  if (intervalTimer < 1000 && tempData.preurl == config.url) {  //防止重复点击
    tempData.preurl = "";
    return;
  }
  tempData.preurl = config.url;

  var pages = getAppConfig('pages'),
    url,
    p_reg = /^\/pages\//,
    q_reg = /\?(\w&?=?)*/,
    m_reg = /\//;

  if (!config.url) {
    var curpages = getCurrentPages();
    if (curpages.length == 1) {
      wx.switchTab({
        url: '/pages/index/index'
      });
    } else {
      wx.navigateBack({
        delta: config.delta
      });
    }
    return;
  }
  config.url = decodeURIComponent(config.url);
  if (!m_reg.test(config.url) && !pages[config.url]) {
    return;
  }

  url = urlSplice(m_reg.test(config.url) ? config.url : pages[config.url].url, config.options, "", true);

  if (pages[config.url] && pages[config.url].isLogin != false && config.ischeck && url != "login") { //验证登录状态
    var appobj = getApp(),
      pageobj = getPage(),
      backUrl = config.iscallback ? encodeURIComponent(url) : "",
      loginRes = appobj.checkLogin();

    if (loginRes.code > 0) {
      if (pageobj.isAutoLogin) {
        appobj.onLogin(function (res) {
          res.code == 0 && jump(url);
        });
        return;
      } else {
        url = pages['login'].url + "?callback=" + backUrl;
      }
    } else if (!loginRes.data.inn_name && pageobj.route != 'pages/register/register') {
      // url = pages["register"].url + "?callback=" + backUrl;
    }
  }

  jump(url);

  function jump(url) {
    if (!p_reg.test(url)) {
      url = "/pages/" + url;
    }
    config.target = pages[config.url] && pages[config.url].isTab ? "tab" : config.target;
    if (config.target == "blank") {
      wx.navigateTo({ url: url });
    } else if (config.target == "self") {
      wx.redirectTo({ url: url });
    } else if (config.target == "tab") {
      url = url.replace(q_reg, "");
      wx.switchTab({ url: url });
    } else if (config.target == "relaunch" && wx.reLaunch) {
      wx.reLaunch({ url: url });
    }
    isFunction(config.cb) && config.cb(url);
  }
}

/**
 * 本地数据存储
 */
function dataStorage(key) {
  var o = new Object();
  o.key = key || "";
  o.setTs = function (data) {
    var ts = formatDate().ts;
    return {
      ts: ts,
      data: data
    }
  }
  o.get = function (key) {  //获取
    key = key || this.key;
    var res = wx.getStorageSync(key) || {};
    return res;
  }
  o.set = function (key, data) { //设置
    key = key || this.key;
    var res = this.setTs(data);
    wx.setStorageSync(key, res);
    return res;
  }
  o.remove = function (key) { //移除
    key = key || this.key;
    var res, that = this;
    if (isArray(key)) {
      key.map(function (key__) {
        that.remove(key__);
      });
    } else {
      wx.removeStorageSync(key);
    }

    return res;
  }
  o.clear = function () { //清空
    var info = this.getInfo() || {};
    info.keys && info.keys.length > 0 && wx.clearStorageSync();
  }
  o.reset = function (key, params) { //重置部分信息
    var res = this.get(key);
    res.data = isJson(params, res.data) ? extend(true, {}, res.data, params) : params;
    this.set(key, res.data);
    return res.data;
  }
  o.getInfo = function () { //获取信息
    return wx.getStorageInfoSync();
  }
  return o;
}

/**
 * 获取指定页面的配置信息
*/
function getPageConfig(route) {
  var pages = getAppConfig('pages'), obj;
  if (!route) {
    obj = getPage();
    route = obj.route;
  }
  for (var p in pages) {
    if ('pages/' + pages[p].url == route) {
      pages[p].key = p;
      return pages[p];
    }
  }
  return {};
}

/**
 * 拨号
 */
function makePhoneCall(num) {
  wx.makePhoneCall({
    phoneNumber: num
  });
}
/**
 * 粘贴板操作
 */
function clipboardDeal() {
  var o = new Object();
  o.getClipboardData = function (callback) {
    wx.getClipboardData ? wx.getClipboardData({
      success: function (res) {
        callback("success", res.data);
      }
    }) : callback("fail", {});
  }
  o.setClipboardData = function (data, callback) {
    data && wx.setClipboardData && wx.setClipboardData({
      data: data,
      success: function (res) {
        isFunction(callback) && callback("success");
      },
      fail: function () {
        isFunction(callback) && callback("fail");
      }
    })
  }
}
/**
 * 设置导航名称
 */
function setTitle(title) {
  title && wx.setNavigationBarTitle({
    title: title
  });
}

/**
 * 获取指定页面对象 index 0：当前页；1：上一页，依次类推
 */
function getPage(index) {
  index = typeof index == "undefined" ? 0 : index;
  var pages = getCurrentPages(), len = pages.length,
    obj = pages[len - (1 + index)] || pages[len - 1];
  return obj || { setData: function () { } };
}

/**
 * 获取config内容
*/
function getAppConfig(key) {
  return key ? appconfig[key] : appconfig;
}

/**
 * 获取设备信息
*/
function getSystemInfo() {
  var res = wx.getSystemInfoSync(),
    system = res.system.split(' ');
  res.system = {
    name: system[0].toLowerCase(),
    version: system[1]
  }
  return res;
}

module.exports = {
  getPageConfig: getPageConfig,  //获取指定页面配置
  getSystemInfo: getSystemInfo,  //获取设备信息
  getAppConfig: getAppConfig, //获取config内容
  extend: extend,                     //合并json数组
  serialize: serialize,               //json数组序列化  
  textFilter: textFilter,             //过滤文本
  isFunction: isFunction,             //是否为函数
  isArray: isArray,                   //是否为数组 
  inArray: inArray,                   //是否存在数组中，或在数组中的索引
  isJson: isJson,                     //是否为json
  isEmpty: isEmpty,                   //判断是否为空json|array
  formatDate: formatDate,             //日期格式化
  addZero: addZero,                   //补0
  urlSplice: urlSplice,                //拼接url
  trim: trim,                                //去除首位空格
  arrSort: arrSort,                      //数组排序
  dateCompare: dateCompare,  //日期比较
  wordHump: wordHump,            //首字母大写
  onNavigator: onNavigator,                //导航
  storage: dataStorage(),                     //本地数据存储
  clipboardDeal: wx.getClipboardData ? clipboardDeal() : false,  //粘贴板操作
  makePhoneCall: makePhoneCall,   //呼叫
  setTitle: setTitle,  //设置导航栏名称
  getPage: getPage  //获取对应页面对象
};