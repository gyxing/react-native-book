import request from "../utils/request";
import { Format, Storage } from "../utils";
import SQLite from "../db/SQLite";

const sqLite = new SQLite();

const originList = [
    { key: "qu.la", search: "http://zhannei.baidu.com/cse/search?s=920895234054625192&q=", searchCharset: 'utf8', charset: 'utf8' },
    { key: "166xs.com", search: "http://zhannei.baidu.com/cse/search?s=4838975422224043700&wt=1&q=", searchCharset: 'utf8', charset: 'gbk' },
    { key: "dingdiann.com", search: "https://www.dingdiann.com/searchbook.php?keyword=", charset: "utf8" },
    // { key: "23us.cc", search: "https://sou.xanbhx.com/search?t=920895234054625192&siteid=23uscc&q=" },
    { key: "biqukan.com", search: "http://www.biqukan.com/s.php?ie=gbk&s=2758772450457967865&q=", searchCharset: 'gbk', charset: 'gbk' },
];

/* 联网 - 搜索书本列表 */
export async function search(params) {
    const url = `http://www.qidian.com/search?kw=${encodeURIComponent(
        params.keyword
    )}&page=${params.page || 1}`;
    return request(url);
}

/* 联网 - 查询书籍章节列表所在url */
export async function searchBookUrl({ book }) {
    return new Promise((resolve, reject) => {
        let defaultOrigin = originList[0];
        let netUrl = `${defaultOrigin.search}${encodeURIComponent(
            book.name
        )}`;
        request(netUrl, {charset:defaultOrigin.searchCharset}).then(({ data }) => {
            let url = "", origin = defaultOrigin.key, charset = defaultOrigin.charset;
            for (const item of Format.book(data, defaultOrigin.key)) {
                if (item.name === book.name && item.author === book.author) {
                    url = item.chaptersUrl;
                    // origin = defaultOrigin.key;
                    // charset = defaultOrigin.charset;
                    break;
                }
            }
            if (url) {
                resolve({ data: { url, origin, charset } });
            } else {
                resolve({ err: "not found this book" });
            }
        });
    });
}

/* 联网 - 查询章节列表 */
export async function searchChapters({ book }) {
    return new Promise((resolve, reject) => {
        if (book.url) {
            request(book.url, {charset:book.charset}).then(({ data }) => {
                const chpList = Format.chapters(data, book);
                chpList.map(item => {
                    item.origin = book.origin;
                    item.charset = book.charset;
                    item.bookId = book.id;
                });
                resolve({ data: chpList });
            });
        } else {
            resolve({});
        }
    });
}

/* 联网 - 查询章节内容 */
export async function searchContent({ chapter }) {
    return new Promise((resolve, reject) => {
        request(chapter.url, {charset:chapter.charset}).then(({ data }) => {
            const content = Format.content(data, chapter.origin);
            if(content) {
                sqLite.updateChapter(chapter.id, { content }).then(() => {
                    resolve({ data: content });
                });
            } else {
                resolve({ data: '' });
            }
        });
    });
}

/* 加入书架 */
export async function addBook({ book }) {
    return new Promise((resolve, reject) => {
        book.hasNew = 1;
        sqLite.saveBook(book).then(res => {
            resolve({ data: res });
        });
    });
}

/* 获取书架列表 */
export async function getBooks(params) {
    return new Promise((resolve, reject) => {
        sqLite.listBook().then(books => {
            resolve({ data: books });
        });
    });
}

/* 获取书籍信息 */
export async function getBook({ id }) {
    return new Promise((resolve, reject) => {
        sqLite.findBookById(id).then(book => {
            resolve({ data: book });
        });
    });
}

/* 更新书籍信息 */
export async function updateBook({ book, params }) {
    return new Promise((resolve, reject) => {
        sqLite.updateBook(book.id, params).then(() => {
            resolve({ data: { ...book, ...params } });
        });
    });
}

/* 删除书籍 */
export async function removeBook({ id }) {
    return new Promise((resolve, reject) => {
        sqLite.deleteBookById(id).then(() => {
            resolve();
        });
    });
}

/* 批量添加章节列表 */
export async function addChapters({ chapters }) {
    return new Promise((resolve, reject) => {
        sqLite.saveChapterList(chapters).then(() => {
            resolve();
        });
    });
}

/* 获取章节列表 */
export async function getChapters({ bookId }) {
    return new Promise((resolve, reject) => {
        sqLite.listChapterByBookId(bookId).then(chapters => {
            resolve({ data: chapters });
        });
    });
}

/* 清空书籍的所有章节 */
export async function clearChapterByBookId({ bookId }) {
    return sqLite.deleteChapterByBookId(bookId)
}

/* 清空所有书籍 */
export async function clear() {
    return new Promise((resolve, reject) => {
        sqLite.clearAll().then(() => {
            resolve();
        });
    });
}

/* 联网 - 更新书籍 */
export async function refresh({ book }) {
    return new Promise((resolve, reject) => {
        if (book.url) {
            request(book.url, {charset:book.charset}).then(({ data }) => {
                const newChapters = Format.chapters(data, book);
                sqLite.listChapterByBookId(book.id).then(chapters => {
                    const chpList = [];
                    newChapters.map(item => {
                        const temp = chapters.find(chp => chp.name === item.name);
                        if (!temp) {
                            chpList.push({
                                ...item,
                                bookId: book.id,
                                url: item.url,
                                charset: book.charset,
                                origin: book.origin
                            });
                        }
                    });
                    if (chpList.length > 0) {
                        // 保存新添的章节列表
                        sqLite.saveChapterList(chpList).then(() => {
                            sqLite.listChapterByBookId(book.id).then(res => {
                                const index = res.findIndex(ii => ii.id === book.curChapterId);
                                const progress = `${(
                                    (index || 0) /
                                    (res.length - 1) *
                                    100
                                ).toFixed(2)}%`;
                                sqLite
                                    .updateBook(book.id, {
                                        progress,
                                        hasNew: 1
                                    })
                                    .then(() => {
                                        resolve();
                                    });
                            });
                        });
                    } else {
                        resolve();
                    }
                });
            });
        } else {
            resolve();
        }
    });
}

