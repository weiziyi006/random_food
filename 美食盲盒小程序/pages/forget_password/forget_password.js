const app = getApp();
Page({
  data: {
    phone: '',
    newPassword: '',
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
  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value.trim() });
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
      scene: 'forget'
    }, 'POST').then(res => {
      if (res.code === 200) {
        wx.showToast({ title: res.msg, icon: 'none' });
        this.startCountdown();
      } else {
        wx.showToast({ title: res.msg, icon: 'none' });
        this.setData({ codeBtnDisabled: false });
      }
    }).catch(err => {
      wx.showToast({ title: '网络异常，发送失败', icon: 'none' });
      this.setData({ codeBtnDisabled: false });
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
  confirmReset() {
    const { phone, newPassword, code } = this.data;
    if (!phone) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      wx.showToast({ title: '密码长度不能少于6位', icon: 'none' });
      return;
    }
    if (!code || !/^\d{6}$/.test(code)) {
      wx.showToast({ title: '请输入6位数字验证码', icon: 'none' });
      return;
    }
    app.request('/forget-password', {
      user_phone: phone,
      new_password: newPassword,
      code: code
    }, 'POST').then(res => {
      if (res.code === 200) {
        wx.showToast({ title: res.msg, icon: 'success' });
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/user_login/user_login' });
        }, 1000);
      } else {
        wx.showToast({ title: res.msg, icon: 'none' });
      }
    }).catch(err => {
      wx.showToast({ title: '网络异常，操作失败', icon: 'none' });
    });
  },
  goToLogin() {
    wx.navigateBack();
  }
});