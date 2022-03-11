/*global $,uihelper,sysbase,dotize,console,root,global,self,document,uientry,define */
/*global async */
(function () {
    "use strict";
    let sqlutils = {};

    let root = typeof self === 'object' && self.self === self && self ||
        typeof global === 'object' && global.global === global && global ||
        this;

    let myidcode = "sqlutils";
    let myidhash = "#" + myidcode;

    let newskip = 0;
    let tablename = "";
    let skip = 0;
    let limit = 1000;

    let myfields = [];


    sqlutils.putForm = function (container) {
        $(container)
            .append($("<form/>")
                .append($("<div/>", {
                    class: "form-group ",
                    html: "<b>Du kannst hier SQL erfassen</b>"
                }))

                .append($("<div/>", {
                        class: "col-11"
                    })
                    .append($('<label/>', {
                        class: "col-form-label font-weight-bold",
                        for: "selStmt",
                        text: "SELECT Statement"
                    }))
                    .append($('<textarea/>', {
                        class: "form-control",
                        id: "selStmt",
                        rows: 3,
                        css: {
                            resize: "vertical"
                        }
                    }))
                )


                .append($("<div/>", {
                        class: "col-11"
                    })
                    .append($('<label/>', {
                        class: "col-form-label font-weight-bold",
                        for: "comment",
                        text: "Kommentar"
                    }))
                    .append($('<textarea/>', {
                        class: "form-control",
                        id: "comment",
                        rows: 3,
                        css: {
                            resize: "vertical"
                        }
                    }))
                )
            );

    };



    sqlutils.parms = {
        sel: {},
        sort: [
            ['_id', -1]
        ],
        skip: 0,
        limit: 1000,
        tablename: ""
    };


    sqlutils.show = function () {
        /**
         * sqlutils - generische Kontrolle Tabellen und JSON-Inhalte
         */
        uihelper.init("online");
        $("body").removeClass("overflow-hidden");
        $("body").addClass("overflow-hidden");
        if ($(".klicontainer").length <= 0) {
            $("body")
                .append($("<div/>", {
                        class: "container-fluid klicontainer",
                        pageid: "sqlutils",
                        css: {
                            "background-color": "navyblue"
                        }
                    })
                    .append($("<div/>", {
                            class: "row"
                        })
                        .append($("<div/>", {
                            //class: "col-9 klicontainerrowwrapper",
                            class: "col-12 klicontainerrowwrapper overflow-auto"
                        }))
                    )
                );
        }
        $(".klicontainerrowwrapper").empty();

        if (document.title != "SQL-Queries") {
            document.title = "SQL-Queries";
        }
        $('meta[name="description"]').attr("content", "SQL-Queries");

        let myRandom = Math.floor(Math.random() * 1000000);
        let rowid = "row" + myRandom;
        let h = $(".klicontainerrowwrapper").height();
        $(".klicontainerrowwrapper")
            .append($("<div/>", {
                id: rowid,
                css: {
                    "margin-top": "15px",
                    "min-height": h
                },
                class: "row klicontainerrow"
            }));

        let tsdate = new Date();
        let myisoday = new Date(tsdate - tsdate.getTimezoneOffset() * 60 * 1000).toISOString().substr(0, 10);

        $(".klicontainerrow")
            .append($("<div/>", {
                    class: "col1of2 col-3",
                    id: "sqlutilsc1wrapper",
                    css: {
                        "background-color": "white",
                        overflow: "auto"
                    }
                })
                .append($("<div/>", {
                    id: "sqlutilsc1"
                }))
            );

        $(".klicontainerrow")
            .append($("<div/>", {
                    class: "col2of2 col-9",
                    id: "sqlutilsc2",
                    css: {
                        "background-color": "mistyrose",
                        overflow: "auto"
                    }
                })
                .append($("<div/>", {
                    id: "sqlutilsformwrapper"
                }))
                .append($("<div/>", {
                    id: "sqlutilsbutts",
                    css: {
                        width: "100%"
                    }
                }))
                .append($("<div/>", {
                    id: "sqlutilsdata",
                    css: {
                        width: "100%",
                        "background-color": "white"
                    }
                }))
            );

        // sqlutilsc1wrapper
        let h1 = $(window).height();
        h1 = h1 - $(".klicontainerrow").position().top;

        $("#sqlutilsc1wrapper").height(h1);

        sqlutils.showsqlutilstables(function (ret) {

            sqlutils.putForm("#sqlutilsformwrapper");

            //sysbase.putMessage("kli1020evt" + " aufgebaut", 0);
            $("#sqlutilsbutts")
                .append($("<button/>", {
                    id: "sqlutilsbsel",
                    html: "Datensätze anzeigen",
                    css: {
                        margin: "10px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let selrecord = {};
                        selrecord.selStmt = $("#selStmt").val();
                        selrecord.comment = $("#comment").val();
                        $("#sqlutilsdata").empty();
                        let h = $(window).height();
                        h = h - $(".klicontainerrow").position().top;
                        h = h - $("#sqlutilsformwrapper").height();
                        h = h - $("#sqlutilsbutts").height();

                        $("#sqlutilsdata").height(h);
                        let w = $("#sqlutilsc2").width();
                        $("#sqlutilsdata").width(w);

                        $("#sqlutilsdata").css("overflow", "auto");
                        // $(".goprev").hide();
                        // $(".gonext").hide();
                        let sel = selrecord.selStmt;
                        sqlutils.parms.tablename = "";
                        sqlutils.parms.sel = sel;
                        sqlutils.parms.skip = 0;
                        sqlutils.parms.limit = 1000;
                        sqlutils.showDetails(function (ret) {
                            if (ret.error === true) {
                                uihelper.putMessage(ret.message, 3);
                            } else {
                                uihelper.putMessage(ret.message, 0);
                            }
                        });
                    }
                }));

            $("#sqlutilsbutts")
                .append($("<button/>", {
                    id: "sqlutilsbsel",
                    html: "ALLE Datensätze anzeigen",
                    css: {
                        margin: "10px"
                    },
                    click: function (evt) {
                        evt.preventDefault();

                        let qmsg = "Der Abruf für ALLE Daten kann lange dauern! Trotzdem durchführen?";
                        let check = window.confirm(qmsg);
                        if (check === true) {
                            let selrecord = {};
                            selrecord.selStmt = $("#selStmt").val();
                            selrecord.comment = $("#comment").val();
                            $("#sqlutilsdata").empty();
                            let h = $(window).height();
                            h = h - $(".klicontainerrow").position().top;
                            h = h - $("#sqlutilsformwrapper").height();
                            h = h - $("#sqlutilsbutts").height();

                            $("#sqlutilsdata").height(h);
                            $("#sqlutilsdata").css("overflow", "auto");
                            // $(".goprev").hide();
                            // $(".gonext").hide();
                            let sel = selrecord.selStmt;
                            sqlutils.parms.tablename = "";
                            sqlutils.parms.sel = sel;
                            sqlutils.parms.skip = 0;
                            sqlutils.parms.limit = 0;
                            sqlutils.showDetails(function (ret) {
                                if (ret.error === true) {
                                    uihelper.putMessage(ret.message, 3);
                                } else {
                                    uihelper.putMessage(ret.message, 0);
                                }
                            });
                        }
                    }
                }));


            $("#sqlutilsbutts")
                .append($("<button/>", {
                    html: "SQL-SELECT speichern",
                    css: {
                        margin: "10px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let selrecord = {};
                        selrecord.selStmt = $("#selStmt").val();
                        selrecord.comment = $("#comment").val();
                        let sel = selrecord.selStmt;
                        if (sel.trim().length === 0) {
                            uihelper.putMessage("sqlutils:" + " Erst ein SELECT-Statement erfassen", 3);
                            return;
                        }
                        let sqlkey = md5(sel);
                        let selfields = {
                            sqlkey: sqlkey
                        };
                        let insfields = {
                            sqlkey: sqlkey
                        };
                        let updfields = {
                            sel: sel,
                            comment: selrecord.comment,
                            username: "anonymous"
                        };

                        let api = "putKLISQL";
                        let table = "KLISQL";

                        let jqxhr = $.ajax({
                            method: "POST",
                            crossDomain: false,
                            url: "putKLISQL",
                            data: {
                                selfields: selfields,
                                insfields: insfields,
                                updfields: updfields,
                                table: table
                            }
                        }).done(function (r1, textStatus, jqXHR) {
                            let j1 = JSON.parse(r1);
                            if (j1.error === false) {
                                uihelper.putMessage("KLISQL eingefügt", 1);
                            } else {
                                uihelper.putMessage("KLISQL ERROR:" + j1.message, 3);
                            }
                            return;
                        }).fail(function (err) {
                            uihelper.putMessage("KLISQL AJAX ERROR:" + err.message);
                            return;
                        }).always(function () {
                            // nope
                        });
                    }
                }));


            $("#sqlutilsbutts")
                .append($("<button/>", {
                    html: "SQL-SELECTs anzeigen",
                    css: {
                        margin: "10px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let sqlstmt = "SELECT * FROM KLISQL";
                        sqlstmt += " ORDER BY tsserverupd desc";
                        sqlutils.parms.tablename = "KLISQL";
                        sqlutils.parms.sel = sqlstmt;
                        sqlutils.parms.skip = 0;
                        sqlutils.parms.limit = 1000;
                        $("#selStmt").val(sqlstmt);
                        $("#sqlutilsbsel").click();
                    }
                }));


            $("#sqlutilsbutts")
                .append($("<button/>", {
                    html: "csv-Download",
                    css: {
                        margin: "10px"
                    },
                    click: function (evt) {
                        evt.preventDefault();

                        let sqlstmt = "";
                        sqlstmt = $("#selStmt").val();
                        sqlutils.parms.tablename = "KLISQL";
                        sqlutils.parms.sel = sqlstmt;
                        sqlutils.parms.skip = 0;
                        sqlutils.parms.limit = 1000;
                        let filename = "sql.csv";
                        let jqxhr = $.ajax({
                            method: "POST",
                            crossDomain: false,
                            url: "sql2csv",
                            data: {
                                sqlstmt: sqlstmt,
                                limit: 1000,
                                filename: filename
                            }
                        }).done(function (r1, textStatus, jqXHR) {
                            let j1 = JSON.parse(r1);
                            if (j1.error === false) {
                                let download_path = j1.path;
                                // Could also use the link-click method.
                                // window.location = download_path;
                                window.open(download_path, '_self'); // _blank
                                uihelper.putMessage(filename + " download erfolgt", 1);
                            } else {
                                uihelper.putMessage(filename + " download ERROR:" + j1.message, 3);
                            }
                            return;
                        }).fail(function (err) {
                            uihelper.putMessage("getAllTables AJAX ERROR:" + err.message);
                            return;
                        }).always(function () {
                            // nope
                        });

                    }
                }));


            $("#sqlutilsbutts")
                .append($("<button/>", {
                    html: "HTML-Download",
                    css: {
                        margin: "10px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        //uihelper.downloadHtmlTable($("#sqlutilsdata").find("table"), "html-extrakt");
                        saveTextAs($("#sqlutilst1").parent().html(), "html-extrakt" + ".html");
                    }
                }));
        });
    };

    /*
    sqlutils.gonext = function (event, ui, callback) {
        let username = uihelper.getUsername();
        sqlutils.parms.skip += sqlutils.parms.limit;
        sqlutils.showDetails(function (ret) {
            if (ret.error === true) {
                sysbase.putMessage(ret.message, 3);
            } else {
                sysbase.putMessage(ret.message, 0);
            }
        });
    };

    sqlutils.goprevious = function (event, ui, callback) {
        let username = uihelper.getUsername();
        sqlutils.parms.skip -= sqlutils.parms.limit;
        if (sqlutils.parms.skip < 0) {
            sqlutils.parms.skip = 0;
        }
        sqlutils.showDetails(function (ret) {
            if (ret.error === true) {
                sysbase.putMessage(ret.message, 3);
            } else {
                sysbase.putMessage(ret.message, 0);
            }
        });
    };
    */

    /**
     * sqlutils.showsqlutilstables(target) - Ausgabe Namen aller Tabellen
     * Quelle ist ajax-Call auf den Server
     */
    sqlutils.showsqlutilstables = function (callback) {
        let retmsg = "";
        try {
            /**
             * AJAX holt die Liste als JSON/Array
             */
            let jqxhr = $.ajax({
                method: "GET",
                crossDomain: false,
                url: "getsql3tablesx",
                data: {

                }
            }).done(function (r1, textStatus, jqXHR) {
                let ret = {};
                let j1 = JSON.parse(r1);
                if (j1.records && j1.records !== null) {
                    let tabletree = j1.tabletree;
                    $("#sqlutilsc1").empty();
                    // expliziter Treeview https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_treeview
                    $("#sqlutilsc1")
                        .append($("<ul/>", {
                            id: "sqlutilsc1b1",
                            css: {
                                "list-style": "none",
                                "margin-left": 0,
                                "padding-left": 0,
                                overflow: "hidden"
                            }
                        }));

                    for (const [tind, table] of tabletree[0].children.entries()) {
                        $("#sqlutilsc1b1")
                            .append($("<li/>")
                                .append($("<span/>", {
                                    class: "caret",
                                    // Unicode Character 'BLACK DOWN-POINTING TRIANGLE' (U+25BC)
                                    html: "&#x25BC; " + table.text
                                }))
                                .append($("<ul/>", {
                                    class: "nested"
                                }))

                            );
                        let lasttable = $("#sqlutilsc1b1").find("li:last").find("ul");
                        for (const [fldind, field] of table.children.entries()) {
                            $(lasttable)
                                .append($("<li/>")
                                    .append($("<span/>", {
                                        // Unicode Character 'BLACK Right-POINTING TRIANGLE' (U+25B6)
                                        html: "" + field.text
                                    }))
                                );
                        }
                    }


                    $(document).on("click", ".caret", function (evt) {
                        evt.preventDefault();
                        this.parentElement.querySelector(".nested").classList.toggle("active");
                        this.classList.toggle("caret-down");
                        if ($(this).hasClass("caret-down")) {
                            let tablename = $(this).text().substr(2);
                            let sqlstmt = "SELECT * FROM KLISQL";
                            sqlstmt += " WHERE sel LIKE '%" + tablename + "%'";
                            sqlstmt += " ORDER BY tsserverupd desc";
                            sqlutils.parms.tablename = "KLISQL";
                            sqlutils.parms.sel = sqlstmt;
                            sqlutils.parms.skip = 0;
                            sqlutils.parms.limit = 1000;
                            $("#selStmt").val(sqlstmt);
                            sqlutils.showDetails(function (ret) {
                                if (ret.error === true) {
                                    uihelper.putMessage(ret.message, 3);
                                } else {
                                    uihelper.putMessage(ret.message, 0);
                                }
                            });
                        }
                    });
                    callback({
                        error: false,
                        message: "Treeview geladen"
                    });
                } else {
                    callback({
                        error: false,
                        message: "Treeview nicht geladen"
                    });
                }
                return;
            }).fail(function (err) {
                callback({
                    error: true,
                    message: "getAllTables AJAX ERROR:" + err.message,
                    records: null
                });
                return;
            }).always(function () {
                // nope
            });
        } catch (err) {
            console.log("ERROR:" + err);
            callback({
                error: true,
                message: err,
                repeat: false
            });
        }
    };

    /**
     * Holen der Daten und Blätterlogik
     */
    sqlutils.showDetails = function (callback30) {

        let api = "getallrecords";
        let table = "";
        let skip = sqlutils.parms.skip;
        if (skip < 0) skip = 0;
        let limit = sqlutils.parms.limit;
        let sel = sqlutils.parms.sel;

        let ghcnclock = sqlutils.showclock("#sqlutilsbutts");
        $("#sqlutilsbutts").find("button").prop('disabled', true);
        $("body").css("cursor", "progress");

        let htmltable = "<table id='sqlutilst1'"; // class='tablesorter'>"; //  style='display:none'>";
        if (limit > 0) {
            htmltable = "<table id='sqlutilst1'";
        }
        htmltable += "class='table-striped table-bordered'";
        htmltable += ">";
        let jqxhr = $.ajax({
            method: "GET",
            crossDomain: false,
            url: "getallrecords",
            data: {
                timeout: 10 * 60 * 1000,
                sel: sel,
                skip: skip,
                limit: limit
            }
        }).done(function (r1, textStatus, jqXHR) {
            $("body").css("cursor", "");
            $("#sqlutilsbutts").find("button").prop('disabled', false);
            clearInterval(ghcnclock);
            let ret = JSON.parse(r1);
            if (ret.error === true) {
                alert(ret.message + " " + textStatus);
                uihelper.putMessage(ret.message, 3);
                return;
            }
            if (typeof ret.records === "undefined") {
                alert("Keine Daten gefunden:"  + textStatus);
                uihelper.putMessage("Keine Daten gefunden", 3);
                return;
            }
            uihelper.putMessage(ret.message, 1);
            let irec = 0;
            let anzrecs = Object.keys(ret.records).length;
            let fcount = 0;
            let fsum = 0;
            let flen = 0;
            let staformat = {};
            let staattributes = {};
            if (sqlutils.parms.limit === 0) {
                let rmsg = anzrecs + " Sätze gefunden";
                uihelper.putMessage(rmsg, 3);
            }
            for (let property in ret.records) {
                if (ret.records.hasOwnProperty(property)) {
                    let record = ret.records[property];
                    // Bestimmung feste Breiten
                    irec++;
                    if (irec === 1) {
                        if (sqlutils.parms.limit === 0 && anzrecs > 1000) {
                            staformat.attributes = {};
                            staattributes.largetable = true;
                            let keys = Object.keys(record);
                            for (let ikey = 0; ikey < keys.length; ikey++) {
                                let feldname = keys[ikey];
                                let feldtype = typeof record[feldname];
                                let feldwert = "";
                                if (feldname === "number") {
                                    feldwert = record[feldname];
                                    staformat[feldname] = {
                                        title: feldname,
                                        align: "right",
                                    };
                                    flen = feldwert.toFixed(2).length;
                                    if (flen <= 8) {
                                        staformat[feldname].stellen = 8;
                                    } else if (flen <= 15) {
                                        staformat[feldname].stellen = 15;
                                    } else {
                                        staformat[feldname].stellen = 20;
                                    }
                                    fsum += staformat[feldname].stellen;
                                } else if (feldname === "boolean") {
                                    feldwert = record[feldname];
                                    staformat[feldname] = {
                                        title: feldname,
                                        align: "center"
                                    };
                                    staformat[feldname].stellen = 10;
                                    fsum += staformat[feldname].stellen;
                                } else if (feldname === "object") {
                                    feldwert = JSON.stringify(record[feldname], null, "");
                                    staformat[feldname] = {
                                        title: feldname,
                                        align: "center"
                                    };
                                    staformat[feldname].stellen = 10;
                                    fsum += staformat[feldname].stellen;
                                } else {
                                    feldwert = record[feldname];
                                    staformat[feldname] = {
                                        title: feldname,
                                        align: "left"
                                    };
                                    flen = feldwert.length;
                                    if (flen <= 8) {
                                        staformat[feldname].stellen = 8;
                                    } else if (flen <= 15) {
                                        staformat[feldname].stellen = 15;
                                    } else {
                                        staformat[feldname].stellen = flen;
                                    }
                                    fsum += staformat[feldname].stellen;
                                }
                            }
                            if (fsum < 200) {
                                let keys = Object.keys(staformat);
                                for (let ikey = 0; ikey < keys.length; ikey++) {
                                    let feldname = keys[ikey];
                                    if (feldname !== "attributes") {
                                        staformat[feldname].width = (staformat[feldname].stellen / fsum * 100).toFixed(0) + "%";
                                    }
                                }
                            }
                        } else {
                            staformat = {};
                        }
                    }
                    // uihelper.transformJSON2TableTRX = function (obj, count, formatattributes, format, rowid, rowclass, linkfield) {
                    let line = uihelper.transformJSON2TableTRX(record, irec - 1, staattributes, staformat, "", "sqlutilsclick");
                    htmltable += line;
                }
            }
            htmltable += "</body>";
            htmltable += "</table>";
            $("#sqlutilsdata").html(htmltable);
            $('#sqlutilst1').DataTable({
                /*"scrollX": true, */
                dom: 'QBfrtip',
                "scrollX": true,
                buttons: [
                    'copy', 'csv', 'excel', 'pdf', 'print'
                ]
            });
            $(document).on("click", ".sqlutilsclick", function (event) {
                event.preventDefault();
                let selfields = {};
                let row = $(this).closest("tr");
                let sqlstmt = $(row).find("td:nth-child(2)").text();
                sqlutils.parms.tablename = "";
                sqlutils.parms.sel = sqlstmt;
                sqlutils.parms.skip = 0;
                sqlutils.parms.limit = 20;
                $("#selStmt").val(sqlstmt);
                $("#sqlutilsbsel").click();
            });
            return;
        }).fail(function (err) {
            $("body").css("cursor", "progress");
            $("#sqlutilsbutts").find("button").prop('disabled', false);
            clearInterval(ghcnclock);
            //$("#kli1400raw_rightwdata").empty();
            //document.getElementById("kli1400raw").style.cursor = "default";
            alert(err);
            uihelper.putMessage("getallrecords:" + err, 3);
            return;
        }).always(function () {
            // nope
            // $(that).attr("disabled", false);
        });
    };


    sqlutils.showclock = function (clockcontainer) {
        // Update the count down every 1 second
        if (typeof clockcontainer === "string") {
            if (!clockcontainer.startsWith("#")) clockcontainer = "#" + clockcontainer;
        }
        if ($('#kliclock', clockcontainer).length === 0) {
            $(clockcontainer)
                .append($("<span/>", {
                    id: "kliclock",
                    class: "kliclock",
                    html: "Stoppuhr",
                    css: {
                        "font-size": "2em",
                        "font-weight": "bold"
                    }
                }));
        }
        let countDownDate = new Date().getTime();
        let xclock = setInterval(function () {
            // Get today's date and time
            let now = new Date().getTime();
            // Find the distance between now and the count down date
            let distance = now - countDownDate;
            // Time calculations for days, hours, minutes and seconds
            // let days = Math.floor(distance / (1000 * 60 * 60 * 24));
            let seconds = Math.floor((distance % (1000 * 60)) / 1000);
            distance = Math.floor(distance - seconds * 1000);
            let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            distance = Math.floor(distance - minutes * 1000 * 60);
            let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            // Display the result in the element with id="demo"
            $("#kliclock").text(hours + "h " + minutes + "m " + seconds + "s ");
        }, 1000);
        return xclock;
    };




    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = sqlutils;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return sqlutils;
        });
    } else {
        // included directly via <script> tag
        root.sqlutils = sqlutils;
    }
}());