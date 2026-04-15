const app = getApp();
Page({
  data: {
    tagList: [
      { name: "快餐", selected: false },
      { name: "面食", selected: false },
      { name: "低脂", selected: false },
      { name: "饮品", selected: false },
      { name: "暖胃", selected: false },
      { name: "煲类", selected: false },
      { name: "家常菜", selected: false },
      { name: "甜品", selected: false },
      { name: "解暑", selected: false },
      { name: "麻辣", selected: false },
      { name: "清淡", selected: false },
    ],
    loading: false,
    result: null,
    showTagModal: false,
    weather: {},
    moodText: "",
    shopStatus: {
      isCollected: false,
      isBlocked: false
    }
  },
  openTagModal() {
    this.setData({ showTagModal: true });
  },
  closeTagModal() {
    this.setData({ showTagModal: false });
  },
  toggleTag(e) {
    const name = e.currentTarget.dataset.name;
    const newList = this.data.tagList.map(item => {
      if (item.name === name) {
        item.selected = !item.selected;
      } else {
        item.selected = false;
      }
      return item;
    });
    this.setData({ tagList: newList });
  },
  getUserId() {
    let userid = 1;
    if (app && app.globalData && app.globalData.userInfo && app.globalData.userInfo.userid) {
      const userIdRaw = app.globalData.userInfo.userid;
      userid = Number(userIdRaw) || 1;
    }
    return userid;
  },
  customRequest(url, data = {}, method = 'GET') {
    app.updateLastOperateTimeOnly();
    const token = app.globalData.token;
    const fullUrl = app.globalData.baseUrl + url;
    return new Promise((resolve, reject) => {
      wx.request({
        url: fullUrl,
        data,
        method: method.toUpperCase(),
        header: {
          'content-type': 'application/json',
          token
        },
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          wx.showToast({ title: '网络异常，请稍后再试', icon: 'none' });
          reject(err);
        }
      })
    })
  },
  checkShopCollectStatus(shopid, userid) {
    if (!shopid || !userid) {
      console.error('shopid或userid为空，跳过收藏状态检查');
      return;
    }
    this.customRequest('/is-collected', {
      userid: userid,
      shopid: shopid
    }, 'GET')
      .then(res => {
        if (res.code === 200) {
          this.setData({
            'shopStatus.isCollected': res.data.is_collected
          });
        }
      })
      .catch(err => {
        console.error('检查收藏状态失败:', err);
      });
  },
  onCollectTap() {
    const { result } = this.data;
    const userid = this.getUserId();
    if (!result || !result.shopid) {
      wx.showToast({ title: "暂无店铺信息", icon: "none" });
      return;
    }
    this.customRequest('/collect_shop', {
      userid: userid,
      shopid: result.shopid
    }, 'POST')
      .then(res => {
        if (res.code === 200) {
          this.setData({
            'shopStatus.isCollected': res.data.is_collected
          });
          wx.showToast({
            title: res.data.is_collected ? '收藏成功' : '取消收藏',
            icon: 'none'
          });
        } else {
          wx.showToast({ title: res.msg || '操作失败', icon: 'none' });
        }
      })
      .catch(err => {
        console.error('收藏/取消收藏失败:', err);
        wx.showToast({ title: '网络异常，操作失败', icon: 'none' });
      });
  },
  async getResult() {
    const selectedTags = this.data.tagList.filter(t => t.selected).map(t => t.name).join(",") || "";
    this.setData({ loading: true });
    wx.showLoading({ title: '正在抽取美食...', mask: true });
    try {
      const resData = await this.customRequest("/smart-recommend", {
        userid: this.getUserId(),
        tags: selectedTags
      }, "GET");
      wx.hideLoading();
      if (resData.code === 200 && resData.data) {
        let weather = resData.weather || { temp: 25, weather: "晴朗" };
        let moodText = this.getMoodText(weather.temp);
        this.setData({
          result: resData.data,
          weather: weather,
          moodText: moodText,
          showTagModal: false,
          loading: false,
          shopStatus: { isCollected: false, isBlocked: false }
        });
        this.checkShopCollectStatus(resData.data.shopid, this.getUserId());
      } else {
        wx.showToast({ title: "暂无推荐", icon: "none" });
        this.setData({ loading: false });
      }
    } catch (err) {
      wx.hideLoading();
      console.error("获取推荐失败：", err);
      this.setData({ loading: false });
    }
  },
  getMoodText(temp) {
    if (temp < 10) return "天气有点冷，吃点暖乎乎的最治愈～";
    if (temp < 20) return "微凉天气，美食最能抚慰心情 ✨";
    if (temp < 28) return "天气刚刚好，美食与快乐都在线 😊";
    return "天气有点热，清爽美食给你降降温～";
  },
  resetAll() {
    const resetList = this.data.tagList.map(item => {
      item.selected = false;
      return item;
    });
    this.setData({
      tagList: resetList,
      result: null,
      weather: {},
      moodText: "",
      showTagModal: false,
      shopStatus: { isCollected: false, isBlocked: false }
    });
  }
});