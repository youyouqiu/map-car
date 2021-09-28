import { utilApi } from '../../lib/getEnv';
const addressRequest = (latitude, longitude) => {
  let timeout = true, timer = null;
  const closeLoadingToast = (msg) => {
    wx.hideLoading();
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 2000
    })
    clearTimeout(timer);
    timeout = false;
  }
  return new Promise((resolve, reject) => {
    timer = setTimeout(() => {
      if (timeout) {
        closeLoadingToast("请求超时");
        return false;
      }
      clearTimeout(timer);
      timeout = false;
    }, 35000)
    wx.request({
      url: utilApi + "api/tool/analysis/address",
      method: method,
      data: data,
      header: header ? header : {},
      success: (res) => {
        console.log("接口请求成功 时间差：", +new Date() - time)
        if(res.data.code === 10000){
          resolve(res.data);
        }else{
          closeLoadingToast(res.data.msg || '数据出错');
        }
      },
      fail: (res) => {
        console.log('接口请求失败 [fail]', res)
        closeLoadingToast(res.errMsg || "网络错误-fail");
        reject(res)
      }
    });
  })
}

export default {
  addressRequest
}