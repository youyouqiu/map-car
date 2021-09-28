let isTest = true; 
// 'develop'开发版  'trial'体验版,   'release'正式版
if (__wxConfig.envVersion) {
  console.log('版本信息', __wxConfig.envVersion)
  let env = __wxConfig.envVersion;
  if (env =='develop') {
    isTest = true
  } else if (env == 'trial') {
    isTest = true
  } else if (env == 'release') {
    isTest = false
  }
}
// https://192.168.24.142:443/  
// https://zwkj-test.com:9443/
// https://www.picclbs.com
// https://www.zoomwell.cn/
// utilApi = 'http://10.163.0.28:7400/'
const testApi = 'https://www.zoomwell.cn/' //192.168.66.52
const prodApi = 'https://www.zoomwell.cn/'
const utilApi = 'http://10.163.0.28:7400/'
let Api = isTest ? testApi : prodApi;
let socketApi = "wss://zoomwell.com/";
module.exports = {
  Api,
  socketApi,
  utilApi
};