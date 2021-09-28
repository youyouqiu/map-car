const QQMapWX = require('./qqmap-wx-jssdk.min.js'),
  qqmapsdk = new QQMapWX({
    key: 'JUMBZ-HI3CF-47KJD-N23WA-YLMJS-LHFBQ' // 必填
  });
/**
 * 格式化时间2020-12-12 传了date格式化date  否则格式化当前时间
 * @param {*} date 
 */
const formatTime = date => {
  if (!date) date = new Date();
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const week = date.getDay()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  return {
    year,
    month,
    day,
    week,
    hour,
    minute,
    second
  }
}

/**
 * 月 天 时 分 秒 < 9 加 0
 * @param {*} n 
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 初始化时间 年后两位+月+天+时+分+秒
 * @param {*} time 
 */
const initDateTime = (time) => {
  const currentTime = new Date().getFullYear();
  const beforeYear = currentTime.toString().substring(0, 2);
  const newTime = beforeYear + time.substring(0, 2) +
    "-" + time.substring(2, 4) +
    "-" + time.substring(4, 6) +
    " " + time.substring(6, 8) +
    ":" + time.substring(8, 10) +
    ":" + time.substring(10, 12);
  return newTime;
}

/**
 * 时间戳转时间
 * @param {*} startTime 
 * @param {*} endTime 
 */
const timestampToTime = (timestamp) => {
  timestamp = timestamp + '';
  if(timestamp.length == 10) timestamp = timestamp * 1000;
  var date = new Date(timestamp); //时间戳为10位需*1000，时间戳为13位的话不需乘1000
  var Y = date.getFullYear();
  var M = date.getMonth() + 1;
  var D = date.getDate();
  var h = date.getHours();
  var m = date.getMinutes();
  var s = date.getSeconds();
  return {
    year: Y,
    month: formatNumber(M),
    day: formatNumber(D),
    hour: formatNumber(h),
    minute: formatNumber(m),
    second: formatNumber(s)
  }
}

/**
 * iOS new Date 不支持在数据库中传递 2019-07-02这种格式的日期，必须转换为2019/07/02这种格式
 * @param {*} startTime 
 * @param {*} endTime 
 */
const formatIOSDate = (date) => {
  return date.replace(/-/g, '/');
}

/**
 * 计算时间间隔
 * @param {*} startTime 
 * @param {*} endTime 
 */
const intervalTime = (startTime, endTime) => {
  const start = new Date(formatIOSDate(startTime)),
    end = new Date(formatIOSDate(endTime));
  const interval = end.getTime() - start.getTime(); //时间差的毫秒数
  const days = Math.floor(interval / (24 * 3600 * 1000)), //相差天数
    leave1 = interval % (24 * 3600 * 1000), //天数后剩余的毫秒数
    hours = Math.floor(leave1 / (3600 * 1000)), //小时数
    leave2 = leave1 % (3600 * 1000), //小时数后剩余的毫秒数
    minutes = Math.floor(leave2 / (60 * 1000)), //分钟数
    leave3 = leave2 % (60 * 1000), //分钟数后剩余的毫秒数
    seconds = Math.round(leave3 / 1000); //相差秒数
  return {
    days,
    hours,
    minutes,
    seconds
  }
}

/**
 * 计算两个点之间的距离
 */

const pointDistance = (la1, lo1, la2, lo2) => {
  if(!la1 || !lo1 || !la2 || !lo2){
    console.log("传入经纬度有误");
    return 20;
  };
  const La1 = la1 * Math.PI / 180.0,
    La2 = la2 * Math.PI / 180.0;
  const _La = La1 - La2;
  const Lb3 = lo1 * Math.PI / 180.0 - lo2 * Math.PI / 180.0;
  let distance = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(_La / 2), 2) + Math.cos(La1) * Math.cos(La2) * Math.pow(Math.sin(Lb3 / 2), 2)));
  distance = distance * 6378.137;//地球半径
  distance = Math.round(distance * 10000) / 10000;
  return distance;
}

/**
 * 调用腾讯地图api 通过经纬度获取地址信息
 * @param {*} latitude 
 * @param {*} longitude 
 */
const getReverseGeocoder = (latitude, longitude) => {
  return new Promise((resolve, reject) => {
    if(!latitude || !longitude){
      wx.showToast("经纬度不正确");
      reject();
    }
    qqmapsdk.reverseGeocoder({
      location: {
        latitude,
        longitude
      },
      success: (res) => {
        if(res.status === 0){
          const {result: {address, formatted_addresses: {recommend}}} = res;
          resolve(address + recommend);
        }
      },
      fail: (error) => {
        reject(error);
      }
    })
  })
}

const plateNumberReg = /^[0-9a-zA-Z\u4e00-\u9fa5-]{1,20}$/; // 车牌号正则 
const passwordReg = /^[A-Za-z0-9]{1,6}$/; // 密码正则

module.exports = {
  formatTime,
  formatNumber,
  initDateTime,
  timestampToTime,
  intervalTime,
  pointDistance,
  plateNumberReg,
  passwordReg,
  getReverseGeocoder
}