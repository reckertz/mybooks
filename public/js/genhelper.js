/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*jslint white:true, browser:true, devel:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper */
/*global uientry,planetaryjs, */

(function () {
    "use strict";
    //
    let genhelper = {};
    let root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global) || this;
    /** 
     * genhelper
     * Functions without dependencies, applicable in server and client
     */

    /**
     * isISBN - checkt ISBN-10 und ISBN-13
     * @param {*} isbnstring 
     * return true or false
     */
    genhelper.isISBN = function (isbnstring) {
        let isbninput = isbnstring;
        isbninput = isbninput.replace(/-/g, "");
        isbninput = isbninput.replace(/ /g, "");
        // erst mal: alles zahlen
        let reg = /^\d+/;
        if (!reg.test(isbninput)) {
            return;
        }
        if (isbninput.trim().length === 10) {
            // dedizierte Prüfung
            let sum = 0;
            let isbnok = false;
            for (let i = 0; i < 9; i++) {
                let num = parseInt(isbninput.substr(i, 1));
                sum += (i + 1) * num;
            }
            let pz = sum % 11;
            if (pz !== 10) {
                if (pz !== parseInt(isbninput[9])) {
                    return; // falsche ISBN-10
                } else {
                    $("#mybookscanb1").click();
                }
            } else {
                if (isbninput.substr(9, 1) === "X" || isbninput.substr(9, 1) === "0") {
                    $("#mybookscanb1").click();
                }
            }
        }
        if (isbninput.trim().length === 13) {
            // dedizierte Prüfung
            let sum = 0;
            let isbnok = false;
            for (let i = 0; i < 12; i++) {
                let num = parseInt(isbninput.substr(i, 1));
                let z = i + 1;
                if (z % 2 === 0) {
                    sum += 3 * num; // geradzahlig
                } else {
                    sum += num; // ungeradzahlig
                }
                console.log(z + ":" + i + " num:" + num + " sum: " + sum);
            }
            //let pz = (10 - sum % 10) % 10;
            let pz = sum % 10;
            pz = 10 - pz;
            pz = pz % 10;
            console.log(isbninput + "=>" + sum + "=>" + pz);
            if (pz !== parseInt(isbninput.substr(12, 1))) {
                return; // falsche ISBN-13
            } else {
                $("#mybookscanb1").click();
            }
        }

    };

    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = genhelper;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return genhelper;
        });
    } else {
        // included directly via <script> tag
        root.genhelper = genhelper;
    }
}());