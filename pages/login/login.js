import WxValidate from '../../utils/WxValidate';
import { plateNumberReg, passwordReg, logoAndNameRequest } from '../../utils/util.js';
import {
  loginRequest
} from '../../lib/api';
const App = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    logoUrl: '', // logo
    name: 'F3单车监控', // 名称
    plateNumber: "", // 只能输入汉字、字母、数字或短横杠，长度超过20位就让其输入无效
    password: "", // 只能输入大小写字母或0-9数字
    loginStatus: false // 登录状态
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.initLogoAndName();
    this.initLoginForm();
    this.initValidate();
  },

  //获取logo和name
  initLogoAndName() {
    logoAndNameRequest({
      a: 1,
      b: 2,
    }).then(res => {
      if (res) {

      }
    }).catch(e => {

    });
  },
  // 缓存账号密码
  initLoginForm() {
    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo.plateNumber && userInfo.password) {
        this.setData({
          plateNumber: userInfo.plateNumber,
          password: userInfo.password
        })
      }
    } catch (e) {
    }
  },

  // 清除账号
  onClonePlateNumber() {
    this.setData({
      plateNumber: '',
    });
  },

  // 清除密码
  onClonePassword() {
    this.setData({
      password: '',
    });
  },

  // 登录表单验证
  initValidate() {
    const rules = {
      plateNumber: {
        required: true,
        plateNumberValidate: true
      },
      password: {
        required: true,
        passwordValidate: true
      }
    };
    const messages = {
      plateNumber: {
        required: "车牌号不能为空"
      },
      password: {
        required: "密码不能为空"
      }
    };
    this.WxValidate = new WxValidate(rules, messages);
    // 自定义验证车牌号/账号规则 只能输入汉字、字母、数字或短横杠，长度超过20位就让其输入无效
    this.WxValidate.addMethod('plateNumberValidate', (value, param) => {
      return this.WxValidate.optional(value) || plateNumberReg.test(value)
    }, '只能输入汉字、字母、数字或短横杠')
    // 自定义验证密码规则 只能输入大小写字母或0-9数字
    this.WxValidate.addMethod('passwordValidate', (value, param) => {
      return this.WxValidate.optional(value) || passwordReg.test(value)
    }, '只能输入大小写字母或0-9数字')
  },

  // 登录提交
  loginFormSubmit(e) {
    const { plateNumber, password } = e ? e.detail.value : this.data;
    const params = { plateNumber, password };
    if (!this.WxValidate.checkForm(params)) {
      const error = this.WxValidate.errorList[0];
      App.showToast(error.msg)
      return false;
    }
    // console.log('登录提交数据：', params)
    App.showLoading("正在登录");
    this.setData({
      loginStatus: true
    }, () => {
      loginRequest({
        brand: plateNumber,
        vehiclePassword: password
      }).then(res => {
        if(!res){
          this.setData({
            loginStatus: false
          }, () => wx.hideLoading())
          return false;
        }
        wx.hideLoading();
        App.showToast("登录成功");
        // 登录重置之前选择的数据
        getApp().globalData.historyTime = {startTime: '', endTime: ''};
        getApp().globalData.alarmTime = {startTime: '', endTime: ''};
        try {
          const _plateNumber = wx.getStorageSync("plateNumber");
          if(_plateNumber != plateNumber){
            wx.setStorageSync('satelliteMd', false);
          }
          wx.setStorageSync('plateNumber', plateNumber);
          wx.setStorageSync('userInfo', params);
          wx.setStorageSync('userToken', res.token);
        } catch (e) {
          console.log("数据存储出错")
        }
        wx.switchTab({
          url: "/pages/position/position"
        })
      }, (res) => {
        this.setData({
          loginStatus: false
        }, () => App.showToast(res.msg || "登录失败，请稍后重试"))
      })
    })
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