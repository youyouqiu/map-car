let timer = null,
  timeout = false;
class request {
  constructor() {
    const token = wx.getStorageSync('userToken');
    if (token) {
      this._header = {
        'token': token
      }
    }
  }
  /**
   * 错误提示并关闭加载框 取消定时器
   * @param {*} result 
   */
  closeLoadingToast(msg) {
    wx.hideLoading();
    if(msg){
      wx.showToast({
        title: msg,
        icon: 'none',
        duration: 2000
      })
    }
    clearTimeout(timer);
    timeout = false;
  }
  /**
   * 未登录
   * @param {*} result 
   */
  unLogin(){
    this.closeLoadingToast("请先登录");
    const newtime = setTimeout(() => {
      clearTimeout(newtime);
      wx.reLaunch({
        url: '/pages/login/login'
      })
    }, 1000)
  }
  /**
   * 处理请求 success 之后的情况
   */
  handleRequest(result) {
    // 认证失败,请先登录
    if (result.statusCode === 200) {
      const data = result.data;
      if (data.msg === '认证失败,请先登录') {
        this.unLogin();
        return false;
      }
      if (data.success) {
        timeout = false;
        clearTimeout(timer);
        if (!data.obj) {
          // console.log("接口返回数据找不到obj属性")
          // this.closeLoadingToast("接口返回数据格式出错");
          // return undefined;
        }
        // 返回的数据  如果有obj属性   就返回   否则返回整个数据
        console.log("接口成功返回结果：", data)
        return data.obj ? data.obj : data;
      } else {
        this.closeLoadingToast();
        return undefined;
      }
    }
  }
  /**
   * GET类型的网络h请求
   */
  get(url, data, header = this._header) {
    this.requestAll(url, data, header, 'GET');
  }

  /**
   * DELETE类型的网络请求
   */
  delete(url, data, header = this._header) {
    return this.requestAll(url, data, header, 'DELETE')
  }

  /**
   * PUT类型的网络请求
   */
  put(url, data, header = {
    'Content-Type': 'application/json;charset=UTF-8'
  }) {
    return this.requestAll(url, data, header, 'PUT')
  }

  /**
   * POST类型的网络请求
   */
  post(url, data, header = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }) {
    return this.requestAll(url, data, header ? header : this._header, 'POST')
  }
  /**
   * POST类型的网络请求
   */
  postOther(url, data, header = {
    'Content-Type': 'application/json;charset=UTF-8'
  }) {
    return this.requestAll(url, data, header, 'POST')
  }

  /**
   * 网络请求
   */
  requestAll(url, data, header, method) {
    let time = +new Date();
    console.log("接口请求地址：", url)
    console.log("接口请求参数：", data)
    return new Promise((resolve, reject) => {
      timeout = true;
      timer = setTimeout(() => {
        if (timeout) {
          this.closeLoadingToast("请求超时");
          return false;
        }
        clearTimeout(timer);
        timeout = false;
      }, 10000)
      const token = wx.getStorageSync('userToken');
      let pages = getCurrentPages(); //获取加载的页面
      let currentPage = pages[pages.length - 1]; //获取当前页面的对象
      let routeUrl = currentPage.route; //当前页面url
      console.log("token：",token)
      if(!token && routeUrl != 'pages/login/login'){
        //this.unLogin(); // 没有token且当前页面不是登录页  提示  并跳转登录页
        //return false;
      }
      if (header && token) header['token'] = token;
      // 川A68685
      wx.request({
        url: url,
        method: method,
        data: data,
        header: header ? header : {},
        success: (res) => {
          console.log("接口请求成功 时间差：", +new Date() - time)
          if(res.statusCode === 200){
            const resdata = this.handleRequest(res);
            if(resdata){
              resolve(resdata);
            }else{
              reject(res.data);
            }
          }else{
            this.closeLoadingToast();
            reject(res)
          }
        },
        fail: (res) => {
          console.log('接口请求失败 [fail]', res)
          this.closeLoadingToast(); //res.errMsg || "网络错误-fail"
          reject(res)
        }
      });
    })
  }
  /**
   * 获取地址 基本请求
   */
  requestBasic(url, data, header, method){
    let time = +new Date();
    console.log("接口请求地址：", url)
    console.log("接口请求参数：", data)
    return new Promise((resolve, reject) => {
      timeout = true;
      timer = setTimeout(() => {
        if (timeout) {
          closeLoadingToast("请求超时");
          return false;
        }
        clearTimeout(timer);
        timeout = false;
      }, 35000)
      wx.request({
        url: url,
        method: method,
        data: data,
        header: header ? header : {},
        success: (res) => {
          console.log("接口请求成功 时间差：", +new Date() - time)
          if(res.data.code === 10000){
            clearTimeout(timer);
            timeout = false;
            resolve(res.data.data);
          }else{
            this.closeLoadingToast(res.data.message || '数据出错');
          }
        },
        fail: (res) => {
          console.log('接口请求失败 [fail]', res)
          this.closeLoadingToast();
          reject(res)
        }
      });
    })
  }
}

export default request;