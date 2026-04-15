Page({
  data: {
    isLoading: false,
    records: []
  },
  onLoad(options) {
    this.getDrawRecords()
  },
  getDrawRecords() {
    this.setData({ isLoading: true })
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/get_draw_records',
      method: 'GET',
      data: {
        userid: 1,
        limit: 15
      },
      success: (res) => {
        this.setData({ isLoading: false })
        if (res.data && res.data.code === 200 && res.data.data) {
          this.setData({ records: res.data.data })
        } else {
          wx.showToast({ 
            title: res.data ? res.data.msg : '获取记录失败', 
            icon: 'none' 
          })
        }
      },
      fail: () => {
        this.setData({ isLoading: false })
        wx.showToast({ title: '网络错误', icon: 'none' })
      }
    })
  }
})