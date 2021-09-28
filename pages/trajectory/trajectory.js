import {
  monitorHistoryData
} from '../../lib/api';
import {
  formatTime,
  formatNumber,
  timestampToTime,
  pointDistance,
  getReverseGeocoder
} from '../../utils/util.js';
import {
  ungzip
} from '../../utils/unzip.js';
import log from '../../utils/log';

const App = getApp();
let timer = null,
  markerTimes = 0, 
  diffTimes = 20, 
  markerId = 1;
let startX = 0;
let _pixelRatio = 2;
let markRradii = 9,
  lineHeight = 6,
  lineTop = 0,
  lineWidth = 10,
  canvasWidth = 10,
  canvasHeight = 10; // 圆 、 线的半径
let polylineColor = "#1b1da6", polylineWidth = 3;
let {startPoint, endPoint} = App.globalData;
let startDriveIndex = 0, lastAngle = 0;
let mapTimes = 0, regionchange = false; // 获取地图中心位置和缩放比例的次数
Page({

  /**
   * 页面的初始数据
   */
  data: {
    test: "44",
    centerLongitude: "",
    centerLatitude: "",
    errorStatus: null,
    startTime: '',
    endTime: '',
    isSatellite: false,
    scale: 16,
    defaultPoints: [],
    polyline: [],
    markers: [],
    currentLocation: {
      date: "",
      time: "",
      speed: "",
      address: "",
    },
    playStatus: false, // 播放/暂停状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    const current = formatTime(new Date());
    const currentDate = [current.year, current.month, current.day].map(formatNumber).join('-'),
      currentTime = [current.hour, current.minute, current.second].map(formatNumber).join(':');
    this.startTime = currentDate + ' 00:00:00', this.endTime = currentDate + ' ' + currentTime;
    this.pageData = [];
    this.x; // 
    this.unitWidth = 1;
    this.markCtx = null;
    this.lineCtx = null;
    this.initPageSize();
    // this.initFormatDatetime(() => this.getPageData())
    log.info('hello test hahaha'); // 日志会和当前打开的页面关联，建议在页面的onHide、onShow等生命周期里面打
    log.warn('warn');
    log.error('error');
    log.setFilterMsg('filterkeyword');
    log.addFilterMsg('addfilterkeyword');
  },

  /**
   * 请求出错 重新刷新数据请求接口
   */
  handleErrorRefresh(){
    this.setData({
      errorStatus: false
    }, () => {
      this.markCtx && this.markCtx.clearRect(0, 0, canvasWidth, canvasHeight)
      this.lineCtx && this.lineCtx.clearRect(0, 0, canvasWidth, canvasHeight)
      this.initPageSize(() => this.initFormatDatetime(() => this.getPageData()));
    })
  },

  /**
   * 重置页面数据
   */
  resetData(){
    clearInterval(timer);
    timer = null;
    markerTimes = 0;
    this.mapCtx = null;
    this.pageData = [];
    this.setData({
      playStatus: false,
      centerLongitude: '',
      centerLatitude: '',
      markers: [],
      polyline: [],
      defaultPoints: [],
      currentLocation: {
        date: "-",
        time: "-",
        speed: "-",
        address: "-"
      }
    })
  },

  /**
   * 设置markers的值 中止移动动画
   */
  resetMarkers(longitude, latitude, rotate){
    markerId = Math.floor(Math.random() * 1000) + 10;
    const {markObject, defaultLongitude, defaultLatitude} = App.globalData;
    const totalLen = this.pageData.length;
    startPoint.latitude = this.pageData[0].latitude;
    startPoint.longitude = this.pageData[0].longitude;
    endPoint.latitude = this.pageData[totalLen-1].latitude;
    endPoint.longitude = this.pageData[totalLen-1].longitude;
    // console.log(lastAngle, rotate)
    const markerItem = {
      id: markerId,
      iconPath: markObject.icon,
      rotate: 0,
      anchor: {
        x: 0.5,
        y: 0.5
      },
      width: markObject.width,
      height: markObject.height,
      longitude: longitude || defaultLongitude,
      latitude: latitude || defaultLatitude
    };
    const newmarkers = [startPoint, endPoint, markerItem];
    this.setData({
      markers: newmarkers
    })
  },

  /**
   * 获取系统属性
   * 初始化mark标记
   * 根据圆mark的width height确定canvas的宽和高  
   * 进度条的高度，距离顶部的高度
   * 圆的半径
   */
  initPageSize(callback) {
    this.mapCtx = wx.createMapContext('map');
    
    const {
      pixelRatio
    } = wx.getSystemInfoSync();
    const query = wx.createSelectorQuery();
    _pixelRatio = pixelRatio;
    query.selectAll('#trackRoute,#mark')
      .fields({
        node: true,
        size: true
      })
      .exec((res) => {
        if(!res || !res[0] || !res[0].length) return false;
        const resLine = res[0][0],
          resMark = res[0][1];
        lineWidth = resLine.width;
        canvasWidth = resMark.width;
        canvasHeight = resMark.height;
        const canvas1 = resLine.node,
          canvas2 = resMark.node;
        // line - canvas1
        // mark - canvas2
        this.lineCtx = canvas1.getContext('2d');
        this.markCtx = canvas2.getContext('2d');
        canvas2.width = canvasWidth * _pixelRatio;
        canvas1.width = lineWidth * _pixelRatio; // 线容器的宽度前少半个圆  后少半个圆的宽度
        canvas1.height = canvas2.height = canvasHeight * _pixelRatio; // 高度一致
        this.lineCtx.scale(_pixelRatio, _pixelRatio);
        this.markCtx.scale(_pixelRatio, _pixelRatio);
        this.x = markRradii = canvasHeight / 2; // 半径 开始画圆的x轴
        lineHeight = Math.ceil(canvasHeight / 3); // 线条的高度
        lineTop = Math.ceil(canvasHeight / 2); // 线条距离容器顶部的高度
        callback && callback();
      })
  },

  /**
   * 初始化显示时间格式
   */
  initFormatDatetime(callback){
    if (!this.startTime || !this.endTime) return false;
    const start = this.startTime.split(" "),
      startDate = start[0].split("-");
    const end = this.endTime.split(" "),
      endDate = end[0].split("-");
    const _startTime = startDate[1] + "-" + startDate[2] + " " + start[1],
      _endTime = endDate[1] + "-" + endDate[2] + " " + end[1];
    this.setData({
      startTime: _startTime,
      endTime: _endTime
    }, () => callback())
  },

  /**
   * 获取页面数据
   */
  getPageData() {
    App.showLoading("数据正在加载");
    // 重置播放
    this.resetData();
    // startTime: "2020-05-21 00:00:00", endTime: "2020-05-21 23:59:59"
    monitorHistoryData({
      startTime: this.startTime, //"2020-06-16 00:00:00" , // 
      endTime: this.endTime //"2020-06-16 14:50:00" //
    }).then(res => {
      if (res) {
        let history = JSON.parse(ungzip(res.allData));
        // console.log(ungzip(responsedata.allData))
        this.dealHistoryData(history);
      }
    }, res => {
      // 接口请求失败  设置默认中心经纬度
      this.setData({
        errorStatus: true
      })
    })
  },

  /**
   * 处理接口请求返回的数据
   */
  dealHistoryData(jsondata){
    const { defaultLongitude, defaultLatitude } = App.globalData;
    wx.hideLoading();
    App.showLoading("正在处理");
    if (!jsondata.length){
      App.showToast("暂无数据")
      this.setData({
        scale: 18,
        polyline: [
          {
            points: [],
            color: polylineColor,
            width: polylineWidth
          }
        ],
        defaultPoints: [{latitude: defaultLatitude, longitude: defaultLongitude}],
        markers: [],
        errorStatus: false,
        centerLongitude: defaultLongitude,
        centerLatitude: defaultLatitude,
      })
      this.x = markRradii;
      if(this.markCtx || this.lineCtx){
        this.markCtx.clearRect(0, 0, canvasWidth, canvasHeight)
        this.lineCtx.clearRect(0, 0, canvasWidth, canvasHeight)
        this.initRouteLine();
        this.drawRouteMark(0);
      }
      return false;
    }
    console.log(jsondata)
    // 补点
    this.suplementMissingPoint(jsondata, (prevItem, time) => ({
      ...prevItem,
      uploadTime: time,
      speed: 0,
      drivingState: "-1"
    }));
    /**
     * 历史数据经纬度为0的点位置取上一个，具体逻辑为：
     * 如果一个点的经纬度同时为0，则同时向前向后寻找经纬度不为0的点，向前方向优先，
     * 如果遍历所有点都找不到有经纬度的点，则该点保持原样，也就是整条线都是经纬度为0
     * 后面的经纬度是厂商的经纬度，有时候会自动跳到该点，所以也需要过滤
     */
    for (let i = 0, len = jsondata.length; i < len; i += 1) {
      const element = jsondata[i];
      const prevElement = i > 0 ? jsondata[i-1] : null;
      let angle = element.angle ? element.angle : 0, distance = 60;
      let { month, day, hour, minute, second } = timestampToTime(element.uploadTime);
      if ((element.latitude === '0.0' && element.longtitude === '0.0') || (element.latitude === '22.612487' && element.longtitude === '114.059264')) {
        let toReplace = null;
        for (let j = 0, max = Math.max(i, len - i - 1); j < max; j += 1) {
          const prev = jsondata[i - j];
          const next = jsondata[i + j];
          if (prev && (prev.latitude !== '0.0' || prev.longtitude !== '0.0') && (prev.latitude !== '22.612487' || prev.longtitude !== '114.059264')) {
            toReplace = prev;
          } else if (next && (next.latitude !== '0.0' || next.longtitude !== '0.0') && (next.latitude !== '22.612487' || next.longtitude !== '114.059264')) {
            toReplace = next;
          }
          if (toReplace !== null) {
            break;
          }
        }
        if (toReplace !== null) {
          element.latitude = toReplace.latitude;
          element.longtitude = toReplace.longtitude;
        }else{
          element.latitude = App.globalData.defaultLatitude;
          element.longtitude = App.globalData.defaultLongitude;
        }
      }
      // 计算当前点和上一个点的距离
      if(prevElement){
        const dis = pointDistance(element.latitude, element.longtitude, prevElement.latitude, prevElement.longtitude);
        distance = dis ? Math.round(dis * 1000) * 1.5 : 60;
      }
      // console.log(distance)
      angle = Math.round(angle);
      month = isNaN(month) ? '-' : month;
      day = isNaN(day) ? '-' : day;
      hour = isNaN(hour) ? '-' : hour;
      minute = isNaN(minute) ? '-' : minute;
      second = isNaN(second) ? '-' : second;
      const date = [month, day].join("-"),
        time = [hour, minute, second].join(":");
      this.pageData.push({
        longitude: Number(element.longtitude),
        latitude: Number(element.latitude),
        // status: element.status, // ACC状态
        drivingState: element.drivingState, // 行驶状态 1:行驶; 2:停止;
        uploadTimes: element.uploadTime,
        date,
        time,
        distance,
        speed: element.speed,
        rotate: angle > 180 ? 360 - angle + 180 : angle,
        angle: angle
      })
    }
    // console.log(this.pageData)
    const totalLen = this.pageData.length;
    startDriveIndex = this.pageData.findIndex(item => item.drivingState == 1);
    const startDriveMarker = startDriveIndex > -1 ? this.pageData[startDriveIndex] : this.pageData[0];
    // const newdata = this.pageData.slice(0, this.pageData.length);
    const polyline = [{
      points: this.pageData,
      color: polylineColor,
      width: polylineWidth
    }];
    markerTimes = startDriveIndex > -1 ? startDriveIndex : 0;
    // include-points设置值得时候，地图会把所有数据包含在地图里面，并自动比例尺scale
    this.setData({
      polyline,
      defaultPoints: this.pageData,
      errorStatus: false,
      centerLongitude: '',
      centerLatitude: ''
    }, () => {
      regionchange = true;
      const newtime = setTimeout(() => {
        this.getMapInfo();
        clearTimeout(newtime)
      }, 1000);
    })
    this.initCurrentLocation(startDriveMarker)
    wx.hideLoading();
    const timer = setInterval(() => {
      if (this.lineCtx || this.markCtx) {
        clearInterval(timer);
        this.markCtx.clearRect(0, 0, canvasWidth, canvasHeight)
        this.lineCtx.clearRect(0, 0, canvasWidth, canvasHeight)
        if (totalLen) {
          this.initRouteLine();
          console.log("状态为行驶的第一条数据index：", startDriveIndex,"item：", startDriveMarker)
          if(startDriveIndex > -1){
            this.x = markerTimes * this.unitWidth + markRradii;
          }else{
            this.x = markRradii;
          }
          this.drawRouteMark(0);
          const {longitude,latitude,rotate} = startDriveMarker;
          this.resetMarkers(longitude,latitude,rotate);
        }
      }
    }, 80)
    const _timer = setTimeout(() => {
      wx.hideLoading();
      clearTimeout(_timer);
      clearInterval(timer);
      if(!this.lineCtx || !this.markCtx){
        App.showToast("手机不支持canvas")
      }
    }, 1000)
  },

  /**
   * 补点，如果数组的两个点时间相差大于五分钟，则按30秒一个点来补
   * @param {Array} array 需要补点的数组
   * @param {Function} cloneFunc 提供补点转换函数，接受上一个点和时间
   */
  suplementMissingPoint: (array, cloneFunc) => {
    if (!array) return;
    let err = 0;
    let len = array.length;
    for (let i = 0; i < len;) {
      const prevItem = array[i - 1],
        item = array[i];
      if (!prevItem) {
        i += 1;
        continue;
      }
      const difference = item.uploadTime - prevItem.uploadTime; // 都是以秒为单位
      if(difference <= 300) {
        err += 1
      }else{
        // console.log(item, prevItem, difference)
      };
      if (difference <= 300 || difference > 3600 * 24 * 3) { // 超过三天了也不补了，多半是数据有问题
        i += 1;
        continue;
      }
      let second30Times = Math.floor(difference / 30); // 这些秒中包含多少个30秒
      // 如果刚好是30秒间隔整数个，那么最后一个实际上不需要不点，比如10秒到70秒，差了60秒，但只需要补一个点
      if (difference / 30 === second30Times && second30Times > 0) {
        second30Times -= 1;
      }
      for (let j = 0; j < second30Times; j += 1) {
        array.splice(i + j, 0, cloneFunc(prevItem, prevItem.uploadTime * 1 + (30 * (j + 1))));
      }
      len = array.length;
      i += second30Times + 1;
    }
  },

  /**
   * 地图视野发生变化触发
   */
  regionChange(){
    if(!regionchange) return false;
    // this.mapCtx.getCenterLocation({
    //   success: resdata => {
    //     const {longitude, latitude} = resdata;
    //     this.setData({
    //       centerLongitude: longitude,
    //       centerLatitude: latitude
    //     }, () => regionchange = false)
    //   }
    // })
  },

  /**
   * 获取地图的中心坐标和缩放比例
   */
  getMapInfo(){
    if(!this.mapCtx) this.mapCtx = wx.createMapContext('map');
    this.mapCtx.getCenterLocation({
      success: resdata => {
        const {longitude, latitude} = resdata;
        console.log("getCenterLocation中心坐标", resdata)
        if(longitude == 0 || latitude == 0){
          if(mapTimes == 5){
            console,log("获取地图中心坐标错误次数5，取消继续获取");
            return false;
          }
          const timer1 = setTimeout(() => {
            clearTimeout(timer1);
            this.getMapInfo();
          }, 100);
          return false;
        }
        this.mapCtx.getScale({
          success: res => {
            this.setData({
              scale: res.scale,
              centerLongitude: longitude,
              centerLatitude: latitude
            })
          }
        })
      }
    })
  },

  /**
   * 只设置日期 时间 速度
   */
  initCurrentDate(data, callback){
    let {
      date,
      time,
      speed
    } = data;
    this.setData({
      currentLocation: {
        date,
        time,
        speed,
        address: '-',
      }
    }, () => callback && callback())
  },

  /**
   * 根据经纬度获取地址的文本信息  
   * 日期 时间 速度 地址
   */
  initCurrentLocation(data) {
    let {
      date,
      time,
      speed,
      longitude,
      latitude
    } = data;
    App.showLoading("地址获取中");
    getReverseGeocoder(latitude, longitude).then(res => {
      this.setData({
        currentLocation: {
          date,
          time,
          speed,
          address: res || '-',
        }
      }, () => {
        wx.hideLoading();
      })
    }, error => {
      console.log("逆地址解析出错", error)
      App.showToast("地址解析出错");
      this.setData({
        currentLocation: {
          date,
          time,
          speed,
          address: '-',
        }
      })
    })
  },

  /**
   * 绘制底部进度条直线
   */
  initRouteLine() {
    if(!this.lineCtx) return false;
    const {
      polyline
    } = this.data, points = polyline[0].points;
    this.lineCtx.lineWidth = lineHeight;
    if(!points.length){
      this.unitWidth = lineWidth;
      this.lineCtx.beginPath()
      this.lineCtx.moveTo(0, lineTop);
      this.lineCtx.lineTo(lineWidth, lineTop);
      this.lineCtx.closePath()
      this.lineCtx.strokeStyle = "lightgray";
      this.lineCtx.stroke()
      return false;
    }
    this.unitWidth = lineWidth / points.length;
    for (let idx in points) {
      const point = points[idx],
        startPoint = this.unitWidth * idx,
        endPoint = this.unitWidth * idx + this.unitWidth;
      let color = "#f99";
      // 1行驶-绿色 2停止-粉色 -1补点数据-灰色
      if (point.drivingState == "1") {
        color = "#a3d843";
      }
      if(point.drivingState == "2"){
        color = "#f99";
      }
      if(point.drivingState == "-1"){
        color = "lightgray";
      }
      if (!color) return false;
      point.color = color;
      point.len = endPoint;
      this.lineCtx.beginPath()
      this.lineCtx.moveTo(startPoint, lineTop);
      this.lineCtx.lineTo(endPoint, lineTop);
      this.lineCtx.closePath()
      this.lineCtx.strokeStyle = color;
      this.lineCtx.stroke()
    }
  },

  /**
   * canvas绘制控制进度条的圆点
   */
  drawRouteMark(step) {
    if(!this.markCtx) return false;
    this.markCtx.clearRect(0, 0, canvasWidth, canvasHeight)
    this.markCtx.beginPath();
    let ctxStep = this.unitWidth;
    if (step || step == 0) ctxStep = step;
    this.x = this.x + ctxStep;
    if(this.x > lineWidth + markRradii) this.x = lineWidth + markRradii;
    this.markCtx.arc(this.x, markRradii, markRradii, 0, 2 * Math.PI);
    this.markCtx.fillStyle = '#4367fd';
    this.markCtx.shadowColor = '#4367fd';
    this.markCtx.shadowBlur = 2;
    this.markCtx.shadowOffsetX = 1;
    this.markCtx.fill();
    this.markCtx.restore()
  },

  /**
   * 点击开始播放/暂停
   */
  bindPlayTrack() {
    let { playStatus, polyline } = this.data;
    // 没有数据 不做处理
    if(!polyline[0].points || !polyline[0].points.length) return false;
    this.setData({
      playStatus: !playStatus
    }, () => {
      if (playStatus || markerTimes == 0) {
        // 播放暂停的时候  需要更新时间、地点、速度等数据
        const currentItem = this.pageData[markerTimes];
        this.x = markerTimes * this.unitWidth + markRradii;
        // this.handleMarkerMove(currentItem, () => {
        //   this.initCurrentLocation(currentItem);
        //   if(markerTimes == 0) this.renderRouteMark();
        //   if(playStatus) this.drawRouteMark();
        // });
        this.resetMarkers(currentItem.longitude, currentItem.latitude, currentItem.angle);
        this.initCurrentLocation(currentItem);
        if(markerTimes == 0) this.renderRouteMark();
        if(playStatus) this.drawRouteMark();
      }else{
        this.renderRouteMark()
      }
    })
  },
  
  /**
   * 点击播放之后轨迹移动点和进度条变化渲染
   * @param {*} canvas 
   */
  renderRouteMark(canvas) {
    const {playStatus} = this.data
    if (playStatus) {
      const len = this.pageData.length - 1;
      const point = this.pageData[markerTimes],
        prevPoint = this.pageData[markerTimes - 1];
        // console.log(markerTimes,len)
        if(prevPoint && point && point.latitude == prevPoint.latitude && point.longitude == prevPoint.longitude){
          const timeout = setTimeout(() => {
            clearTimeout(timeout);
            if(markerTimes == len){
              this.setData({
                playStatus: false
              }, () => {
                markerTimes = 0;
                this.drawRouteMark();
                this.initCurrentLocation(point)
              })
              return false;
            }
            this.drawRouteMark();
            this.initCurrentDate(point);
              markerTimes++;
              this.renderRouteMark();
          },100)
          return false;
        }
        this.handleMarkerMove(point, () => {
          if(!this.data.playStatus) return false;
          // markerTimes 循环次数 == 总长度  则播放完毕，设置播放状态为false，markerTimes为0
          if(markerTimes == len){
            this.setData({
              playStatus: false
            }, () => {
              markerTimes = 0;
              this.drawRouteMark();
              this.initCurrentLocation(point)
            })
          }else{
            this.drawRouteMark();
            this.initCurrentDate(point);
            markerTimes++;
            this.renderRouteMark();
          }
        });
    }
  },
  
  /**
   * 利用小程序地图api translateMarker 
   * 平滑移动轨迹点
   * callback 是因为translateMarker是异步函数，需要监听回调，使用定时器存在问题
   */
  handleMarkerMove(point, animationEndFun) {
    if (!point) return false;
    if(!this.mapCtx) this.mapCtx = wx.createMapContext('map');
    // console.log(point.rotate, markerTimes)
    this.mapCtx.translateMarker({
      markerId: markerId,
      destination: {
        latitude: point.latitude,
        longitude: point.longitude
      },
      autoRotate: true,
      rotate: point.angle,
      duration: point.distance,
      success: () => {
        // const end = new Date().getTime();
        // console.log("translateMarker 开始调用至调用成功时间", end-start)
        // successFun && successFun();
      },
      animationEnd: () => {
        animationEndFun && animationEndFun();
      },
      fail: (res) => {
        // console.log(res)
      }
    })
  },
  
  /**
   * 进度拖动开始
   */
  handleMarkhStart(e){
    if (this.data.playStatus) return false;
    const { changedTouches } = e;
    startX = changedTouches[0].x;
    if(startX < markRradii){
      this.x = markRradii;
    } else if(startX > lineWidth + markRradii){
      this.x = lineWidth + markRradii;
    }else{
      this.x = startX;
    }
    this.setData({
      currentLocation: {
        date: "-",
        time: "-",
        speed: "-",
        address: "-"
      }
    })
    console.log("开始拖动", changedTouches, startX)
    this.drawRouteMark(0);
  },
  /**
   * 进度拖动
   */
  handleMarkhMove(e){
    if (this.data.playStatus) return false;
    const { changedTouches } = e;
    const currentX = changedTouches[0].x;
    if(currentX < markRradii){
      this.x = markRradii;
    }else if(currentX > lineWidth + markRradii){
      this.x = lineWidth + markRradii;
    }else{
      this.x = currentX;
    }
    // console.log("拖动", currentX)
    this.drawRouteMark(0);
  },
  /**
   * 进度拖动取消
   */
  handleMarkhCancel(e){
  },
  /**
   * 进度拖动结束
   */
  handleMarkhEnd(e){
    if (this.data.playStatus) return false;
    const { changedTouches } = e;
    let endX = changedTouches[0].x;
    if(endX < markRradii) endX = markRradii;
    if(endX > lineWidth + markRradii) endX = lineWidth + markRradii;
    this.x = endX;
    const _lineWidth = this.x - markRradii;
    const len = this.pageData.length - 1;
    // 根据当前拖动结束的位置  和  每个单位长度   计算点前点击的位置对应的路线的哪一个点
    let index = Math.ceil(_lineWidth / this.unitWidth);
    // 计算出来索引大于最大索引   则设置当前索引为最大索引
    if(index > len) index = len;
    console.log("半径和比例：", markRradii, this.unitWidth)
    console.log("当前index：", index, this.pageData[index])
    console.log("endX: ", endX,"已拖动长度：", _lineWidth, "总长度", lineWidth, "剩余长度：", lineWidth - _lineWidth)
    const currentMarker = this.pageData[index];
    markerTimes = index;
    lastAngle = currentMarker.angle;
    this.resetMarkers(currentMarker.longitude, currentMarker.latitude);
    this.initCurrentLocation(currentMarker);
    // this.handleMarkerMove(currentMarker, () => {
    //   this.initCurrentLocation(currentMarker);
    // });
  },

  /**
   * 自定义时间点击页面跳转
   */
  goCustomTime(){
    wx.navigateTo({
      url: "/pages/dateTime/dateTime?from=trajectory"
    })
  },

  /**
   * 地图比例变化
   */
  scaleChange(data) {
    this.mapCtx.getCenterLocation({
      success: res => {
        // console.log(res)
        if (res) {
          this.setData({
            scale: data.detail.scale,
            centerLongitude: res.longitude,
            centerLatitude: res.latitude
          })
        }
      }
    })
  },

  /**
   * 地图模式切换
   */
  modelChange(res) {
    this.setData({
      isSatellite: res.detail.isSatellite
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
    const {
      historyTime
    } = App.globalData, {
      startTime,
      endTime
    } = historyTime;
    const satelliteMd = wx.getStorageSync('satelliteMd') || false;
    this.setData({
      isSatellite: satelliteMd
    })
    if (startTime && endTime) {
      // 时间相同  则不获取数据
      if (startTime == this.startTime && endTime == this.endTime) {
        return false;
      }
      this.startTime = startTime;
      this.endTime = endTime;
    }
    if(this.markCtx) this.markCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    if(this.lineCtx) this.lineCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.initFormatDatetime(() => this.getPageData())
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
    wx.hideLoading();
    this.resetData();
  }
})