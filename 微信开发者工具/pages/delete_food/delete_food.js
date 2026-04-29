Page({
  data: {
    categories: [],
    searchValue: '',
    filteredCategories: [],
    selectedCategories: []
  },
  onLoad() {
    this.loadCategories();
  },
  loadCategories() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    wx.request({
      url: 'http://1ab188bh60243.vicp.fun:14137/categories',
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        if (res.data.code === 200 && res.data.data) {
          const initCategories = res.data.data.map(item => ({
            ...item,
            checked: false
          }));
          this.setData({
            categories: initCategories,
            filteredCategories: initCategories
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
    this.filterCategories(searchValue);
  },
  filterCategories(keyword) {
    const { categories, selectedCategories } = this.data;
    let filterResult = [...categories];
    if (keyword) {
      filterResult = categories.filter(item => {
        const idStr = item.categoryid.toString();
        const nameStr = item.category_name.toLowerCase();
        return idStr.includes(keyword) || nameStr.includes(keyword.toLowerCase());
      });
    }
    const finalList = filterResult.map(item => ({
      ...item,
      checked: selectedCategories.includes(Number(item.categoryid))
    }));
    this.setData({ filteredCategories: finalList });
  },
  onCheckboxChange(e) {
    const categoryId = Number(e.currentTarget.dataset.id);
    const isChecked = e.detail.checked;
    const { selectedCategories } = this.data;
    let newSelected = [...selectedCategories];
    if (isChecked) {
      if (!newSelected.includes(categoryId)) {
        newSelected.push(categoryId);
      }
    } else {
      newSelected = newSelected.filter(id => id !== categoryId);
    }
    this.setData({
      selectedCategories: newSelected,
      filteredCategories: this.data.filteredCategories.map(item => ({
        ...item,
        checked: newSelected.includes(Number(item.categoryid))
      }))
    });
    console.log('最终选中ID:', this.data.selectedCategories, '长度：', this.data.selectedCategories.length);
    console.log('当前选中ID:', newSelected);
  },
  onItemTap(e) {
    const categoryId = Number(e.currentTarget.dataset.id);
    const currentItem = this.data.filteredCategories.find(item => Number(item.categoryid) === categoryId);
    const isChecked = currentItem ? currentItem.checked : false;
    this.onCheckboxChange({
      detail: { checked: !isChecked },
      currentTarget: { dataset: { id: categoryId } }
    });
  },  
  handleDelete() {
    const currentSelectedIds = this.data.selectedCategories;
    console.log('handleDelete实际拿到的选中数组:', currentSelectedIds);
    console.log('长度:', currentSelectedIds.length);
    if (!currentSelectedIds || currentSelectedIds.length === 0) {
      wx.showToast({
        title: '请选择删除项',
        icon: 'none',
        duration: 1500
      });
      console.log('【提示来源】:handleDelete函数')
      return;
    }
    wx.showModal({
      title: '确认删除',
      content: `确定删除选中的${currentSelectedIds.length}个菜品大类？旗下店铺将自动转移至「其他」大类`,
      confirmText: '确认删除',
      confirmColor: '#FF7A2F',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(currentSelectedIds);
        }
      }
    });
  },
  performDelete(deleteIds) {
    wx.showLoading({ title: '删除中...', mask: true });
    const url = `http://1ab188bh60243.vicp.fun:14137/delete_food?category_ids=${deleteIds.join(',')}`;
    console.log('【准备发送请求】要删除的ID:',deleteIds);
    wx.request({
      url: url,
      method: 'DELETE',
      data: {},
      query: {
        category_ids: deleteIds.join(',') 
      },
      success: (res) => {
        wx.hideLoading();
        console.log('【后端返回结果】：',res.data);
        if (res.data.code === 200) {
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.setData({ searchValue: '', selectedCategories: [] });
          this.loadCategories();
        } else {
          console.log('【后端返回错误信息】：',res.data.msg);
          wx.showToast({ title: res.data.msg, icon: 'error' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.log('【请求错误信息】：',err);
        wx.showToast({ title: '删除失败', icon: 'error' });
      }
    });
  }  
});