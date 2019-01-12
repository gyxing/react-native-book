import {
    getHtmlObjectLong,
    getHtmlObject,
    removeTag,
    replaceAll
} from "../index";

// 笔趣看
const BiQuKan = {
    // 格式化书籍列表
    books(html, origin) {
        let res = [];
        try {
            let nameHtml = getHtmlObjectLong(html, 'h4 class="bookname"', 'h4');
            let authorHtml = getHtmlObjectLong(html, 'div class="author"', 'div');
            let chNameHtml = getHtmlObjectLong(html, 'div class="update"', 'div');

            if (nameHtml.length > 0) {
                nameHtml.map( (item, i) => {
                    let name = removeTag(nameHtml[i]).trim(); // 书名
                    let chaptersUrl = 'http://www.biqukan.com'+nameHtml[i].substring(nameHtml[i].indexOf("href=\"") + 6, nameHtml[i].lastIndexOf('">')); // 章节列表url
                    let author = removeTag(authorHtml[i]).trim().replace('作者：','');
                    let newChapterName = removeTag(chNameHtml[i]).trim().replace('最新章节：','');

                    res.push({ name, author, chaptersUrl, newChapterName, origin });
                });
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
                if(chaptersHtml.length > 12) {
                    chaptersHtml = chaptersHtml.filter( (item,i) => i>11 );
                }
                for (let dd of chaptersHtml) {
                    let chUrl = dd.substring(dd.indexOf('href ="') + 7, dd.indexOf('">'));
                    let name = removeTag(dd).trim();
                    if (name.indexOf('biqukan.com') === -1) {
                        res.push({ url: `http://www.biqukan.com${chUrl}`, name: removeTag(dd).trim() });
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
                replaceAll(replaceAll(list[0], "<br />", "\n"), '<br/>', '\n')
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
            let list = getHtmlObjectLong(html, "div class=\"small\"", "div");
            let temp = getHtmlObjectLong(list[0], 'a href=', 'a');
            name = removeTag(temp[0]);
        } catch (e) {
            console.log(e)
        }
        return name;
    }
};

export default BiQuKan;
