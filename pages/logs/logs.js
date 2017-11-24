// //logs.js
// const util = require('../../utils/util.js')

// // Page({
// //   data: {
// //     logs: []
// //   },
// //   onLoad: function () {
// //     this.setData({
// //       logs: (wx.getStorageSync('logs') || []).map(log => {
// //         return util.formatTime(new Date(log))
// //       })
// //     })
// //   }
// // })
// const APP_ID = '';//输入小程序appid  
// const APP_SECRET = '';//输入小程序app_secret  
// var OPEN_ID = ''//储存获取到openid  
// var SESSION_KEY = ''//储存获取到session_key  
// Page({
//   getOpenIdTap: function () {
//     wx.login({
//       success: function (res) {
//         console.log(res)
//         var appid = 'wx3d3d09233282b3fa'; //填写微信小程序appid  
//         var secret = '0a4d460369c41208a1c1a82d1c86e7b2'; //填写微信小程序secret  
//         //调用request请求api转换登录凭证  
//         wx.request({
//           url: 'https://api.weixin.qq.com/sns/jscode2session?appid=wx3d3d09233282b3fa&secret=0a4d460369c41208a1c1a82d1c86e7b2&js_code='+res.code+'&grant_type=authorization_code',
//           header: {
//             'content-type': 'application/json'
//           },
//           success: function (res) {
//             console.log(res.data)
//             console.log("openid:", res.data.openid)
//           }
//         })
//       }
//     }) 
//   }
// })  
Page({
  
  onLoad: function () {
    wx.login({
      success: function (res) {
        if (res.code) {
          console.log(res.code)
          //发起网络请求
          wx.request({
            url: 'http://10.22.64.58:9091/weixin',
            data: {
              code: res.code
            },
            success: function (res){
              console.log(res)
            }
          })
        } else {
          console.log('获取用户登录态失败！' + res.errMsg)
        }
      }
    });
  }
})