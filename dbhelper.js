/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*jslint white:true, browser:true, devel:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper */
/*global uientry,planetaryjs, */

(function () {
    "use strict";
    //
    let dbhelper = {};
    let root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global) || this;

    let perftimer = {};
    perftimer.sor = {};
    let sorcount = 0;

    let gblInfo = {};
    dbhelper.getInfo = function () {
        return gblInfo;
    };

    /**
     * deep copy für Objekte, Arrays etc.
     * https://www.codementor.io/avijitgupta/deep-copying-in-js-7x6q8vh5d
     */
     dbhelper.cloneObject = function (o) {
        if (o === null) {
            return null;
        } 
        var output, v, key;
        output = Array.isArray(o) ? [] : {};
        for (key in o) {
            if (key.startsWith("_")) {
                console.log("Problem1:" + key);
                continue;
            }
            if (o.hasOwnProperty(key)) {
                v = o[key];
                output[key] = (typeof v === "object") ? dbhelper.cloneObject(v) : v;
            } else {
                console.log("Problem2:" + key);
                continue;
            }
        }
        return output;
    };



    
    /**
     * setonerecord - adaptive Datenfortschreibung mit JSON-Vorgaben in den Parametern
     * table, selfields, insfields und updfields, vorausgesetzt wird:
     * selfieds hat name-value pairs, die in UND/=-Direktiven umgesetzt werden
     * insfields entspricht bei insert gewöhnlich selfields, kann aber auch mehr Felder haben
     * updfields hat die ergänzenden Felder für insert und update
     * für name-value pairs, typeof object wird mit JSON.stringify in einen String konvertiert
     * die Funktion prüft zuerst, ob die Zieltabelle vorhanden ist und legt sie mit
     * CREATE TABLE an, wenn dies erforderlich ist.
     * TODO:
     * 1. CREATE INDEX aus selfields ableiten und
     * 2. ALTER TABLE für neue Felder, die noch nicht in der Feldbeschreibung enthalten sind,
     * vorhandene Felder werden abgefragt mit PRAGMA table_info(table-name);
     * diese Feldlisten können in einen globalen Cache genommen werden, um wieder verwendet zu werden
     * @param db - SQLite3 Datenbank, zugewiesen
     * @param async - Standardbibliothek
     * @param req - hat selfields, insfields und updfields sowie table für Aufruf aus dem Client (über server.js etc)
     * @param reqparm - hat selfields, updfields und table für Aufruf innerhalb des Servers
     * @param res - response-Objekt, wird einfach durchgereicht in callback
     * @param callback returns res, ret
     */
     dbhelper.setonerecord = function (db, async, req, reqparm, res, callbacksor) {
        /**
         * Prüfen, welche Parameter vorliegen, dann zugreifen
         * username und firma sind auch verfügbar
         */
        let ret = {};
        sorcount++;
        ret.sorcount = sorcount;
        ret.startts = new Date();
        perftimer.sor.start = new Date();
        let selfields = {};
        let insfields = {};
        let updfields = {};
        let table = "";
        let firma = "";
        if (typeof req !== "undefined" && req !== null) {
            if (req.body && typeof req.body.selfields !== "undefined" && req.body.selfields.length > 0) {
                selfields = JSON.parse(req.body.selfields);
            }
            if (req.body && typeof req.body.insfields !== "undefined" && req.body.insfields.length > 0) {
                insfields = JSON.parse(req.body.insfields);
            }
            if (req.body && typeof req.body.updfields !== "undefined" && req.body.updfields.length > 0) {
                updfields = JSON.parse(req.body.updfields);
            }
            if (req.body && typeof req.body.table !== "undefined" && req.body.table.length > 0) {
                table = req.body.table;
            }
            if (req.body && typeof req.body.firma !== "undefined" && req.body.firma.length > 0) {
                firma = req.body.firma;
            }
        } else {
            if (reqparm && typeof reqparm.selfields !== "undefined") {
                selfields = reqparm.selfields;
            }
            if (reqparm && typeof reqparm.insfields !== "undefined") {
                insfields = reqparm.insfields;
            }
            if (reqparm && typeof reqparm.updfields !== "undefined") {
                updfields = reqparm.updfields;
            }
            if (reqparm && typeof reqparm.table !== "undefined" && reqparm.table.length > 0) {
                table = reqparm.table;
            }
            if (reqparm && typeof reqparm.firma !== "undefined" && reqparm.firma.length > 0) {
                firma = reqparm.firma;
            }
        }
        // console.log("updfields-raw:" + JSON.stringify(updfields, null, " "));
        if (table === "MYBOOKS") {
            //debugger;
        }

        //try {
        if (db === null) {
            ret.error = true;
            ret.message = "setonerecord ERROR:" + "Keine Datenbank übergeben";
            ret.record = null;
            console.log("ABBRUCH-ERROR-keine Datenbank");
            callbacksor(res, ret);
            return;
        }

        updfields.tsserverupd = new Date().toISOString();
        updfields.iostatus = 1;

        //console.log("SEL:" + JSON.stringify(selfields, null, " "));
        //console.log("UPD:" + JSON.stringify(updfields, null, " "));
        /**
         * Absichern - Object stringify zu string
         * not allowed in selfields and insfields!!!
         */
        for (let property in updfields) {
            if (updfields.hasOwnProperty(property)) {
                if (typeof updfields[property] === "object") {
                    let fstring = JSON.stringify(updfields[property]);
                    updfields[property] = fstring;
                }
            }
        }
        for (let property in insfields) {
            if (insfields.hasOwnProperty(property)) {
                if (typeof insfields[property] === "object") {
                    let fstring1 = JSON.stringify(insfields[property]);
                    insfields[property] = fstring1;
                }
            }
        }

        /**
         * Erzeugen Update-Statement - upsert = true ist default und wird beachtet
         */
        let allfields = {};
        allfields = Object.assign({}, selfields);
        allfields = Object.assign(allfields, insfields);
        allfields = Object.assign(allfields, updfields);
        let sorparms = {
            table: table,
            selfields: selfields,
            insfields: insfields,
            updfields: updfields,
            allfields: allfields
        };
        db.serialize(function () {
            async.waterfall([
                function (callback210) {
                    // Lesen des evtl. vorhandenen Satzes
                    // SELECT konstruieren
                    let ret = {};
                    ret.error = false;
                    ret.message = "";
                    ret.sorparms = sorparms;
                    ret.sorcount = sorcount;
                    let sqlStmt = "";
                    let sel = sorparms.selfields;
                    let conds = Object.keys(sel);
                    let where = "";
                    for (let icond = 0; icond < conds.length; icond++) {
                        let condval = sel[conds[icond]];
                        if (typeof condval === "number") {
                            if (where.length > 0) where += " AND ";
                            where += conds[icond];
                            where += " = " + condval;
                        } else if (typeof condval === "string") {
                            if (where.length > 0) where += " AND ";
                            where += conds[icond];
                            where += " = " + "'" + condval + "'";
                        // TODO boolean oder bool in der Zukunft auch, evtl. isodate
                        } else {
                            // Dickes Problem!!!
                            ret.error = true;
                            ret.message += "WHERE zu komplex:" + JSON.stringify(sel);
                            callback210("Error", res, ret);
                            return;
                        }
                    }
                    if (where.length > 0) {
                        sqlStmt += "SELECT * ";
                        sqlStmt += " FROM " + ret.sorparms.table;
                        sqlStmt += " WHERE " + where;
                    }
                    db.get(sqlStmt, function (err, row) {
                        perftimer.sor.SELECT = new Date() - perftimer.sor.start;
                        perftimer.sor.start = new Date();
                        ret.alter = false;
                        /**
                         * Eine Fehlermeldung kann aus der WHERE-Klausel kommen oder aus fehlender Tabelle
                         * das wird hier nicht differenziert!
                         * also erst mal die Existenz abfragen!
                         */
                        if (err) {
                            // wenn Tabelle nicht vorhanden, dann CREATE TABLE
                            if (err.message.indexOf("SQLITE_ERROR: no such table:") >= 0) {
                                console.log(err.message);
                            }
                            ret.createTable = true;
                            ret.insert = true;
                            ret.update = false;
                        } else {
                            ret.createTable = false;
                            if (typeof row !== "undefined" && row !== null) {
                                ret.insert = false;
                                ret.update = true;
                                ret.oldrecord = row;
                            } else {
                                ret.insert = true;
                                ret.update = false;
                            }
                        }
                        if (err) {
                            ret.message += " SELECT:" + err.message;
                        } else if (row === null) {
                            ret.message += " SELECT:" + ret.sorparms.table + " not found";
                        } else {
                            ret.message += " " + ret.sorparms.table + " selected";
                        }
                        callback210(null, res, ret);
                        return;
                    });
                },
                function (res, ret, callback210a1) {
                    /**
                     * Es ist zu prüfen, ob der error wegen fehlender Tabelle oder fehlendem Feld kam
                     */
                    if (ret.createTable === false) {
                        callback210a1(null, res, ret);
                        return;
                    }
                    // SELECT name FROM sqlite_master WHERE type='table' AND name='yourTableName';
                    let metaStmt = "SELECT name FROM sqlite_master WHERE type='table' AND name='" + table + "';";
                    db.get(metaStmt, function (err, row) {
                        if (err) {
                            ret.alter = false;
                            ret.createTable = true;
                            ret.insert = true;
                            ret.update = false;
                        } else {
                            if (typeof row === "undefined" || row === null || row < 1) {
                                ret.alter = false;
                                ret.createTable = true;
                                ret.insert = true;
                                ret.update = false;
                            } else {
                                ret.alter = true;
                                ret.createTable = false;
                            }
                        }
                        callback210a1(null, res, ret);
                        return;
                    });
                },
                function (res, ret, callback210a) {
                    // optional CREATE TABLE
                    if (ret.createTable === false) {
                        callback210a(null, res, ret);
                        return;
                    }
                    /*
                        CREATE TABLE bench (key VARCHAR(32), value TEXT)
                    */
                    let createStmt = "CREATE TABLE IF NOT EXISTS";
                    createStmt += " " + ret.sorparms.table;
                    createStmt += " (";
                    let baserecord = ret.sorparms.allfields;
                    let varlist = "";
                    let vallist = "";
                    for (let property in baserecord) {
                        if (baserecord.hasOwnProperty(property)) {
                            createStmt += " " + property;
                            let ptype = typeof baserecord[property];
                            let pvalue = baserecord[property];
                            varlist += property + ",";
                            if (ptype === "object") {
                                createStmt += " TEXT,";
                                vallist += JSON.stringify(pvalue) + ",";
                            } else if (ptype === "string") {
                                createStmt += " TEXT,";
                                vallist += "'" + pvalue.replace(/'/g, "''") + "',";
                            } else if (ptype === "number") {
                                createStmt += " FLOAT,";
                                vallist += pvalue + ",";
                            } else if (ptype === "boolean") {
                                createStmt += " TEXT,";
                                vallist += pvalue + ",";
                            } else {
                                createStmt += " TEXT,";
                                if (pvalue === null) {
                                    vallist += "null,";
                                } else {
                                    vallist += pvalue + ",";
                                }
                            }
                        }
                    }
                    // letztes Komma weg
                    if (createStmt.lastIndexOf(",") > 0) createStmt = createStmt.slice(0, -1);
                    createStmt += ')';
                    if (varlist.lastIndexOf(",") > 0) varlist = varlist.slice(0, -1);
                    if (vallist.lastIndexOf(",") > 0) vallist = vallist.slice(0, -1);
                    console.log(createStmt);
                    db.run(createStmt, function (err) {
                        
                        perftimer.sor.CREATE = new Date() - perftimer.sor.start;
                        perftimer.sor.start = new Date();
                        /**
                         * TODO: Indices Anlegen wäre noch gut aus selfields und für tsserver
                         * CREATE INDEX IF NOT EXISTS ind1_KLISTATIONS ON KLISTATIONS(tsserverrupd)
                         */
                        if (err) {
                            console.log("CREATE TABLE:" + err);
                            ret.message += " CREATE TABLE:" + err.message;
                            callback210a("Error", res, ret);
                            return;
                        } else {
                            console.log("CREATE TABLE successfull");
                            ret.message += " " + ret.sorparms.table + " created";
                            let indFields = "";
                            for (let field in ret.sorparms.selfields) {
                                if (ret.sorparms.selfields.hasOwnProperty(field)) {
                                    if (indFields.length > 0) indFields += ", ";
                                    indFields += field;
                                }
                            }
                            if (indFields.length > 0) {
                                let indrnd = "T" + Math.floor(Math.random() * 100000) + 1;
                                let createInd = "CREATE INDEX IF NOT EXISTS ";
                                createInd += " ind" + indrnd + "_" + ret.sorparms.table;
                                createInd += " ON " + ret.sorparms.table + "(";
                                createInd += indFields;
                                createInd += ")";
                                db.run(createInd, function (err) {
                                    perftimer.sor.CREATEIND = new Date() - perftimer.sor.start;
                                    perftimer.sor.start = new Date();
                                    callback210a(null, res, ret);
                                    return;
                                });
                            } else {
                                callback210a(null, res, ret);
                                return;
                            }
                        }
                    });
                },

                function (res, ret, callback210c) {
                    // check new fields - wenn Tabelle nicht neu ist
                    let mycache = dbhelper.getInfo();
                    if (ret.createTable === true) {
                        // cache immer aufbauen bei neuer Tabelle
                        mycache.tables = {};
                        let acttable = ret.sorparms.table;
                        mycache.tables[acttable] = {};
                        let allfields = Object.keys(ret.sorparms.allfields);
                        for (let ifield = 0; ifield < allfields.length; ifield++) {
                            let fieldname = allfields[ifield];
                            let fieldtype = typeof ret.sorparms.allfields[fieldname];
                            mycache.tables[acttable][fieldname] = fieldtype;
                        }
                        callback210c(null, res, ret);
                        return;
                    } else {
                        // hier wird es ernst
                        if (typeof mycache.tables === "undefined") {
                            mycache.tables = {};
                        }
                        let acttable = ret.sorparms.table;
                        if (typeof mycache.tables[acttable] === "undefined") {
                            mycache.tables[acttable] = {};
                            db.all("PRAGMA table_info ('" + ret.sorparms.table + "')", function (err, fields) {
                                perftimer.sor.PRAGMATI = new Date() - perftimer.sor.start;
                                perftimer.sor.start = new Date();
                                if (err === null) {
                                    for (let ifield = 0; ifield < fields.length; ifield++) {
                                        let name = fields[ifield].name;
                                        let type = fields[ifield].type;
                                        mycache.tables[acttable][name] = type;
                                    }
                                }
                                callback210c(null, res, ret);
                                return;
                            });
                        } else {
                            callback210c(null, res, ret);
                            return;
                        }
                    }
                },

                function (res, ret, callback210d) {
                    if (ret.createTable === true) {
                        callback210d(null, res, ret);
                        return;
                    }
                    let acttable = ret.sorparms.table;
                    let mycache = dbhelper.getInfo(); // holt gblinfo
                    let allfields = Object.keys(ret.sorparms.allfields);
                    let alterstatements = [];
                    for (let ifield = 0; ifield < allfields.length; ifield++) {
                        let actfield = allfields[ifield];
                        let actvalue = ret.sorparms.allfields[actfield];
                        let acttype = "TEXT";
                        if (typeof actvalue === "number") {
                            acttype = "FLOAT";
                        }
                        if (typeof mycache.tables[acttable][actfield] === "undefined") {
                            let alterstatement = "ALTER TABLE ";
                            alterstatement += ret.sorparms.table;
                            alterstatement += " ADD COLUMN " + actfield;
                            alterstatement += " " + acttype;
                            alterstatements.push(alterstatement);
                            mycache.tables[acttable][actfield] = acttype;
                        }
                    }
                    if (alterstatements.length > 0) {
                        async.eachSeries(alterstatements, function (alterStmt, nextStmt) {
                                db.run(alterStmt, function (err) {
                                    perftimer.sor.ALTER = new Date() - perftimer.sor.start;
                                    perftimer.sor.start = new Date();
                                    if (err) {
                                        ret.message += " ALTER-Error:" + err.message;
                                    } else {
                                        ret.message += " " + alterStmt + " executed";
                                        ret.alter = true;
                                    }
                                    nextStmt();
                                    return;
                                });
                            },
                            function (error) {
                                callback210d(null, res, ret);
                                return;
                            });
                    } else {
                        callback210d(null, res, ret);
                        return;
                    }
                },
                function (res, ret, callback210i) {
                    // optional INSERT
                    if (ret.insert === false) {
                        callback210i(null, res, ret);
                        return;
                    }
                    /*
                        INSERT INTO table_name(column_name)
                        VALUES(value_1), (value_2), (value_3),...
                    */
                    let insStmt = "INSERT INTO ";
                    insStmt += " " + ret.sorparms.table;
                    let baserecord = ret.sorparms.allfields;
                    let varlist = "";
                    let vallist = "";
                    for (let property in baserecord) {
                        if (baserecord.hasOwnProperty(property)) {
                            let ptype = typeof baserecord[property];
                            let pvalue = baserecord[property];
                            varlist += property + ",";
                            if (ptype === "object") {
                                vallist += JSON.stringify(pvalue) + ",";
                            } else if (ptype === "string") {
                                vallist += "'" + pvalue.replace(/'/g, "''") + "',";
                            } else if (ptype === "number") {
                                vallist += pvalue + ",";
                            } else if (ptype === "boolean") {
                                vallist += pvalue + ",";
                            } else {
                                if (pvalue === null) {
                                    vallist += "null,";
                                } else {
                                    vallist += pvalue + ",";
                                }
                            }
                        }
                    }
                    // letztes Komma weg
                    if (varlist.lastIndexOf(",") > 0) varlist = varlist.slice(0, -1);
                    if (vallist.lastIndexOf(",") > 0) vallist = vallist.slice(0, -1);
                    insStmt += "(";
                    insStmt += varlist;
                    insStmt += ")";
                    insStmt += " VALUES(";
                    insStmt += vallist;
                    insStmt += ")";
                    db.run(insStmt, function (err) {
                        perftimer.sor.INSERT = new Date() - perftimer.sor.start;
                        perftimer.sor.start = new Date();
                        if (err) {
                            ret.message += " INSERT-Error:" + err.message;
                            console.log(" INSERT-Error:" + err.message);
                            console.log(insStmt);
                        } else {
                            ret.message += " " + ret.sorparms.table + " ID:" + this.lastID + " inserted";
                        }
                        callback210i(null, res, ret);
                        return;
                    });
                },
                function (res, ret, callback210u) {
                    // optional UPDATE
                    if (ret.update === false) {
                        callback210u(null, res, ret);
                        return;
                    }
                    /**
                     * Ein Vergleich auf sifnifikante Updates kann hier vorgenommen werden
                     */

                    /*
                        UPDATE table
                        SET column_1 = new_value_1,
                            column_2 = new_value_2
                        WHERE
                            search_condition
                        ORDER column_or_expression
                        LIMIT row_count OFFSET offset;
                    */
                    let updStmt = "UPDATE ";
                    updStmt += " " + ret.sorparms.table;
                    let set = "";

                    let baserecord = dbhelper.cloneObject(ret.sorparms.updfields);
                    /**
                     * Ein Vergleich auf sifnifikante Updates kann hier vorgenommen werden
                     * alte Felder gegen neue und neue Felder an sich müssen Update auslösen
                     */
                    let isigcount = 0;
                    let idelcount = 0;

                    for (let property in baserecord) {
                        if (baserecord.hasOwnProperty(property)) {
                            let ptype = typeof baserecord[property];
                            let pvalue = baserecord[property];
                            if (property !== "tsserverupd") {
                                if (ret.oldrecord[property] !== pvalue) {
                                    isigcount++;
                                } else {
                                    delete baserecord[property];
                                    idelcount++;
                                }
                            }
                        }
                    }
                    let newkeys = Object.keys(baserecord);
                    // bisher isigcount === 0
                    // Hinweis tsserverupd zählt nicht, daher < 2 ist zu wenig
                    if (newkeys.length < 2) {
                        ret.message += " " + ret.sorparms.table + " kein update notwendig";
                        callback210u(null, res, ret);
                        return;
                    }
                    for (let property in baserecord) {
                        if (baserecord.hasOwnProperty(property)) {
                            let ptype = typeof baserecord[property];
                            let pvalue = baserecord[property];
                            if (set.length > 0) set += ", ";
                            set += property;
                            set += " = ";
                            if (ptype === "object") {
                                let updobjstring = JSON.stringify(pvalue);
                                set += "'" + updobjstring.replace(/'/g, "''") + "'";
                            } else if (ptype === "string") {
                                set += "'" + pvalue.replace(/'/g, "''") + "'";
                            } else if (ptype === "number") {
                                set += pvalue;
                            } else if (ptype === "boolean") {
                                set += pvalue;
                            } else {
                                set += "'" + pvalue.replace(/'/g, "''") + "'";
                            }
                        }
                    }
                    updStmt += " SET " + set;
                    // jetzt noch die WHERE-Bedingung
                    let sel = ret.sorparms.selfields;
                    let conds = Object.keys(sel);
                    let where = "";
                    for (let icond = 0; icond < conds.length; icond++) {
                        let condval = sel[conds[icond]];
                        if (typeof condval === "number") {
                            if (where.length > 0) where += " AND ";
                            where += conds[icond];
                            where += " = " + condval;
                        } else if (typeof condval === "string") {
                            if (where.length > 0) where += " AND ";
                            where += conds[icond];
                            where += " = " + "'" + condval + "'";
                        } else {
                            // Dickes Problem!!!
                            ret.error = true;
                            ret.message = "WHERE zu komplex:" + JSON.stringify(sel);
                            callback210u("Error", res, ret);
                            return;
                        }
                    }
                    if (where.length > 0) {
                        updStmt += " WHERE " + where;
                    }
                    db.run(updStmt, function (err) {
                        perftimer.sor.UPDATE = new Date() - perftimer.sor.start;
                        perftimer.sor.start = new Date();
                        if (err) {
                            ret.message += " UPDATE:" + err.message;
                        } else {
                            ret.message += " " + ret.sorparms.table + " updated:" + this.changes;
                        }
                        callback210u(null, res, ret);
                        return;
                    });
                }
            ], function (error, res, ret) {
                // hier geht es erst heraus
                // db.run("BEGIN");   db.run("END");
                if (typeof error !== "undefined" && error !== null && error === "Error") {
                    console.log("ABBRUCH-ERROR-final");
                    console.log(error);
                    console.log(JSON.stringify(ret));
                    callbacksor(res, ret);
                    return;
                }
                ret.message += " " + ret.sorparms.table + " finished";
                ret.endts = new Date();
                ret.timediff = ret.endts - ret.startts;
                if (ret.error === true) {
                    console.log("#" + ret.sorcount + ". " + ret.message);
                }
                /*
                if (ret.sorcount % 100 === 0) {
                    console.log("#" + ret.sorcount + ". last sor-Time:" + ret.timediff);
                    console.log(JSON.stringify(perftimer.sor, null, ""));
                }
                */
                perftimer.sor = {}; // Später müsste hier kumuliert werden
                callbacksor(res, ret);
                return;
            }); // async.waterfall
        }); // db.serialize
    };


    /**
     * Holen einen record aus table mit sel als Filter
     * @param {*} db - formal notwendig
     * @param {*} async - formal notwendig
     * @param {*} req - request vom Server, kann null sein, dann muss reqparm angegeben sein
     * @param {*} reqparm - request vom Server, kann null sein, dann muss reqparm angegeben sein
     * @param {*} res - response zum Server, wird übernommen, um die Antwort im callback zurückgeben zu können
     * @param {*} callback - callback funktion
     */
    dbhelper.getonerecord = function (db, async, req, reqparm, res, callback201) {

        dbhelper.getallsqlrecords(db, async, req, reqparm, res, function (res1, ret1) {
            // Transformation Ergebnis
            ret1.record = null;
            if (typeof ret1.records !== "undefined") {
                if (Array.isArray(ret1.records)) {
                    if (ret1.records.length > 0) {
                        ret1.record = ret1.records[0];
                        if (ret1.records.length > 1) {
                            console.log("getonerecord:" + ret1.records.length);
                            // nur den ersten Satz nehmen!!!
                            ret1.record = ret1.records[0];    
                        }
                    }
                } else {
                    let key = Object.keys(ret1.records);
                    if (key.length > 0) {
                        ret1.record = ret1.records[key[0]];
                    }
                }
            }
            delete ret1.records;
            callback201(res1, ret1);
            return;
        });

    };


    /**
     * getallsqlrecords - Holen alle records aus sql3-table mit sel als Filter
     * @param {*} db - formal notwendig
     * @param {*} async - formal notwendig
     * @param {*} req - request vom Server, kann null sein, dann muss reqparm angegeben sein
     * @param {*} reqparm - request vom Server, kann null sein, dann muss reqparm angegeben sein
     * @param {*} res - response zum Server, wird übernommen, um die Antwort im callback zurückgeben zu können
     * @param {*} callback - callback funktion
     */
    dbhelper.getallsqlrecords = function (db, async, req, reqparm, res, callbackgsr) {
        /**
         * Prüfen, welche Parameter vorliegen, dann zugreifen
         * username und firma sind auch verfügbar
         */
        var sel = {};
        var projection = {};
        var sort = {};
        var table = "";
        var firma = "";
        var skip = 0;
        var limit = 0;
        var selectmode = false;
        var ret = {};
        if (typeof reqparm === "undefined" || reqparm === null) {
            if (req.query && typeof req.query.sel !== "undefined" && req.query.sel.length > 0) {
                // sqlite3 - sel kann ein SELECT-String sein!
                if (req.query.sel.startsWith("{")) {
                    sel = JSON.parse(req.query.sel);
                    selectmode = false;
                } else {
                    sel = req.query.sel;
                    selectmode = true;
                }
            }
            if (req.query && typeof req.query.projection !== "undefined" && req.query.projection.length > 0) {
                projection = JSON.parse(req.query.projection);
                if (projection !== "undefined" && projection !== null) {
                    var pkeys = Object.keys(projection);
                    if (pkeys.length === 1 && pkeys[0] === "history") {
                        projection = {};
                    }
                } else {
                    projection = {};
                }
            }
            if (req.query && typeof req.query.sort !== "undefined" && req.query.sort.length > 0) {
                sort = JSON.parse(req.query.sort);
            }
            if (req.query && typeof req.query.table !== "undefined" && req.query.table.length > 0) {
                table = req.query.table;
            }
            if (req.query && typeof req.query.firma !== "undefined" && req.query.firma.length > 0) {
                firma = req.query.firma;
            }
            if (req.query && typeof req.query.skip !== "undefined" && req.query.skip.length > 0) {
                skip = parseInt(req.query.skip);
            }
            if (req.query && typeof req.query.limit !== "undefined" && req.query.limit.length > 0) {
                limit = parseInt(req.query.limit);
            }
        } else {
            if (reqparm && typeof reqparm.sel !== "undefined") {
                sel = reqparm.sel;
                if (typeof reqparm.sel === "object") {
                    selectmode = false;
                } else {
                    selectmode = true;
                }
            }
            if (selectmode === false) {
                if (reqparm && typeof reqparm.projection !== "undefined") {
                    projection = reqparm.projection;
                }
                if (reqparm && typeof reqparm.sort !== "undefined") {
                    sort = reqparm.sort;
                }
                if (reqparm && typeof reqparm.table !== "undefined" && reqparm.table.length > 0) {
                    table = reqparm.table;
                }
                if (reqparm && typeof reqparm.firma !== "undefined" && reqparm.firma.length > 0) {
                    firma = reqparm.firma;
                }
            }
            if (reqparm && typeof reqparm.skip !== "undefined" && reqparm.skip > 0) {
                skip = parseInt(reqparm.skip);
            }
            if (reqparm && typeof reqparm.limit !== "undefined" && reqparm.limit > 0) {
                limit = parseInt(reqparm.limit);
            }
        }
        if (typeof sel === "object") {
            // where-Bedingung bauen
            var selstring = "SELECT ";
            if (typeof projection === "object") {
                var flds = Object.keys(projection);
                var fldstring = "";
                if (flds.length > 0) {
                    for (var ifld = 0; ifld < flds.length; ifld++) {
                        if (projection[flds[ifld]] === 1) {
                            if (fldstring.length > 0) fldstring += ",";
                            fldstring += flds[ifld];
                        }
                    }
                }
                if (fldstring.length === 0) {
                    selstring += " * ";
                } else {
                    selstring += " " + fldstring;
                }
            }
            selstring += " FROM " + table;
            // WHERE nur flat an dieser Stelle
            var conds = Object.keys(sel);
            var where = "";
            for (var icond = 0; icond < conds.length; icond++) {
                var condval = sel[conds[icond]];
                if (typeof condval === "number") {
                    if (where.length > 0) where += " AND ";
                    where += conds[icond];
                    where += " = " + condval;
                } else if (typeof condval === "string") {
                    if (where.length > 0) where += " AND ";
                    where += conds[icond];
                    where += " = " + "'" + condval + "'";
                } else {
                    // Dickes Problem!!!
                    ret.error = true;
                    ret.message = "WHERE zu komplex:" + JSON.stringify(sel);
                    callbackgsr(res, ret);
                    return;
                }
            }
            if (where.length > 0) {
                selstring += " WHERE " + where;
            }
            var orderby = "";
            if (Array.isArray(sort)) {
                for (var isort = 0; isort < sort.length; isort++) {
                    // ["startdate", "asc"],
                    if (orderby.length > 0) orderby += ", ";
                    orderby += sort[isort][0];
                    var odir = sort[isort][1];
                    if (odir.toUpperCase() === "ASC") {
                        orderby += " ASC";
                    } else {
                        orderby += " DESC";
                    }
                }
                if (orderby.length > 0) {
                    selstring += " ORDER BY " + orderby;
                }
            } else if (typeof sort === "object") {
                var sortkeys = Object.keys(sort);
                for (let isort = 0; isort < sortkeys.length; isort++) {
                    // ["startdate", "asc"],
                    if (orderby.length > 0) orderby += ", ";
                    orderby += sortkeys[isort];
                    let odir = sort[sortkeys[isort]];
                    if (typeof odir === "number") {
                        if (odir === 1) {
                            orderby += " ASC";
                        } else {
                            orderby += " DESC";
                        }
                    } else {
                        if (odir.toUpperCase() === "ASC") {
                            orderby += " ASC";
                        } else {
                            orderby += " DESC";
                        }
                    }
                }
                if (orderby.length > 0) {
                    selstring += " ORDER BY " + orderby;
                }
            }
            sel = selstring; // et voila der Zauber
        }
        if (sel.indexOf("LIMIT ") > 0) {} else {
            if (limit > 0) {
                //  + " LIMIT 10 OFFSET 0";
                if (sel.toUpperCase().indexOf("ORDER BY") > 0) {
                    // sel += " LIMIT " + limit;
                    //sel += "," + skip;
                    sel += " LIMIT " + skip;
                    sel += "," + limit;
                }
            }
        }
        ret = {};
        var records = [];
        // console.log("getallsqlrecords-0:" + sel);
        try {
            if (db === null) {
                ret.error = true;
                ret.message = "getallsqlrecords-1:" + "Keine Datenbank übergeben";
                ret.record = null;
                ret.records = null;
                callbackgsr(res, ret);
                return;
            }
            /**
             * Aufbau des Response-Array
             */
            var record = {};
            var sqlStmt = sel;
            var rows;
            db.serialize(function () {
                db.all(sqlStmt, function (err, rows) {
                    var ret = {};
                    if (err) {
                        ret.error = true;
                        ret.message = "getallsqlrecords-2:" + err;
                        // SQLITE_IOERR: disk I/O error - kommt wohl von konkurrierenden Zugriffen
                        console.log(ret.message);
                        console.log(sqlStmt);
                        console.log(err.stack);

                        callbackgsr(res, ret);
                        return;
                    } else if (rows.length === 0) {
                        ret.error = false;
                        ret.message = "getallsqlrecords-2:Keine Sätze zu " + sqlStmt;
                        //console.log(ret.message);
                        callbackgsr(res, ret);
                        return;
                    } else {
                        ret.error = false;
                        ret.message = "getallsqlrecords-5:" + " gefunden:" + rows.length;
                        ret.records = rows;
                        //console.log(ret.message);
                        callbackgsr(res, ret);
                        return;
                    }
                });
            });
        } catch (err) {
            ret.error = true;
            ret.message = "getallsqlrecords-6:" + err.message;
            ret.records = null;
            console.log("getallsqlrecords-7:" + ret.message);
            callbackgsr(res, ret);
            return;
        }
    };


    
    /**
     *  removeTable - Sequenz zum kompletten Löscher einer Tabelle mit ihren Indices
     * @param {*} db
     * @param {*} tablename
     */
     dbhelper.removeTable = function (db, tablename, cb6190D) {

        db.serialize(function () {
            async.waterfall([
                    function (cb100) {
                        db.all("PRAGMA index_list('" + tablename + "')", function (err, indexlist) {
                            console.log("index_list " + tablename + ":" + JSON.stringify(indexlist) + " " + err);
                            cb100(null, {
                                error: false,
                                message: "indices",
                                indexlist: indexlist
                            });
                        });
                    },
                    function (ret, cb101) {
                        var indexlist = ret.indexlist;
                        async.eachSeries(indexlist, function (dbindex, nextindex) {
                                var dropStmt = "DROP INDEX IF EXISTS " + dbindex.name;
                                db.run(dropStmt, function (err) {
                                    console.log(dropStmt + "=>" + err);
                                    nextindex();
                                    return;
                                });
                            },
                            function (err) {
                                cb101(null, {
                                    error: false,
                                    message: "Indices gelöscht"
                                });
                                return;
                            });
                    },
                    function (ret, cb102) {
                        var dropStmt = "DROP TABLE IF EXISTS " + tablename;
                        db.run(dropStmt, function (err) {
                            console.log(tablename + " gelöscht:" + err);
                            cb102("Finish", {
                                error: false,
                                message: "fertig"
                            });
                            return;
                        });
                    }
                ],
                function (error, result) {
                    console.log("Fertig DROP with indices:" + tablename);
                    cb6190D(result);
                    return;
                });
        });
    };

    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = dbhelper;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return dbhelper;
        });
    } else {
        // included directly via <script> tag
        root.dbhelper = dbhelper;
    }
}());