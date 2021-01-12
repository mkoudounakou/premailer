
/* PREMAILER FUNCTIONS - 1. FIND STYLE/BODY - 2. FIND INLINABLE STYLES - 3. INLINE CSS VIA NODE LIST */

// dependencies
const strLib = require('.././utils/string-manipulations.js');
const openTag = strLib.openTag;
const closeTag = strLib.closeTag;
const dblQuote = strLib.dblQuote;
const openCmt = strLib.openCmt;
const closeCmt = strLib.closeCmt;
const arrSelfCloseTags = strLib.arrSelfCloseTags;

// STEP 3: now to add the styles data to DOM elements affected by their selectors
module.exports.inliner = function(emailHtmlBody, StylesSelectors, stylesData, options) {
  let newEmailHtmlBody = "";
  let treeCreationLog = "";

  // part I: first I create a node tree, reading the html with a recursive function call
  let uidPrefix = 'HTMLNode_uid_#';
  let uidCounter = 0;
  let uidCustomDataAttribute = 'data-premailer';
  class HTMLNode {
    constructor(type, id, classList, currentInlineStyles/*, childNodes, parentNode */) {
      this._type = 								(arguments.length >= 1) ? type 								: "" ;
      this._id = 									(arguments.length >= 2) ? id 									: "" ;
      this._classList = 					(arguments.length >= 3) ? classList 					: "" ;
      this._currentInlineStyles = (arguments.length >= 4) ? currentInlineStyles : "" ;
      this._childNodes = 				/*(arguments.length >= 5) ? childNodes 				:*/ [] ;
      this._parentNode = 				/*(arguments.length >= 6) ? parentNode 				:*/ "" ;
      this._uid =	`${uidPrefix}${uidCounter++}`;
    }
    get type() { return this._type; }
    set type(x) { this._type = x; }
    get id() { return this._id; }
    set id(x) { this._id = x; }
    get classList() { return this._classList; }
    set classList(x) { this._classList = x; }
    get currentInlineStyles() { return this._currentInlineStyles; }
    set currentInlineStyles(x) { this._currentInlineStyles = x; }
    get childNodes() { return this._childNodes; }
    //set childNodes(x) { this._childNodes = x; }
    get parentNode() { return this._parentNode; }
    set parentNode(x) { this._parentNode = x; }
    get uid() { return this._uid; }

    isRoot(){
      return this.uid === (uidPrefix + '0');
    }

    addChildNode(newNode){
      this._childNodes.push(newNode);
    }

    getChildByIndex(i){
      return this._childNodes[i];
    }

    prettyPrint(){
      return `
      UID:        	|	'${this._uid}'\n
      ID:         	|	'${this._id}'\n
      Type:       	|	'${this._type}'\n
      Class List: 	|	'${this._classList}'\n
      Styles:     	|	'${this._currentInlineStyles}'\n
      Parent Node:	|	'${this._parentNode._uid}'\n
      Child Nodes:	|	'${this._childNodes.map( c => c._uid ).join("', '")}'
      `;
    }


    /* depth first search is the best choice as the node tree was constructed
    from txt file in a dfs-algorithmic manner, hence calling this function
    without selection conditions will return node uids in numerical order.	*/
    depthFirstSearch(str_styleTag_selector) {

      let strSelectors = (typeof str_styleTag_selector==="undefined") ? "" : str_styleTag_selector;
      let arrSelectors = strSelectors.split(/\s+/);

      let meetsCondition = (n,selector) => {
        let res=false;
        let tmp = selector.split('.');
        let typeNm = tmp[0];
        let classNm = (tmp.length > 1) ? tmp[1] : "";
        // comparing n.type
        if(typeNm !== ""){
          if(typeNm === n.type){
            res=true;
          } else { return false; }
        } else { res= true; }
        // comparing n.classList
        if(classNm !== ""){
          if(n.classList.split(/\s+/).includes(classNm)){
            res=true;
          } else { return false; }
        } else { res=true; }
        // return result
        return res;
      };

      // dfs set-up vars
      let nodes, stack = [];
      stack.push(this);

      // non-recursive dfs algorithm for my node tree structure
      let dfs = () => {
        nodes = [];
        while (stack.length != 0) {
          let item = stack.pop();
          if(!nodes.includes(item)){
            nodes.push(item);
          }
          let children = item.childNodes;
          for (let i = children.length - 1; i >= 0; i--)
          stack.push(children[i]);
        }
      };

      // filtering logic for 'str_styleTag_selector' arg
      if(arrSelectors.length > 0){
        let checkedNodes = [];
        for(let s = 0; s < arrSelectors.length; s++){
          dfs();
          checkedNodes = nodes.filter(n => meetsCondition(n,arrSelectors[s]) );
          stack = checkedNodes;
        }
        nodes = checkedNodes;
      }
      else {
        dfs();
      }

      return nodes;
    }

  }

  // a function for adding an attribute to a html tag in the email body, Im calculating the insert point using the currentString.length or node UID attribute supplied
  const addAttributeToCurrentTagorNode = (currentStringOrNodeUID, attributeName, value) => {

    let e = (newEmailHtmlBody==="") ? openTag + currentStringOrNodeUID : newEmailHtmlBody;
    let strIsNodeUID = currentStringOrNodeUID.includes(uidPrefix) && !isNaN(Number(currentStringOrNodeUID.slice(uidPrefix.length)));
    let s="";

    if(strIsNodeUID){

      if(e.includes(currentStringOrNodeUID)) {
        let indexUID = e.indexOf(`${uidCustomDataAttribute}=${dblQuote}${currentStringOrNodeUID}${dblQuote}`);
        // finds the corresponding open tag for the found 'node uid' custom attribute
        s = e.slice(0, indexUID).split(openTag).pop() + e.slice(indexUID);
      }
      else {
        console.log(`Premailer Error:
          \nError message:             'Node UID does not exist within emailHtmlBody',
          \nError origin:              'addAttributeToCurrentTagorNode()',
          \nThe param supplied:        '${currentStringOrNodeUID}',
          \nParam is valid node uid:   '${strIsNodeUID}',
          \nEmail body refs this node: '${e.includes(currentStringOrNodeUID)}',
          \nError handling result:     'return from function without processing data'.
        `);
        return;
      }

    }
    else {
      /* this mode is only entered during HtmlNode Tree creation (the "set-up" stage),
      where it supplies strings showing the currently open tag being processed and
      asks this function to create an entry in the html body of the email being
      premailed to add the new node uid to its custom html attribute so I can
      thereafter inline CSS using just the node uid in the mode seen above.				*/
      s = currentStringOrNodeUID;
    }

    let indexOfOpenTag = e.length - s.length;
    let attributeExistsInCurrentTag = s.split(closeTag)[0].split(dblQuote).filter((e,i)=>i%2===0).join('').split(" ").map(e=> e.split('=')[0]===attributeName).includes(true);
    let strBeforeOpenTag = e.slice(0,indexOfOpenTag);
    let strAfterOpenTag = e.slice(indexOfOpenTag);
    let valueToInsert =  ` ${attributeName}=${dblQuote}${value}${dblQuote}`;

    // Now to reconstruct the whole file with the amendment
    let amendedEmailHtmlBody = strBeforeOpenTag;
    let insertStartPoint, insertEndPoint = 0;

    if (attributeExistsInCurrentTag){

      insertStartPoint = (() => {
        let index = 0;
        let AttrIsFound = false;
        strAfterOpenTag.split(closeTag)[0].split(dblQuote).forEach((e,i)=>{
          if(i===0){
            index += e.length;
            e = e.split(/\s+/).pop();
            index -= e.length;
          }
          if(i%2===0 && e.split('=')[0].trim()===attributeName){
            AttrIsFound = true;
            if(i!==0){
              index += 1;
            }
          }
          else if(!AttrIsFound){
            index += e.length + 1;
          }
        });
        return index;
      })();

      let currentAttrValue = strAfterOpenTag.slice(insertStartPoint+`${attributeName}=${dblQuote}`.length).split(dblQuote)[0];
      insertEndPoint = insertStartPoint + `${attributeName}=${dblQuote}${currentAttrValue}${dblQuote}`.length;

    }
    else {
      insertStartPoint = strAfterOpenTag.indexOf(closeTag);
      insertEndPoint = insertStartPoint;
    }

    let strBeforeInsert = strAfterOpenTag.slice(0,insertStartPoint);
    let strAfterInsert = strAfterOpenTag.slice(insertEndPoint);

    amendedEmailHtmlBody += strBeforeInsert + valueToInsert + strAfterInsert;

    // updates the parent inliner function's return/result variable, called 'newEmailHtmlBody'
    newEmailHtmlBody = amendedEmailHtmlBody;
    return;
  };

  /* 	need to make a recursive function that creates nodes by looking at the
  next tag to see if its self-closing or closing (in which case: return),
  or if the next tag is opening (in which case: call this function again)		*/
  const evaluateHtmlNode = (thisNode, thisString) => {

    // creates log of process
    const logNodeTreeCreation = (this_node, next_node, this_string) => {
      treeCreationLog += `      * * *
        \nReady to read next node..
        \n As this parent node: (thisNode)
        \n${this_node.prettyPrint()}
        \n With this text to open: (thisString)
        \n	${((str) => { let s = str.split('\n'); return (s.length>5) ? s.splice(0,5).join('\n') : str; })(this_string)}
        \n	(showing maximum of 5 lines) \n
        \n '${next_node.uid}' -- was added to -- '${this_node.uid}'
      \n\n`;
    };

    // inner function
    const readNextTag = (currentNode, currentString) => {
      const res = { nextNodeToContinueWith: {}, nextStringToContinueWith: ""};
      let newOpenedTag = currentString.split(openTag).splice(1, currentString.length-1).join(openTag);
      let thisTagIsSelfClosing = arrSelfCloseTags.includes(newOpenedTag.split(closeTag)[0].split(' ')[0]);
      let thisTagIsNotAClosingTag = ( newOpenedTag.split('')[0] !== '/' );

      if(thisTagIsNotAClosingTag){

        const newNode = new HTMLNode();

        // read tag data into newNode
        const tryReadProperty = (propertyName, str) => {
          let res = "";
          let search = str.split(`${propertyName}=${dblQuote}`);
          if(!search[0].includes(openTag)){
            res = search[1].split(dblQuote)[0];
          }
          return res;
        };
        newNode.type = 									newOpenedTag.split(' ').shift().split(closeTag).join('');
        newNode.id = 										tryReadProperty('id', 		newOpenedTag);
        newNode.classList = 						tryReadProperty('class', 	newOpenedTag);
        newNode.currentInlineStyles = 	tryReadProperty('style', 	newOpenedTag);

        // add to node tree
        currentNode.addChildNode(newNode);
        newNode.parentNode = currentNode;

        // create the custom data attribute to store the new node's uid in the new email body
        addAttributeToCurrentTagorNode(newOpenedTag, uidCustomDataAttribute, newNode.uid);

        // logging the node tree creation process
        if(options.makeLogFiles){
          logNodeTreeCreation(currentNode, newNode, currentString);
        }

        res.nextNodeToContinueWith = (!options.makeXHTMLcompatible && thisTagIsSelfClosing) ? currentNode : newNode ;
        res.nextStringToContinueWith = newOpenedTag;
      } else {
        res.nextNodeToContinueWith = currentNode.parentNode;
        res.nextStringToContinueWith = newOpenedTag;
      }
      return res;
    };

    // outer function
    if(thisString!=="" && thisString.includes(openTag)){
      // setting up the first run of this recursive function
      if(thisNode.isRoot()){
        /* 	gets 'thisString' ready for reading (strips comments, then reformats
        tags that close then open without space between), and lastly conforms
        self-closing tags either to html5 standard or for XHTML compatability.	 */
        let tmpData = strLib.addSpaceToCloseTag(strLib.stripHtmlComments(thisString));
        thisString = strLib.conformSelfCloseTags(tmpData, options.makeXHTMLcompatible);
        // all of the above would cause inliner to stop working, had they not been called.
      }
      let data = readNextTag(thisNode, thisString);
      evaluateHtmlNode(data.nextNodeToContinueWith,data.nextStringToContinueWith);
    }
    return;

  };

  const root = new HTMLNode('div', 'root');
  evaluateHtmlNode(root,emailHtmlBody);

  // I DID ACCIDENTALLY GET RID OF MY GHOST TABLES WHEN I STRIPPED THE COMMENT TAGS FROM thisString :(x
  /* I could add them back in after with a options.makeGhostTables and if table.styles has max-width attribute,
  then surround table opening and closing tags (insert point calculated by node tree) with a ghost table of
  width: max_width_value.																																										*/



  // part II: my logic to inline the styles data for selected nodes
  let nodes = [];
  let s = "";
  let d = "";
  for(let i=0;i<StylesSelectors.length;i++){
    s = StylesSelectors[i];
    d = stylesData[i];
    nodes = root.depthFirstSearch(s);
    for(let j=0;j<nodes.length;j++){
      let n = nodes[j];
      let dataToAdd = [];
      dataToAdd.push(n.currentInlineStyles);
      dataToAdd = dataToAdd.concat(d.split(/\s+/));
      //console.log(dataToAdd);
      addAttributeToCurrentTagorNode(n.uid, "styles", dataToAdd.join(' ').trim());
    }
  }
  //console.log(root.depthFirstSearch().map(n => n.prettyPrint()).join('\n			-----------------\n'));



  // part III: ready to send as an object, including a way to view the logged results
  let result_html = strLib.convertStrTo(newEmailHtmlBody,'result','result').trim();
  let entityName_html = strLib.convertStrTo(newEmailHtmlBody,'entityName','result').trim();

  // the old function.. (for some reason doesn't produce the same output) - testing required
  const convertHtmlToPlaintext = (s) => { return s.split('<').join('&lt;').split('>').join('&gt;'); };
  entityName_html = convertHtmlToPlaintext(newEmailHtmlBody); // overriding this for now..

  const res = { res: strLib.leftAlignMyContent(result_html,true,true).join(''), HTMLNodeTreeLog: treeCreationLog, htmlLogResult: `
    <div id="inliner_htmlLogResult">
      <h4>
        The new html file:
      </h4>
      <pre>
        <code>
             ${strLib.leftAlignMyContent(entityName_html,true,false,2)}
        </code>
      </pre>
    </div>
  `};
  return res;
};
