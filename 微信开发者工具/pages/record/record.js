Page({
  data: {
    isLoading: false,
    records: []
  },
  onLoad(options) {
    this.getDrawRecords()
  },
  getDrawRecords() {
    this.setData({ isLoading: true })
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/get_draw_records',
      method: 'GET',
      data: {
        userid: 1,
        limit: 15
      },
      success: (res) => {
        this.setData({ isLoading: false })
        if (res.data && res.data.code === 200 && res.data.data) {
          this.setData({ records: res.data.data })
        }
      }
    })
  },
  goToEvaluate(e) {
    const index = e.currentTarget.dataset.index;
    const record = this.data.records[index];
    console.log("这条记录的所有数据：", record);
    const shopid = record.shopid || record.shopId || record.id;
  
    if (!shopid) {
      wx.showToast({ title: "店铺ID无效", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/pages/evaluate/evaluate?shopId=${shopid}&shopName=${encodeURIComponent(record.shop_name)}&category=${encodeURIComponent(record.category_name)}`
    });
  }
})