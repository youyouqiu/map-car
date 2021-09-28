const App = getApp();
let timer = null,
  times = 5,
  timerLocation = null,
  timerLocationCu = 0;
import {
  locationRequest
} from '../../lib/api';
import {
  initDateTime
} from '../../utils/util.js';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    errorStatus: false,
    isSatellite: false,
    scale: App.globalData.scale,
    uploadtime: '',
    gpsTime: '',
    positionDescription: '',
    centerLongitude: App.globalData.defaultLongitude,
    centerLatitude: App.globalData.defaultLatitude,
    markers: [],
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 请求出错 重新刷新数据请求接口
   */
  handleErrorRefresh(){
    this.getPositionData();
  },

  /**
   * 获取位置信息
   */
  getPositionData() {
    const {
      markObject
    } = App.globalData;
    App.showLoading("正在更新位置");
    locationRequest().then(res => {
      if (res) {
        let markers = [];
        const close = () => {
          const newtime = setTimeout(() => {
            clearTimeout(newtime);
            this.initScale();
          }, 1000)
        }
        if(!res.longitude || !res.latitude){
          wx.hideLoading();
          App.showToast("位置无效，将为您显示默认位置", 1600);
          close();
          return false;
        }
        const {longitude, latitude, direction, monitorInfo: {monitorId}} = res;
        markers.push({
          iconPath: markObject.icon,
          id: monitorId,
          rotate: -direction,
          longitude,
          latitude,
          width: markObject.width,
          height: markObject.height
        })
        this.setData({
          markers,
          uploadtime: initDateTime(res.uploadtime),
          gpsTime: initDateTime(res.gpsTime),
          positionDescription: res.positionDescription,
          errorStatus: false
        }, () => {
          wx.hideLoading();
          close();
        })
      }
    }).catch(e => {
      console.log(e, 'e');
      // 接口请求失败  设置默认中心经纬度
      this.setData({
        errorStatus: false
      }, () => {
        App.showToast("接口请求失败", 1600);
      })
    })
  },

  /**
   * 地图缩放比例变化
   */
  initScale(e) {
    if (App.globalData.scale != 3){
      this.setData({
        scale: App.globalData.scale
      })
      return false
    };
    times = 5;
    const timer = setInterval(() => {
      let {
        scale
      } = this.data;
      if (scale >= 18) {
        clearInterval(timer);
      }
      getApp().globalData.scale = scale + times;
      this.setData({
        scale: scale + times
      })
      times--;
    }, 800)
  },

  /**
   * 模式切换
   */
  modelChange(res) {
    this.setData({
      isSatellite: res.detail.isSatellite
    })
  },
  /**
   * 比例变化
   */
  scaleChange(res) {
    this.setData({
      scale: res.detail.scale
    }, () => clearInterval(timer))
  },
  /**
   * 地图位置更新
   */
  refreshChange(res) {
    this.getPositionData();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    console.log('监听页面显示', timerLocationCu);
    const satelliteMd = wx.getStorageSync('satelliteMd') || false;
    this.setData({
      isSatellite: satelliteMd
    });
    if (timerLocationCu <= 0) {
      this.getPositionData();
      timerLocationCu++;
    }
    timerLocation = setInterval(() => {
      this.getPositionData();
    }, 30000);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    timerLocationCu = 0;
    clearInterval(timerLocation);
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    timer = null;
    times = 5;
    clearInterval(timer);
    timerLocationCu = 0;
    clearInterval(timerLocation);
  }
})