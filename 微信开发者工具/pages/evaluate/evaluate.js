Page({
  data: {
    shopId: '',
    shopName: '',
    category: '',
    score: 0,
    uploadedImages: [],
    isAnonymous:false,
    shopInfo: {},
    evaluateContent: '',
    questionList: [
      '大家想知道：味道怎么样啊？',
      '大家想知道：分量足不足？',
      '大家想知道：送餐快不快？',
      '大家想知道：食材新鲜吗？',
      '大家想知道：推荐大家来吃吗？',
      '大家想知道：服务态度好吗？',
      '大家想知道：性价比高吗？',
      '大家想知道：环境干净吗？',
      '大家想知道：菜品好吃吗？'
    ],
    currentQuestion: ''
  },

  onLoad(options) {
    const { shopId, shopName, category } = options
    this.setData({
      shopId,
      shopName,
      category,
      shopInfo: {
        name: shopName,
        logo: '/images/default-shop-logo.png'
      }
    })
    const list = this.data.questionList
    const randomIndex = Math.floor(Math.random() * list.length)
    this.setData({
      currentQuestion: list[randomIndex]
    })
  },
  goBack() {
    wx.navigateBack()
  },
  setScore(e) {
    const score = e.currentTarget.dataset.score
    this.setData({ score })
  },
  chooseImage() {
    const remaining = 5 - this.data.uploadedImages.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传5张图片', icon: 'none' })
      return
    }
    wx.chooseImage({
      count: remaining,
      success: (res) => {
        this.setData({
          uploadedImages: [...this.data.uploadedImages, ...res.tempFilePaths]
        })
      }
    })
  },
  deleteImg(e) {
    const index = e.currentTarget.dataset.index
    const newList = [...this.data.uploadedImages]
    newList.splice(index, 1)
    this.setData({ uploadedImages: newList })
  },
  chooseVideo() {
    wx.chooseVideo({
      maxDuration: 60,
      success: (res) => {
        console.log('选择的视频', res.tempFilePath)
      }
    })
  },
  toggleAnonymous() {
    this.setData({ isAnonymous: !this.data.isAnonymous })
  },
  handleInput(e) {
    this.setData({
      evaluateContent: e.detail.value
    })
  },
  submitEvaluate() {
    const score = this.data.score;
    if (score === 0) {
      wx.showToast({ title: '请先评分', icon: 'none' });
      return;
    }
    wx.request({
      url: "http://1ab188bh60243.vicp.fun:14137/submit_evaluate",
      method: "POST",
      data: {
        userid: 1,            // 固定测试用户，不用改
        shopid: this.data.shopId,
        score: score,
        content: this.data.evaluateContent
      },
      success: (res) => {
        if (res.data.code === 200) {
          wx.showToast({ title: '评价成功', icon: 'success' });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: res.data.msg, icon: 'none' });
        }
      },
      fail: () => {
        wx.showToast({ title: '网络异常', icon: 'none' });
      }
    });
  }
})