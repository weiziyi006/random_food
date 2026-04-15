Page({
  data:{
    workId:'',
    password:''
  },
  onWorkIdInput(e){
    this.setData({workId:e.detail.value.trim()});
  },
  onPasswordInput(e){
    this.setData({password:e.detail.value.trim()});
  },
  //管理员登录
  onAdminLogin(){
    const {workId,password} = this.data;
    if(!workId || !password){
      wx.showToast({title:'请填写完整信息',icon:'none'});
      return;
    }
    wx.request({
    url: 'http://1ab188bh60243.vicp.fun:14137/admin_login',
    method: 'POST',
    data: {
      admin_account: workId,
      admin_pwd: password,
    },
    header: {
      'content-type': 'application/json'
    },
    success: (res) => {
      if (res.statusCode === 200) {
        if (res.data.success) {
          wx.showToast({ 
            title: '登录成功',
            icon: 'success',
            duration: 1000
          });
          setTimeout(() => {
            wx.redirectTo({ url: '/pages/total_counts/total_counts' });
          },1000);
        } else {
          wx.showToast({ title: res.data.message, icon: 'none' });
        }
      } else if (res.statusCode === 400) {
        wx.showToast({ title: res.data.message || '账号或密码错误', icon: 'none' });
      } else {
        wx.showToast({ title: '登录失败，请重试', icon: 'none' });
      }
    },
    fail: (err) => {
      wx.showToast({ title: '网络错误，请重试', icon: 'none' });
    }
  });
  },
    goToForgetPassword(){
      wx.navigateTo({url:'/pages/forget_password_admin/forget_password_admin'});
  },
  goToUserLogin(){
    wx.navigateBack();
  }
});