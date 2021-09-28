import {
  formatTime,
  formatNumber,
  intervalTime
} from '../../utils/util.js'
const App = getApp();
let pageUrl = 'alarm'; // 报警 alarm    轨迹 trajectory
Page({

  /**
   * 页面的初始数据
   */
  data: {
    startTime: '2019-11-11 11:11:25',
    endTime: '2016-09-01 22:11:38',
    intervalTimes: {
      days: 1,
      hours: 1,
      minutes: 1,
      seconds: 1
    },
    warning: ""
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    pageUrl = options.from;
    let startTime = "", endTime = "";
    const {alarmTime, historyTime} = App.globalData;
    if(pageUrl == "alarm" && alarmTime.startTime && alarmTime.endTime){
      startTime = alarmTime.startTime;
      endTime = alarmTime.endTime;
    }else if(pageUrl == "trajectory" && historyTime.startTime && historyTime.endTime){
      startTime = historyTime.startTime;
      endTime = historyTime.endTime;
    }else{
      const current = formatTime() || {},
        date = [current.year, current.month, current.day].map(formatNumber).join('-');
        startTime = `${date} 00:00:00`,
        endTime = `${date} 23:59:59`;
    }
    const intervalTimes = intervalTime(startTime, endTime);
    this.setData({
      startTime,
      endTime,
      intervalTimes
    })
  },

  /**
   * 开始日期选择器选择事件
   * @param {*} e 
   */
  handleStartTimeChange(e) {
    const { endTime } = this.data, currentTime = e.detail.dateString;
    const intervalTimes = intervalTime(currentTime, endTime);
    let warning = this.intervalTimeText(intervalTimes);
    this.setData({
      startTime: currentTime,
      warning,
      intervalTimes
    })
  },
  /**
   * 结束日期选择器选择事件
   * @param {*} e 
   */
  handleEndTimeChange(e) {
    const { startTime } = this.data, currentTime = e.detail.dateString;
    const intervalTimes = intervalTime(startTime, currentTime);
    let warning = this.intervalTimeText(intervalTimes);
    this.setData({
      endTime: e.detail.dateString,
      warning,
      intervalTimes
    })
  },

  /**
   * 计算相差时间 格式出错的 警告
   * @param {*} time 
   */
  intervalTimeText(time){
    console.log("时间差：", time)
    let warning = '';
    if(time.days < 0 || time.hours < 0 || time.minutes < 0 || time.seconds < 0){
      warning = "时间格式不对"
    }
    if(time.days > 2){
      if(time.days == 3 && time.hours == 0 && time.minutes == 0 && time.seconds == 0){}else{
        warning = "请勿超过3天";
      }
    }
    return warning;
  },

  /**
   * 返回
   */
  pageBack(e) {
    const { type } = e.currentTarget.dataset;
    const { startTime, endTime } = this.data;
    if(type){
      const time = {
        startTime,
        endTime
      }
      if(pageUrl == 'alarm'){
        getApp().globalData.alarmTime = time;
      }else{
        getApp().globalData.historyTime = time;
      }
    }
    if(!pageUrl) return false;
    wx.switchTab({
      url: `/pages/${pageUrl}/${pageUrl}`
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

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