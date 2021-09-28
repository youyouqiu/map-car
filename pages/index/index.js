import { logoAndNameRequest } from '../../lib/api';
Page({
  data: {
    logoUrl: '', // logo
    name: 'F3单车监控', // 名称
  },
  onLoad(options){
    // this.initLogoAndName();
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
  //跳转登录页
  goLogin: function() {
    wx.redirectTo({
      url: "/pages/login/login"
    })
  }
})
