var tools = require("tools");
'use strict';
module.exports = function (config) {   //config[onLoad,onShow...]对应页面处理程序中的回调
  var pconfig = tools.extend(true, {
    isCall: false,             // 是否绑定呼叫
    isAutoLogin: true,    //自动登录
    isStorage: true,        //是否开启存储模式 == []则为存储列表，
    isNavigator: true,    //是否需要配置跳转方法
    hasImage: false,       //==true||string 自动加载图片失败的监控方法
    handler: {},             //页面处理程序
    serve: [],                 /*服务插件进入，默认引入tools插件，string|array 单个或批量引入插件，
                                    若需自定义插件地址，需要使用[["插件名称","插件地址"]]的方式*/
    life: [],        //生命周期函数配置，默认onLoad，onSetData有处理相关初始化处理
    dataFilter: function (d) {    //数据过滤
      return d || {};
    },
    optionsFilter: function (o) {
      return o || {};
    },
    navHandler: function (ev) {  //跳转处理事件 pconfig.isNavigator == true;
      var dataset = ev.currentTarget.dataset,
        url = dataset.url,
        target = dataset.target;
      delete dataset["url"];
      delete dataset["target"];
      return {
        url: url,
        options: dataset,
        target: target
      }
    },
    tempData: {},
    data: {}                //页面数据
  }, config),
    pObj = this,
    s_obj = {               //插件对象，handler及页面周期函数 使用this.serve["插件名"]的方式引用
      tools: tools
    },
    appobj,     //小程序对象
    pparms,             //page配置对象
    pdata,                //页面数据
    poptions;           //页面参数

  pconfig.optionsParse = function (options, datakey, isall) {   //options数据解析
    if (options.q) {
      var query = decodeURIComponent(options.q), url,
        data = {}, str1, str2,
        queryArr;
      queryArr = query.split('?');
      url = queryArr[0] || "";
      query = queryArr[1] || "";
      query = query.split('&');
      query.map(function (value) {
        value = value.split('=');
        str1 = value[0]; str2 = value[1] || "";
        if (str1) {
          if (datakey) {
            if (datakey[str1]) {
              data[datakey[str1]] = str2;
            } else if (isall) {
              data[str1] = str2;
            }
          } else {
            data[str1] = str2;
          }
        }
      });
      options = data;
      options.url = url;
    }
    return options;
  }

  pconfig.setTempData = function (key, data) {  //设置页面临时数据
    this.tempData[key] = data;
  }
  pconfig.getTempData = function (key, blank) { //获取页面临时数据
    blank = typeof blank == "undefined" ? "" : blank;
    return this.tempData[key] || blank;
  }
  requireServe(pconfig.serve);
  pdata = pconfig.dataFilter(pconfig.data);   //data数据过滤
  pparms = {
    data: pdata,
    onPageScroll: function () { },
    onReachBottom: function () { },
    onLoad: function (options) {                  //页面初始化
      appobj = getApp();
      this.isAutoLogin = pconfig.isAutoLogin;
      poptions = pconfig.optionsFilter(options);   //页面参数过滤
      pconfig.options = poptions;              //引用页面参数
      pconfig.data = this.data;                  //引用页面数据
      pconfig.serve = s_obj;                      //引用serve工具集
      pconfig.appobj = appobj;                 //引用app对象
      pconfig.pageobj = this;                     //引用页面page对象

      pconfig.setData = this.onSetData;   //应用setData;

      pconfig.eventHandler = function (name, callback) {  //创建事件处理程序
        this[name] = callback.bind(pconfig);
      }.bind(this);

      if (options.navtitle) {  //设置标题栏
        tools.setTitle(options.navtitle);
      }

      //用户信息相关
      var pageConfig = tools.getPageConfig(),
        loginRes = appobj.checkLogin();
      if (loginRes.code > 0) {  //未登录
        if (pageConfig.isLogin != false) {
          if (pconfig.isAutoLogin) {  //自动登录- 注：登录成功后才会回调onLoad
            appobj.onLogin(function (res, req) {
              if (res.code == 0 && pageConfig.key == 'login') {
                tools.onNavigator();
              }
            });
          } else {
            tools.onNavigator({
              url: 'login'
            });
          }
        }
      } else if (!loginRes.data.inn_name) {  //已登录，没有填写驿站资料
        // this.route != 'pages/register/register' && this.route != 'pages/register/editor/editor' && tools.onNavigator({
        //   target: this.route == 'pages/login/login' ? 'self' : 'blank',
        //   url: 'register'
        // });
      }
      pconfig.isFirstLoad = true;
      pconfig.onLoad && pconfig.onLoad(poptions, loginRes);
    },
    onShow: function () {
      pconfig.onShow && pconfig.onShow();
      pconfig.isFirstLoad = false;
    },
    onSetData: function (key, value, deep) {  //issingle是否单个设置
      setData(key, value, this, deep);
    }
  };
  if (pconfig.hasImage) {
    pparms.onImageError = function (ev) {  //图片加载失败监控
      var dataset = ev.currentTarget.dataset,
        src = dataset.src || pconfig.hasImage,
        list;
      if (dataset.index && dataset.dkey) {  //数组
        list = this.data[dataset.dkey];
        list[dataset.index][dataset.key] = src;
        this.onSetData(dataset.dkey, list);
      } else {
        this.onSetData(dataset.key, src);
      }
    }
  }
  if (pconfig.isCall) {
    pparms.onCall = function (ev) {
      wx.makePhoneCall({
        phoneNumber: ev.currentTarget.dataset.tel
      })
    }
  }
  if (pconfig.onScan) {  //扫描
    pparms.onScan = function () {
      var res = pconfig.onScan('check', { code: 3 });
      if (res == false) {
        return;
      }
      wx.scanCode({
        onlyFromCamera: true,
        success: function (res) {
          var data = { code: 0, msg: 'scan.ok' };
          if (res) {
            data.data = res;
          } else {
            data.code = 1;
            data.msg = '扫描失败'
          }
          pconfig.onScan('res', data);
        },
        fail: function () {
          pconfig.onScan('res', { code: 2, msg: '扫描失败' });
        }
      });
    }
  }
  if (pconfig.isStorage) {  //开启存储模式
    pparms.onHide = pparms.onUnload = function () {
      var keys = this.storageKeys || (tools.isArray(pconfig.isStorage) && pconfig.isStorage), data, skey;
      keys && keys.map(function (rkeys) {
        rkeys = rkeys.split('.');
        rkeys.map(function (rkey, i) {
          data = i == 0 ? this.data[rkey] : data[rkey];
          data = data || {};
        }.bind(this));
        skey = rkeys.join('_');
        if (!data || (tools.isArray(data) && data.length == 0)) {
          tools.storage.remove(skey);
          return;
        }
        tools.storage.set(skey, data);
      }.bind(this));
    }
  }
  if (pconfig.isNavigator) {
    var navRes;
    pparms.onNavigator = function (ev) {  //页面跳转
      navRes = pconfig.navHandler(ev);
      navRes && tools.onNavigator(navRes);
    }
  }

  pconfig.life && pconfig.life.map(function (v, i) {     //配置生命监控数据，即事件监控，页面内调用方式  on开头首字母大写
    v = tools.wordHump(v);
    if (!pparms["on" + v]) {
      pparms["on" + v] = pconfig["on" + v] ? pconfig["on" + v].bind(pconfig) : function (ev) {
        //console.log("请配置P.on" + v + "");
      }.bind(pconfig);
    }
  });

  Page(pparms);


  function groupData(key, value) {  //组合深拷贝data
    var data = {};
    group(key, value);
    return data;
    function group(key, value) {
      if (tools.isJson(value)) {
        for (var v in value) {
          group(key + '.' + v, value[v]);
        }
      } else {
        data[key] = value;
      }
    }
  }

  function setData(key, value, pageobj, deep) {                 //设置数据Json,[[key,value]],deep深层组合数据
    var data;
    if (tools.isJson(key)) {
      pageobj.setData(key);
      return;
    } else if (tools.isArray(key)) {
      data = {};
      key.map(function (v_) {
        if (value) {
          data = tools.extend(true, data, groupData(v_[0], v_[1]));
        } else {
          data[v_[0]] = v_[1];
        }
      });
    } else {
      data = {};
      if (deep) {
        data = groupData(key, value);
      } else {
        data[key] = value;
      }
    }
    pageobj.setData(data);
  }

  function requireServe(name, url) {                     //追加服务插件
    var reg = /^(..\/)+$/;
    if (tools.isArray(name)) {
      name.map(function (v, i) {
        if (tools.isArray(v)) {
          v[1] = reg.test(v[1]) ? ('../component/' + v[0] + '/' + v[0]) : v[1];
          requireServe(v[0], v[1]);
        } else {
          requireServe(v);
        }
      });
    } else {
      s_obj[name] = require(url ? url : name);
    }
  }
}