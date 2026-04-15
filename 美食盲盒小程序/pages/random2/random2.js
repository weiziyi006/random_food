Page({
  data: {
    food: null,
    fairyTexts: [
      "恭喜你抽中美食啦!✨",
      "快去尝尝这份美味吧GO！",
      "这家店超赞的！🌟💯",
      "不喜欢这个菜品选择换个菜品试试呢🤔",
      "不喜欢这家店,换个店铺试试就可以啦~",
      "快约上朋友一起去打卡吧！📸",
      "干饭人干饭魂，这份美食超配你😊",
      "吃完记得回来告诉我好不好吃呀😋",
      "这份美食专治没胃口，冲！🚀💨",
      "这份菜品颜值口感双在线✨",
      "选它准没错，好吃到舔盘！ヾ(◍°∇°◍)ﾉﾞ",
      "盲盒开奖成功，美食到手！",
      "欧气满满，抽中超赞美食咯！🎉",
      "哇塞，这份菜品听着就超香欸（＞ｙ＜）",
      "喜欢这家店就可以收藏它哇！💖",
      "可以点击推荐店铺旁的小心心把它收藏起来哟~"
    ],
    currentFairyText: "",
    shopStatus: {
      isCollected: false,
      isBlocked: false
    }
  },
  onLoad(options) {
    this.setFairyText();
    if (options.foodData) {
      try {
        const foodData = JSON.parse(decodeURIComponent(options.foodData));
        this.setData({
          food: foodData
        });
        const userid = this.getUserId();
        this.checkShopCollectStatus(foodData.shopid, userid);
      } catch (error) {
        console.error('解析菜品数据失败:', error);
        wx.showToast({ title: '数据加载失败', icon: 'none' });
      }
    } else {
      wx.showToast({ title: '没有获取到菜品信息', icon: 'none' });
    }
  },
  getUserId() {
    const app = getApp();
    let userid = 1;
    if (app && app.globalData && app.globalData.userInfo && app.globalData.userInfo.userid) {
      const userIdRaw = app.globalData.userInfo.userid;
      userid = Number(userIdRaw) || 1;
    }
    return userid;
  },
  setFairyText() {
    const texts = this.data.fairyTexts;
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    this.setData({
      currentFairyText: randomText
    });
  },
  customRequest(url, data = {}, method = 'GET') {
    const app = getApp();
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
    const { food } = this.data;
    const userid = this.getUserId();
    this.customRequest('/collect_shop', {
      userid: userid,
      shopid: food.shopid
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
  onChangeFoodTap() {
    const food = this.data.food;
    const userid = this.getUserId();
    this.customRequest('/re_random', {
      category_name: food.category_name,
      userid: userid
    }, 'GET')
      .then(res => {
        if (res.code === 200) {
          this.setData({
            food: res.data
          });
          this.checkShopCollectStatus(res.data.shopid, userid);
          this.setFairyText();
        } else {
          wx.showToast({ title: res.msg || '更换失败', icon: 'none' });
        }
      })
      .catch(err => {
        console.error('换菜品请求失败:', err);
        wx.showToast({ title: '网络异常，请稍后再试', icon: 'none' });
      });
  },
  onChangeShopTap() {
    const { food } = this.data;
    const userid = this.getUserId();
    this.customRequest('/change_shop', {
      category_name: food.category_name,
      shop_name: food.shop_name,
      userid: userid
    }, 'GET')
      .then(res => {
        if (res.code === 200) {
          this.setData({
            food: res.data
          });
          this.checkShopCollectStatus(res.data.shopid, userid);
          this.setFairyText();
        } else {
          wx.showToast({ title: res.msg || '更换失败', icon: 'none' });
        }
      })
      .catch(err => {
        console.error('换店铺请求失败:', err);
        wx.showToast({ title: '网络异常，请稍后再试', icon: 'none' });
      });
  },
  onBackTap() {
    this.setData({
      food: null,
      currentFairyText: "",
      shopStatus: {
        isCollected: false,
        isBlocked: false
      }
    }, () => {
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/random1/random1',
          fail: (err) => console.error('跳转到主页失败:', err)
        });
      }, 100);
    });
  }
});