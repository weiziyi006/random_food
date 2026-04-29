Page({
  data: {
    feedbackList: []
  },
  onLoad() {
    this.fetchFeedbackList();
  },
  fetchFeedbackList() {
    wx.request({
      url: "http://1ab188bh60243.vicp.fun:14137/feedback",
      method: "GET",
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            feedbackList: res.data.data
          });
        }
      },
      fail: () => {
        wx.showToast({ title: "获取反馈失败", icon: "none" });
      }
    });
  }
});