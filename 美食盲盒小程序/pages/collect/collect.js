Page({
  data: {
    collectedshops: [],
    isloading: true
  },
  onLoad() {
    this.fetchusercollects();
  },
  onPullDownRefresh() {
    this.fetchusercollects();
  },
  fetchusercollects() {
    this.setData({ isloading: true });
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/getmycollect',
      method: 'GET',
      data: {
        userid: 1
      },
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            collectedshops: res.data.data || [],
            isloading: false
          });
        } else {
          wx.showToast({ title: res.data.msg || '获取收藏失败', icon: 'none' });
          this.setData({ isloading: false });
        }
      },
      fail: (err) => {
        console.error('获取收藏失败:', err);
        wx.showToast({ title: '网络异常', icon: 'none' });
        this.setData({ isloading: false });
      },
      complete: () => {
        wx.stopPullDownRefresh();
      }
    });
  },
  onCancelCollectTap(e) {
    const shopid = e.currentTarget.dataset.shopid;
    const shopname = e.currentTarget.dataset.shopname;
    wx.showModal({
      title: '取消收藏',
      content: `确定要取消收藏「${shopname}」吗？`,
      confirmColor: '#ff6b6b',
      success: (res) => {
        if (res.confirm) {
          this.doCancelCollect(shopid);
        }
      }
    });
  },
  doCancelCollect(shopid) {
    wx.showLoading({ title: '处理中...' });
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/collect_shop',
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        userid: 1,
        shopid: shopid
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && !res.data.data.is_collected) {
          this.fetchusercollects();
          wx.showToast({ 
            title: '取消收藏成功', 
            icon: 'success',
            duration: 1500
          });
        } else {
          wx.showToast({ 
            title: res.data.msg || '取消失败', 
            icon: 'none' 
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('取消收藏失败:', err);
        wx.showToast({ 
          title: '网络异常，请重试', 
          icon: 'none' 
        });
      }
    });
  },
  onBackTap() {
    wx.navigateBack();
  }
});