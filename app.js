//app.js
App({
  onLaunch: function () {
    this.getBarStatusHeight();
  },
  /**
   * 获取手机状态栏的高度
   */
  getBarStatusHeight() {
    try {
      const res = wx.getSystemInfoSync();
      if (res.statusBarHeight) {
        this.globalData.barStatusHight = res.statusBarHeight;
      }
    } catch (e) {
    }
  },
  showToast(msg, time) {
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: time ? time : 2000
    })
  },
  showLoading(msg){
    wx.showLoading({
      title: msg ? msg : '加载中',
      mask: true
    })
  },
  
  /**
   * 获取星期的字符串
   * @param {*} data 
   */
  initWeekText(data){
    let text = '';
    switch (data) {
      case 0:
        text = '周日';
        break;
      case 1:
        text = '周一';
        break;
      case 2:
        text = '周二';
        break;
      case 3:
        text = '周三';
        break;
      case 4:
        text = '周四';
        break;
      case 5:
        text = '周五';
        break;
      case 6:
        text = '周六';
        break;
      default:
        text = '-';
        break;
    }
    return text;
  },
  globalData: {
    defaultLongitude: 116.397470,
    defaultLatitude: 39.908823,
    startPoint: {
      id: 1,
      iconPath: '/assets/images/start-map.png',
      rotate: 0,
      anchor: {
        x: 0.5,
        y: 0.85
      },
      width: 32,
      height: 40
    },
    endPoint: {
      id: 2,
      iconPath: '/assets/images/end-map.png',
      rotate: 0,
      anchor: {
        x: 0.5,
        y: 0.85
      },
      width: 32,
      height: 40
    },
    markObject: {
      icon: "/assets/images/marker.png",
      width: 31,
      height: 16
    },
    userInfo: null,
    scale: 3,
    barStatusHight: 20,
    alarmTime: {
      startTime: "", // 报警 开始/结束时间自定义
      endTime: ""
    },
    historyTime: {
      startTime: "", // 轨迹 开始/结束时间自定义
      endTime: ""
    },
    tabColor: "#999db2",  // 底部菜单颜色
    tabSelectedColor: "rgb(43,161,238)", // 底部菜单选中颜色
    tabList: [{
      pagePath: "/pages/position/position",
      text: "位置",
      iconPath: "/assets/images/tab1.png",
      selectedIconPath: "/assets/images/tab1-active.png",
    },
    {
      pagePath: "/pages/trajectory/trajectory",
      text: "轨迹",
      iconPath: "/assets/images/tab2.png",
      selectedIconPath: "/assets/images/tab2-active.png",
    },
    {
      pagePath: "/pages/alarm/alarm",
      text: "报警",
      iconPath: "/assets/images/tab3.png",
      selectedIconPath: "/assets/images/tab3-active.png",
    },
    {
      pagePath: "/pages/user/user",
      text: "我的",
      iconPath: "/assets/images/tab4.png",
      selectedIconPath: "/assets/images/tab4-active.png",
    }]
  }
})