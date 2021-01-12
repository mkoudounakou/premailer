
/* PREMAILER FUNCTIONS - FOR FORMATTING AND STRING MANIPULATION */

// no dependencies


// A formatting function I use to convert special chars to their plaintext equivalents, which is a useful facility for my .createUI() function
module.exports.convertStrTo = function(str,returnType, specifiedInputType) {
	let res = "";

  /* Array of 'HTML Reserve Chars' listed on 'w3schools'. Those found in my premailer test data were: '&lt;', '&gt;', '\&quot;', '&amp;nbsp;' */
  const conversionTable = [
    { result: '	', description: 'non-breaking space', 								entityName: '&nbsp;', 	entityNumber: '&#160;'},
    { result: '<', description: 'less than', 													entityName: '&lt;', 		entityNumber: '&#60;'},
    { result: '>', description: 'greater than', 											entityName: '&gt;', 		entityNumber: '&#62;'},
    { result: '&', description: 'ampersand', 													entityName: '&amp;', 		entityNumber: '&#38;'},
    { result: '"', description: 'double quotation mark', 							entityName: '&quot;', 	entityNumber: '&#34;'},
    { result: "'", description: 'single quotation mark (apostrophe)', entityName: '&apos;', 	entityNumber: '&#39;'},
    { result: '¢', description: 'cent', 															entityName: '&cent;', 	entityNumber: '&#162;'},
    { result: '£', description: 'pound', 															entityName: '&pound;', 	entityNumber: '&#163;'},
    { result: '¥', description: 'yen', 																entityName: '&yen;', 		entityNumber: '&#165;'},
    { result: '€', description: 'euro', 															entityName: '&euro;', 	entityNumber: '&#8364;'},
    { result: '©', description: 'copyright', 													entityName: '&copy;', 	entityNumber: '&#169;'},
    { result: '®', description: 'registered trademark', 							entityName: '&reg;', 		entityNumber: '&#174;'}
  ]; // 'result' is the property Ill need to use for my inliner logic, the others are for use between <code> and <pre> tags in the UI.

  const autoDetect = (s) => { 						/* I HAVE AN EXTENDED FACILITY IN THIS CODE THAT I HAVENT COMMITED YET */
  	let propertyType = "";								// the facility: THIS WILL NOW CONVERT MULTIPLE INPUT TYPES TO THE SAME RETURN TYPE
    let i = 0;														// I ADDED A DO WHILE LOOP AND AMENDED THE AUTO DETECT FUNCTION BY NOT PRIORITISING RETURNTYPE
    let properties = Object.keys(conversionTable[i]);
    // properties = properties.filter(p => p !== returnType );
    // properties.push(returnType);
    for(i=0;i<properties.length;i++){
    	const strMatchesProp = (s,p) => { let arr=conversionTable.map(e=>{ return s.includes( e[p] ); }); return arr.includes(true); };
      if( strMatchesProp(s,properties[i]) ){ propertyType = properties[i]; /* break; */ }
    }
    return propertyType;
  };

  let tmpData = str;
  res = str;
  let i = 0;
  // do {
  let autoDetectedConvertFrom = ((typeof specifiedInputType)==="undefined") ? autoDetect(str) : "" ;
  for(i=0;i<conversionTable.length;i++){
    let convertFrom = (autoDetectedConvertFrom==="") ? conversionTable[i][specifiedInputType] : conversionTable[i][autoDetectedConvertFrom] ;
    let convertTo = conversionTable[i][returnType];
    res = tmpData.split(convertFrom).join(convertTo);
    tmpData = res;
  }
  // 	if(autoDetectedConvertFrom!==""){ specifiedInputType = undefined; }
  // } while(autoDetectedConvertFrom !== returnType)

  return res;
};

// remember, I'm dealing with the console automatically converting 'result' html reserve chars to their 'entityName' form.
// NO BENEFIT in this environment, but will be where automatic plaintext handling isnt default practice.. (for security)
const openTag = module.exports.convertStrTo('<', 'result');
const closeTag = module.exports.convertStrTo('>', 'result');
const dblQuote = module.exports.convertStrTo('"', 'result');
const openCmt = module.exports.convertStrTo("<!--", 'result');
const closeCmt = module.exports.convertStrTo("-->", 'result');
module.exports.openTag = openTag;
module.exports.closeTag = closeTag;
module.exports.dblQuote = dblQuote;
module.exports.openCmt = openCmt;
module.exports.closeCmt = closeCmt;


