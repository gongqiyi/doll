Page({
  data: {
    navbar: ['所有', '填充玩偶', '玩具', '潮物'],
    currentTab: 0
  },
  navbarTap: function (e) {
    this.setData({
      currentTab: e.currentTarget.dataset.idx
    })
  },
  onReady: function () {
    wx.connectSocket({
      url: 'http://localhost/ad',
      data: {

      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log(1)
        console.log(res)
      }
    })
  },
  onLoad: function () {
    var that = this
    wx.request({
      url: 'http://localhost/ad', //仅为示例，并非真实的接口地址
      data: {
        x: '',
        y: ''
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        console.log(res.data)
        console.log(res.data[0].data.device_list)
        var name = res.data[0].data.device_list
        that.setData({
       device_list: name
        })
      }
    })
  }
 
})  