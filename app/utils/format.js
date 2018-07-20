import {
  getHtmlObjectLong,
  getHtmlObject,
  removeTag,
  replaceAll,
} from './index'
import { Toast } from 'antd-mobile'
/* 起点中文网 - 格式化书籍列表 */
const books = html => {
  const res = []
  try {
    const imgHTML = getHtmlObjectLong(html, 'div class="book-img-box"', 'div')
    const infoHTML = getHtmlObjectLong(html, 'div class="book-mid-info"', 'div')

    imgHTML
      ? imgHTML.map((item, i) => {
          const img = `http:${item.substring(
            item.indexOf('src="') + 5,
            item.indexOf('"></a>')
          )}`
          const name = removeTag(getHtmlObjectLong(infoHTML[i], 'h4', 'h4')[0])
          const info = removeTag(
            getHtmlObjectLong(infoHTML[i], 'p class="author"', 'p')[0]
          ).split('|')
          const author = info[0].trim()
          const type = info[1].trim()
          const status = info[2].trim()
          const desc = removeTag(
            getHtmlObjectLong(infoHTML[i], 'p class="intro"', 'p')[0]
          ).trim()

          res.push({ img, name, author, type, status, desc })
        })
      : ''
  } catch (e) {}

  return res
}

/* 笔趣阁 - 格式化书籍列表 */
const xsBook = (html, origin) => {
  const res = []
  try {
    let booksHtml = getHtmlObjectLong(
      html,
      'div class="result-game-item-detail"',
      'div'
    )
    if (booksHtml.length > 0) {
      for (const div of booksHtml) {
        let name = div.substring(
          div.indexOf('title="') + 7,
          div.indexOf('" class=')
        ) // 书名
        let chaptersUrl = div.substring(
          div.indexOf('href="') + 6,
          div.indexOf('" title=')
        ) // 章节列表url
        let author = removeTag(getHtmlObject(div, 'span')[0]).trim() // 作者
        let newChapterName = '';
        try {
          newChapterName = removeTag(getHtmlObjectLong(div, 'a', 'a')[1]).trim() // 最新章节
        }catch (e1) {}

        res.push({ name, author, chaptersUrl, newChapterName, origin: `www.${origin}` })
      }
    }
  } catch (e) {
    console.log(e)
  }
  return res
}

/* 笔趣阁 - 格式化章节列表 */
const xsChapters = html => {
  const res = []
  try {
    const chaptersHtml = getHtmlObjectLong(html, 'dd', 'dd')
    if (chaptersHtml && chaptersHtml.length > 0) {
      for (const dd of chaptersHtml) {
        const chUrl = dd.substring(dd.indexOf('href="') + 6, dd.indexOf('">'))
        if (chUrl.indexOf('/') === 0) {
          res.push({ url: chUrl, name: removeTag(dd).trim() })
        }
      }
    }
  } catch (e) {
    console.log(e)
  }

  return res
}

/* 笔趣阁 - 格式化章节内容 */
const xsContent = html => {
  try {
    const list = getHtmlObjectLong(html, 'div id="content"', 'div')
    const content = removeTag(
      replaceAll(list[0].replace('<br/>', '\n'), '<br/>', '\n')
    )
    return replaceAll(content, '&nbsp;', '').trim()
  } catch (e) {}
  return ''
}

export default {
  books,
  xsBook,
  xsChapters,
  xsContent,
}
