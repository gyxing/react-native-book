import {
    getHtmlObjectLong,
    getHtmlObject,
    removeTag,
    replaceAll
} from "../index";

// 笔趣阁
const QuLa = {
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
                for (const div of booksHtml) {
                    let name = div.substring(
                        div.indexOf("title=\"") + 7,
                        div.indexOf("\" class=")
                    ); // 书名
                    let chaptersUrl = div.substring(
                        div.indexOf("href=\"") + 6,
                        div.indexOf("\" title=")
                    ); // 章节列表url
                    let author = removeTag(getHtmlObject(div, "span")[0]).trim(); // 作者
                    let newChapterName = "";
                    try {
                        newChapterName = removeTag(getHtmlObjectLong(div, "a", "a")[1]).trim(); // 最新章节
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
            if (chaptersHtml && chaptersHtml.length > 0) {
                for (let dd of chaptersHtml) {
                    let chUrl = dd.substring(dd.indexOf("href=\"") + 6, dd.indexOf("\">"));
                    if (chUrl.indexOf("/") === 0) {
                        res.push({ url: `${baseUrl}/${chUrl}`, name: removeTag(dd).trim() });
                    }
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
            let list = getHtmlObjectLong(html, "div id=\"content\"", "div");
            let content = removeTag(
                replaceAll(list[0].replace("<br/>", "\n"), "<br/>", "\n")
            );
            return replaceAll(content, "&nbsp;", "").trim();
        } catch (e) {
        }
        return "";
    },
    // 格式化最新章节名称
    newChapterName(html) {
        let name = '';
        try {
            let list = getHtmlObjectLong(html, "div id=\"maininfo\"", "div");
            let temp = getHtmlObject(list[0], 'p');
            name = removeTag(temp[3].replace('最新更新：',''));
        } catch (e) {
            console.log(e)
        }
        return name;
    }
};

export default QuLa;
