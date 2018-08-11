import React, { Component } from 'react'
import SQLiteStorage from 'react-native-sqlite-storage'

SQLiteStorage.DEBUG(true)
const database_name = 'reader.db'
const database_version = '1.0'
const database_displayname = 'ReaderSQLite'
const database_size = -1
let db
const Book_TABLE_NAME = 'Book' // 书架表
const Chapter_TABLE_NAME = 'Chapter' // 目录表

export default class SQLite extends Component {
  constructor() {
    super()
  }

  componentWillUnmount() {
    if (db) {
      this._successCB('close')
      db.close()
    } else {
      console.log('SQLiteStorage not open')
    }
  }
  open() {
    db = SQLiteStorage.openDatabase(
      database_name,
      database_version,
      database_displayname,
      database_size,
      () => {
        this._successCB('open')
      },
      err => {
        this._errorCB('open', err)
      }
    )
  }
  createTable() {
    if (!db) {
      this.open()
    }
    // 创建表
    db.transaction(
      tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${Book_TABLE_NAME}(` +
            `id INTEGER PRIMARY KEY NOT NULL,` +
            `name VARCHAR,` +
            `author VARCHAR,` +
            `type VARCHAR,` +
            `status VARCHAR,` +
            `img VARCHAR,` +
            `desc VARCHAR,` +
            `origin VARCHAR,` +
            `url VARCHAR,` +
            `curChapterId INTEGER,` +
            `hasNew INTEGER,` +
            `scroll INTEGER,` +
            `charset VARCHAR,` +
            `progress VARCHAR` +
            `);`,
          [],
          () => {
            this._successCB('executeSql')
          },
          err => {
            this._errorCB('executeSql', err)
          }
        )
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS ${Chapter_TABLE_NAME}(` +
            `id INTEGER PRIMARY KEY NOT NULL,` +
            `name VARCHAR,` +
            `url VARCHAR,` +
            `content TEXT,` +
            `origin VARCHAR,` +
            `charset VARCHAR,` +
            `bookId INTEGER` +
            `);`,
          [],
          () => {
            this._successCB('executeSql')
          },
          err => {
            this._errorCB('executeSql', err)
          }
        )
      },
      err => {
        this._errorCB('transaction', err)
      },
      () => {
        this._successCB('transaction')
      }
    )
  }
  /* 下列是操作书架的 */
  saveBook(params) {
    // 添加一本书
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        const keys = Object.keys(params).map(key => `${key}`)
        const keys2 = Object.keys(params).map(key => '?')
        const values = Object.values(params)
        db.executeSql(
          `INSERT INTO ${Book_TABLE_NAME} (${keys.join(
            ','
          )}) VALUES(${keys2.join(',')})`,
          [...values],
          res => {
            this._successCB('saveBook')
            resolve({ id: res.insertId, ...params })
          },
          err => {
            this._errorCB('saveBook', err)
            reject()
          }
        )
      } else {
        reject('db not open')
      }
    })
  }
  updateBook(id, params) {
    // 更新书架信息
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        const keys = Object.keys(params).map(key => `${key}=?`)
        const values = Object.values(params)
        db.executeSql(
          `UPDATE ${Book_TABLE_NAME} SET ${keys.join(',')} WHERE id=?`,
          [...values, id],
          () => {
            this._successCB('updateBook')
            resolve()
          },
          err => {
            this._errorCB('updateBook', err)
            reject(err)
          }
        )
      } else {
        reject('db not open')
      }
    })
  }
  findBookById(id) {
    // 获取书本信息
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        db.executeSql(
          `SELECT * FROM ${Book_TABLE_NAME} WHERE id=? LIMIT 1`,
          [id],
          results => {
            if (results.rows.length > 0) {
              resolve(results.rows.item(0))
            } else {
              reject('not find item')
            }

            this._successCB('findBookById')
          },
          err => {
            reject(err)
            this._errorCB('findBookById', err)
          }
        )
      } else {
        reject('db not open')
      }
    })
  }
  deleteBookById(id) {
    // 删除一本书
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        db.executeSql(
          `DELETE FROM ${Book_TABLE_NAME} WHERE id=?`,
          [id],
          () => {
            this.deleteChapterByBookId(id)
            resolve()
            this._successCB('deleteBookById')
          },
          err => {
            reject(err)
            this._errorCB('deleteBookById', err)
          }
        )
      } else {
        reject('db not open')
      }
    })
  }
  listBook() {
    // 获取书架列表
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        db.executeSql(
          `SELECT * FROM ${Book_TABLE_NAME}`,
          [],
          results => {
            const len = results.rows.length
            const datas = []
            for (let i = 0; i < len; i++) {
              datas.push(results.rows.item(i))
            }
            resolve(datas)
            this._successCB('listBook')
          },
          err => {
            reject(err)
            this._errorCB('listBook', err)
          }
        )
      } else {
        reject('db not open')
      }
    })
  }
  /* 下列是操作目录的 */
  saveChapterList(chapters) {
    // 批量添加目录
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        const sqlList = []
        chapters.map((chapter, i) => {
          const keys = Object.keys(chapter).map(key => `${key}`)
          const keys2 = Object.keys(chapter).map(key => '?')
          const values = Object.values(chapter)
          sqlList.push([
            `INSERT INTO ${Chapter_TABLE_NAME} (${keys.join(
              ','
            )}) VALUES(${keys2.join(',')})`,
            [...values],
          ])
        })
        // 分批插入数据库，解决数据过大问题
        const _sqlBatch = sqls => {
          /* if(sqls.length > 0){
                    let sql = sqls[0];
                    let nextSql = sqls.filter( (item,i) => i > 0 );
                    db.executeSql(sql[0], sql[1], ()=>{
                      _sqlBatch(nextSql)
                    }, (err)=>{
                      this._errorCB('saveChapter',err);
                      reject();
                    })
                  }else{
                    // 更新书本状态
                    db.executeSql('UPDATE ' + Book_TABLE_NAME + ' SET hasNew=1 WHERE id=' + chapters[0].bookId);
                    resolve();
                  } */
          const sql = sqls.filter((item, i) => i < 100)
          const nextSql = sqls.filter((item, i) => i >= 100)
          db.sqlBatch(
            sql,
            () => {
              if (nextSql.length > 0) {
                _sqlBatch(nextSql)
              } else {
                this._successCB('saveChapter')
                // 更新书本状态
                db.executeSql(
                  `UPDATE ${Book_TABLE_NAME} SET hasNew=1 WHERE id=${
                    chapters[0].bookId
                  }`
                )
                resolve()
              }
            },
            err => {
              this._errorCB('saveChapter', err)
              reject()
            }
          )
        }
        _sqlBatch(sqlList)

        /* db.sqlBatch(sqlList, ()=>{
                    this._successCB('saveChapter');
                    // 更新书本状态
                    db.executeSql('UPDATE ' + Book_TABLE_NAME + ' SET hasNew=1 WHERE id=' + chapters[0].bookId);
                    resolve();
                }, (err)=>{
                    this._errorCB('saveChapter',err);
                    reject();
                }); */
      } else {
        reject('db not open')
      }
    })
  }
  updateChapter(id, params) {
    // 更新目录信息
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        const keys = Object.keys(params).map(key => `${key}=?`)
        const values = Object.values(params)
        db.executeSql(
          `UPDATE ${Chapter_TABLE_NAME} SET ${keys.join(',')} WHERE id=?`,
          [...values, id],
          () => {
            this._successCB('updateBook')
            resolve()
          },
          err => {
            this._errorCB('updateBook', err)
            reject(err)
          }
        )
      } else {
        reject('db not open')
      }
    })
  }
  deleteChapterByBookId(bookId) {
    // 批量删除目录
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        db.executeSql(
          `DELETE FROM ${Chapter_TABLE_NAME} WHERE bookId=?`,
          [bookId],
          () => {
            resolve()
            this._successCB('deleteChapterByBookId')
          },
          err => {
            reject(err)
            this._errorCB('deleteChapterByBookId', err)
          }
        )
      } else {
        reject('db not open')
      }
    })
  }
  listChapterByBookId(bookId) {
    // 获取目录列表
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        db.executeSql(
          `SELECT * FROM ${Chapter_TABLE_NAME} WHERE bookId=?`,
          [bookId],
          results => {
            const len = results.rows.length
            const datas = []
            for (let i = 0; i < len; i++) {
              datas.push(results.rows.item(i))
            }
            resolve(datas)
            this._successCB('listChapterByBookId')
          },
          err => {
            reject(err)
            this._errorCB('listChapterByBookId', err)
          }
        )
      } else {
        reject('db not open')
      }
    })
  }
  getChapter(id) {
      // 获取章节信息
      if (!db) {
          this.open()
      }
      return new Promise((resolve, reject) => {
          if (db) {
              db.executeSql(
                  `SELECT * FROM ${Chapter_TABLE_NAME} WHERE id=? LIMIT 1`,
                  [id],
                  results => {
                      if (results.rows.length > 0) {
                          resolve(results.rows.item(0))
                      } else {
                          reject('not find item')
                      }

                      this._successCB('getChapter')
                  },
                  err => {
                      reject(err)
                      this._errorCB('getChapter', err)
                  }
              )
          } else {
              reject('db not open')
          }
      })
  }
  /* 清空表数据 */
  clearAll() {
    if (!db) {
      this.open()
    }
    return new Promise((resolve, reject) => {
      if (db) {
        db.executeSql(`DELETE FROM ${Book_TABLE_NAME}`)
        db.executeSql(
          `update sqlite_sequence SET seq = 0 where name="${Book_TABLE_NAME}"`
        )
        db.executeSql(`DELETE FROM ${Chapter_TABLE_NAME}`)
        db.executeSql(
          `update sqlite_sequence SET seq = 0 where name="${Chapter_TABLE_NAME}"`
        )
        resolve()
      } else {
        reject('db not open')
      }
    })
  }

  close() {
    if (db) {
      this._successCB('close')
      db.close()
    } else {
      console.log('SQLiteStorage not open')
    }
    db = null
  }
  _successCB(name) {
    // console.log("SQLiteStorage "+name+" success");
  }
  _errorCB(name, err) {
    console.log(`SQLiteStorage ${name} error:`, err)
  }

  render() {
    return null
  }
}
