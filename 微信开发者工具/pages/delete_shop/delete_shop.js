Page({
  data: {
    shops: [],
    searchValue: '',
    filteredshops: [],
    selectedshops: []
  },
  onLoad() {
    this.loadshops();
  },
  loadshops() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/shops',
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const initshops = res.data.data.map(item => ({
            ...item,
            checked: false
          }));
          this.setData({
            shops: initshops,
            filteredshops: initshops
          });
        } else {
          wx.showToast({
            title: '数据加载失败',
            icon: 'error',
            duration: 1500
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('接口请求失败：', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error',
          duration: 1500
        });
      }
    });
  },
  onSearchInput(e) {
    const searchValue = e.detail.value.trim();
    this.setData({ searchValue });
    this.filtershops(searchValue);
  },
  filtershops(keyword) {
    const { shops, selectedshops } = this.data;
    let filterResult = [...shops];
    if (keyword) {
      filterResult = shops.filter(item => {
        const idStr = item.shopid.toString();
        const nameStr = item.shop_name.toLowerCase();
        return idStr.includes(keyword) || nameStr.includes(keyword.toLowerCase());
      });
    }
    const finalList = filterResult.map(item => ({
      ...item,
      checked: selectedshops.includes(Number(item.shopid))
    }));
    this.setData({ filteredshops: finalList });
  },
  onCheckboxChange(e) {
    const shopId = Number(e.currentTarget.dataset.id);
    const isChecked = e.detail.checked;
    const { selectedshops } = this.data;
    let newSelected = [...selectedshops];
    if (isChecked) {
      if (!newSelected.includes(shopId)) {
        newSelected.push(shopId);
      }
    } else {
      newSelected = newSelected.filter(id => id !== shopId);
    }
    this.setData({
      selectedshops: newSelected,
      filteredshops: this.data.filteredshops.map(item => ({
        ...item,
        checked: newSelected.includes(Number(item.shopid))
      }))
    });
    console.log('最终选中ID:', this.data.selectedshops, '长度：', this.data.selectedshops.length);
    console.log('当前选中ID:', newSelected);
  },
  onItemTap(e) {
    const shopId = Number(e.currentTarget.dataset.id);
    const currentItem = this.data.filteredshops.find(item => Number(item.shopid) === shopId);
    const isChecked = currentItem ? currentItem.checked : false;
    this.onCheckboxChange({
      detail: { checked: !isChecked },
      currentTarget: { dataset: { id: shopId } }
    });
  },  
  handleDelete() {
    const { selectedshops } = this.data;
    if (selectedshops.length === 0) {
      wx.showToast({
        title: '请选择要删除的店铺',
        icon: 'none',
        duration: 1500
      });
      return;
    }
    wx.showModal({
      title: '确认删除',
      content: `确定删除选中的${selectedshops.length}个店铺？`,
      confirmText: '确认删除',
      confirmColor: '#FF7A2F',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(selectedshops);
        }
      }
    });
  },
  performDelete(deleteIds) {
    wx.showLoading({
      title: '删除中...',
      mask: true
    });
    const queryParams = deleteIds.map(id => `ids=${id}`).join('&');
    wx.request({
      url: `http://1ab188bh60243.vicp.fun:14137/delete_shops?${queryParams}`,
      method: 'DELETE',
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200) {
          wx.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 1500
          });
          this.setData({
            searchValue: '',
            selectedshops: []
          });
          this.loadshops();
        } else {
          wx.showToast({
            title: res.data.msg || '删除失败',
            icon: 'error',
            duration: 1500
          });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('删除请求失败：', err);
        wx.showToast({
          title: '网络错误，删除失败',
          icon: 'error',
          duration: 1500
        });
      }
    });
  }
});