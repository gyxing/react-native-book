import { createAction, Format } from "../utils";
import {
    clear,
    search,
    addBook,
    getBooks,
    searchBookUrl,
    searchChapters,
    searchContent,
    updateBook,
    addChapters,
    getBook,
    getChapters,
    removeBook,
    refresh,
    exchange,
    replaceChapters,
    customizeOrigin
} from "../services/book";

export default {
    namespace: "book",
    state: {
        searchList: [],
        bookList: []
    },
    reducers: {
        setParam(state, { payload }) {
            return { ...state, ...payload };
        },
        addToList(state, { payload }) {
            return {
                ...state,
                [payload.key]: [...state[payload.key], ...payload.value]
            };
        }
    },
    effects: {
        * search({ payload }, { call, put }) {
            const { data } = yield call(search, payload);
            if (data) {
                const searchList = Format.books(data);
                if (payload.page !== 1) {
                    yield put(
                        createAction("addToList")({
                            key: "searchList",
                            value: searchList
                        })
                    );
                } else {
                    yield put({ type: "setParam", payload: { searchList } });
                }
            }
        },
        * addBook({ payload }, { call, put }) {
            const { data } = yield call(addBook, payload);
            if (data) {
                yield put(
                    createAction("addToList")({
                        key: "bookList",
                        value: [data]
                    })
                );
                if (payload.callback) {
                    payload.callback(data);
                }
            }
        },
        * getBooks({ payload }, { call, put }) {
            const { data } = yield call(getBooks, payload);
            if (data) {
                yield put({
                    type: "setParam",
                    payload: {
                        bookList: data
                    }
                });
            }
        },
        * searchBookUrl({ payload }, { call, put }) {
            const { book, onSuccess, onError } = payload;
            // 获取章节列表路径
            const { data } = yield call(searchBookUrl, payload);
            if (data) {
                book.url = data.url;
                book.origin = data.origin;
                book.charset = data.charset;
                // 获取章节列表
                const res = yield call(searchChapters, { book });

                if (res.data && res.data.length > 0) {
                    // 本地保存章节列表
                    yield call(addChapters, { chapters: res.data });
                    // 更新书籍信息
                    yield call(updateBook, {
                        book: payload.book,
                        params: {
                            hasNew: 0,
                            url: data.url,
                            origin: data.origin,
                            charset: data.charset
                        }
                    });
                    if (onSuccess) {
                        onSuccess();
                    }
                } else if (onError) {
                    onError();
                }
            } else if (onError) {
                onError();
            }
            yield put({ type: "getBooks" });
        },
        * getBook({ payload }, { call, put }) {
            const { data } = yield call(getBook, payload);
            if (data && payload.callback) {
                payload.callback(data);
            }
        },
        * getChapters({ payload }, { call, put }) {
            const { data } = yield call(getChapters, payload);
            if (data && payload.callback) {
                payload.callback(data);
            }
        },
        * searchContent({ payload }, { call, put }) {
            const { data } = yield call(searchContent, payload);
            payload.callback && payload.callback(data);
        },
        * updateBook({ payload }, { call, put }) {
            const { data } = yield call(updateBook, payload);
            if (data && payload.callback) {
                payload.callback(data);
            }
            yield put({ type: "getBooks" });
        },
        * removeBook({ payload }, { call, put }) {
            yield call(removeBook, payload);
            yield put({ type: "getBooks" });
        },
        * clear({ payload }, { call, put }) {
            yield call(clear, payload);
            yield put({ type: "getBooks" });
        },
        * refresh({ payload }, { call, put }) {
            const { data } = yield call(getBooks, payload);
            if (data && data.length > 0) {
                for (const book of data) {
                    yield call(refresh, { book });
                }
                yield put({ type: "getBooks" });
            }
        },
        /* 切换下载源 */
        * exchange({ payload }, { call, put }) {
            const { callback, error } = payload;
            const { data } = yield call(exchange, payload);
            if (data && callback) {
                callback(data);
            } else if (error) {
                error()
            }
        },
        /* 替换当前章节 */
        * replaceChapters({ payload }, { call, put }) {
            const { callback, callbackOne, callbackMore, dlWay } = payload;
            const { data } = yield call(replaceChapters, payload);
            if (data) {
                switch (dlWay) {
                    case 'one': callbackOne(data); break;
                    case 'more': callbackMore(); break;
                    case 'all': callback(); break;
                }
            }else{
                console.log('失败')
            }
        },
        /* 自定义数据源地址 */
        * customizeOrigin({ payload }, { call, put }) {
            const { callback, callbackMore, dlWay } = payload;
            const { data } = yield call(customizeOrigin, payload);
            if (data) {
                switch (dlWay) {
                    case 'more': callbackMore(); break;
                    case 'all': callback(); break;
                }
            }else{
                console.log('失败')
            }
        }
    },
    subscriptions: {
        setup({ dispatch }) {
            dispatch({ type: "getBooks" });
        }
    }
};
