// The following is a guide to Premailer.js, developed by Maria Koudounakou.
/* EXAMPLE SHOWING HOW PREMAILER CAN BE USED AND IMPORTED INTO A PROJECT */

// importing Premailer into a project
const Premailer = require('premailer.js');

// using Premailer in your project
const premailer = new Premailer('./example/input.html', './example/output/', { makeLogFiles: true });
premailer.premailMyEmail();

// Resultant file structure created from this method call
/*  ./example/output/premailer-log-files/
    ./example/output/premailer-log-files/premailer-node-tree-creation-log.txt
    ./example/output/premailer-log-files/premailer-result-log.html
    ./example/output/premailer-log-files/premailer-result-UI.html
    ./example/output/premailer-result-file.html
*/

// Please note
/* Premailer takes three arguments in its constructor:
    - dirInputFile: (typeof String) the relative path of the HTML file you wish to convert.
    - dirOutputFile: (typeof String) the relative path of the directory you wish Premailer to write the output file(s) to.
    - premailerOptions: (typeof Object) *Optional Argument* with properties to customise how Premailer operates.

   To begin premailing, you need only call the class method 'premailMyEmail()' for your instance of Premailer.

   Valid 'premailerOptions' Object Properties (typeof Boolean) are listed below:
    - makeXHTMLcompatible: Conforms all self-closing tags to the format <Tag></Tag> for compatibility with XHTML applications.
    - makeLogFiles: In addition to the default output file, Premailer will create further log files showing your file at various conversion stages.
*/

// Library Information
/* Premailer is a JavaScript library which:
    1. reads a HTML document
    2. creates a tree data structure to represent the DOM
    3. "inlines" any extracted CSS rules found in the file

  The code can be found at: https://github.com/mkoudounakou/premailer

  Keywords: "Premailer", "Inline", "CSS", "Outlook", "Compatible", "Email",
            "HTML", "File", "Conversion", "Mail", "Styles", "Inliner".

  © 2020 Maria Koudounakou, All rights reserved.
*/