// A formatting function I use for "prettifying" <code> sections in 'htmlLogResult' outputs from my premailer functions
module.exports.leftAlignMyContent = function(string_or_array_of_string_values, retainIndent, ignoreFirstLine, addIndentPostProcessing) {
  let res = [];
  let tmpArr = [];
  let indent = 0;
  let regexMatchNothing = /$^/; // regex attempts to match NOTHING - needs testing

  //check function input and convert to array if necessary
  let arr = [];
  if( Array.isArray(string_or_array_of_string_values) ){
  	arr = string_or_array_of_string_values;
  }
  else {
  	arr = string_or_array_of_string_values.split(regexMatchNothing);
  }

  //apply formatting logic to content as an array
  if(retainIndent){
    tmpArr = arr.map(e => e.split('\n'));

    const countLeadingWhitespace = (s) => {
      let charFound = false;
      let res = 0;
      s.split('').forEach((el,i) => {
        if(charFound || el !== " "){
          if(!charFound) { charFound = true; }
        }
        else {
          res = i+1;
        }
      });
      return res;
    };

    let ArrIndents = [];
    let bigNumber = 999999999;
    tmpArr.forEach( arr => {
    	arr.map(e => {
      	if(e===""){
        	ArrIndents.push(bigNumber);
        } else {
        	ArrIndents.push(countLeadingWhitespace(e));
        }
      });
    })

    if(ignoreFirstLine){ ArrIndents[0] = bigNumber; }
    indent = Math.min(...ArrIndents);

    let ArrRes = [];
    tmpArr.map(arr => {
    	arr.map( (e, i) => {
        if(ignoreFirstLine && i === 0){
        	ArrRes.push(e);
        } else {
        	ArrRes.push(e.slice(indent,e.length));
        }

				let addedItem = ArrRes.pop();
				const spaceToTabMultiplier = 4;
				let extraIndent = "";
				if(typeof addIndentPostProcessing !== "undefined"){
					if(addIndentPostProcessing>0){
						extraIndent = new Array(addIndentPostProcessing+1).map(e => "").join('    ');
					}
				}
				let postProcess = (addIndentPostProcessing > 0) ? extraIndent + addedItem : addedItem.slice(addIndentPostProcessing * -spaceToTabMultiplier);
				ArrRes.push(postProcess);
    	});
    });

    res = ArrRes.join('\n').trim().split(regexMatchNothing);
  }
  else {
    res = arr.map(e => e.split('\n').map(el => el.trim()).join('\n')).join('').trim().split('\n\n');
  }

  //return formatted content as array
  return res;
};

/* 	gets a code string ready for processing (strips comments, then reformats
    tags that close then open without space between), and lastly conforms
    self-closing tags either to html5 standard or for XHTML compatability.	 */

module.exports.stripHtmlComments = function(s) { return s.split(closeCmt).join(openCmt).split(openCmt).filter((e,i)=>i%2===0).join(''); };

module.exports.addSpaceToCloseTag = function(s) { return s.split(closeTag).join(closeTag+' '); };

// list of valid self-close tags for html5
const arrSelfCloseTags = ["area","base","br","col","command","embed","hr","img","input",
                          "keygen","link","menuitem","meta","param","source","track","wbr"];
module.exports.arrSelfCloseTags = arrSelfCloseTags;

// adds conformity to self-closing tags, so they're all in the format: <br> | NOT: <br></br> OR <br />
module.exports.conformSelfCloseTags = function(s, makeXHTMLcompatible) {
  let res = "";
  let arrSplitString = s.split(closeTag).join(openTag).split(openTag);
  const findTagType = (s) => { return s.split('/').join('').split(' ')[0]; };
  let arrDetectSelfClosing = arrSplitString.map((e,i)=>{ return ( i%2!==0 ) ? ( arrSelfCloseTags.includes(findTagType(e)) ? true : false ) : false; });

  for(let i=0;i<arrSplitString.length;i++){
    let e = arrSplitString[i];
    let tagIsSelfClosable = arrDetectSelfClosing[i];

    if(tagIsSelfClosable){
      // detect leading "/" to remove whole closing tag, and trailing "/" to remove "self-closing syntax" backslash
      let arrChars = e.split('');
      if(arrChars[0]==="/"){ arrSplitString[i] = ''; }
      else if(arrChars[arrChars.length-1]==="/"){ arrSplitString[i] = e.split("/").join(''); }

      if(makeXHTMLcompatible){ // convert to "<t></t>" format for compatibility
        e = arrSplitString[i];
        if(e!==""){
          let t = findTagType(e);
          arrSplitString[i] = `${e}${closeTag}${openTag}/${t}`;
        }
      }
    }
  }
  res = arrSplitString.map((e,i)=>{ return ((i%2!==0) && (e!=="")) ? `${openTag}${e}${closeTag}` : e; }).join('');
  return res;
};
