/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper, */
/*global uientry,planetaryjs,SpeechRecognition */
(function () {
    "use strict";
    //
    let mybooksprices = {};

    let root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global) || this;

    let activeBook = {};
    let recognition;
    let recognitionEventListener;

    mybooksprices.show = function () {
        uihelper.init("online");

        let oldbox = uihelper.getCookie("box");
        if (oldbox === null) {
            oldbox = "";
        }
        $(".kliheaderinfo").show();
        $(".titletext").text("Aufbereiten jeweils 100 ISBN für rebuy-Anfrage");
        $(".subtitletext").text("");

        $("body").removeClass("overflow-hidden");
        $("body").addClass("overflow-hidden");
        if ($(".klicontainer").length <= 0) {
            $("body")
                .append($("<div/>", {
                        class: "container-fluid klicontainer",
                        pageid: "mybooksprices",
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

        let scrollbarwidth = uihelper.getScrollbarWidth("body");
        let krpos = $(".klicontainerrowwrapper").position();
        let kroff = $(".klicontainerrowwrapper").offset();
        let hw = $(window).height();
        let hr = Math.floor(hw - kroff.top - scrollbarwidth); // für Desktop, inkl. margin 5px alle Seiten
        $(".klicontainerrowwrapper").height(hr);

        $(".klicontainerrowwrapper")
            .append($("<div/>", {
                    class: "row"
                })
                .append($("<div/>", {
                    id: "mybookspricesform",
                    class: "col-11 col-sm-11 col-md-4 col-lg-4",
                    css: {
                        height: hr,
                        "background-color": "lightsteelblue",
                        overflow: "auto"
                    }
                }))
                .append($("<div/>", {
                    id: "mybookspricesdata",
                    class: "col-11 col-sm-11 col-md-8 col-lg-8",
                    css: {
                        height: hr,
                        "background-color": "lightsteelblue",
                        overflow: "auto"
                    }
                }))
            );

        let config = uihelper.getLoginData();
        if (config.mobile === true) {
            $("#mybookspricesform")
                .append($("<div/>", {
                    id: "mybarcodearea"
                }));
        }


        $("#mybookspricesform")
            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        margin: "10px",
                        width: "100%"
                    }
                })
                .append($("<label/>", {
                    for: "mybookspricesbox",
                    text: "Box",
                    class: "col-sm-4 col-form-label"
                }))
                .append($("<div/>", {
                        class: "col-sm-7"
                    })
                    .append($("<select/>", {
                        id: "mybookspricesbox",
                        class: "form-control mybookspricesbox",
                        type: "text",
                        "data-mini": "true",
                        title: "Box oder Regalfach als Textvorgabe",
                        keydown: function (event) {
                            if (event.which == 13) {
                                event.preventDefault();
                                $("#mybooksprices100").click();
                            }
                        }
                    }))
                )
            );


        $("#mybookspricesform")
            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        width: "100%",
                        "margin": "10px"
                    }
                })

                .append($("<button/>", {
                    class: "button-primary",
                    id: "mybooksprices100",
                    title: "Nächste 100 ISBN's aus Boxvorgabe anzeigen",
                    css: {
                        width: "40%",
                        "margin-left": "40%"
                    },
                    html: "show next 100",
                    click: function (evt) {
                        evt.preventDefault();
                        uihelper.clearMessage();
                        mybooksprices.search(function (ret) {
                            $("input.markedactive").removeClass("markedactive");
                        });
                    }
                }))
            )


            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        width: "100%",
                        "margin": "10px"
                    }
                })
                .append($("<button/>", {
                    class: "button-primary",
                    id: "mybookspricesb2",
                    css: {
                        width: "40%",
                        "margin-left": "40%"
                    },
                    html: "select and prepare ISBN in Clipboard",
                    click: function (evt) {
                        evt.preventDefault();
                        uihelper.clearMessage();
                        mybooksprices.storeBookStatus();
                        $("input.markedactive").removeClass("markedactive");
                    }
                }))
            )


            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        width: "100%",
                        "margin": "10px"
                    }
                })
                .append($("<button/>", {
                    class: "button-primary",
                    id: "mybookspricesb3",
                    css: {
                        width: "40%",
                        "margin-left": "40%"
                    },
                    html: "start rebuy",
                    click: function (evt) {
                        evt.preventDefault();
                        let url = "https://www.rebuy.de/verkaufen/bulk-isbn";
                        window.open(url, '_blank').focus();
                    }
                }))
            )


            .append($("<div/>", {
                    class: "row",
                    css: {
                        clear: "both",
                        width: "100%",
                        "margin-top": "20px"
                    }
                })
                .append($("<ul/>", {
                    id: "bookhistory"
                }))
            );

        // Initialisieren bookbox-Auswahl
        let sel = "SELECT bookbox, count(bookbox) as count";
        sel += " FROM MYBOOKSINFOS";
        sel += " WHERE bookstatus <= 1";
        sel += " GROUP BY bookbox";
        sel += " ORDER BY bookbox";
        let jqxhr = $.ajax({
            method: "GET",
            crossDomain: false,
            url: "getallrecords",
            data: {
                timeout: 10 * 60 * 1000,
                sel: sel,
                skip: 0,
                limit: 0
            }
        }).done(function (r1, textStatus, jqXHR) {
            $("body").css("cursor", "");
            let ret = JSON.parse(r1);
            if (ret.error === true) {
                alert(ret.message + " " + textStatus);
                uihelper.putMessage(ret.message, 3);
                return;
            }
            if (typeof ret.records === "undefined") {
                alert("Keine Daten gefunden:" + textStatus);
                uihelper.putMessage("Keine Daten gefunden", 3);
                $("#mybookspricesbox")
                .append($("<option/>", {
                    value: "",
                    html: "Alle"
                }));
                return;
            }
            // verarbeiten
            let sum = 0;
            ret.records.forEach(function (record, irec) {
                $("#mybookspricesbox")
                    .append($("<option/>", {
                        value: record.bookbox,
                        html: record.bookbox + " (" + record.count + ")"
                    }));
                sum += record.count;
            });
            $("#mybookspricesbox")
                .append($("<option/>", {
                    value: "",
                    html: "Alle" + " (" + sum + ")"
                }));

        }).fail(function (err) {
            $("body").css("cursor", "progress");
            alert(err);
            uihelper.putMessage("getallrecords:" + err, 3);
            return;
        }).always(function () {
            // nope
            // $(that).attr("disabled", false);
        });

    };


    /**
     * search next 100 - boxsearch als Vorgabe
     * im Server Abfrage bookstatus und bookbox dazu
     */
    mybooksprices.search = function (cbpricesearch) {
        // API-Aufruf booksearch
        let boxsearch = $("#mybookspricesbox").val().trim();
        if (boxsearch.length > 1000) {
            alert("Suchbegriff ist zu lang");
            cbpricesearch({
                error: true,
                message: "Suchbegriff ist zu lang:" + booksearch.length
            });
            return;
        }
        let jqxhr = $.ajax({
            method: "POST",
            crossDomain: false,
            url: "get100",
            data: {
                boxsearch: boxsearch
            }
        }).done(function (r1, textStatus, jqXHR) {
            let ret = JSON.parse(r1);
            $("body").css("cursor", "");
            //alert(JSON.parse(ret.book));
            let bookbox = $("#myscanbox").val();
            uihelper.setCookie("box", bookbox);
            activeBook = {};
            if (typeof ret.records === "object" && Array.isArray(ret.records) && ret.records.length > 0) {
                mybooksprices.showBookListe(ret.booksearch, ret.records, "#mybookspricesdata");
            } else {
                // hier wurde wirklich nichts gefunden
            }
            uihelper.putMessage(ret.message, 3);
            cbpricesearch({
                error: ret.error,
                message: ret.message
            });
            return;
        }).fail(function (err) {
            cbpricesearch({
                error: true,
                message: err.responseText
            });
            return;
        }).always(function () {
            // nope
        });
    };

    /**
     * showBookListe
     * @param {*} booksearch - Titelsuche 
     * @param {*} bookliste - Array von Büchern als Trefferliste
     * @param {*} container 
     */
    mybooksprices.showBookListe = function (booksearch, bookliste, container) {
        $(container).children().remove();
        $(container)
            .append($("<br/>"));
        $(container)
            .append($("<ul/>", {
                id: "mybookliste"
            }));
        bookliste.forEach(function (book, ibook) {
            let html = ibook + ". " + book.title + " " + JSON.stringify(book);
            let pubyear = "";
            if (typeof book.publish_year !== "undefined") {
                pubyear = book.publish_year.split(", ");
                if (pubyear.length > 5) {
                    pubyear = pubyear.slice(0, 5).join(", ");
                    pubyear += " ...";
                } else {
                    pubyear = pubyear.join(", ");
                }
            } else if (typeof book.publishedDate !== "undefined") {
                pubyear = book.publishedDate;
            }
            let authorstring = "";
            if (typeof book.authors !== "undefined") {
                authorstring = book.authors;
            } else if (typeof book.author_name !== "undefined") {
                authorstring = book.author_name;
            }

            $("#mybookliste")
                .append($("<li/>", {
                        ibook: ibook,
                        title: book.title,
                        ISBN: book.ISBN,
                        bookbox: book.bookbox
                    })
                    .append($("<span/>", {
                        html: "<b>" + book.title + "</b>"
                    }))
                    .append($("<span/>", {
                        css: {
                            "margin-left": "10px",
                            color: "red"
                        },
                        html:  book.bookbox 
                    }))
                    .append($("<span/>", {
                        css: {
                            "margin-left": "10px"
                        },
                        html: authorstring + " " + pubyear
                    }))
                    .append($("<br/>"))
                    .append($("<span/>", {
                        id: "mybookliste" + (ibook + 1)
                    }))
                );

            let isbncontainer = "#mybookliste" + (ibook + 1);
            let isbncontainerx = isbncontainer + "x";
            let isbncontainerm = isbncontainer + "m";
            if (typeof book.ISBN !== "undefined") {
                let isbns = book.ISBN.split(",");
                if (isbns === null || isbns.length === 0) {
                    $(isbncontainerx)
                        .append($("<span/>", {
                            html: " Ohne ISBN "
                        }));
                }
                isbns.forEach(function (isbn, iisbn) {
                    isbn = isbn.trim();
                    if (isbn.length > 0) {
                        if (iisbn <= 4) {
                            $(isbncontainer)
                                .append($("<button/>", {
                                    class: "mybookspriceschoice",
                                    isbn: isbn,
                                    html: (ibook + 1) + "," + (iisbn + 1)
                                }))
                                .append($("<span/>", {
                                    css: {
                                        "margin-left": "10px"
                                    },
                                    html: isbn
                                }));
                        } else {
                            if (iisbn === 5) {
                                $(isbncontainer)
                                    .append($("<span/>", {
                                        id: isbncontainerx.substr(1),
                                        css: {
                                            display: "none"
                                        }
                                    }))
                                    .append($("<span/>", {
                                        id: isbncontainerm.substr(1),
                                        class: "showmore",
                                        css: {
                                            "font-weight": "bold"
                                        },
                                        html: "... more"
                                    }));

                            }
                            $(isbncontainerx)
                                .append($("<button/>", {
                                    class: "mybookspriceschoice",
                                    isbn: isbn,
                                    html: (ibook + 1) + "," + (iisbn + 1)
                                }))
                                .append($("<span/>", {
                                    html: isbn
                                }));
                        }
                    }
                });
            } else {
                $(isbncontainerx)
                    .append($("<span/>", {
                        html: " Ohne ISBN "
                    }));
            }
        });

    };

    $(document).on("click", ".mybookspriceschoice", function (evt) {
        evt.preventDefault();
        let isbn = $(this).attr("isbn");
        // TODO: .mybookspriceschoice-Click muss anders gelöst werden
    });

    $(document).on("click", ".showmore", function (evt) {
        evt.preventDefault();
        // span mit inner span, das gezeigt oder versteckt wird
        let moreTarget = $(this).prev();
        let tstatus = $(moreTarget).is(":visible");
        if (tstatus === true) {
            $(moreTarget).hide();
            $(this).text("... more");
        } else {
            $(moreTarget).show();
            $(this).text("... less");
        }
    });


    /**
     * storeBookData
     */
    mybooksprices.storeBookStatus = function () {

        let clipstring = "";
        let books100 = [];
        $("#mybookliste > li").each(function (index) {
            let ISBN = $(this).attr("ISBN");
            let bookbox = $(this).attr("bookbox");
            clipstring += ISBN + "\n";
            books100.push({
                ISBN: ISBN,
                bookbox: bookbox
            });
            console.log(index + ": " + ISBN);
        });
        $("body").css("cursor", "progress");
        navigator.clipboard.writeText(clipstring).then(function () {
            /* clipboard successfully set */
            let jqxhr = $.ajax({
                method: "POST",
                crossDomain: false,
                url: "set100",
                data: {
                    books100: books100
                }
            }).done(function (r1, textStatus, jqXHR) {
                let ret = JSON.parse(r1);
                $("body").css("cursor", "");
                if (ret.error === false) {
                    uihelper.putMessage(ret.message, 1);
                } else {
                    uihelper.putMessage(ret.message, 3);
                }
                //alert(JSON.parse(ret.book));
                return;
            }).fail(function (err) {
                alert(err);
                uihelper.putMessage(err, 3);
                return;
            }).always(function () {
                // nope
            });
        }, function () {
            /* clipboard write failed */
            console.log("could not write to Clipboard");
        });
        /*
        bookliste.forEach(function (book, ibook) {
            let html = ibook + ". " + book.title + " " + JSON.stringify(book);
        
        // API-Aufruf Setzen bookstatus initial
        let selfields = {
            ISBN: isbn,
            bookbox: bookbox,
            bookcampaign: bookcampaign
        };
        let insfields = {
            ISBN: isbn,
            bookbox: bookbox
        };
        let updfields = {};
        let table = "MYBOOKSINFOS";
        
        if (Object.keys(updfields).length > 0) {
            // Effektive Änderungen liegen vor
            let jqxhr = $.ajax({
                method: "POST",
                crossDomain: false,
                url: "putdatabyisbn",
                data: {
                    selfields: selfields,
                    insfields: insfields,
                    updfields: updfields
                }
            }).done(function (r1, textStatus, jqXHR) {
                let ret = JSON.parse(r1);
                $("body").css("cursor", "");
                if (ret.error === false) {
                    uihelper.putMessage(ret.message, 1);
                } else {
                    uihelper.putMessage(ret.message, 3);
                }
                //alert(JSON.parse(ret.book));
                return;
            }).fail(function (err) {
                alert(err);
                uihelper.putMessage(err, 3);
                debugger;
                $("#myscansearch").focus();
                return;
            }).always(function () {
                // nope
            });
        }
        */
    };




    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = mybooksprices;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return mybooksprices;
        });
    } else {
        // included directly via <script> tag
        root.mybooksprices = mybooksprices;
    }
}());