Page({
  data: {
    phone: '',
    newPassword: '',
    code: '',
    codeBtnText: '获取验证码',
    codeBtnDisabled: false
  },
  onPhoneInput(e) {
    this.setData({ phone: e.detail.value.trim()});
  },
  onNewPasswordInput(e) {
    this.setData({ newPassword: e.detail.value.trim()});
  },
  onCodeInput(e) {
    this.setData({ code: e.detail.value.trim()});
  },
  getCode() {
    const phone = this.data.phone;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    this.setData({ codeBtnDisabled: true }); // 防止重复点击
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/send-code-admin',
      method: 'POST',
      data: {
        phone_number: phone,
        type: 'forget'
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        if (res.data.success) {
          wx.showToast({ title: '验证码已发送', icon: 'none' });
          this.startCountdown();
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' });
          this.setData({ codeBtnDisabled: false });
        }
      },
      fail: () => {
        wx.showToast({ title: '发送失败，请重试', icon: 'none' });
        this.setData({ codeBtnDisabled: false });
      }
    });
  },
  startCountdown() {
    let count = 60;
    this.setData({
      codeBtnDisabled: true,
      codeBtnText: `${count}s后重新获取`
    });
    const timer = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timer);
        this.setData({
          codeBtnDisabled: false,
          codeBtnText: '获取验证码'
        });
      } else {
        this.setData({ codeBtnText: `${count}s后重新获取` });
      }
    }, 1000);
  },
  confirmReset() {
    const {phone,newPassword,code} = this.data;
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
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/forget-password-admin',
      method: 'POST',
      data: {
        admin_phone: phone,
        new_password: newPassword,
        code: code
      },
      header: { 'content-type': 'application/json' },
      complete: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({ title: res.data.message, icon: 'success', duration:2000});
          setTimeout(() => {
            wx.redirectTo({url:'/pages/admin_login/admin_login'})
          },1000);
        } else {
          const errorMsg = res.data.message || '操作失败，请重试';
          wx.showToast({ title: errorMsg, icon: 'none' });
        }
      }
    });
  },
  goToLogin() {
    wx.navigateBack();
  }
});