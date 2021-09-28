const App = getApp();
Component({
  properties: {
    active: {
      type: Number,
      value: 0
    }
  },
  data: {
    color: "",
    selectedColor: "",
    list: []
  },
  attached() {
    const { tabColor, tabSelectedColor, tabList } = App.globalData;
    this.setData({
      color: tabColor,
      selectedColor: tabSelectedColor,
      list: tabList
    })
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({
        url
      })
    }
  }
})