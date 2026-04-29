Page({
  data: {
  },
  onCollectTap() {
    const userid = wx.getStorageSync('userid');
    const shopid = this.data.food.shopid;
    if (!userid || !shopid) {
      wx.showToast({ title: '参数异常', icon: 'none' });
      return;
    }
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/addcollect',
      method: 'POST',
      data: {
        userid: userid,
        shopid: shopid
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '收藏成功' });
          this.setData({
            'shopStatus.isCollected': true
          });
        } else if (res.data.code === 400) {
          wx.showToast({ title: '已收藏', icon: 'none' });
          this.setData({
            'shopStatus.isCollected': true
          });
        }
      },
      fail: () => {
        wx.showToast({ title: '请求失败', icon: 'none' });
      }
    });
  },
  goFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    })
  },
  goRank() {
    wx.navigateTo({
      url: '/pages/rank/rank'
    })
  },
  goCollect() {
    wx.navigateTo({
      url: '/pages/collect/collect'
    })
  },
  goRecord() {
    wx.navigateTo({
      url: '/pages/record/record'
    })
  }
})