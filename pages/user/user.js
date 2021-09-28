import {
  maintenanceReminder,
  logOutRequest
} from '../../lib/api';
const App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    errorStatus: null,
    maintainMileage: "",
    distance: "",
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    
  },

  /**
   * 更新保养提醒信息
   */
  updateMaintenance(){
    App.showLoading("数据正在更新");
    maintenanceReminder().then(res => {
      if(res){
        // maintainMileage 保养里程  distance总里程
        let { maintainMileage, distance } = res;
        this.setData({
          maintainMileage,
          distance,
          errorStatus: false
        }, () => {
          const timer = setTimeout(() => {
            wx.hideLoading();
            clearTimeout(timer);
          }, 300);
        })
      }
    }, () => {
      this.setData({
        errorStatus: true
      })
    })
  },
  /**
   * 修改密码
   */
  goUpdatePasswd() {
    wx.navigateTo({
      url: '/pages/password/password',
    })
  },
  /**
   * 退出登录
   */
  loginOut(){
    const userToken = wx.getStorageSync('userToken');
    if(userToken){
      App.showLoading("请稍后");
      logOutRequest({token: userToken}).then(() => {
        wx.hideLoading();
        App.showToast("退出成功", 500);
        getApp().globalData.scale = 3;
        const timer = setTimeout(() => {
          clearTimeout(timer);
          wx.reLaunch({
            url: '/pages/index/index'
          })
        }, 500);
      })
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.updateMaintenance();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  }
})