App({
  globalData: {
    isLogin: false,
    token: '',
    userInfo: {},
    inactiveExpire: 30*24*60*60*1000,
    baseUrl: 'http://1ab188bh60243.vicp.fun:14137'
  },
  onLaunch(options) {
    this.checkLoginStatus();
  },
  onShow() {
    if (this.globalData.isLogin) { 
      this.updateLastOperateTimeOnly();
    }
  },
  checkLoginStatus() {
    try {
      const localToken = wx.getStorageSync('token');
      const localUserInfo = wx.getStorageSync('userInfo');
      const lastOperateTime = wx.getStorageSync('lastOperateTime');
      if (localToken && lastOperateTime) {
        this.globalData.isLogin = true;
        this.globalData.token = localToken;
        this.globalData.userInfo = localUserInfo || {};
        this.checkInactiveExpire();
      } else {
        this.logout();
      }
    } catch (err) {
      console.error('读取本地存储失败', err);
      this.logout();
    }
  },
  checkInactiveExpire() {
    if (!this.globalData.isLogin) return;
    try {
      const lastOperateTime = wx.getStorageSync('lastOperateTime');
      const now = Date.now();
      const timeDiff = now - lastOperateTime;
      if (timeDiff > this.globalData.inactiveExpire) {
        wx.showToast({ title: '长期未使用，请重新登录', icon: 'none', duration: 2000 });
        this.logout();
      }
    } catch (err) {
      console.error('校验长期未使用失败', err);
      this.logout();
    }
  },
  updateLastOperateTimeOnly() {
    wx.setStorageSync('lastOperateTime', Date.now());
  },
  updateLoginStatus(token, userInfo = {}) {
    if (!token) return;
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('lastOperateTime', Date.now());
    this.globalData.isLogin = true;
    this.globalData.token = token;
    this.globalData.userInfo = userInfo;
    console.log('登录状态更新成功，已持久化到本地');
  },
  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('lastOperateTime');
    this.globalData.isLogin = false;
    this.globalData.token = '';
    this.globalData.userInfo = {};
    wx.reLaunch({
      url: '/pages/user_login/user_login',
      fail: (err) => console.error('跳登录页失败', err)
    });
  },
  request(url, data = {}, method = 'GET') {
    this.updateLastOperateTimeOnly();
    const token = this.globalData.token;
    const fullUrl = this.globalData.baseUrl + url;
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: '加载中', mask: true });
      wx.request({
        url: fullUrl,
        data,
        method: method.toUpperCase(),
        header: {
          'content-type': 'application/json',
          token
        },
        success: (res) => {
          if (res.data.code === 401) {
            wx.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 2000 });
            this.logout();
            reject(new Error('token过期'));
            return;
          }
          resolve(res.data);
        },
        fail: (err) => {
          wx.showToast({ title: '网络异常，请稍后再试', icon: 'none' });
          reject(err);
        },
        complete: () => {
          wx.hideLoading();
        }
      })
    })
  }
})