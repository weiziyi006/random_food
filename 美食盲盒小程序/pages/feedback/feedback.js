Page({
  data: {
    content: '',
    email: ''
  },
  onContentInput(e) {
    this.setData({
      content: e.detail.value
    });
  },
  onEmailInput(e) {
    this.setData({
      email: e.detail.value
    });
  },
  submitFeedback() {
    const { content, email } = this.data;
    if (!content.trim()) {
      wx.showToast({
        title: '请填写反馈内容',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      wx.showToast({
        title: '邮箱格式不正确',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    wx.showLoading({ title: '提交中...' });
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/feedback',
      method: 'POST',
      data: {
        content: content,
        email: email
      },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200) {
          wx.showToast({
            title: '提交成功',
            icon: 'success',
            duration: 2000
          });
          this.setData({
            content: '',
            email: ''
          });
        } else {
          wx.showToast({
            title: '提交失败：' + res.data.msg,
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
        console.error('提交失败：', err);
      }
    });
  }
});