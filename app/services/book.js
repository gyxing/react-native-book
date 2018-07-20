import request from '../utils/request'
import { Format } from '../utils'
import SQLite from '../db/SQLite'

const sqLite = new SQLite()
import { Toast } from 'antd-mobile'

const originList = [
  {key:'xs.la', search:'http://zhannei.baidu.com/cse/search?s=1393206249994657467&q='},
  {key:'qu.la', search:'http://zhannei.baidu.com/cse/search?s=920895234054625192&q='},
  {key:'xs.la', search:'http://zhannei.baidu.com/cse/search?s=1393206249994657467&q='},
  {key:'biqudu.com', search:'http://zhannei.baidu.com/cse/search?s=13603361664978768713&q='},
  {key:'biqubook.com', search:'http://zhannei.baidu.com/cse/search?s=15781148592605450919&q='}
];

/* 联网搜索书本列表 */
export async function search(params) {
  const url = `http://www.qidian.com/search?kw=${encodeURIComponent(
    params.keyword
  )}&page=${params.page || 1}`
  return request(url)
}

/* 联网查询书籍章节列表所在url */
export async function searchBookUrl({ book }) {
  return new Promise((resolve, reject) => {
    let defaultOrigin = originList[0];
    let netUrl = `${defaultOrigin.search}${encodeURIComponent(
      book.name
    )}`;
    console.log(netUrl)
    request(netUrl).then(({ data }) => {
      let url = '', origin = ''
      for (const item of Format.xsBook(data, defaultOrigin.key)) {
        if (item.name === book.name && item.author === book.author) {
          url = item.chaptersUrl
          origin = item.origin
          break
        }
      }
      if (url) {
        resolve({ data: { url, origin } })
      } else {
        resolve({ err: 'not found this book' })
      }
    })
  })
}

/* 联网查询章节列表 */
export async function searchChapters({ book }) {
  console.log(book)
  return new Promise((resolve, reject) => {
    if (book.url) {
      request(book.url).then(({ data }) => {
        const chpList = Format.xsChapters(data)
        chpList.map(item => {
          item.bookId = book.id
          item.url = `http://${book.origin}${item.url}`
        })
        resolve({ data: chpList })
      })
    } else {
      resolve({})
    }
  })
}

/* 联网查询章节内容 */
export async function searchContent({ chapter }) {
  return new Promise((resolve, reject) => {
    request(chapter.url).then(({ data }) => {
      const content = Format.xsContent(data)
      sqLite.updateChapter(chapter.id, { content }).then(() => {
        resolve({ data: content })
      })
    })
  })
}

/* 加入书架 */
export async function addBook({ book }) {
  return new Promise((resolve, reject) => {
    book.hasNew = 1
    sqLite.saveBook(book).then(res => {
      resolve({ data: res })
    })
  })
}

/* 获取书架列表 */
export async function getBooks(params) {
  return new Promise((resolve, reject) => {
    sqLite.listBook().then(books => {
      resolve({ data: books })
    })
  })
}

/* 获取书籍信息 */
export async function getBook({ id }) {
  return new Promise((resolve, reject) => {
    sqLite.findBookById(id).then(book => {
      resolve({ data: book })
    })
  })
}

/* 更新书籍信息 */
export async function updateBook({ book, params }) {
  return new Promise((resolve, reject) => {
    sqLite.updateBook(book.id, params).then(() => {
      resolve({ data: { ...book, ...params } })
    })
  })
}

/* 删除书籍 */
export async function removeBook({ id }) {
  return new Promise((resolve, reject) => {
    sqLite.deleteBookById(id).then(() => {
      resolve()
    })
  })
}

/* 批量添加章节列表 */
export async function addChapters({ chapters }) {
  return new Promise((resolve, reject) => {
    sqLite.saveChapterList(chapters).then(() => {
      resolve()
    })
  })
}

/* 获取章节列表 */
export async function getChapters({ bookId }) {
  return new Promise((resolve, reject) => {
    sqLite.listChapterByBookId(bookId).then(chapters => {
      resolve({ data: chapters })
    })
  })
}

/* 清空所有书籍 */
export async function clear() {
  return new Promise((resolve, reject) => {
    sqLite.clearAll().then(() => {
      resolve()
    })
  })
}

/* 更新书籍 */
export async function refresh({ book }) {
  return new Promise((resolve, reject) => {
    if (book.url) {
      request(book.url).then(({ data }) => {
        const newChapters = Format.xsChapters(data)
        sqLite.listChapterByBookId(book.id).then(chapters => {
          const chpList = []
          newChapters.map(item => {
            const temp = chapters.find(chp => chp.name === item.name)
            if (!temp) {
              chpList.push({
                ...item,
                bookId: book.id,
                url: `http://${book.origin}${item.url}`,
              })
            }
          })
          if (chpList.length > 0) {
            // 保存新添的章节列表
            sqLite.saveChapterList(chpList).then(() => {
              sqLite.listChapterByBookId(book.id).then(res => {
                const index = res.findIndex(ii => ii.id === book.curChapterId)
                const progress = `${(
                  (index || 0) /
                  (res.length - 1) *
                  100
                ).toFixed(2)}%`
                sqLite
                  .updateBook(book.id, {
                    progress,
                    hasNew: 1,
                  })
                  .then(() => {
                    resolve()
                  })
              })
            })
          } else {
            resolve()
          }
        })
      })
    } else {
      resolve()
    }
  })
}

/* 切换下载源 */
export async function exchange({ book, dlWay }) {
  return new Promise((resolve, reject) => {
    let res = [];
    loop(originList);

    function loop(arr) {
      if(arr.length > 0) {
        let originItem = arr[0];
        let netUrl = `${originItem.search}${encodeURIComponent(book.name)}`;
        request(netUrl).then(({ data }) => {
          let url = '', origin = '', newChapterName = '';
          let bookList = Format.xsBook(data, originItem.key);
          for (let item of bookList) {
            if (item.name === book.name && item.author === book.author) {
              url = item.chaptersUrl;
              origin = item.origin;
              newChapterName = item.newChapterName;
              break
            }
          }
          if (url) {
            res.push({ ...originItem, url, origin, newChapterName })
          }
          loop(arr.filter( (a,i) => i>0 ));
        })
      }else{
        resolve({data:res})
      }
    }
  })
}
