const App = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    pageBack: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    vh: App.globalData.barStatusHight,
    pageTitle: "单车登录小程序"
  },

  lifetimes: {
    attached() {
      const plateNumber = wx.getStorageSync('plateNumber') || 20;
      const {title} = this.properties;
      this.setData({
        pageTitle: title ? title : plateNumber
      })
    },
    detached() {
    },
  },

  /**
   * 组件的方法列表
   */
  methods: {
    pageBack(){
      this.triggerEvent("pageBack")
    }
  }
})
