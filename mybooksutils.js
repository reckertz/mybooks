/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*jslint browser:true,white:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper */
/*global uientry,planetaryjs,console */

const genhelper = require('./public/js/genhelper.js');

(function () {
    "use strict";
    //
    let mybooksutils = {};

    let root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global) || this;
    let isbn = require('node-isbn/index');
    let booksbytitle = require('google-books-search');
    let dbhelper = require("./dbhelper.js");
    let request = require("ajax-request");
    let superagent = require("superagent");

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
                    /*
                    let reqparm = {
                        sel: {
                            ISBN: ret.booksearch
                        },
                        projection: {},
                        table: "MYBOOKS"
                    };
                    */
                    let sql = "SELECT MYBOOKS.*, MYBOOKSINFOS.*";
                    sql += " FROM MYBOOKS";
                    sql += " LEFT JOIN MYBOOKSINFOS";
                    sql += " ON MYBOOKS.ISBN = MYBOOKSINFOS.ISBN";
                    sql += " WHERE MYBOOKS.ISBN = '" + ret.booksearch + "'";
                    let reqparm = {
                        sel: sql,
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
                        // ISBN bereits bekannt oder Titeleingabe
                        cbisbn12(null, res, ret);
                        return;
                    }
                    if (genhelper.isISBN(ret.booksearch) === false) {
                        // ISBN-API braucht formal korrekte ISBN
                        cbisbn12(null, res, ret);
                        return;
                    }
                    try {
                        isbn.resolve(booksearch, function (err, book) {
                            if (err) {
                                let msg = booksearch + " Book not found ";
                                msg += err.response.statusText;
                                msg += " " + err.message;
                                console.log(msg);
                                // err.response.status = 401
                                let ret = {
                                    error: false,
                                    message: msg,
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
                    } catch (err) {
                        ret.error = true;
                        ret.message += err;
                        cbisbn12(null, res, ret);
                        return;
                    }
                },

                function (res, ret, cbisbn12a) {
                    if (typeof ret.book === "object" && Object.keys(ret.book).length > 0) {
                        cbisbn12a(null, res, ret);
                        return;
                    }
                    ret.booklist = [];
                    // Suche im original google-API
                    superagent.get("https://www.googleapis.com/books/v1/volumes")
                        .query({
                            q: ret.booksearch
                        })
                        .end(function (err, res1) {
                            /*
                            if (err) {
                                return console.log(err);
                            }
                            console.log(res1.body.url);
                            console.log(res1.body.explanation);
                            */
                            if (err !== null) {
                                console.log(err);
                                ret.error = true;
                                ret.message = err;
                                cbisbn12a(null, res, ret);
                                return;
                            } else {
                                let body = res1.body;
                                if (typeof body === "string") {
                                    body = JSON.parse(body);
                                }
                                if (typeof body.totalItems !== "undefined" && body.totalItems === 0) {
                                    ret.error = true;
                                    ret.message = "superagent - keine Treffer";
                                    cbisbn12a(null, res, ret);
                                    return;
                                }
                                // Extrakt übernehmen https://openlibrary.org/works/OL45883W.json
                                ret.booklist = [];
                                body.items.forEach(function (book, ibook) {
                                    let title = book.volumeInfo.title;
                                    let authors = "";
                                    if (typeof book.volumeInfo.authors === "object" && Array.isArray(book.volumeInfo.authors) && book.volumeInfo.authors.length > 0) {
                                        authors = book.volumeInfo.authors.join(", ");
                                    } else {
                                        authors = book.volumeInfo.authors;
                                    }
                                    let isbns = [];
                                    if (typeof book.volumeInfo.industryIdentifiers === "object" && Array.isArray(book.volumeInfo.industryIdentifiers)) {
                                        book.volumeInfo.industryIdentifiers.forEach(function (indid, iindid) {
                                            if (indid.type.toLowerCase().indexOf("isbn") >= 0) {
                                                isbns.push(indid.identifier);
                                            }
                                        });
                                    }
                                    // TODO: Duplikate prüfen 10 und 13-er ISBN
                                    let lisbn = isbns.join(",");
                                    let publishedDate = "";
                                    if (typeof book.volumeInfo.publishedDate === "string" && book.volumeInfo.publishedDate.length >= 4) {
                                        publishedDate = book.volumeInfo.publishedDate.substr(0, 4);
                                    } else {
                                        //debugger;
                                    }
                                    ret.booklist.push({
                                        title: title,
                                        authors: authors,
                                        ISBN: lisbn,
                                        publish_year: publishedDate
                                    });
                                });
                                ret.error = false;
                                ret.message = "superagent - Treffer";
                                cbisbn12a(null, res, ret);
                                return;
                            }
                        });
                },

                function (res, ret, cbisbn12b) {
                    // Sonderfall: Titelsuche, wenn ISBN nicht vorgegeben war
                    if (typeof ret.book === "object" && Object.keys(ret.book).length > 0 ||
                        typeof ret.booklist === "object" && Object.keys(ret.booklist).length > 0) {
                        cbisbn12b(null, res, ret);
                        return;
                    }

                    // https://openlibrary.org/dev/docs/api/search
                    /*
                    {
                        "start": 0,
                        "num_found": 629,
                        "docs": [
                            {...},
                            {...},
                            ...
                            {...}]
                    }
                    und im Detail dann bei docs:
                    {
                        "cover_i": 258027,
                        "has_fulltext": true,
                        "edition_count": 120,
                        "title": "The Lord of the Rings",
                        "author_name": [
                            "J. R. R. Tolkien"
                        ],
                        "first_publish_year": 1954,
                        "key": "OL27448W",
                        "ia": [
                            "returnofking00tolk_1",
                            "lordofrings00tolk_1",
                            "lordofrings00tolk_0",
                        ],
                        "author_key": [
                            "OL26320A"
                        ],
                        "public_scan_b": true
                    }
                    Request:
                    http://openlibrary.org/search.json?q=the+lord+of+the+rings  wird genutzt
                    /search.json?q=harry%20potter&fields=*,availability&limit=1 wäre Extension der Response
                    TODO https://openlibrary.org/works/OL45883W.json wenn OL gegeben ist!!!
                    */
                    let apisearch = encodeURIComponent(ret.booksearch);
                    let url = "https://openlibrary.org/search.json";
                    request({
                        url: url,
                        method: 'GET',
                        data: {
                            q: ret.booksearch
                        }
                    }, function (err, res1, body) {
                        if (err !== null) {
                            console.log(err);
                            ret.error = true;
                            ret.message = err;
                            cbisbn12b(null, res, ret);
                            return;
                        } else {
                            if (typeof body === "string") {
                                body = JSON.parse(body);
                            }
                            // Extrakt übernehmen https://openlibrary.org/works/OL45883W.json
                            body.docs.forEach(function (book, ibook) {
                                let author_name = "";
                                if (typeof book.author_name === "string") {
                                    author_name = book.author_name;
                                } else if (typeof book.author_name === "object" && Array.isArray(book.author_name) && book.author_name.length > 0) {
                                    author_name = book.author_name.join("; ");
                                }
                                let lisbn = "";
                                if (typeof book.lisbn === "string") {
                                    lisbn = book.lisbn;
                                } else if (typeof book.lisbn === "object" && Array.isArray(book.lisbn) && book.lisbn.length > 0) {
                                    lisbn = book.lisbn.join(", ");
                                }
                                let publish_year = "";
                                if (typeof book.publish_year === "string") {
                                    publish_year = book.publish_year;
                                } else if (typeof book.publish_year === "object" && Array.isArray(book.publish_year) && book.publish_year.length > 0) {
                                    publish_year = book.publish_year.join(", ");
                                }
                                ret.booklist.push({
                                    title: book.title,
                                    author_name: author_name,
                                    ISBN: lisbn,
                                    publish_year: publish_year
                                });
                            });
                            if (ret.booklist.length > 0) {
                                ret.error = false;
                                ret.message = ret.booklist.length + " Bücher gefunden";
                                cbisbn12b(null, res, ret);
                                return;
                            } else {
                                ret.error = true;
                                ret.message = ret.booksearch + " Keine Bücher gefunden";
                                cbisbn12b(null, res, ret);
                                return;
                            }
                        }
                    });
                },

                function (res, ret, cbisbn12d) {
                    // Sonderfall: Titelsuche, wenn ISBN nicht vorgegeben war
                    if (typeof ret.book === "object" && Object.keys(ret.book).length > 0 ||
                        typeof ret.booklist === "object" && Object.keys(ret.booklist).length > 0) {
                        cbisbn12d(null, res, ret);
                        return;
                    }
                    let moresearch = true;
                    if (typeof ret.booklist === "object" && Array.isArray(ret.booklist)) {
                        ret.booklist.forEach(function (book, ibook) {
                            let bookkeys = Object.keys(book);
                            bookkeys.forEach(function (bookkey, ibookkey) {
                                if (bookkey.toLowerCase().indexOf("isbn") >= 0) {
                                    if (typeof book[bookkey] === "string" && book[bookkey].trim().length > 0) {
                                        moresearch = false;
                                        return false;
                                    }
                                    if (typeof book[bookkey] === "object" && Array.isArray(book[bookkey]) && book[bookkey].length > 0) {
                                        moresearch = false;
                                        return false;
                                    }
                                }
                            });
                            if (moresearch === false) {
                                return false;
                            }
                        });
                    } else {
                        ret.booklist = [];
                    }
                    if (moresearch === false) {
                        cbisbn12d(null, res, ret);
                        return;
                    }
                    // Prüfen, ob die Trefferliste ISBN's enthält, wenn nicht, dann hier weiter suchen
                    booksbytitle.search(ret.booksearch, function (error, results) {
                        if (!error) {
                            console.log(JSON.stringify(results));
                            ret.booklist = ret.booklist.concat(results);
                        } else {
                            console.log(error);
                        }
                        cbisbn12d(null, res, ret);
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
                if (typeof ret.book === "undefined" && (typeof ret.booklist === "undefined" || ret.booklist.length === 0)) {
                    // Fehlermeldung final
                    ret.error = true;
                    ret.message = "Kein Ergebnis " + ret.message;
                } else {
                    if (typeof ret.book === "object" && Object.keys(ret.book).length > 0) {
                        ret.error = false;
                        ret.message = "Buch gefunden " + (ret.message || "");
                    } else if (typeof ret.booklist === "object" && Array.isArray(ret.booklist) && ret.booklist.length > 0) {
                        // Fehlermeldung final
                        ret.error = false;
                        ret.message = "Bücher gefunden " + (ret.message || "");
                    }
                }
                cbisbn1(res, ret);
                return;
            });
    };


    /**
     * get100 - boxsearch als Vorgabe für 100 Bücher
     * Markierung beachten in MYBOOKSINFOS bookstatus <= 1
     * @param {*} rootdir 
     * @param {*} fs 
     * @param {*} async 
     * @param {*} req 
     * @param {*} reqparm
     * @param {*} res 
     * @param {*} cbisbn1 
     * callback mit function (res, ret) - returns ret.booklist !!!
     */
    mybooksutils.get100 = function (db, rootdir, fs, async, req, reqparm, res, cbbox1) {
        let boxsearch = ""; // "0735619670";
        if (req.body && typeof req.body.boxsearch === "string" && req.body.boxsearch.length > 0) {
            boxsearch = req.body.boxsearch;
        }

        async.waterfall(
            [
                function (cbbox10) {
                    let ret = {};
                    ret.boxsearch = boxsearch;
                    cbbox10(null, res, ret);
                    return;
                },

                function (res, ret, cbbox11) {
                    ret.boxsearch = boxsearch;
                    let reqparm = {};
                    reqparm.sel = "SELECT * FROM MYBOOKSINFOS";
                    reqparm.sel += " WHERE bookstatus <= 1";
                    if (typeof ret.boxsearch === "string" && ret.boxsearch.trim().length > 0) {
                        //reqparm.sel += " WHERE lower(bookbox) LIKE '%" + ret.boxsearch.toLowerCase() + "%'";
                        reqparm.sel += " AND bookbox = '" + ret.boxsearch + "'";
                    }
                    reqparm.sel += " ORDER BY bookbox, ISBN";
                    reqparm.limit = 100;
                    reqparm.skip = 0;
                    // TODO: Selektion auf den Status bookstatus - später, wenn die Felder angelegt sind
                    dbhelper.getallsqlrecords(db, async, null, reqparm, res, function (res, ret) {
                        cbbox11(null, res, ret);
                        return;
                    });
                }
            ],
            function (error, res, ret) {
                console.log(ret.booksearch + " finished");
                if (typeof ret.booklist === "object" && Array.isArray(ret.booklist) && ret.booklist.length > 0) {
                    // Fehlermeldung final
                    ret.error = false;
                    ret.message = "Bücher gefunden " + (ret.message || "");
                }
                cbbox1(res, ret);
                return;
            });
    };


    /**
     * set100 - Bücker markieren auf bookstatus 1
     * gemäß ISBN und bookbox
     * @param {*} rootdir 
     * @param {*} fs 
     * @param {*} async 
     * @param {*} req 
     * @param {*} reqparm
     * @param {*} res 
     * @param {*} cbisbn1 
     * callback mit function (res, ret) - returns ret.booklist !!!
     */
    mybooksutils.set100 = function (db, rootdir, fs, async, req, reqparm, res, cbbox3) {
        let books100 = ""; // "0735619670";
        if (req.body && typeof req.body.books100 === "string" && req.body.books100.length > 0) {
            books100 = JSON.parse(req.body.books100);
        } else if (req.body && typeof req.body.books100 === "object" && req.body.books100.length > 0) {
            books100 = req.body.books100;
        }
        async.waterfall(
            [
                function (cbbox30) {
                    req.ret = {};
                    let ret = req.ret;
                    ret.books100 = books100;
                    cbbox30(null, res, ret);
                    return;
                },
                function (res, ret, cbbox31) {
                    async.eachSeries(ret.books100, function (book, nextbook) {
                        let ISBN = book.ISBN;
                        let bookbox = book.bookbox;

                        let selfields = {};
                        let insfields = {};
                        let updfields = {};
                        selfields.ISBN = ISBN;
                        selfields.bookbox = bookbox;
                        insfields.ISBN = ISBN;
                        insfields.bookbox = bookbox;
                        updfields.bookstatus = 1;
                        updfields.bookprice = "";
                        updfields.bookpriceisoday = "";
                        updfields.bookreseller = "rebuy";
                        let reqparm = {};
                        reqparm.selfields = dbhelper.cloneObject(selfields);
                        reqparm.insfields = dbhelper.cloneObject(insfields);
                        reqparm.updfields = dbhelper.cloneObject(updfields);
                        reqparm.table = "MYBOOKSINFOS";
                        console.log("MYBOOKSINFOS-status-UPD-started " + book.ISBN);
                        dbhelper.setonerecord(db, async, null, reqparm, res, function (res, ret1) {
                            console.log("MYBOOKSINFOS-status-UPD-ended " + book.ISBN + " " + book.bookbox);
                            ret.error = ret1.error;
                            ret.message += " " + book.ISBN + " " + ret1.error;
                            nextbook(null, res, ret);
                            return;
                        });
                    },
                     function(err) {
                        cbbox31 (null, res, ret);
                        return;
                    });
                }
            ],
            function (error, res, ret) {
                cbbox3(res, ret);
                return;    
            });

    };




    /**
     * setofferings
     * @param {*} db 
     * @param {*} rootdir 
     * @param {*} fs 
     * @param {*} async 
     * @param {*} req 
     * @param {*} reqparm 
     * @param {*} res 
     * @param {*} cboff1 
     * return res, ret
     * 
     */
    mybooksutils.setofferings = function (db, rootdir, fs, async, req, reqparm, res, cboff1) {
        async.waterfall([
                function (cboff10) {
                    let results = req.body.results;
                    if (typeof results === "string") {
                        results = JSON.parse(results);
                    }
                    req.ret = {};
                    let ret = req.ret;
                    ret.error = false;
                    ret.message = "";
                    ret.results = results;
                    cboff10(null, res, ret);
                    return;
                },
                function (res, ret, cboff10a) {
                    // Laden alle ISBN's, die in MYBOOKSINFOS vorhanden sind nach ret.ISBNs[i]
                    let reqparm = {};
                    ret.ISBNs = [];
                    ret.bookboxes = [];
                    reqparm.sel = "SELECT ISBN, bookbox, bookstatus, bookprice FROM MYBOOKSINFOS";
                    reqparm.sel += " WHERE bookstatus <= 1";
                    reqparm.sel += " ORDER BY ISBN";
                    // TODO: bookstatus = 1 später bzw. >=1 noch zu durchdenken
                    dbhelper.getallsqlrecords(db, async, null, reqparm, res, function (res, ret1) {
                        if (ret1.error === false && typeof ret1.records === "object" && Array.isArray(ret1.records) && ret1.records.length > 0) {
                            ret1.records.forEach(function (record, irec) {
                                ret.ISBNs.push(record.ISBN);
                                ret.bookboxes.push(record.bookbox);
                            });
                        }
                        cboff10a(null, res, ret);
                        return;
                    });
                },
                function (res, ret, cboff11) {
                    if (typeof ret.results === "object" && ret.results !== null) {
                        //for (let i = 0; i < results.length; i++) {
                        async.eachSeries(ret.results, function (result, nextresult) {
                                console.log(result);
                                // hier können die Daten fortgeschrieben werden
                                // {ISBN: 'Bücher;EAN/ISBN: 3839212022, 9783839212028;', price: '0,22 €;'}
                                let ISBNtext = result.ISBN;
                                let pricetext = result.price;
                                // parsen
                                let re1 = /[A-Za-z0-9]+/g;
                                let found1 = ISBNtext.match(re1);
                                //[0-9]+,[0-9]+
                                if (pricetext === "nobuy" || pricetext === "unknown" ) {
                                    ret.price = pricetext;
                                    ret.bookstatus = 3;
                                } else {
                                    let re2 = /[0-9]+,[0-9]+/g;
                                    let found2 = pricetext.match(re2);
                                    ret.price = found2[0];
                                    ret.bookstatus = 2;
                                }
                                ret.ISBN = "";
                                ret.bookbox = "";
                                for (let j = 0; j < found1.length; j++) {
                                    if (genhelper.isISBN(found1[j]) === true) {
                                        // check gegen ret.ISBNs
                                        let ISBNindex = ret.ISBNs.indexOf(found1[j]);
                                        if (ISBNindex >= 0) {
                                            ret.ISBN = found1[j].trim();
                                            ret.bookbox = ret.bookboxes[ISBNindex];
                                            break;
                                        }
                                    }
                                }
                                if (ret.ISBN.length > 0) {
                                    // Update auf BOOKSINFOS - mit "richtiger ISBN"
                                    ret.message += ret.ISBN + ",";
                                    let selfields = {};
                                    let insfields = {};
                                    let updfields = {};
                                    selfields.ISBN = ret.ISBN;
                                    selfields.bookbox = ret.bookbox;
                                    insfields.ISBN = ret.ISBN;
                                    insfields.bookbox = ret.bookbox;
                                    updfields.bookprice = ret.price;
                                    updfields.bookstatus = ret.bookstatus;
                                    updfields.bookpriceisoday = new Date().toISOString().substr(0, 10);
                                    updfields.bookreseller = "rebuy";
                                    let reqparm = {};
                                    reqparm.selfields = dbhelper.cloneObject(selfields);
                                    reqparm.insfields = dbhelper.cloneObject(insfields);
                                    reqparm.updfields = dbhelper.cloneObject(updfields);
                                    reqparm.table = "MYBOOKSINFOS";
                                    console.log("MYBOOKSINFOS-price-UPD-started " + ret.ISBN);
                                    dbhelper.setonerecord(db, async, null, reqparm, res, function (res, ret1) {
                                        console.log("MYBOOKSINFOS-price-UPD-ended " + ret.ISBN +  " " + ret1.message);
                                        ret.error = ret1.error;
                                        ret.message += " " + ret1.message;
                                        nextresult(null, res, ret);
                                        return;
                                    });
                                } else {
                                    ret.message += " " + ret.ISBN + " not found with " + ret.bookbox;
                                    nextresult(null, res, ret);
                                    return;
                                }
                            },
                            function (error) {
                                if (error === null) {
                                    cboff11(null, res, ret);
                                    return;
                                } else {
                                    let ret = {
                                        error: false,
                                        message: error
                                    };
                                    cboff11(null, res, ret);
                                    return;
                                }
                            });
                    } else {
                        let ret = {
                            error: true,
                            message: "nichts gefunden"
                        };
                        cboff11(null, res, ret);
                        return;
                    }
                }
            ],
            function (error, res, ret) {
                cboff1(res, ret);
                return;
            });
    };


    /**
     * initofferings - Initalisieren alle MYBOOKSINFOS für offerings!!!
     * @param {*} db 
     * @param {*} rootdir 
     * @param {*} fs 
     * @param {*} async 
     * @param {*} req 
     * @param {*} reqparm 
     * @param {*} res 
     * @param {*} cboff1 
     * return res, ret
     * 
     */
    mybooksutils.initofferings = function (db, rootdir, fs, async, req, reqparm, res, cboff2) {

        async.waterfall([
                function (cboff20) {
                    req.ret = {};
                    let ret = req.ret;
                    cboff20(null, res, ret);
                    return;
                },
                function (res, ret, cboff21) {
                    let reqparm = {};
                    reqparm.sel = "SELECT * FROM MYBOOKSINFOS";
                    reqparm.sel += " ORDER BY bookbox, ISBN";
                    dbhelper.getallsqlrecords(db, async, null, reqparm, res, function (res, ret1) {
                        ret.records = ret1.records;
                        cboff21(null, res, ret);
                        return;
                    });
                },
                function (res, ret, cboff22) {
                    async.eachSeries(ret.records, function (record, nextrecord) {
                            let selfields = {};
                            let insfields = {};
                            let updfields = {};
                            selfields.ISBN = record.ISBN;
                            selfields.bookbox = record.bookbox;
                            insfields.ISBN = record.ISBN;
                            insfields.bookbox = record.bookbox;

                            updfields.bookprice = 0;
                            updfields.bookstatus = 0;
                            updfields.bookpriceisoday = "";
                            updfields.bookreseller = "";
                            let reqparm = {};
                            reqparm.selfields = dbhelper.cloneObject(selfields);
                            reqparm.insfields = dbhelper.cloneObject(insfields);
                            reqparm.updfields = dbhelper.cloneObject(updfields);
                            reqparm.table = "MYBOOKSINFOS";
                            dbhelper.setonerecord(db, async, null, reqparm, res, function (res, ret1) {
                                ret.error = ret1.error;
                                ret.message += " " + ret1.message;
                                nextrecord(null, res, ret);
                                return;
                            });
                        },
                        function (error) {
                            cboff22(null, res, ret);
                            return;
                        });
                }
            ],
            function (error, res, ret) {
                cboff2(res, ret);
                return;
            });
    };





    /**
     * putinfobyisbn - isbn oder Titel als Vorgabe
     * erst prüfen, ob schon in der Datenbank,
     * wenn nicht, dann über API die Daten holen bzw. suchen
     * @param {*} rootdir 
     * @param {*} fs 
     * @param {*} async 
     * @param {*} req 
     * @param {*} reqparm
     * @param {*} res 
     * @param {*} cbisbn2 
     * callback mit function (res, ret)
     */
    mybooksutils.putinfobyisbn = function (db, rootdir, fs, async, req, reqparm, res, cbisbn2) {
        let username = "anonymous";
        if (req.body && typeof req.body.username === "string" && req.body.username.length > 0) {
            username = req.body.username;
        }

        let isbn = ""; // "0735619670";
        if (req.body && typeof req.body.isbn === "string" && req.body.isbn.length > 0) {
            isbn = req.body.isbn;
        }

        let bookbox = "Box 1";
        if (req.body && typeof req.body.bookbox === "string" && req.body.bookbox.length > 0) {
            bookbox = req.body.bookbox;
        }

        let bookcomment = "";
        if (req.body && typeof req.body.bookcomment === "string" && req.body.bookcomment.length > 0) {
            bookcomment = req.body.bookcomment;
        }

        let booktitle = "";
        if (req.body && typeof req.body.booktitle === "string" && req.body.booktitle.length > 0) {
            booktitle = req.body.booktitle;
        }

        let booksubtitle = "";
        if (req.body && typeof req.body.booksubtitle === "string" && req.body.booksubtitle.length > 0) {
            booksubtitle = req.body.booksubtitle;
        }

        async.waterfall(
            [
                function (cbisbn20) {
                    let ret = {};
                    ret.username = username;
                    ret.isbn = isbn;
                    ret.bookbox = bookbox;
                    ret.bookcomment = bookcomment;
                    ret.booktitle = booktitle;
                    ret.booksubtitle = booksubtitle;
                    cbisbn20(null, res, ret);
                    return;
                },
                function (res, ret, cbisbn24) {
                    // Aufbereiten der Ausgabe MYBOOKSINFOS mit box und comment zur ISBN mit title
                    console.log(ret.booksearch + " upsert MYBOOKSINFOS");
                    let selfields = {};
                    let insfields = {};
                    let updfields = {};
                    selfields.ISBN = ret.isbn;
                    insfields.ISBN = ret.isbn;
                    updfields.username = ret.username;
                    updfields.title = ret.booktitle || "";
                    updfields.subtitle = ret.booksubtitle || "";
                    updfields.bookbox = ret.bookbox;
                    updfields.bookcomment = ret.bookcomment;
                    updfields.bookprice = "";
                    updfields.bookstatus = 0;
                    updfields.bookpriceday = "";
                    updfields.bookreseller = "";
                    let reqparm = {};
                    reqparm.selfields = dbhelper.cloneObject(selfields);
                    reqparm.insfields = dbhelper.cloneObject(insfields);
                    reqparm.updfields = dbhelper.cloneObject(updfields);
                    reqparm.table = "MYBOOKSINFOS";
                    dbhelper.setonerecord(db, async, null, reqparm, res, function (res, ret1) {
                        ret.error = ret1.error;
                        ret.message = ret1.message;
                        cbisbn24(null, res, ret);
                        return;
                    });
                }
            ],
            function (error, res, ret) {
                console.log(ret.isbn + " Kommentar erfasst");
                cbisbn2(res, ret);
                return;
            });
    };


    /**
     * putdatabyisbn - isbn oder Titel als Vorgabe
     * erst prüfen, ob schon in der Datenbank,
     * wenn nicht, dann über API die Daten holen bzw. suchen
     * @param {*} rootdir 
     * @param {*} fs 
     * @param {*} async 
     * @param {*} req 
     * @param {*} reqparm
     * @param {*} res 
     * @param {*} cbisbn3 
     * callback mit function (res, ret)
     */
    mybooksutils.putdatabyisbn = function (db, rootdir, fs, async, req, reqparm, res, cbisbn3) {
        let selfields = {};
        if (req.body && typeof req.body.selfields === "object") {
            selfields = req.body.selfields;
        }

        let insfields = {};
        if (req.body && typeof req.body.insfields === "object") {
            insfields = req.body.insfields;
        }

        let updfields = {};
        if (req.body && typeof req.body.updfields === "object") {
            updfields = req.body.updfields;
        }
        let table = "MYBOOKS";

        async.waterfall(
            [
                function (cbisbn30) {
                    let ret = {};
                    cbisbn30(null, res, ret);
                    return;
                },
                function (res, ret, cbisbn34) {
                    // Aufbereiten der Ausgabe MYBOOKSINFOS mit box und comment zur ISBN mit title
                    console.log(selfields.ISBN + " upsert MYBOOKS");
                    let reqparm = {};
                    reqparm.selfields = dbhelper.cloneObject(selfields);
                    reqparm.insfields = dbhelper.cloneObject(insfields);
                    reqparm.updfields = dbhelper.cloneObject(updfields);
                    reqparm.table = "MYBOOKS";
                    dbhelper.setonerecord(db, async, null, reqparm, res, function (res, ret1) {
                        ret.error = ret1.error;
                        ret.message = ret1.message;
                        cbisbn34(null, res, ret);
                        return;
                    });
                }
            ],
            function (error, res, ret) {
                console.log(selfields.ISBN + " Daten geändert");
                cbisbn3(res, ret);
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