const App = getApp();
import {
  formatTime,
  formatNumber
} from '../../utils/util.js';
import { alarmInterfaceInit, alarmListRequestPage} from '../../lib/api';
let timer = null;
let scrollFlag = true,  // 防止一直滚一直请求接口
  loadFlag = false; // 是否还存在数据
Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentTime: "2020-09-11",
    activeTime: "2020-09-13",
    datetimes: [],
    scrollTop: 0,
    alarmData: [],
    totalRecords: 0,
    isEmptyPage: false,
    loadRefresher: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.selectStartTime = '';
    this.selectEndTime = '';
    this.initDateTimes();
  },
  // 初始化 重置数据和接口
  resetPageData(callback){
    this.page = 0;
    this.limit = 15;
    this.pageTotal = 0;
    loadFlag = false;
    const {
      activeTime
    } = this.data;
    const alarmStartTime = this.selectStartTime ? this.selectStartTime : activeTime + " 00:00:00", alarmEndTime = this.selectEndTime ? this.selectEndTime : activeTime + " 23:59:59";
    const param = {
      alarmType: "3,13,14,29,30,157,158,0,1,2,18,19,2011,2012,20,2111,2112,21,2211,2212,22,23,15,148,149,164,24,25,26,27,28,31,4,5,6,7,8,9,10,11,12,16,17,651,652,653,661,662,663,14303,14301,14300,14302,14304,14305,14306,681,682,701,1321,702,683,67,124,12411,14411,125,126,1271,1272,130,128,131,129,77,75,147,76,7211,7212,7311,7312,11911,11912,151,209,150,203,82,7702,7703,79,81,32,118,11511,11512,11611,11612,123,1111,1112,113,114,107,106,104,105,108,109,18712,18715,18811,18718,18810,18812,18813,18814,18815,18716,18719,18717,18714,18711,18713,19711",
      alarmStartTime,
      alarmEndTime,
      status: -1,
      alarmSource: -1,
      pushType: -1
    };
    App.showLoading("请稍后");
    alarmInterfaceInit(param).then(res => {
      if (res.success) {
        this.setData({
          alarmData: [],
          totalRecords: 0
        }, () => {
          wx.hideLoading();
          callback && callback()
        })
      }
    })
    
  },
  /**
   * 初始化时间列表
   */
  initDateTimes() {
    const date = new Date();
    const {
      year,
      month,
      day
    } = formatTime(date);
    let lastDay = day,
      datetimes = [];
    for (lastDay; lastDay > -31; lastDay--) {
      let item = {};
      if (lastDay > 0) {
        item = {
          year: year,
          month: month,
          day: lastDay
        }
      } else {
        const monthDay = 31;
        let $month = 12,
          $year = year;
        if (month > 1) {
          $month = month - 1;
        } else {
          $year--;
        }
        let $lastDay = lastDay + monthDay;
        item = {
          year: $year,
          month: $month,
          day: $lastDay
        }
      }
      const $month = formatNumber(item.month),
        $day = formatNumber(item.day);
      const _week = new Date(`${item.year}-${$month}-${$day}`).getDay(), $week = App.initWeekText(_week);
      if(datetimes.length >= 5) break;
      datetimes.unshift({
        datetime: item.year + `-${$month}-${$day}`,
        year: item.year,
        date: `${$month}-${$day}`,
        week: `${$week}`
      })
    }
    if(datetimes.length){
      const current = datetimes[datetimes.length-1];
      this.setData({
        datetimes,
        currentTime: current,
        activeTime: current.datetime,
      })
    }
  },
  /**
   * 顶部时间选择
   */
  handleDateTimeChange(e){
    const {
      datetime
    } = e.currentTarget.dataset;
    const { activeTime } = this.data;
    if(activeTime == datetime) return false;
    if(datetime){
      this.setData({
        activeTime: datetime,
      }, () => {
        this.selectStartTime = '';
        this.selectEndTime = '';
        getApp().globalData.alarmTime = {startTime: '', endTime: ''};
        this.resetPageData(() => this.getPageData());
      })
    }
  },

  /**
   * 自定义时间点击页面跳转
   */
  goCustomTime(){
    wx.navigateTo({
      url: "/pages/dateTime/dateTime?from=alarm"
    })
  },

  getPageData() {
    let data = [];
    const {
      alarmData
    } = this.data;
    if(loadFlag) return false; // 开始数据大于等于总数据  则不执行
    App.showLoading("正在查询");
    const param = {
      // alarmType: 3,
      // alarmStartTime: -1,
      // alarmEndTime: -1,
      start: this.page * this.limit,
      length: this.limit,
      draw: this.page + 1
    };
    alarmListRequestPage(param).then(res => {
      if (res) {
        const {totalPages, records, totalRecords} = res;
        let newIsEmptyPage = false;
        for(let i = 0, len = records.length; i < len; i++){
          const item = records[i];
          // 找不到地点 但是有经纬度 则通过经纬度查询地点
          if(!item.alarmEndSpecificLocation && item.alarmEndLatitude && item.alarmEndLongitude){
            getReverseGeocoder({latitude: item.alarmEndLatitude, longitude: item.alarmEndLongitude}).then(res => {
              if(res) item.alarmEndSpecificLocation = res;
            }, error => {
              console.log("逆地址解析出错", error)
            })
          }
        }
        if(totalPages) this.pageTotal = totalPages;
        if(records) data = alarmData.concat(records);
        if (!data.length) newIsEmptyPage = true;
        loadFlag = data.length >= res.recordsTotal;
        try {
          wx.setStorageSync('alarmList', data)
        } catch (e) {}
        scrollFlag = true;
        this.setData({
          alarmData: data,
          totalRecords: totalRecords ? totalRecords : 0,
          isEmptyPage: newIsEmptyPage
        }, () => {
          const newtime = setTimeout(() => {
            wx.hideLoading();
            clearTimeout(newtime);
          }, 500)
        })
      }
    })
  },

  /**
   * 列表容器下拉刷新被触发
   */
  onRefresherRefresh(e) {
    console.log("下拉刷新被触发", e);
    this.resetPageData(() => this.getPageData());
    this.setData({
      loadRefresher: false
    })
  },
  /**
   * 滚动到列表容器底部/右边时触发
   */
  scrollLoadMore(e) {
    if (this.page === this.pageTotal) {
      App.showToast("已经是最后一页了");
      return false;
    }
    if(scrollFlag){
      console.log("scrollLoadMore滚动到底部并获取数据", e);
      scrollFlag = false;
      this.page += 1;
      this.getPageData();
    }
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
    const { alarmTime } = App.globalData,
      { startTime, endTime } = alarmTime;
    const {alarmData} = this.data;
    if(startTime && endTime){
      // 选择的时候等于当前查询数据的时间时   则不执行查询操作  将滚动条滚动至最顶部
      if(startTime == this.selectStartTime && this.selectEndTime == endTime){
        this.setData({
          scrollTop: 0
        })
        return false;
      }
      this.selectStartTime = startTime;
      this.selectEndTime = endTime;
      this.setData({
        activeTime: ""
      })
    }else if(alarmData.length){
      return false;
    }
    this.resetPageData(() => {
      this.getPageData();
    });
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
    timer = null;
    wx.hideLoading();
    clearInterval(timer);
  }
})