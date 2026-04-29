Page({
  data: {
    categoryCount: 0,
    shopCount: 0
  },
  onLoad(){
    this.loadCounts();
  },
  onShow(){
    this.loadCounts();
  },
  // 获取菜品和店铺总数
  loadCounts() {
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/total_counts',
      success: (res) => {
        this.setData({
          categoryCount: res.data.data.category_count,
          shopCount: res.data.data.shop_count
        });
      }
    });
  },
  goToAddFood(){
    wx.navigateTo({ url: '/pages/add_food/add_food' });
  },
  goToDeleteFood(){
    wx.navigateTo({ url: '/pages/delete_food/delete_food' });
  },
  goToAddShop(){
    wx.navigateTo({ url: '/pages/add_shop/add_shop' });
  },
  goToDeleteShop(){
    wx.navigateTo({ url: '/pages/delete_shop/delete_shop' });
  },
  goToUserFeedback(){
    wx.navigateTo({url:'/pages/user_feedback/user_feedback' })
  },
  goToUserLogin(){
    wx.navigateTo({url:'/pages/user_login/user_login' })
  },
  goBack(){
    wx.navigateBack();
  }
});