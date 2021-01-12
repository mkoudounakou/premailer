/* PREMAILER MAIN */

// dependencies
const prep = require('./premailer-process/prepare-data.js');
const exec = require('./premailer-process/execute-data.js');
const strLib = require('./utils/string-manipulations.js');
const fs = require('fs');

// This could be something to add to the UI as a form input when it comes to production.
class Options {
  constructor(options){
    this._makeXHTMLcompatible = (arguments.length < 1) ? false : (typeof options.makeXHTMLcompatible !== "undefined") ? options.makeXHTMLcompatible : false ;
    this._makeLogFiles        = (arguments.length < 1) ? false : (typeof options.makeLogFiles        !== "undefined") ? options.makeLogFiles        : false ;
    // need 'makeGhostTables' var
  }
  get makeXHTMLcompatible() { return this._makeXHTMLcompatible; }
  set makeXHTMLcompatible(x) { this._makeXHTMLcompatible = x; }
  get makeLogFiles() { return this._makeLogFiles; }
  set makeLogFiles(x) { this._makeLogFiles = x; }
}

module.exports = class Premailer {
  constructor(dirInputFile, dirOutputFile, premailerOptions) {
    this._dirInputFile = 			(arguments.length >= 1) ? dirInputFile 			              : "" ;
    this._dirOutputFile = 		(arguments.length >= 2) ? dirOutputFile 		              : "" ;
    this._premailerOptions = 	(arguments.length >= 3) ? new Options(premailerOptions) 	: new Options();
  }
  get dirInputFile() { return this._dirInputFile; }
  set dirInputFile(x) { this._dirInputFile = x; }
  get dirOutputFile() { return this._dirOutputFile; }
  set dirOutputFile(x) { this._dirOutputFile = x; }
  get premailerOptions() { return this._premailerOptions; }
  set premailerOptions(x) { this._premailerOptions = new Options(x); }

  premailMyEmail(){
    // locally scoped helper functions
    const prettyPrintError = (customMsg, err) => {
      let res = `Premailer Error:\nError Msg: ${customMsg}`;
      if(typeof err !== "undefined"){
        res += `,\nError Code: ${err.code}`;
      }
      return console.log(res);
    };

    const tryReadInputFile = (dir) => {
      let res = "";
      if(dir !== ""){
        if(dir.split('.').pop()==="html"){
          try {
            res = fs.readFileSync(dir, "utf8");
          } catch (err) {
            prettyPrintError(`Premailer couldn't read the input file you supplied`, err);
          }
        }
        else { prettyPrintError(`Premailer instance was not supplied an input file with the '.html' extension.`); }
      }
      else { prettyPrintError(`Premailer instance was not supplied with an input file.`); }
      return res;
    };

    const tryWriteOutputFile = (dir, data) => {
      let writeFileSucceeded = true;
      if(dir !== ""){
        try {
          fs.writeFileSync(dir, data);
        } catch (err) {
          prettyPrintError(`Premailer couldn't write to the output directory you supplied`, err);
          writeFileSucceeded = false;
        }
      }
      else { prettyPrintError(`Premailer instance was not supplied with an output directory.`); }
      return writeFileSucceeded;
    };

    const createOutputLogs = (dirOutputFile, objFoundStylesAndBody, objClassifiedStyles, objInlinedEmail) => {
      const dirLogFiles = dirOutputFile + 'premailer-log-files';

      const createDirectory = (dir) => {
        let pathExists = true;
        try {
          fs.statSync(dir);
        } catch(err) {
          pathExists = false;
        }
        if(pathExists === false){
          fs.mkdirSync(dir, { recursive: true });
        }
        return;
      };
      createDirectory(dirLogFiles);

      const htmlNodeCreationLog = `Premailer 'HTMLNode' DOM Tree Creation Log:\n\n${objInlinedEmail.HTMLNodeTreeLog}`;
      fs.writeFileSync(dirLogFiles+"/premailer-node-tree-creation-log.txt", htmlNodeCreationLog);

      const htmlResultLog = `
      <!DOCTYPE html>
      <html>
        <body>
          <div id="myPremailerFunction_htmlLogResult">
            <h2>
              <center>Welcome to Premailer!</center>
            </h2>
            ${strLib.leftAlignMyContent(objInlinedEmail.htmlLogResult,true,true,3).join('')}
            ${strLib.leftAlignMyContent(objClassifiedStyles.htmlLogResult,true,false,3).join('')}
          </div>
        </body>
      </html>
      ` ;
      fs.writeFileSync(dirLogFiles+"/premailer-result-log.html", strLib.leftAlignMyContent(htmlResultLog,true,false).join(''));

      const grvAccent = '`';
      const htmlResultUI = `
      <!DOCTYPE html>
      <html>
        <body>
          <script>
            window.onload = () => {
              let toggle = false;
              const bodytag = document.getElementsByTagName('body')[0];

              const wrapper = document.createElement('div');
              wrapper.setAttribute("id", "premailer_wrapper");
              wrapper.setAttribute("style","position: fixed; width: 100%; height: 100%;");

              const divResultEmail = document.createElement('div');
              divResultEmail.setAttribute("id", "premailer_result-preview");
              divResultEmail.setAttribute("style","position: absolute; top: 0px; overflow:scroll; height:100%; width: 100%; background-color: white;");
              divResultEmail.innerHTML = ${grvAccent}
                <h2>
                  <center>Welcome to Premailer!</center>
                </h2>
                <h4>Preview Result:</h4>
                <div id="premailer_result">
                  <pre>
                    <code>
                      ${strLib.leftAlignMyContent(objInlinedEmail.res,true,false,4).join('')}
                    </code>
                  </pre>
                </div>
              ${grvAccent};

              const divResultLog = document.createElement('div');
              divResultLog.setAttribute("id", "premailer_result-log");
              divResultLog.innerHTML = ${grvAccent}
                ${strLib.leftAlignMyContent(htmlResultLog,true,false,4).join('')}
              ${grvAccent};
              let arr = ["display: visible; position: absolute; top: 0px; overflow:scroll; height:100%; width: 100%; background-color: white; z-index: 8888;", "display: none;"];
              divResultLog.setAttribute("style",arr[1]);

              const btnToggleShowResult = document.createElement('button');
              btnToggleShowResult.innerHTML = "Show Result Log";
              btnToggleShowResult.setAttribute("style","position: fixed; right: 17px; top: 17px; z-index: 9999; border: none;  color: grey;  padding: 15px 0px;  text-align: center;  text-decoration: none;  display: inline-block;  font-size: 16px; margin: 1px 2px;  cursor: pointer; width: 160px;");
              const showhide = () => { toggle = !toggle; divResultLog.setAttribute("style",((toggle) ? arr[0] : arr[1])); btnToggleShowResult.innerHTML = (toggle) ? "Hide Result Log" : "Show Result Log"; };
              btnToggleShowResult.onclick = showhide;

              bodytag.appendChild(btnToggleShowResult);
              wrapper.appendChild(divResultEmail);
              wrapper.appendChild(divResultLog);
              bodytag.appendChild(wrapper);
            };
          </script>
        </body>
      </html>
      `;
      fs.writeFileSync(dirLogFiles+"/premailer-result-UI.html", strLib.leftAlignMyContent(htmlResultUI,true,false).join(''));

      return;
    };

    // main logic
    const strInputFile = tryReadInputFile(this._dirInputFile);
    if(strInputFile !== ""){
      const objFoundStylesAndBody = prep.findStylesAndBody(strInputFile);
      const objClassifiedStyles = prep.findInlinableStyles(objFoundStylesAndBody.s); // I NEED TO STRIP COMMENTED CODE OUT TO AVOID ERRORS WITH "{ } @" SYMBOLS
      const objInlinedEmail = exec.inliner(objFoundStylesAndBody.b, objClassifiedStyles.inlinable.s, objClassifiedStyles.inlinable.d, this._premailerOptions);
      if(this._dirOutputFile.split('').pop()==="/"){
        const outputFileCreated = tryWriteOutputFile(this._dirOutputFile+"premailer-result-file.html", strLib.leftAlignMyContent("    "+objInlinedEmail.res,true,false,-1).join(''));
        if(outputFileCreated && this._premailerOptions.makeLogFiles === true){
          createOutputLogs(this._dirOutputFile, objFoundStylesAndBody, objClassifiedStyles, objInlinedEmail);
        }
      }
      else {
        prettyPrintError("The output file destination supplied must be a directory, with the last character: '/'.");
      }
    }

    return;
  }

}
