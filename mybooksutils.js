/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*jslint browser:true,white:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper */
/*global uientry,planetaryjs, */

(function () {
    "use strict";
    //
    let mybooksutils = {};

    let root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global) || this;
    let isbn = require('node-isbn/index');
    let booksbytitle = require('google-books-search');
    let dbhelper = require("./dbhelper.js");
    /**
     * getbyisbn - isbn oder Titel als Vorgabe
     * erst prüfen, ob schon in der Datenbank,
     * wenn nicht, dann über API die Daten holen bzw. suchen
     * @param {*} rootdir 
     * @param {*} fs 
     * @param {*} async 
     * @param {*} req 
     * @param {*} reqparm
     * @param {*} res 
     * @param {*} cbisbn1 
     * callback mit function (res, ret)
     */
    mybooksutils.getbyisbn = function (db, rootdir, fs, async, req, reqparm, res, cbisbn1) {
        let booksearch = ""; // "0735619670";
        if (req.query && typeof req.query.booksearch === "string" && req.query.booksearch.length > 0) {
            booksearch = req.query.booksearch;
        } else if (req.body && typeof req.body.booksearch === "string" && req.body.booksearch.length > 0) {
            booksearch = req.body.booksearch;
        }

        let bookbox = "Box 1";
        if (req.query && typeof req.query.bookbox === "string" && req.query.bookbox.length > 0) {
            bookbox = req.query.bookbox;
        } else if (req.body && typeof req.body.bookbox === "string" && req.body.bookbox.length > 0) {
            bookbox = req.body.bookbox;
        }

        
        let bookcomment = "";
        if (req.query && typeof req.query.bookcomment === "string" && req.query.bookcomment.length > 0) {
            bookbox = req.query.bookbox;
        } else if (req.body && typeof req.body.bookcomment === "string" && req.body.bookcomment.length > 0) {
            bookcomment = req.body.bookcomment;
        }


        async.waterfall(
            [
                function (cbisbn10) {
                    let ret = {};
                    ret.booksearch = booksearch;
                    ret.bookbox = bookbox;
                    ret.bookcomment = bookcomment;
                    cbisbn10(null, res, ret);
                    return;
                },
                function (res, ret, cbisbn11) {
                    // Zugriff zur Datenbank
                    let reqparm = {
                        sel: {
                            ISBN: ret.booksearch
                        },
                        projection: {},
                        table: "MYBOOKS"
                    };
                    dbhelper.getonerecord(db, async, null, reqparm, res, function (res, ret1) {
                        if (ret1.error === true) {
                            ret.error = false;
                            ret.message = "not found" + ret1.message;
                            ret.isNew = true;
                            cbisbn11(null, res, ret);
                            return;
                        } else if (typeof ret1.record !== "undefined" && ret1.record !== null && Object.keys(ret1.record).length > 0) {
                            ret.error = false;
                            ret.message = "MYBOOKS found";
                            ret.book = Object.assign({}, ret1.record); // fullcopy
                            ret.isNew = false;
                            console.log(ret.booksearch + " found in MYBOOKS");
                            cbisbn11(null, res, ret);
                            return;
                        } else {
                            ret.isNew = true;
                            console.log(ret.booksearch + " NOT found in MYBOOKS");
                            cbisbn11(null, res, ret);
                            return;
                        }
                    }); 
                },
                function (res, ret, cbisbn12) {
                    // Zugriff zum API
                    if (typeof ret.isNew !== "undefined" && ret.isNew === false) {
                        // Buch bereits bekannt
                        cbisbn12(null, res, ret);
                        return;
                    }
                    isbn.resolve(booksearch, function (err, book) {
                        if (err) {
                            console.log('Book ' + booksearch + ' not found', err);
                            // err.response.status = 401
                            let ret = {
                                error: false,
                                message: "Book not found",
                                booksearch: booksearch
                            };
                            cbisbn12(null, res, ret);
                            return;
                        } else {
                            console.log(booksearch + ' found in API');
                            let ret = {};
                            ret.booksearch = booksearch;
                            ret.bookbox = bookbox;
                            ret.bookcomment = bookcomment;
                            ret.isNew = true;
                            ret.ISBN = booksearch;
                            ret.book = dbhelper.cloneObject(book);
                            ret.error = false;
                            ret.message = booksearch + " Book found";
                            cbisbn12(null, res, ret);
                            return;
                        }
                    });
                },
                function (res, ret, cbisbn12a) {
                    // Sonderfall: Titelsuche, wenn ISBN nicht vorgegeben war
                    if (typeof ret.book === "object" && Object.keys(ret.book).length > 0) {
                        cbisbn12a(null, res, ret);
                        return; 
                    }
                    booksbytitle.search(ret.booksearch, function(error, results) {
                        if ( ! error ) {
                            console.log(JSON.stringify(results));
                        } else {
                            console.log(error);
                        }
                        cbisbn12a(null, res, ret);
                        return; 
                    });
                },
                function (res, ret, cbisbn13) {
                    // Sichern neues Buch in die Datenbank
                    if (typeof ret.isNew !== "undefined" && ret.isNew === false) {
                        // Buch bereits bekannt
                        cbisbn13(null, res, ret);
                        return;
                    }
                    // kein Buch da
                    if (typeof ret.book === "undefined") {
                        cbisbn13(null, res, ret);
                        return; 
                    }
                    console.log(ret.booksearch + " conversion and upsert");
                    let selfields = {};
                    let insfields = {};
                    let updfields = {};
                    selfields.ISBN = ret.booksearch;
                    insfields.ISBN = ret.booksearch;
                    updfields.title = ret.book.title || "";
                    updfields.subtitle = ret.book.subtitle || "";
                    updfields.authors = ret.book.authors; // Array of objects
                    updfields.publisher = ret.book.publisher || "";
                    updfields.publishedDate = ret.book.publishedDate || "";
                    updfields.description = ret.book.description || "";
                    updfields.industryIdentifiers = ret.book.industryIdentifiers; // Array of objects     
                    updfields.pageCount = ret.book.pageCount || "";
                    updfields.printType = ret.book.printType || "";
                    updfields.categories = ret.book.categories || "";
                    updfields.contentVersion = ret.book.contentVersion || "";
                    if (typeof ret.book.imageLinks === "object") {
                        updfields.smallThumbnail = ret.book.imageLinks.smallThumbnail || "";
                        updfields.thumbnail = ret.book.imageLinks.thumbnail || "";
                    } else {
                        updfields.smallThumbnail = "";
                        updfields.thumbnail = "";
                    }
                    updfields.language = ret.book.language || "";
                    updfields.previewLink = ret.book.previewLink || "";
                    updfields.infoLink = ret.book.infoLink || "";
                    updfields.canonicalVolumeLink = ret.book.canonicalVolumeLink || "";
                    /*
                        "readingModes": {
                            "text": false,
                            "image": false
                        },
                    */
                    /*   
                        "categories": [
                            "Computers"
                        ],
                    */
                    //    "averageRating": 4,
                    //    "ratingsCount": 123,
                    // "contentVersion": "preview-1.0.0",
                    /*
                        "imageLinks": {
                            "smallThumbnail": "http://books.google.com/books/content?id=QnghAQAAIAAJ&printsec=frontcover&img=1&zoom=5&source=gbs_api",
                            "thumbnail": "http://books.google.com/books/content?id=QnghAQAAIAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api"
                        },
                        "language": "en",
                        "previewLink": "http://books.google.es/books?id=QnghAQAAIAAJ&dq=isbn:0735619670&hl=&cd=1&source=gbs_api",
                        "infoLink": "http://books.google.es/books?id=QnghAQAAIAAJ&dq=isbn:0735619670&hl=&source=gbs_api",
                        "canonicalVolumeLink": "http://books.google.es/books/about/Code_Complete.html?hl=&id=QnghAQAAIAAJ"
                    }
                    */
                    let reqparm = {}; 
                    reqparm.selfields = dbhelper.cloneObject(selfields);
                    reqparm.insfields = dbhelper.cloneObject(insfields);
                    reqparm.updfields = dbhelper.cloneObject(updfields);
                    reqparm.table = "MYBOOKS";
                    dbhelper.setonerecord(db, async, null, reqparm, res, function (res, ret1) {
                        cbisbn13(null, res, ret);
                        return;
                    });
                },
                function (res, ret, cbisbn14) {
                    if (typeof ret.isNew !== "undefined" && ret.isNew === false) {
                        // Buch bereits bekannt
                        cbisbn14(null, res, ret);
                        return;
                    }
                    // kein Buch da
                    if (typeof ret.book === "undefined") {
                        cbisbn14(null, res, ret);
                        return; 
                    }
                    // Aufbereiten der Ausgabe MYBOOKSINFOS mit box und comment zur ISBN mit title
                    console.log(ret.booksearch + " upsert MYBOOKSINFOS");
                    let selfields = {};
                    let insfields = {};
                    let updfields = {};
                    selfields.ISBN = ret.booksearch;
                    insfields.ISBN = ret.booksearch;
                    updfields.title = ret.book.title || "";
                    updfields.subtitle = ret.book.subtitle || "";
                    updfields.bookbox = ret.bookbox;
                    updfields.bookcomment = ret.bookcomment;
                    let reqparm = {}; 
                    reqparm.selfields = dbhelper.cloneObject(selfields);
                    reqparm.insfields = dbhelper.cloneObject(insfields);
                    reqparm.updfields = dbhelper.cloneObject(updfields);
                    reqparm.table = "MYBOOKSINFOS";
                    dbhelper.setonerecord(db, async, null, reqparm, res, function (res, ret1) {
                        ret.error = ret1.error;
                        ret.message = ret1.message;
                        cbisbn14(null, res, ret);
                        return;
                    });
                }
            ],
            function (error, res, ret) {
                console.log(ret.booksearch + " finished");
                cbisbn1(res, ret);
                return;
            });

    };

    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = mybooksutils;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return mybooksutils;
        });
    } else {
        // included directly via <script> tag
        root.mybooksutils = mybooksutils;
    }
}());