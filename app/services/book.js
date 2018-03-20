import request from '../utils/request'
import {Format} from '../utils'
import SQLite from '../db/SQLite';
const sqLite = new SQLite();
import {Toast} from 'antd-mobile'

/* 联网搜索书本列表 */
export async function search(params) {
  let url = `http://www.qidian.com/search?kw=${encodeURIComponent(params.keyword)}&page=${params.page||1}`;
  return request(url)
}

/* 联网查询书籍章节列表所在url */
export async function searchBookUrl({book}) {
  return new Promise( (resolve, reject) => {
    let url = `http://zhannei.baidu.com/cse/search?s=1393206249994657467&q=${encodeURIComponent(book.name)}`;
    request(url).then( ({data}) => {
      let url = '', origin = '';
      for(let item of Format.xsBook(data)){
        if(item.name === book.name && item.author === book.author){
          url = item.chaptersUrl;
          origin = item.origin;
          break;
        }
      }
      if(url){
        resolve({data:{url,origin}})
      }else{
        resolve({err:'not found this book'})
      }
    })
  })
}

/* 联网查询章节列表 */
export async function searchChapters({book}) {
  return new Promise( (resolve, reject) => {
    if(book.url) {
      request(book.url).then(({data}) => {
        let chpList = Format.xsChapters(data);
        chpList.map(item => {
          item.bookId = book.id;
          item.url = `http://${book.origin}${item.url}`
        });
        resolve({data: chpList})
      })
    }else{
      resolve({})
    }
  })
}

/* 联网查询章节内容 */
export async function searchContent({chapter}) {
  return new Promise( (resolve, reject) => {
    request(chapter.url).then( ({data}) => {
      let content = Format.xsContent(data);
      sqLite.updateChapter(chapter.id, {content}).then( () => {
        resolve({ data: content})
      })
    })
  })
}

/* 加入书架 */
export async function addBook({book}) {
  return new Promise( (resolve, reject) => {
    book.hasNew = 1;
    sqLite.saveBook(book).then( (res) => {
      resolve({data:res})
    })
  })
}

/* 获取书架列表 */
export async function getBooks(params) {
  return new Promise( (resolve, reject) => {
    sqLite.listBook().then( books => {
      resolve({data: books})
    })
  })
}

/* 获取书籍信息 */
export async function getBook({id}) {
  return new Promise( (resolve, reject) => {
    sqLite.findBookById(id).then( book => {
      resolve({data:book})
    })
  })
}

/* 更新书籍信息 */
export async function updateBook({book, params}) {
  return new Promise( (resolve, reject) => {
    sqLite.updateBook(book.id, params).then( () => {
      resolve({ data: {...book, ...params} })
    })
  })
}

/* 删除书籍 */
export async function removeBook({id}) {
  return new Promise( (resolve, reject) => {
    sqLite.deleteBookById(id).then( () => {
      resolve();
    })
  })
}

/* 批量添加章节列表 */
export async function addChapters({chapters}) {
  return new Promise( (resolve, reject) => {
    sqLite.saveChapterList(chapters).then( () => {
      resolve()
    })
  })
}

/* 获取章节列表 */
export async function getChapters({bookId}) {
  return new Promise( (resolve, reject) => {
    sqLite.listChapterByBookId(bookId).then( chapters => {
      resolve({ data:chapters })
    })
  })
}

/* 清空所有书籍 */
export async function clear() {
  return new Promise( (resolve, reject) => {
    sqLite.clearAll().then( () => {
      resolve()
    })
  })
}

/* 更新书籍 */
export async function refresh({book}) {
  return new Promise( (resolve, reject) => {
    if(book.url) {
      request(book.url).then(({data}) => {
        let newChapters = Format.xsChapters(data);
        sqLite.listChapterByBookId(book.id).then(chapters => {
          let chpList = [];
          newChapters.map(item => {
            let temp = chapters.find(chp => chp.name === item.name);
            if (!temp) {
              chpList.push({
                ...item,
                bookId: book.id,
                url: `http://${book.origin}${item.url}`
              })
            }
          });
          if (chpList.length > 0) {
            //保存新添的章节列表
            sqLite.saveChapterList(chpList).then(() => {
              sqLite.listChapterByBookId(book.id).then(res => {
                let index = res.findIndex(ii => ii.id === book.curChapterId);
                let progress = ((index || 0) / (res.length - 1) * 100).toFixed(2) + '%';
                sqLite.updateBook(book.id, {
                  progress,
                  hasNew: 1
                }).then(() => {
                  resolve()
                })
              })
            })
          } else {
            resolve()
          }
        });
      })
    }else{
      resolve()
    }
  })
}
