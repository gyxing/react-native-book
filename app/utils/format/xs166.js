import {
    getHtmlObjectLong,
    getHtmlObject,
    removeTag,
    replaceAll
} from "../index";

// 166小说网

const XS166 = {
    // 格式化书籍列表
    books(html, origin) {
        let res = [];
        try {
            let booksHtml = getHtmlObjectLong(
                html,
                "div class=\"result-game-item-detail\"",
                "div"
            );
            if (booksHtml.length > 0) {
                for (let div of booksHtml) {
                    let name = div.substring(
                        div.indexOf("title=\"") + 7,
                        div.indexOf("\" class=")
                    ); // 书名
                    let chaptersUrl = div.substring(
                        div.indexOf("href=\"") + 6,
                        div.indexOf("\" title=")
                    ); // 章节列表url
                    let author = removeTag(getHtmlObjectLong(div, 'a cpos="author"', 'a')[0]).trim(); // 作者
                    let newChapterName = "";
                    try {
                        newChapterName = removeTag(getHtmlObjectLong(div, 'a cpos="newchapter"', "a")[0]).trim(); // 最新章节
                    } catch (e1) {
                    }

                    res.push({ name, author, chaptersUrl, newChapterName, origin });
                }
            }
        } catch (e) {
            console.log(e);
        }
        return res;
    },
    // 格式化章节列表
    chapters(html, baseUrl) {
        let res = [];
        try {
            let chaptersHtml = getHtmlObjectLong(html, "dd", "dd");
            chaptersHtml = chaptersHtml.filter( (item,i) => i > 6 );
            if (chaptersHtml && chaptersHtml.length > 0) {
                for (let dd of chaptersHtml) {
                    let chUrl = dd.substring(dd.indexOf("href=\"") + 6, dd.indexOf("\">"));
                    res.push({ url: `${baseUrl}/${chUrl}`, name: removeTag(dd).trim() });
                }
            }
        } catch (e) {
            console.log(e);
        }
        return res;
    },
    //格式化章节内容
    content(html) {
        try {
            let list = getHtmlObjectLong(html, "p class=\"Book_Text\"", "p");
            let str = list[0];
            let temp = str.substring(0, str.indexOf('book_hzh();</script>')+20);
            str = str.replace(temp, '');
            let content = removeTag(
                replaceAll(replaceAll(str, "<br />", "\n"), "<br>", "\n")
            );
            return replaceAll(content, "&nbsp;", "").trim();
        } catch (e) {
            console.log(e)
        }
        return "";
    },
    // 格式化最新章节名称
    newChapterName(html) {
        let name = '';
        try {
            let start = html.indexOf('最新章节：</font>') + 12;
            let end = html.indexOf('</a></dd>') + 4;
            name = removeTag(html.substring(start, end));
        } catch (e) {
            console.log(e)
        }
        return name;
    }
};

export default XS166;
