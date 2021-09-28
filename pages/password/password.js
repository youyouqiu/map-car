import WxValidate from '../../utils/WxValidate';
import {
  passwordReg
} from '../../utils/util.js';
import {
  passwordUpdateRequest
} from '../../lib/api';
const App = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    oldPasswd: "",
    passwd: "",
    confirmPasswd: "",
    clickFlag: false, // 密码修改确定按钮点击状态
    visiableIcon: 'https://6465-develop-1-20hb3-1302057402.tcb.qcloud.la/staticImages/visiable.png?sign=2a04dc1274a81742d5181264de051657&t=1588925988',
    unVisiableIcon: 'https://6465-develop-1-20hb3-1302057402.tcb.qcloud.la/staticImages/unVisiable.png?sign=2caf0ee2899553f1c347211b983ca5e3&t=1588926006',
    visiable1: false,
    visiable2: false,
    visiable3: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initValidate();
  },

  // 清除密码1
  onCloneOldPasswd() {
    this.setData({
      oldPasswd: '',
    });
  },
  // 清除密码2
  onClonePasswd() {
    this.setData({
      passwd: '',
    });
  },
  // 清除密码3
  onCloneConfirmPasswd() {
    this.setData({
      confirmPasswd: '',
    });
  },

  /**
   * 密码修改表单验证
   */
  initValidate() {
    const rules = {
      oldPasswd: {
        required: true,
        passwordValidate: true
      },
      passwd: {
        required: true,
        passwordValidate: true
      },
      confirmPasswd: {
        required: true,
        passwordValidate: true
      }
    };
    const messages = {
      oldPasswd: {
        required: "原密码不能为空"
      },
      passwd: {
        required: "新密码不能为空"
      },
      confirmPasswd: {
        required: "确认密码不能为空"
      }
    };
    this.WxValidate = new WxValidate(rules, messages);
    // 自定义验证密码规则 只能输入大小写字母或0-9数字
    this.WxValidate.addMethod('passwordValidate', (value, param) => {
      return this.WxValidate.optional(value) || passwordReg.test(value)
    }, '只能输入大小写字母或0-9数字')
  },
  /**
   * 密码是否明文显示
   */
  passwordVisiable(e) {
    const {
      idx
    } = e.currentTarget.dataset, container = 'visiable' + idx;
    const visiable = this.data[container];
    this.setData({
      [container]: !visiable
    })
  },
  /**
   * 密码修改表单提交
   */
  passwdFormSubmit(e) {
    const { oldPasswd, passwd, confirmPasswd } = e ? e.detail.value : this.data;
    const params = {oldPasswd, passwd, confirmPasswd};
    if (!this.WxValidate.checkForm(params)) {
      const error = this.WxValidate.errorList[0];
      App.showToast(error.msg)
      return false;
    }
    if (params.passwd !== params.confirmPasswd) {
      App.showToast("新密码与输入密码不一致");
      return false;
    }
    if (params.passwd === params.oldPasswd) {
      App.showToast("新密码不能与原密码相同");
      return false;
    }
    // console.log('密码修改提交数据：', params)
    const token = wx.getStorageSync('userToken');
    if (!token) {
      App.showToast("请先登录");
      wx.reLaunch({
        url: '/pages/index/index'
      })
      return false;
    };
    const param = {
      oldVehiclePassword: params.oldPasswd,
      newVehiclePassword: params.passwd,
      confirmNewVehiclePassword: params.confirmPasswd,
      token
    }
    this.setData({
      clickFlag: true
    }, () => {
      App.showLoading("修改中，请稍后");
      passwordUpdateRequest(param).then(res => {
        if(!res){
          this.setData({
            clickFlag: false
          })
          return false;
        }
        try {
          const userInfo = wx.getStorageSync('userInfo');
          wx.setStorageSync('userInfo', {
            ...userInfo,
            password: params.passwd
          });
          this.setData({
            clickFlag: false
          }, () => {
            App.showToast("密码修改成功，请重新登录", 500);
            const timer = setTimeout(() => {
              wx.reLaunch({
                url: '/pages/login/login'
              })
              clearTimeout(timer);
            }, 500)
          })
        } catch (e) {}
      }).catch(e => {
        this.setData({
          clickFlag: false
        }, () => App.showToast(e.msg));
      })
    })
  },

  /**
   * 返回
   */
  pageBack() {
    wx.switchTab({
      url: "/pages/user/user"
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