
/* PREMAILER FUNCTIONS - 1. FIND STYLE/BODY - 2. FIND INLINABLE STYLES - 3. INLINE CSS VIA NODE LIST */

// dependencies
import * as strLib from '.././utils/string-manipulations.js';
const openTag = strLib.openTag;
const closeTag = strLib.closeTag;
const dblQuote = strLib.dblQuote;
const openCmt = strLib.openCmt;
const closeCmt = strLib.closeCmt;
const arrSelfCloseTags = strLib.arrSelfCloseTags;

// STEP 1: isolate "style" and "body" from email html
export function findStylesAndBody(strEmailHtml) {
  const eStyle = strEmailHtml.split('<style type="text/css">')[1].split('</style>')[0];
  const eBody = strEmailHtml.split('<body>')[1].split('</body>')[0];
  const res = {
    s: eStyle,
    b: eBody
  };
  return res;
};

// STEP 2: create list of style tags that can be inlined, isolating any media queries (as they can't be inlined)
export function findInlinableStyles(strStyles) {

  // part I: split styles just before each "@media" query, if they are present
  const splitWithoutRemovingDelimFromStrings = (str, delim, prependOrAppend) => {
    let res = str.split(delim);
    let tmpdata = "";
    let i = 0;
    for(i=0;i< res.length; i++){
      if(prependOrAppend){
        if(i>0){ tmpdata = res[i]; res[i] = delim + tmpdata; }
      }
      else {
        if(i< res.length-1){ tmpdata = res[i]; res[i] = tmpdata + delim; }
      }

    }
    if (!prependOrAppend){ res.pop(); }		/*	I NEED TO UNDERSTAND WHY I NEEDED THIS
    AS MY CODE ISNT BEHAVING HOW I EXPECTED	*/
    return res;
  };

  const mDelim = '@media';
  let arr = splitWithoutRemovingDelimFromStrings(strStyles,mDelim, true);

  // part II: seperate media queries from other style rules, then expand inlinable style rules in { seperator, data } format
  const returnMediaAndStyles = (str) => {
    const res = { m: "", s: "" };
    let arrEndings = splitWithoutRemovingDelimFromStrings(str,'}', false);
    let i = 0;
    let tmpdata = "";
    let strMediaQueries = "";
    let strStyles = "";
    let endWasFound = false;

    for(i=arrEndings.length-1;i>=0;i--){
      if(endWasFound || !(arrEndings[i].includes('{')) ){
        if(!endWasFound){ endWasFound = true; }
        tmpdata = strMediaQueries;
        strMediaQueries = arrEndings[i] + tmpdata;
      }
      else {
        tmpdata = strStyles;
        strStyles = arrEndings[i] + tmpdata;
      }
    }

    res.m = strMediaQueries;
    res.s = strStyles;
    return res;
  };

  const returnStyleTags = (str) => {
    let res = { s: [], d: [] };
    let arrUnsorted = str.split(/{|}/g);
    let arrSelectors = [];
    let arrData = [];
    arrUnsorted.pop();
    for(let i=0;i<arrUnsorted.length;i++){
      if(i%2===0){ arrSelectors.push(arrUnsorted[i]); }
      else { arrData.push(arrUnsorted[i]); }
    }
    res.s = arrSelectors;
    res.d = arrData;
    return res;
  };

  let arrMediaQueries = [];
  let arrStyleTags = { s: [], d: [] };
  let tmpObj = { s: [], d: [] };
  for(let i=0;i<arr.length;i++){
    if( arr[i].includes(mDelim) ){
      let el = returnMediaAndStyles(arr[i]);
      arrMediaQueries.push(el.m);
      tmpObj = returnStyleTags(el.s);
    }
    else {
      tmpObj = returnStyleTags(arr[i]);
    }
    arrStyleTags.s = arrStyleTags.s.concat(tmpObj.s);
    arrStyleTags.d = arrStyleTags.d.concat(tmpObj.d);
  }

  // part III: ready to send as an object, including a way to view the logged results
  const res = { nonInlinable: arrMediaQueries.join('\n'), inlinable: arrStyleTags, htmlLogResult: "" };

  res.htmlLogResult = `
  <div id="findInlinableStyles_htmlLogResult">
    <h4>
      Non-inlinable Styles:
    </h4>
      <pre>
        <code>
                  ${strLib.leftAlignMyContent(res.nonInlinable.trim(),true, true,2).join('')}
        </code>
      </pre>
    <h4>
      Inlinable styles - Selectors:
    </h4>
    <ol style="list-style-position: outside; list-style-type: lower-roman; color: grey;">
      <li>
        <span style="color: black;">
          <pre>
            <code>
                  ${strLib.leftAlignMyContent(res.inlinable.s.map(e => e.trim()).join('\n\t\t\t</code>\n\t\t</pre>\n\t</span>\n</li>\n<li>\n\t<span style="color: black;">\n\t\t<pre>\n\t\t\t<code>\n\t\t  '),true, true,2).join('')}
            </code>
          </pre>
        </span>
      </li>
    </ol>
    <h4>
      Inlinable styles - Data:
    </h4>
    <ol style="list-style-position: outside; list-style-type: lower-roman; color: grey;">
      <li>
        <span style="color: black;">
          <pre>
            <code>
                   ${strLib.leftAlignMyContent(res.inlinable.d.map(e => strLib.leftAlignMyContent(e.trim(), true, false,0)).join('\n\t\t\t</code>\n\t\t</pre>\n\t</span>\n</li>\n<li>\n\t<span style="color: black;">\n\t\t<pre>\n\t\t\t<code>\n\t\t  '),true, true,2).join('')}
            </code>
          </pre>
        </span>
      </li>
    </ol>
  </div>
  ` ;
  return res;
};
