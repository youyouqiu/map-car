const App = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
  },

  /**
   * 组件的初始数据
   */
  data: {
    isSatellite: false
  },

  attached() {
    const satelliteMd = wx.getStorageSync('satelliteMd') || false;
    this.setData({
      isSatellite: !satelliteMd
    })
  },

  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 地图模式切换
     */
    bindModelChange(){
      const satelliteMd = wx.getStorageSync('satelliteMd') || false;
      this.setData({
        isSatellite: !satelliteMd
      }, () => {
        wx.setStorageSync('satelliteMd', !satelliteMd);
        this.triggerEvent("modelChange", { "isSatellite": !satelliteMd })
      })
    },
    /**
     * 地图缩放比例切换
     */
    bindScaleChange(e){
      const { step } = e.currentTarget.dataset;
      const mapObject = wx.createMapContext("map");
      mapObject.getScale({
        success: (e) => {
          const { scale } = e;
          const disableEnlarg = scale == 18 && step == 1,
            disableShrink = scale == 3 && step == -1;
          if (disableEnlarg) return false;
          if (disableShrink) return false;
          getApp().globalData.scale = scale * 1 + step * 1;
          this.triggerEvent("scaleChange", { "scale": App.globalData.scale })
        }
      })
    },
  }
})
