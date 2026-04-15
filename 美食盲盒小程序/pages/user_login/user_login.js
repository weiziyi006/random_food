const app = getApp();
Page({
  data:{
    currentTab: 0, // 0:账号密码登录 1:手机验证登录
    account: '',
    password: '', 
    phone: '',
    code: '', //验证码
    codeBtnText: '获取验证码',
    codeBtnDisabled: false, 
    codeTimer: null // 存储验证码倒计时定时器
  },
  onUnload() {
    if (this.data.codeTimer) {
      clearInterval(this.data.codeTimer);
      this.setData({ codeTimer: null });
    }
  },
  switchTab(e){
    const tab = Number(e.currentTarget.dataset.tab);
    this.setData({ currentTab: tab });
  },
  onAccountInput(e){
    this.setData({ account: e.detail.value.trim()});
  },
  onPasswordInput(e){
    this.setData({ password: e.detail.value.trim()});
  },
  onPhoneInput(e){
    this.setData({ phone: e.detail.value.trim()});
  },
  onCodeInput(e){
    this.setData({ code: e.detail.value.trim()});
  },
  getCode(){
    const { phone } = this.data;
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }
    app.request('/send-code', {
      phone_number: phone,
      scene: 'login'
    }, 'POST').then(res => {
      if (res.code === 200) {
        wx.showToast({
          title: res.msg || '验证码已发送',
          icon: 'none',
          duration: 1500
        });
        this.startCodeCountdown();
      } else {
        wx.showToast({
          title: res.msg || '验证码发送失败',
          icon: 'none',
          duration: 1500
        });
      }
    }).catch(err => {
      wx.showToast({
        title: '网络异常，请稍后再试',
        icon: 'none',
        duration: 1500
      });
    });
  },
  startCodeCountdown() {
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
          codeTimer: null // 清空定时器
        });
      } else {
        this.setData({
          codeBtnText: `${count}s后重新获取`,
          codeTimer: timer // 更新定时器存储
        });
      }
    }, 1000);
    this.setData({
      codeBtnDisabled: true,
      codeBtnText: `${count}s后重新获取`,
      codeTimer: timer
    });
  },
  onAccountLogin(){
    const { account, password } = this.data;
    if (!account || !password) {
      wx.showToast({ title: '请输入账号和密码', icon: 'none' });
      return;
    }
    app.request('/user_login', {
      user_phone: account,
      password: password
    }, 'POST').then(res => {
      if (res.code === 200) {
        this.handleLoginSuccess(res.data.token, res.data.userInfo);
      } else {
        wx.showToast({ title: res.msg || '登录失败', icon: 'none' });
      }
    }).catch(err => {
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    });
  },
  onPhoneLogin() {
    const { phone, code } = this.data;
    if (!phone || !code) {
      wx.showToast({ title: '请输入手机号和验证码', icon: 'none' });
      return;
    }
    app.request('/code_login', {
      user_phone: phone,
      code: code
    }, 'POST').then(res => {
      if (res.code === 200) {
        this.handleLoginSuccess(res.data.token, res.data.userInfo);
      } else {
        wx.showToast({ title: res.msg || '登录失败', icon: 'none' });
      }
    }).catch(err => {
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    });
  },
  handleLoginSuccess(token, userInfo) {
    wx.setStorageSync('token', token);
    wx.setStorageSync('userInfo', userInfo);
    wx.setStorageSync('lastOperateTime', Date.now());
    app.updateLoginStatus(token, userInfo);
    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: 1000
    });
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/random1/random1' });
    }, 1000);
  },
  goToForgetPassword() {
    wx.navigateTo({ url: '/pages/forget_password/forget_password' });
  },
  goToRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  },
  goToAdminLogin() {
    wx.navigateTo({ url: '/pages/admin_login/admin_login' });
  }
});