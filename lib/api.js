import Request from './httpServer'
let SEVER_HOST = require('./getEnv.js').Api;
let UTIL_HOST = require('./getEnv.js').utilApi;

/* 获取logo与小程序名称 */
export const logoAndNameRequest = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/user/login`, params)
}
/* 登录 */
export const loginRequest = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/user/login`, params)
}
/* 获取位置信息 */
export const locationRequest = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/location`, params)
}
/** 轨迹回放  */
export const monitorHistoryData = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/getMonitorHistoryData`, params)
}
/** 初始化报警接口  */
export const alarmInterfaceInit = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/getAlarmList`, params)
}
/** 报警信息查询  */
export const alarmListRequestPage = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/getAlarmPage`, params)
}
/* 保养信息 */
export const maintenanceReminder = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/getMaintenanceReminder`, params)
}
/**退出登录 */
export const logOutRequest = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/logOut`, params)
}
/** 修改密码 */
export const passwordUpdateRequest = params => {
  return new Request().post(`${SEVER_HOST}clbs/single/vehicle/updatePassword`, params)
}
/** 根据经纬度获取位置 */
export const locationByLongitude = params => {
  return new Request().requestBasic(`${UTIL_HOST}api/tool/analysis/address`, params, null, "GET")
}