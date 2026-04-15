Page({
  data: {
    rankList: []
  },
  onLoad() {
    this.getShopRank()
  },
  getShopRank() {
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/get_shop_rank',
      method: 'GET',
      data: {
        limit: 15
      },
      success: (res) => {
        if (res.data && res.data.code === 200 && res.data.data) {
          this.setData({ rankList: res.data.data })
        } else {
          wx.showToast({ 
            title: res.data ? res.data.msg : '获取排行失败', 
            icon: 'none' 
          })
        }
      },
      fail: () => {
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})