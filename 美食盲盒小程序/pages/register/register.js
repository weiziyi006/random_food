const app = getApp();
Page({
  data: {
    phone: '',
    password: '',
    code: '',
    codeBtnText: '获取验证码',
    codeBtnDisabled: false,
    codeTimer: null
  },
  onUnload() {
    if (this.data.codeTimer) {
      clearInterval(this.data.codeTimer);
      this.setData({ codeTimer: null });
    }
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value.trim() });
  },
  onPasswordInput(e) {
    this.setData({ password: e.detail.value.trim() });
  },
  onCodeInput(e) {
    this.setData({ code: e.detail.value.trim() });
  },
  getCode() {
    const { phone } = this.data;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    app.request('/send-code', {
      phone_number: phone,
      scene: 'register'
    }, 'POST').then(res => {
      if (res.code === 200) {
        wx.showToast({ title: res.msg, icon: 'none' });
        this.startCountdown();
      } else {
        wx.showToast({ title: res.msg, icon: 'none' });
      }
    }).catch(err => {
      wx.showToast({ title: '网络异常，发送失败', icon: 'none' });
    });
  },
  startCountdown() {
    let count = 60;
    if (this.data.codeTimer) {
      clearInterval(this.data.codeTimer);
    }
    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        this.setData({
          codeBtnDisabled: false,
          codeBtnText: '获取验证码',
          codeTimer: null
        });
      } else {
        this.setData({
          codeBtnText: `${count}s后重新获取`,
          codeTimer: timer
        });
      }
    }, 1000);
    this.setData({
      codeBtnDisabled: true,
      codeBtnText: `${count}s后重新获取`,
      codeTimer: timer
    });
  },
  handleLoginSuccess(token, userInfo) {
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('lastOperateTime', Date.now());
    app.updateLoginStatus(token, userInfo);
    wx.showToast({ title: '注册成功', icon: 'success' });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/random1/random1' });
    }, 1500);
  },
  onRegister() {
    const { phone, password, code } = this.data;
    if (!phone || !password || !code) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码长度不能少于6位', icon: 'none' });
      return;
    }
    app.request('/register', {
      phone_number: phone,
      password: password,
      code: code
    }, 'POST').then(res => {
      if (res.code === 200) {
        this.handleLoginSuccess(res.data.token, res.data.userInfo);
      } else {
        wx.showToast({ title: res.msg, icon: 'none' });
      }
    }).catch(err => {
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    });
  },
  goToLogin() {
    wx.navigateBack();
  }
});