export { NavigationActions } from 'react-navigation'
import { Dimensions } from 'react-native';

export { default as Storage } from './storage'
export { default as request } from './request'
export { default as Format } from './format'

export const delay = time => new Promise(resolve => setTimeout(resolve, time));

export const createAction = type => payload => ({ type, payload });

/* 移除html标签 */
export const removeTag = (str) => {
  return str.replace(/<.*?>/ig,"")
};

/* 字符串替换字符 */
export const replaceAll = (str, s1, s2) => {
  let reg = new RegExp(s1,"g");
  return str.replace(reg, s2);
};

/* 匹配标签 */
export const getHtmlObject = (html, tag) => {
  let reg = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`,'ig');
  return html.match(reg);
};

/* 匹配标签 */
export const getHtmlObjectSimple = (html, tag) => {
  let reg = new RegExp(`<${tag}.*?>`, 'ig');
  return html.match(reg);
};

/* 匹配标签 */
export const getHtmlObjectLong = (html, start, end) => {
  let reg = new RegExp(`<${start}.*?>[\\s\\S]*?<\\/${end}>`,'ig');
  return html.match(reg);
};

/* 生成uuid */
export const guid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
    return v.toString(16);
  });
};

/* 设备屏幕宽度 */
export const appWidth = Dimensions.get('window').width;

/* 设备屏幕高度 */
export const appHeight = Dimensions.get('window').height;

/* 书籍默认封面 */
export const defaultImg = require('../images/default.jpg');
