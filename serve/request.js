var toast = require("toast"),
  md5 = require("../plugin/CryptoJS/md5"),
  promise = require("../plugin/Promise/es6-promise"),
  form = require('../component/form/check'),
  tools = require("tools");

'use strict';


/**
 * 加载器入口
 */
function request(config, appobj) {
  config = tools.extend(true, {
    domain: "https://api.kuaidihelp.com",
    url: "",
    resFilter: function (res, req) {        //响应数据过滤
      return res;
    },
    reqFilter: function (req) {   //请求数据过滤
      return req;
    },
    reqCheck: '',   //请求检测
    isAuto: true,    //自动发起请求
    isFormat: true,  //是否格式化接口，api验证信息
    isTran: false,  //走转接口
    hasOpenId: false,   //是否传输openid
    tips: {
      loading: '请稍后...',   //false则不提示
      success: false,       //若为字符，直接toast使用此文案，false则不提示
      error: true             //若为字符，直接toast使用此文案，false则不提示
    },
    form: '',  //存在form则验证{rule:'',required:'',max:'',min:''}
    isLoginCheck: false,  //是否检查登录状态
    isToast: true,  //toast==false navbar显示加载中
    toast: {
      duration: 1500,
      mask: false
    }
  }, config);
  var o = new Object();
  o.appobj = appobj || getApp();
  o.apiAuth = tools.getAppConfig('apiAuth');
  o.appAttr = tools.getAppConfig('appAttr');
  o.systemInfo = tools.getSystemInfo();
  o.init = function (params) {  //初始化
    this.config = tools.extend(true, {}, config, params);
    this.config.isAuto && this.request();
  }
  o.enentHandler = function (evtype, data) {  //状态监控
    var that = this, loginRes;
    data = data || { code: 505, msg: '服务中断，请稍后重试' };
    switch (evtype) {
      case 'before':
        this.toast({
          icon: 'loading'
        });
        if (this.config.isLoginCheck) {
          loginRes = this.appobj.checkLogin();
          if (loginRes.code > 0) {
            return { code: 1, data: { code: 1, msg: '您还没有登录哦' } };
          }
        }
        break;
      case 'success':  //请求成功
        this.toast({
          icon: data.code == 0 ? 'success' : 'error',
          title: (data.code == 404 ? ('url：' + this.config.url + '，msg：') : '') + data.msg
        }, function () {
          if (data.code == 1011) {  //登录失效
            tools.storage.remove('loginInfo');
            that.appobj.onLogin();
          }
        });
        break;
      case 'fail':    //请求失败
        this.toast({
          icon: 'error',
          title: data.msg
        });
        break;
      case 'complete':
        break;
    }
    return tools.isFunction(this.config[evtype]) && this.config[evtype](data, this.config.data);
  },
    o.request = function (data) {  //请求
      if (!this.config.url) {
        return;
      }
      var url, sendData, that = this, checkRes, beforeRes;
      this.config.data = this.config.reqFilter(tools.extend(true, that.config.data, data)) || this.config.data;
      if (this.config.form) {
        checkRes = form.check(this.config.form, this.config.data);
        if (checkRes.code > 0) {
          checkRes.msg && this.toast({ title: checkRes.msg, icon: 'error' });
          return;
        }
      }
      if (tools.isFunction(this.config.reqCheck)) {
        checkRes = this.config.reqCheck(this.config.data);
        if (checkRes && checkRes.code > 0) {
          checkRes.msg && toast({ title: checkRes.msg, icon: 'error' });
          return false;
        }
      }
      beforeRes = this.enentHandler('before', that.config.data);
      if (beforeRes && beforeRes.code > 0 && beforeRes.data) {  //拦截请求
        this.enentHandler('success', beforeRes.data);
        this.enentHandler('complete', beforeRes.data);
        return;
      }
      if (this.config.isFormat) {
        url = this.apiFormat();
        sendData = {
          data: this.config.data
        };
      } else {
        url = this.config.url;
        sendData = this.config.data;
      }
      wx.request({
        url: this.config.domain + url,
        data: sendData,
        header: this.config.header || {
          'content-type': 'application/json'
        },
        success: function (res) {
          if (tools.isFunction(that.config.resFilter)) {
            res.data = that.config.resFilter(res.data, that.config.data) || res.data || {};
          }
          that.enentHandler('success', res.data);
        },
        fail: function () {
          that.enentHandler('fail');
        },
        complete: function (res) {
          that.enentHandler('complete', res.data);
        }
      })
    }
  o.apiFormat = function () {  //接口格式化
    var url = this.config.isTran ? "/MiniApp/transfer" : this.config.url,
      ts = tools.formatDate().ts,
      ts = ts.toString().substr(0, 10),
      apiAuth = this.apiAuth[this.systemInfo.system.name],
      loginData = this.appobj.getLoginInfo(),
      apiKey = apiAuth.key,
      apiId = apiAuth.id,
      sign = ts + apiKey + url + apiId,
      hash = md5(sign).toString(),
      data = { sign: hash, ts: ts, app_id: apiId };
    if (loginData.session_id && !config.isTran) { //请求中加入登录信息
      this.config.data.session_id = loginData.session_id;
    }
    if (this.config.hasOpenId && loginData.openid) {  //是否需要openid
      this.config.data.open_id = loginData.openid;
    }
    if (config.isTran) {
      var user_agent = this.appAttr.name_en + "/" + this.appAttr.version + " (" + this.systemInfo.model + ";" + this.systemInfo.system.name + ' ' + this.systemInfo.system.version + ")";
      data.user_agent = encodeURIComponent(user_agent);
      data.session_id = loginData.session_id;
      data.api = this.config.url;
    }
    url = tools.urlSplice(url, data);
    return url;
  },
    o.toast = function (params, callback) {
      if (!this.config.isToast) {  //禁用toast，使用navbarloading
        if (params.icon == 'loading') {
          wx.showNavigationBarLoading();
        } else {
          wx.hideNavigationBarLoading();
        }
        if (params.icon != 'error') {  //保证报错信息正常提醒
          return;
        }
      }
      params = tools.extend(true, this.config.toast, params);
      if (!this.config.tips[params.icon]) {
        params.title = "";
      } else if (typeof this.config.tips[params.icon] == "string") {
        params.title = this.config.tips[params.icon];
      }
      toast(params, callback);
    }

  o.init();

  return o;
}

module.exports = request