/* 联网- 获取下载源列表信息 */
export async function exchange({ book }) {
    return new Promise((resolve, reject) => {
        let res = [];
        Storage.get(`${book.name}-${book.author}`).then( sList => {
            if(sList && sList.length > 0 && sList.length === originList.length) {
                reLoop(sList);
            } else {
                initLoop(originList);
            }
        });

        // 往后更新
        function reLoop(arr) {
            if (arr.length > 0) {
                let rowItem = arr[0];
                request(rowItem.url, {charset:rowItem.charset}).then(ret => {
                    if (ret) {
                        let newChapterName = Format.newChapterName(ret.data, rowItem.origin);
                        res.push({ ...rowItem, newChapterName });
                        initLoop(arr.filter((a, i) => i > 0));
                    }else{
                        initLoop(arr.filter((a, i) => i > 0));
                    }
                });
            } else {
                Storage.set(`${book.name}-${book.author}`, res);
                resolve({ data: res });
            }
        }

        // 首次加载
        function initLoop(arr) {
            if (arr.length > 0) {
                let originItem = arr[0];
                let netUrl = `${originItem.search}${encodeURIComponent(book.name)}`;
                request(netUrl, {charset:originItem.searchCharset}).then(({ data }) => {
                    let url = "", origin = "";
                    let bookList = Format.book(data, originItem.key);
                    for (let item of bookList) {
                        if (item.name === book.name && item.author === book.author) {
                            url = item.chaptersUrl;
                            origin = item.origin;
                            break;
                        }
                    }
                    // 进入目录列表页面
                    if (url) {
                        request(url, {charset:originItem.charset}).then(ret => {
                            if (ret) {
                                let newChapterName = Format.newChapterName(ret.data, origin);
                                res.push({ ...originItem, url, origin, newChapterName });
                                initLoop(arr.filter((a, i) => i > 0));
                            } else {
                                initLoop(arr.filter((a, i) => i > 0));
                            }
                        });
                    } else {
                        initLoop(arr.filter((a, i) => i > 0));
                    }
                });
            } else {
                Storage.set(`${book.name}-${book.author}`, res);
                resolve({ data: res });
            }
        }
    });
}

/* 更改下载源 */
export async function replaceChapters ({ book, dlWay, origin }) {
    return new Promise((resolve, reject) => {
        let bookTemp = {...book};
        bookTemp.charset = origin.charset;
        bookTemp.url = origin.url;
        bookTemp.origin = origin.origin;
        searchChapters({book:bookTemp}).then( ret => {
            let chapters = ret.data;
            if(chapters && chapters.length > 0) {
                switch(dlWay) {
                    case 'all':
                        bookTemp.curChapterId = 0;
                        bookTemp.progress = '0.00%';
                        delete bookTemp.id;
                        // 更新书籍信息
                        updateBook({book, params:bookTemp}).then( ret2 => {
                            // 删除原来的章节列表
                            clearChapterByBookId({bookId:book.id}).then( () => {
                                // 批量添加新的章节列表
                                addChapters({chapters}).then( () => {
                                    resolve({data:'success'})
                                }).catch( () => {
                                    resolve()
                                })
                            }).catch( () => {
                                resolve()
                            })
                        }).catch( () => {
                            resolve()
                        });
                        break;
                    case 'one':
                        // 查询原章节信息
                        sqLite.getChapter(book.curChapterId).then( oldChapter => {
                            let temp = chapters.find( item => item.name === oldChapter.name );
                            // 组合成新的数据
                            let chapter = {...oldChapter, ...temp, content:''};
                            // 查询内容
                            searchContent({chapter}).then( ret2 => {
                                if(ret2.data) {
                                    chapter.content = ret2.data;
                                    let chapterId = chapter.id;
                                    delete chapter.id;
                                    // 更新
                                    sqLite.updateChapter(chapterId, chapter).then(() => {
                                        resolve({data: {...chapter, id:chapterId}})
                                    }).catch( () => {
                                        resolve()
                                    })
                                } else {
                                    resolve()
                                }
                            }).catch( () => {
                                resolve()
                            })
                        }).catch( () => {
                            resolve()
                        });
                        break;
                    case 'more':
                        delete bookTemp.id;
                        // 更新书籍信息
                        updateBook({book, params:bookTemp}).then( ret2 => {
                            // 获取原章节列表
                            getChapters({bookId: book.id}).then( ret3 => {
                                let oldChapterList = ret3.data;
                                let keepList = oldChapterList.filter( item => item.id <= book.curChapterId );
                                // 删除原来的章节列表
                                clearChapterByBookId({bookId:book.id}).then( () => {
                                    let index = 0;
                                    for(let i in chapters) {
                                        if( chapters[i].name === keepList[keepList.length-1].name) {
                                            index = i;
                                            break;
                                        }
                                    }
                                    let newList = chapters.filter( (item,i) => i>index );
                                    let newChapters = [...keepList, ...newList];
                                    // 批量添加新的章节列表
                                    addChapters({chapters: newChapters}).then( () => {
                                        resolve({data:'success'})
                                    }).catch( () => {
                                        resolve()
                                    })
                                }).catch( () => {
                                    resolve()
                                })
                            })
                        }).catch( () => {
                            resolve()
                        });
                        break;
                }
            } else {
                resolve()
            }
        }).catch( () => {
            resolve()
        })
    })
}
