/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*jslint white:true, browser:true, devel:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper */
/*global uientry,planetaryjs, */
(function () {
    "use strict";
    let uihelper = {};

    let root = typeof self === 'object' && self.self === self && self ||
        typeof global === 'object' && global.global === global && global || this;

    let messages = [];
    let modus = "";

    let logindata = {};
    
    /**
     * getLoginData - teilen der Logindaten
     */
    uihelper.getLoginData = function() {
        return logindata;
    };

    /**
     * Initialisiert den Breadcrumb-Stack und das Hauptmenue inkl. Event-Routinen
     * @param {*} mode - Modus online oder offline, online ist Default
     */
    uihelper.init = function (mode) {
        /**
         * Icons für die Navigation und die Bedienung
         */

        $("nav")
            .append($("<div/>", {
                    css: {
                        float: "left"
                    }
                })
                
                .append($("<span/>", {
                    id: "mybookusername",
                    html: "&nbsp;",
                    css: {
                        "margin-left": "10px"
                    }
                }))

                .append($("<button/>", {
                    class: "btn btn-danger newmessages",
                    title: "Nachrichten",
                    html: "0",
                    css: {
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        uihelper.showMessages();
                    }
                }))

                .append($("<button/>", {
                    class: "btn btn-info",
                    title: "SQL Kontrolle",
                    html: "SQL",
                    css: {
                        "font-weight": "bolder",
                        float: "left",
                        "margin-left": "20px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let h = $(".klicontainerrowwrapper").height();
                        let w = $(".klicontainerrowwrapper").width();
                        let gurl = "index.html?target=sqlutils";
                        $('<a href="' + gurl + '" target="_blank">SQL</a>')[0].click();
                        return;
                    }
                }))
                .append($("<span/>", {
                    id: "microphoneok",
                    css: {
                        "margin": "10px"
                    }
                }))
            );
        let username = uihelper.getLoginData().username || "";
        $("#mybookusername").text(username);
        /** 
         * Fehlermeldungen 
         */
        $("nav")
            .append($("<div/>", {
                class: "navmessage",
                css: {
                    float: "left"
                },
                id: "navmessage"
            }));
        /**
         * Header-Infos
         */
        $("nav")
            .append($("<div/>", {
                    class: "kliheaderinfo",
                    css: {
                        float: "right",
                        display: "none"
                    }
                })
                .append($("<span/>", {
                    class: "titletext",
                    css: {
                        "margin-left": "15px"
                    },
                    html: mode
                }))
                .append($("<span/>", {
                    class: "titlefirstname",
                    css: {
                        "margin-left": "15px"
                    },
                    html: "&nbsp;"
                }))
                .append($("<span/>", {
                    class: "titlelevel",
                    css: {
                        "margin-left": "15px"
                    },
                    html: "&nbsp;"
                }))
                .append($("<span/>", {
                    class: "titlepoints",
                    css: {
                        "margin-left": "15px"
                    },
                    html: "&nbsp;"
                }))
                .append($("<span/>", {
                    class: "subtitletext",
                    css: {
                        "margin-left": "15px"
                    },
                    html: "Heatmap"
                }))
                .append($("<span/>", {
                    html: "&nbsp;"
                }))
                .append($("<span/>", {
                    css: {
                        "margin-left": "15px"
                    },
                    class: "klivariablelist"
                }))
                .append($("<span/>", {
                    css: {
                        "margin-left": "20px"
                    }
                }))
            );
    };



    /**
     * Berechnet die Scrollbar-Width eines DOM-Elementes
     * @param {*} el
     */
    uihelper.getScrollbarWidth = function (el) {
        // https://stackoverflow.com/questions/986937/how-can-i-get-the-browsers-scrollbar-sizes;
        let parent, child, width;
        if (width === undefined) {
            parent = $('<div style="width:50px;height:50px;overflow:auto"><div/></div>').appendTo('body');
            child = parent.children();
            width = child.innerWidth() - child.height(99).innerWidth();
            parent.remove();
        }
        return width;
    };


    /**
     * navigateTo - Aufruf einer neuen Seite mit Stack-Fortschreibung
     * @param {*} targetpage - Zielseite/Funktion, die aufzurufen ist mit show
     * @param {*} parameters - Parameter, die bei show übergeben werden als Array
     * @param {*} cb6095 - Callback mit return ret
     */
    uihelper.navigateTo = function (targetpage, parameters, cb6095) {
        /**
         * Aufruf einer anderen Seite mit show-Funktion,
         * depricated ist klistack als Callstack für Back-Unterstützung
         * Problem: wenn .content mit id erst auf unterer Ebene gefunden wird,
         * dann müsste pageid gesucht werden, besser: pageid => .content mit id
         * Kontext: im iframe, da sollte es auch klappen, aber iframe hat kein parent i.e.S.
         */
        if (targetpage === null) {
            return;
        }
        $(".kliconfigcontext").hide();
        $(".kliconfigcontext").off("click", "**");

        $(".klisavecontext").hide();
        $(".klisavecontext").off("click", "**");

        $(".kliprintcontext").hide();
        $(".kliprintcontext").off("click", "**");

        let uname = "Climate-Expert";
        let origin;

        //uihelper.putMessage(origin + "=>" + targetpage);
        if (typeof parameters === "undefined") {
            parameters = [];
        }

        let targetparts = targetpage.split(".");
        let targetmodule = targetparts[0] || "uihelper";
        let targetfunction = targetparts[1] || "show";
        targetpage = targetmodule + "." + targetfunction;
        let script = "js/" + targetmodule + ".js";
        console.log("navigateTo-Start:" + targetpage);

        let ret = {};
        try {
            /* depricated
            klistack.push({
                targetpage: targetpage,
                targetmodule: targetmodule,
                targetfunction: targetfunction,
                parameters: Object.assign({}, parameters)
            });
            */
            let ttype1 = typeof window[targetpage];
            let ttype2 = typeof window[targetmodule];
            let ttype3 = typeof window[targetmodule][targetfunction];
            if (ttype2 === "function") {
                // erst einfacher Fall: function aufrufen
                $(".klicontainer").find("*").off();
                $(".klicontainer").off("click", "**");
                $(".klicontainer").attr("pageid", targetmodule);
                $("nav").attr("title", targetmodule);
                $(window).off("resize");
                window[targetmodule](parameters);
                ret.error = false;
                ret.message = targetpage + " called";
            } else if (ttype3 === "function") {
                $(".klicontainer").find("*").off();
                $(".klicontainer").off("click", "**");
                $(".klicontainer").attr("pageid", targetmodule);
                $("nav").attr("title", targetmodule);
                $(window).off("resize");
                window[targetmodule][targetfunction](parameters);
                ret.error = false;
                ret.message = targetpage + " called";
            } else {
                ret.error = true;
                ret.message = targetpage + " NOT called";
            }
            let plink = " ";
            if (typeof parameters === "object" && typeof parameters.stationid !== "undefined") {
                plink += parameters.stationid;
            } else {
                plink += parameters.stationid;
            }
            /* deprecated
            if (ret.error === false) {
                $(".klimabreadcrumbs")
                    .append($("<li/>", {
                        class: "dropdown-item",
                        // stackindex: klistack.length - 1, depricated
                        html: targetpage + plink
                    }));
            } else {
                klistack.pop(); // remove, weil kein Sprung erfolgt ist
            }
            */
            console.log("navigateTo-Ende:" + targetpage);
            if (typeof cb6095 === "function") {
                cb6095(ret);
                return;
            } else {
                return ret;
            }
        } catch (err) {
            console.log("navigateTo-Error:" + targetpage);
            console.log(err.stack);
            ret = {
                error: true,
                message: err
            };
            if (typeof cb6095 === "function") {
                cb6095(ret);
                return;
            } else {
                return ret;
            }
        }
        /*
          Mimik mit $.getScript(url, function (data, textStatus, jqxhr)  geht nicht in PWA
        */
    };


    /**
     * putMessage
     * @param {*} message
     * @param {*} severity
     */
    let msgcount = 0;
    uihelper.putMessage = function (message, severity) {
        console.log("MSG:" + message);
        if (messages.length > 0 && message.trim() === messages[messages.length - 1].message.trim()) {
            return;
        }
        msgcount++;
        if (typeof severity === "undefined") {
            severity = 1;
        }
        messages.unshift({
            message: message,
            severity: severity
        });
        if (messages.length > 50) {
            messages.pop();
        }
        // einen roten Punkt setzen für neue Nachrichten
        // $(".newmessages").show();
        $(".newmessages").css("background-color", "pink");
        $(".newmessages").html(msgcount);
        if (message.length > 50) {
            $(".navmessage").html(message.substr(0, 50) + "...");
        } else {
            $(".navmessage").html(message);
        }
        $(".navmessage").attr("title", message);
        if (severity > 1) {
            $(".navmessage").css("color", "red");
        } else {
            $(".navmessage").css("color", "blue");
        }
    };

    uihelper.clearMessage = function () {
        $(".navmessage").attr("title", "");
        $(".navmessage").css("color", "white");
    };

    uihelper.showMessages = function () {
        let html = "";
        //html += '<div class="modal-dialog modal-dialog-scrollable">';
        html += "<ul>";
        for (let imsg = 0; imsg < messages.length; imsg++) {
            html += "<li";
            if (messages[imsg].severity > 2) {
                html += " style='background-color:pink;font-weight: bold;'";
            } else if (messages[imsg].severity > 1) {
                html += " style='font-weight: bold;'";
            }
            html += ">";
            html += messages[imsg].message;
            html += "</li>";
        }
        html += "</ul>";

        // DONE: height auf full screen ausrichten
        var myWindow = window.open("", "Messages","top=0,width=600,height='" +  screen.height + "'");
        myWindow.document.write(html);
           
        $(".newmessages").css("background-color", "grey");
        msgcount = 0;
    };


    /**
     * transformJSON2TableTRX
     * @param {*} obj
     * @param {*} count
     * @param {*} formatattributes
     * @param {*} format
     * @param {*} rowid
     * @param {*} rowclass
     * @returns
     */
    uihelper.transformJSON2TableTRX = function (obj, count, formatattributes, format, rowid, rowclass, linkfield) {
        if ($.isEmptyObject(format)) {
            // Berechnung Default-Format
            format = {};
            var keys = Object.keys(obj);
            for (var ikey = 0; ikey < keys.length; ikey++) {
                var feldname = keys[ikey];
                var feldtype = typeof obj[feldname];
                if (feldtype === "number") {
                    format[feldname] = {
                        title: feldname,
                        align: "right"
                    };
                } else if (feldtype === "boolean") {
                    format[feldname] = {
                        title: feldname,
                        align: "center"
                    };
                } else {
                    format[feldname] = {
                        title: feldname,
                        align: "left"
                    };
                }
            }
        }

        if (typeof linkfield === "string" && linkfield.length > 0) {
            format[linkfield].linkclass = rowclass;
        }

        var header = "";
        var line = "";
        var res = "";
        var attrs = [];
        var cont = "";
        try {
            delete format.attributes;
            for (var property in format) {
                if (format.hasOwnProperty(property)) {
                    attrs = [];
                    var cont = "";
                    if (typeof formatattributes === "undefined") formatattributes = {};
                    if (typeof formatattributes.onlyFormat !== "undefined" && formatattributes.onlyFormat === true && typeof formatattributes[property] === "undefined") {
                        continue;
                    }
                    if (typeof obj[property] === "object" && formatattributes.skipObjects === true) {
                        continue;
                    }
                    var attr = "";
                    if (format && typeof format[property] !== "undefined" &&
                        format[property].width && format[property].width.length > 0) {
                        attrs.push(" width='" + format[property].width + "'");
                    }
                    if (count === 0) {
                        header += "<th" + attr + " data-field='" + property + "'" + " data-sortable='true'" + ">";
                        if (typeof format[property] !== "undefined" && typeof format[property].title !== "undefined" && format[property].title.length > 0) {
                            header += format[property].title;
                        } else {
                            header += property;
                        }

                        header += "</th>";
                    }
                    if (typeof obj[property] === "object") {
                        cont = JSON.stringify(obj[property], null, " ");
                    } else {
                        var typ = typeof obj[property];
                        var wrt = obj[property];
                        if (typeof wrt === "undefined" || wrt === null || wrt === "") {
                            cont = "&nbsp;";
                        } else if (format && typeof format[property] !== "undefined") {
                            cont = wrt;
                            if (format[property].pattern && format[property].pattern === "currency") {
                                attrs.push(" align='right'");
                                cont = parseFloat(wrt).toLocaleString('de-DE', {
                                    minimumFractionDigits: 2
                                });
                            }
                            if (format[property].typ && format[property].typ === "checkbox") {
                                cont = "";
                                cont += "<input ";
                                cont += "type='checkbox'";
                                if (format[property].class) {
                                    cont += " class='" + format[property].class + "'";
                                }
                                if (wrt === true) cont += " checked";
                                cont += ">";
                            }
                            if (format[property].width) {
                                attrs.push(" width='" + format[property].width + "'");
                            }
                            if (format[property].align) {
                                attrs.push(" align='" + format[property].align + "'");
                            }
                            if (typ === "number") {
                                attrs.push("align='right'");
                                cont = wrt;
                                if (!isNaN(wrt)) {
                                    attrs.push("align='right'");
                                    cont = wrt;
                                } else if (wrt.length <= 3) {
                                    attrs.push("align='center'");
                                    cont = wrt;
                                } else {
                                    cont = wrt;
                                }
                            }
                            if (typ === "string" && !isNaN(wrt) && typeof format[property].toFixed !== "undefined") {
                                cont = parseFloat(wrt).toFixed(format[property].toFixed);
                            } else if (typ === "number" && !isNaN(wrt) && typeof format[property].toFixed !== "undefined") {
                                cont = parseFloat(wrt).toFixed(format[property].toFixed);
                            }
                        }
                        if (format && typeof format[property] !== "undefined" &&
                            format[property].linkclass && format[property].linkclass.length > 0) {
                            attrs.push("class=" + format[property].linkclass);
                        }
                        if (typeof format[property] !== "undefined" && typeof format[property].css !== "undefined") {
                            var cssstring = JSON.stringify(format[property].css);
                            cssstring = cssstring.substr(1, cssstring.length - 2);
                            attrs.push(" style='" + cssstring + "'");
                        }
                        if (format && typeof format[property] !== "undefined" &&
                            format[property].name && format[property].name.length > 0) {
                            attrs.push("name=" + format[property].name);
                        }
                    }
                }
                line += "<td";
                line += attrs.join(" ");
                line += ">";
                line += cont;
                line += "</td>";
            }
            res = "";
            if (header.length > 0) {
                res += "<thead>";
                res += "<tr>" + header + "</tr>";
                res += "</thead>";
                res += "<tbody>";
            }
            var rowattr = "";

            if (typeof rowid === "string" && rowid !== null && rowid.length > 0) {
                rowattr += " rowid='" + rowid + "'";
            } else if (typeof rowid === "object" && Object.keys(rowid).length > 0) {
                for (var property in rowid) {
                    if (rowid.hasOwnProperty(property)) {
                        // do stuff
                        var value = rowid[property];
                        rowattr += " " + property + "='" + value + "'";
                    }
                }
            }

            if (typeof rowclass !== "undefined" && rowclass.length > 0) {
                rowattr += " class='" + rowclass + "'";
            }

            if (typeof formatattributes.largetable !== "undefined" && formatattributes.largetable === true) {
                if (count > 100) {
                    rowattr += " style='display: none;'";
                }
            }
            res += "<tr" + rowattr + ">" + line + "</tr>";
        } catch (err) {
            res += "***ERROR***" + err + " " + err.stack;
            console.log(err + " " + err.stack);
        }
        return res;
    };



    /**
     * getCookie - holt Cookie oder Pseudocookie aus localStorage
     * und gibt object zurück (!)
     * @param {*} cookiename
     * returns cookie-Inhalt als Objekt (!) oder null
     */
    uihelper.getCookie = function (cookiename) {
        let emptycookie = null;
        try {
            let cookiestring = Cookies.get(cookiename);
            // spezielle Abfrage, kommt wegen API
            if (typeof cookiestring === "undefined" || cookiestring === "undefined" || cookiestring === null || cookiestring.length === 0) {
                return emptycookie;
            } else {
                // Default-Setzungen für klimaquizparms
                let cookieobj = cookiestring;
                if (typeof cookiestring === "string") {
                    if (cookiestring.startsWith("{") || cookiestring.startsWith("[")) {
                        cookieobj = JSON.parse(cookiestring);
                    }
                }
                return cookieobj;
            }
        } catch (err) {
            return emptycookie;
        }
    };

    /**
     * setCookie - setzt Cookie oder Pseudocookie in localStorage
     * Cookie als String, Pseudocookie als object
     * @param {*} cookiename
     * @param {*} cookiestring
     * @param {*} cookieparms
     * returns true oder false, wenn es nicht geklappt hat
     */
    uihelper.setCookie = function (cookiename, cookiestring, cookieparms) {
        let cookiedata;
        if (typeof cookiestring === "string") {
            cookiedata = cookiestring;
        } else if (typeof cookiestring === "object") {
            cookiedata = kla6900.cloneObject(cookiestring);
            cookiestring = JSON.stringify(cookiedata);
        } else {
            return false;
        }
        if (typeof cookieparms === "undefined") {
            cookieparms = {
                expires: 1000, // Tage
                SameSite: "Strict"
            };
        }
        Cookies.set(cookiename, cookiestring, cookieparms);
        return true;
    };



    /**
     * isStorageAvailable - localStorage (dft) und sessionStorage
     * @param {*} type
     * @returns true oder error mit code und name oder false
     */
    uihelper.isStorageAvailable = function (type) {
        let storage;
        if (typeof type === "undefined" || type === null || type.length === 0) {
            type = "localStorage";
        }
        try {
            storage = window[type];
            var x = '__storage_test__';
            storage.setItem(x, x);
            storage.removeItem(x);
            return true;
        } catch (e) {
            return e instanceof DOMException && (
                    // everything except Firefox
                    e.code === 22 ||
                    // Firefox
                    e.code === 1014 ||
                    // test name field too, because code might not be present
                    // everything except Firefox
                    e.name === 'QuotaExceededError' ||
                    // Firefox
                    e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
                // acknowledge QuotaExceededError only if there's something already stored
                (storage && storage.length !== 0);
        }
    };





    var actx = false;
    /**
     * beep
     * https://stackoverflow.com/questions/29567580/play-a-beep-sound-on-button-click
     * @param {*} vol - Default 30
     * @param {*} freq - Default 1000
     * @param {*} duration - Default 50
     */
    uihelper.beep = function (vol, freq, duration) {
        try {
            if (!actx) actx = new AudioContext();
            vol = vol || 30;
            freq = freq || 1000;
            duration = duration || 50;

            let v = actx.createOscillator();
            let u = actx.createGain();
            v.connect(u);
            v.frequency.value = freq;
            u.connect(actx.destination);
            u.gain.value = vol * 0.01;
            v.start(actx.currentTime);
            v.stop(actx.currentTime + duration * 0.001);
        } catch (err) {
            // ignore
            console.log(err.stack);
        }
    };


    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = uihelper;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return uihelper;
        });
    } else {
        // included directly via <script> tag
        root.uihelper = uihelper;
    }
}());