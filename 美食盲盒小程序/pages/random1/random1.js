Page({
  data: {
    activeTab: 'box'
  },
  openBlindBox() {
    this.getRandomFood();
  },
  getRandomFood() {
    wx.showLoading({
      title: '正在抽取...',
      mask: true
    });
    const app = getApp();
    let userid = 1;
    if (app.globalData && app.globalData.userInfo && app.globalData.userInfo.userid) {
      const userIdRaw = app.globalData.userInfo.userid;
      userid = Number(userIdRaw) || 1;
    }
    app.request('/random', { userid }, 'GET')
      .then(res => {
        wx.hideLoading();
        if (res && res.code === 200) {
          wx.showToast({
            title: '抽到啦',
            icon: 'success',
            duration: 1000,
            mask: true
          });
          let foodData = '{}';
          try {
            foodData = encodeURIComponent(JSON.stringify(res.data || {}));
          } catch (e) {
            console.error('数据序列化失败:', e);
          }
          setTimeout(() => {
            wx.redirectTo({
              url: `/pages/random2/random2?foodData=${foodData}`
            });
          }, 800);
        } else {
          wx.showToast({
            title: (res && res.msg) || '抽取失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('网络请求失败:', err);
        wx.showToast({
          title: '网络异常，请稍后再试',
          icon: 'none'
        });
      });
  }
});