import {getHtmlObjectLong, getHtmlObject, removeTag, replaceAll} from './index'
import {Toast} from 'antd-mobile'
/* 起点中文网 - 格式化书籍列表 */
const books = (html) => {
  let res = [];
  try{
    let imgHTML = getHtmlObjectLong(html, 'div class="book-img-box"', 'div');
    let infoHTML = getHtmlObjectLong(html, 'div class="book-mid-info"', 'div');

    imgHTML? imgHTML.map( (item,i) => {
      let img = 'http:' + item.substring(item.indexOf('src="')+5, item.indexOf('"></a>'));
      let name = removeTag(getHtmlObjectLong(infoHTML[i], 'h4', 'h4')[0]);
      let info = removeTag(getHtmlObjectLong(infoHTML[i], 'p class="author"', 'p')[0]).split('|');
      let author = info[0].trim();
      let type = info[1].trim();
      let status = info[2].trim();
      let desc = removeTag(getHtmlObjectLong(infoHTML[i], 'p class="intro"', 'p')[0]).trim();

      res.push({img, name, author, type, status, desc})
    }) : '';
  }catch(e){}

  return res;
};

/* 笔趣阁 - 格式化书籍列表 */
const xsBook = (html) => {
  let res = [];
  try{
    let booksHtml = getHtmlObjectLong(html, 'div class="result-game-item-detail"', 'div');
    if (booksHtml.length > 0) {
      for (let div of booksHtml) {
        let name = div.substring(div.indexOf('title="') + 7, div.indexOf('" class='));//书名
        let chaptersUrl = div.substring(div.indexOf('href="') + 6, div.indexOf('" title='));//章节列表url
        let author = removeTag(getHtmlObject(div, 'span')[0]).trim();//作者

        res.push({name, author, chaptersUrl, origin:'www.xs.la'});
      }
    }
  }catch(e){}
  return res;
};

/* 笔趣阁 - 格式化章节列表 */
const xsChapters = (html) => {
  let res = [];
  try{
    let chaptersHtml = getHtmlObjectLong(html, 'dd', 'dd');
    if (chaptersHtml && chaptersHtml.length > 0) {
      for (let dd of chaptersHtml) {
        let chUrl = dd.substring(dd.indexOf('href="') + 6, dd.indexOf('">'));
        if(chUrl.indexOf('/') === 0){
          res.push({url: chUrl, name: removeTag(dd).trim()});
        }
      }
    }
  }catch(e){}

  return res;
};

/* 笔趣阁 - 格式化章节内容 */
const xsContent = (html) => {
  try{
    let list = getHtmlObjectLong(html, 'div id="content"', 'div');
    let content = removeTag(replaceAll(list[0].replace('<br/>','\n'), '<br/>', '\n'));
    return replaceAll(content, '&nbsp;', '').trim();
  }catch(e){}
  return '';
};

export default {
  books,
  xsBook,
  xsChapters,
  xsContent
}
