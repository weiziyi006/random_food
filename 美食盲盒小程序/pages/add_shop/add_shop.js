Page({
  data: {
    shopName: '',
    shopList: []
  },
  onLoad() {
    this.loadshopList();
  },
  // 加载所有店铺
  loadshopList() {
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/shops',
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            shopList: res.data.data
          });
        }
      },
      fail:(err) => {
        console.log('加载列表失败：',err);
      }
    });
  },
  inputChange(e) {
    this.setData({
      shopName: e.detail.value
    });
  },
  submitForm() {
    const { shopName } = this.data;
    if (!shopName.trim()) {
      wx.showToast({ title: '请输入店铺名称', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '提交中...' });
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/add_shop',
      method: 'POST',
      header: {'content-type':'application/json'},
      data: { shop_name: shopName },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200) {
          wx.showToast({ title: '添加成功' });
          this.setData({ shopName: '' });
          this.loadshopList(); // 刷新列表
        } else {
          wx.showToast({ title: res.data.msg, icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '网络错误', icon: 'none' });
      }
    });
  }
});