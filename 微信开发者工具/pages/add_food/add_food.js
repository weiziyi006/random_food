Page({
  data: {
    categoryName: '',
    categoryList: []
  },
  onLoad() {
    this.loadCategoryList();
  },
  // 加载所有菜品大类
  loadCategoryList() {
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/categories',
      method: 'GET',
      success: (res) => {
        if (res.data.code === 200) {
          this.setData({
            categoryList: res.data.data
          });
        }
      },
      fail:(err) => {
        console.log('加载列表失败：',err);
      }
    });
  },
  // 输入框
  inputChange(e) {
    this.setData({
      categoryName: e.detail.value
    });
  },
  // 提交添加
  submitForm() {
    const categoryName = this.data.categoryName;
    if (!categoryName.trim()) {
      wx.showToast({ title: '请输入菜品大类名称', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '提交中...' });
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/add_food',
      method: 'POST',
      headers: {'content-type':'application/json'},
      data: { category_name: categoryName },
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200) {
          wx.showToast({ title: '添加成功' });
          this.setData({ categoryName: '' });
          this.loadCategoryList(); // 刷新列表
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