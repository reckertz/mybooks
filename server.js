/*jshint laxbreak:true,evil:true, sub:true */
/*jslint node:true */
/*global module,process,require,define,root,global,self,this,console,alert */
/*global sysbase,__dirname,window,console */
"use strict";

let express = require('express');

let bodyParser = require('body-parser');

let fs = require("fs");
let path = require("path");
let async = require("async");

let dbhelper = require("./dbhelper.js");

let sqlite3 = require('sqlite3');
let db = null;
let dbfilename = "";

async.waterfall(
    [
        function (cb101) {
            dbfilename = path.join(__dirname, 'data', 'mybooks.db3');
            if (fs.existsSync(dbfilename)) {
                //file exists
                console.log(dbfilename + " found");
                cb101(null, {
                    error: false,
                    message: dbfilename + " found",
                    dbfilename: dbfilename
                });
                return;
            } else {
                console.log(dbfilename + " not found, will be created automatically");
                cb101(null, {
                    error: false,
                    message: "not found " + dbfilename,
                    dbfilename: dbfilename
                });
                return;
            }
        },
        function (ret, cb200) {
            try {
                db = new sqlite3.Database(ret.dbfilename);
                db.run("PRAGMA case_sensitive_like = false;", function (err) {
                    if (err === null) {
                        console.log("PRAGMA case_sensitive_like=false;");
                    } else {
                        console.log("PRAGMA case_sensitive_like=false:" + err);
                    }
                });
                ret.message = "db assigned";
                cb200(null, ret);
                return;
            } catch (err) {
                ret.error = true;
                ret.message = err;
                cb200("error", ret);
                return;
            }
        },
        // Notoperationen KLISAMPLEMASTER, KLISAMPLESTAT, KLISAMPLEREF
        /*
        function (ret, cb102) {
            dbhelper.removeTable(db, "KLISAMPLEMASTER", function (ret1) {
                cb102(null, ret);
                return;
            });
        },
        */
        function (ret, cb199) {
            cb199("Finish", ret);
            return;
        }
    ],
    function (error, result) {
        if (error === "error") {
            console.log("*****************************************************");
            console.log(result.message + " " + error);
            console.log("*****************************************************");
        } else {
            console.log(result.dbfilename + " " + result.message);
        }
    }
);


let mybooksutils = require("./mybooksutils.js");

let app = express();

app.use(bodyParser.json({
    limit: '150mb',
    parameterLimit: 100000,
    extended: true
}));

app.use(bodyParser.urlencoded({
    limit: '150mb',
    extended: true,
    parameterLimit: 100000
}));

app.use(function (req, res, next) {
    console.log("REQUEST: " + req.protocol + "://" + req.headers.host + " path: " + req.path);
    if (req.path.startsWith("/node_modules")) {
        console.log("1-" + path.resolve(__dirname + req.path));
        res.sendFile(path.resolve(__dirname + req.path));
        return;
    } else if (req.path === "/") {
        res.sendFile(path.resolve("public/index.html"));
        return;
    }
    next();
});

app.use(express.static(path.join(__dirname, 'public')));

/**
 * getbyisbn - Buchdaten mit isbn holen
 */
app.post('/getbyisbn', function (req, res) {
    var timeout = 100 * 60 * 1000; // hier: gesetzter Default
    if (req.query && typeof req.query.timeout !== "undefined" && req.query.timeout.length > 0) {
        timeout = req.query.timeout;
        req.setTimeout(parseInt(timeout));
    }
    var rootdir = __dirname;
    mybooksutils.getbyisbn(db, rootdir, fs, async, req, null, res, function (res, ret) {
        // in ret liegen error, message und record
        var smsg = JSON.stringify(ret);
        res.writeHead(200, {
            'Content-Type': 'application/text',
            "Access-Control-Allow-Origin": "*"
        });
        res.end(smsg);
        return;
    });
});


/**
 * getallrecords - eingeschränkt generischer SQL-SELECT
 */
 app.get('/getallrecords', function (req, res) {
    var timeout = 10 * 60 * 1000; // hier: gesetzter Default
    if (req.query && typeof req.query.timeout !== "undefined" && req.query.timeout.length > 0) {
        timeout = req.query.timeout;
        req.setTimeout(parseInt(timeout));
    }
    // var rootdir = path.dirname(require.main.filename);
    dbhelper.getallsqlrecords(db, async, req, null, res, function (res, ret) {
        // in ret liegen error, message und record
        var smsg = JSON.stringify(ret);
        res.writeHead(200, {
            'Content-Type': 'application/text',
            "Access-Control-Allow-Origin": "*"
        });
        res.end(smsg);
        return;
    });
});



/**
 * getsql3tablesx - API - Sammlung der Tabellen und Felder einer Datenbank,
 * gleiche Rückgabestruktur - wird spannend
 */

 app.get('/getsql3tablesx', function (req, res) {
    try {
        var sqlStmt = "SELECT name";
        sqlStmt += " FROM sqlite_master";
        sqlStmt += " WHERE type ='table'";
        sqlStmt += " AND name NOT LIKE 'sqlite_%'";
        var tabletree = [];
        var rootobj = {
            text: "Tabellen",
            state: {
                selected: true,
                opened: true
            },
            a_attr: {
                tablename: "all"
            },
            children: []
        };
        db.serialize(function () {
            db.all(sqlStmt, function (err, rows) {
                var ret = {};
                if (err) {
                    ret.error = true;
                    ret.message = err;
                } else {
                    ret.error = false;
                    ret.message = "Tabellen gefunden:" + rows.length;
                    ret.records = rows;
                    async.eachSeries(rows, function (row, nextrow) {
                            var newobj = {
                                text: row.name,
                                state: {
                                    selected: false
                                },
                                a_attr: {
                                    tablename: row.name
                                },
                                children: []
                            };
                            // Satzbeschreibung holen
                            db.all("PRAGMA table_info('" + row.name + "')", function (err, felder) {
                                if (typeof felder === "undefined" || felder === null || felder.length === 0) {
                                    console.log("Tabelle " + row.name + " nicht vorhanden");
                                } else {
                                    for (var ifeld = 0; ifeld < felder.length; ifeld++) {
                                        var feld = felder[ifeld];
                                        var newfld = {
                                            text: feld.name + "(" + feld.type + ")",
                                            state: {
                                                selected: false
                                            },
                                            a_attr: {
                                                name: feld.name,
                                                type: feld.type
                                            },
                                            "icon": "jstree-file"
                                        };
                                        newobj.children.push(newfld);
                                    }
                                    rootobj.children.push(newobj);
                                    nextrow();
                                }
                            });
                        },
                        function (error) {
                            tabletree.push(rootobj);
                            ret.tabletree = tabletree;
                            var smsg = JSON.stringify(ret);
                            res.writeHead(200, {
                                'Content-Type': 'application/text',
                                "Access-Control-Allow-Origin": "*"
                            });
                            res.end(smsg);
                            return;
                        });
                }
            });
        });
    } catch (err) {
        res.writeHead(200, {
            'Content-Type': 'application/text',
            "Access-Control-Allow-Origin": "*"
        });
        res.end(JSON.stringify({
            error: true,
            message: err.message,
            records: null
        }));
        return;
    }
});



app.listen(3000, function () {

    console.log('Example app listening on port 3000!');

});