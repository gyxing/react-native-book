export { NavigationActions } from 'react-navigation'
import { Dimensions } from 'react-native'

export { default as Storage } from './storage'
export { default as request } from './request'
export { default as Format } from './format'

export const delay = time => new Promise(resolve => setTimeout(resolve, time))

export const createAction = type => payload => ({ type, payload })

/* 移除html标签 */
export const removeTag = str => str.replace(/<.*?>/gi, '')

/* 字符串替换字符 */
export const replaceAll = (str, s1, s2) => {
  const reg = new RegExp(s1, 'g')
  return str.replace(reg, s2)
}

/* 匹配标签 */
export const getHtmlObject = (html, tag) => {
  const reg = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'ig')
  return html.match(reg)
}

/* 匹配标签 */
export const getHtmlObjectSimple = (html, tag) => {
  const reg = new RegExp(`<${tag}.*?>`, 'ig')
  return html.match(reg)
}

/* 匹配标签 */
export const getHtmlObjectLong = (html, start, end) => {
  const reg = new RegExp(`<${start}.*?>[\\s\\S]*?<\\/${end}>`, 'ig')
  return html.match(reg)
}

/* 生成uuid */
export const guid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    let r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

/* 设备屏幕宽度 */
export const appWidth = Dimensions.get('window').width

/* 设备屏幕高度 */
export const appHeight = Dimensions.get('window').height

/* 书籍默认封面 */
export const defaultImg = require('../images/default.jpg')

/* 资源列表 */
export const originList = [
    { key: "qu.la", search: "https://sou.xanbhx.com/search?siteid=qula&q=", searchCharset: 'utf8', charset: 'utf8' },
    { key: "166xs.com", search: "http://zhannei.baidu.com/cse/search?s=4838975422224043700&wt=1&q=", searchCharset: 'utf8', charset: 'gbk' },
    { key: "dingdiann.com", search: "https://www.dingdiann.com/searchbook.php?keyword=", charset: "utf8" },
    // { key: "23us.cc", search: "https://sou.xanbhx.com/search?t=920895234054625192&siteid=23uscc&q=" },
    { key: "biqukan.com", search: "http://www.biqukan.com/s.php?ie=gbk&s=2758772450457967865&q=", searchCharset: 'gbk', charset: 'gbk' },
];
