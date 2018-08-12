import {
    getHtmlObjectLong,
    getHtmlObject,
    removeTag,
    replaceAll
} from "../index";

import QuLa from './qula'
import XS166 from './xs166'
import BiQuKan from './biqukan'

/* 起点中文网 - 格式化书籍列表 */
const books = html => {
    const res = [];
    try {
        const imgHTML = getHtmlObjectLong(html, "div class=\"book-img-box\"", "div");
        const infoHTML = getHtmlObjectLong(html, "div class=\"book-mid-info\"", "div");

        imgHTML
            ? imgHTML.map((item, i) => {
                const img = `http:${item.substring(
                    item.indexOf("src=\"") + 5,
                    item.indexOf("\"></a>")
                )}`;
                const name = removeTag(getHtmlObjectLong(infoHTML[i], "h4", "h4")[0]);
                const info = removeTag(
                    getHtmlObjectLong(infoHTML[i], "p class=\"author\"", "p")[0]
                ).split("|");
                const author = info[0].trim();
                const type = info[1].trim();
                const status = info[2].trim();
                const desc = removeTag(
                    getHtmlObjectLong(infoHTML[i], "p class=\"intro\"", "p")[0]
                ).trim();

                res.push({ img, name, author, type, status, desc });
            })
            : "";
    } catch (e) {
    }

    return res;
};
/* 格式化书籍列表 */
const book = (html, origin) => {
    let res = [];
    switch (origin) {
        case 'qu.la':
            res = QuLa.books(html, origin);
            break;
        case '166xs.com':
            res = XS166.books(html, origin);
            break;
        case 'biqukan.com':
            res = BiQuKan.books(html, origin);
            break;
    }
    return res;
};
/* 格式化章节列表 */
const chapters = (html, book) => {
    let res = [];
    switch (book.origin) {
        case 'qu.la':
            res = QuLa.chapters(html, `https://www.${book.origin}`);
            break;
        case '166xs.com':
            res = XS166.chapters(html, book.url);
            break;
        case 'biqukan.com':
            res = BiQuKan.chapters(html, book.url);
            break;
    }
    return res;
};
/* 格式化章节内容 */
const content = (html, origin) => {
    let res = '';
    switch (origin) {
        case 'qu.la':
            res = QuLa.content(html);
            break;
        case '166xs.com':
            res = XS166.content(html);
            break;
        case 'biqukan.com':
            res = BiQuKan.content(html);
            break;
    }
    return res;
};
/* 格式化最新章节名称 */
const newChapterName = (html, origin) => {
    let res = '';
    switch (origin) {
        case 'qu.la':
            res = QuLa.newChapterName(html);
            break;
        case '166xs.com':
            res = XS166.newChapterName(html);
            break;
        case 'biqukan.com':
            res = BiQuKan.newChapterName(html);
            console.log(res)
            break;
    }
    return res;
};

export default {
    books,
    book,
    chapters,
    content,
    newChapterName
};
