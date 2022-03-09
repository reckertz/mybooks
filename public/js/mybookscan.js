/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper */
/*global uientry,planetaryjs,SpeechRecognition */
(function () {
    "use strict";
    //
    let mybookscan = {};

    let root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global) || this;

    let activeBook = {};

    mybookscan.show = function () {
        uihelper.init("online");

        let oldbox = uihelper.getCookie("box");
        if (oldbox === null) {
            oldbox = "";
        }
        $("body").removeClass("overflow-hidden");
        $("body").addClass("overflow-hidden");
        if ($(".klicontainer").length <= 0) {
            $("body")
                .append($("<div/>", {
                        class: "container-fluid klicontainer",
                        pageid: "mybookscan",
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
                    id: "mybookscanform",
                    class: "col-11 col-sm-11 col-md-4 col-lg-4",
                    css: {
                        height: hr,
                        "background-color": "lightsteelblue",
                        overflow: "auto"
                    }
                }))
                .append($("<div/>", {
                    id: "mybookscandata",
                    class: "col-11 col-sm-11 col-md-8 col-lg-8",
                    css: {
                        height: hr,
                        "background-color": "lightsteelblue",
                        overflow: "auto"
                    }
                }))
            );

        $("#mybookscanform")
            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        margin: "10px",
                        width: "100%"
                    }
                })
                .append($("<label/>", {
                    for: "myscansearch",
                    text: "Suche",
                    class: "col-sm-4 col-form-label"
                }))
                .append($("<div/>", {
                        class: "col-sm-8"
                    })
                    .append($("<input/>", {
                        id: "myscansearch",
                        class: "form-control myscansearch",
                        type: "text",
                        "data-mini": "true",
                        title: "ISBN-Barcode Scannen oder ISBN bzw. Titel per Tastatur eingeben oder diktieren 'Eingabefeld Suche <ISBN oder Titel>'"
                        //value: "0735619670"
                    }))

                )
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
                    id: "mybookscanb1",
                    title: "Diktieren 'Button Suchen' oder Click",
                    css: {
                        width: "40%",
                        "margin-left": "40%"
                    },
                    html: "Suchen",
                    click: function (evt) {
                        evt.preventDefault();
                        uihelper.clearMessage();
                        mybookscan.search();
                        $("input.markedactive").removeClass("markedactive");
                    }
                }))
            )

            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        margin: "10px",
                        width: "100%"
                    }
                })
                .append($("<label/>", {
                    for: "myscanbox",
                    text: "Box",
                    class: "col-sm-4 col-form-label"
                }))
                .append($("<div/>", {
                        class: "col-sm-8"
                    })
                    .append($("<input/>", {
                        id: "myscanbox",
                        class: "form-control myscanbox",
                        type: "text",
                        "data-mini": "true",
                        title: "Box, Regal o.ä. eingeben",
                        value: oldbox
                        //value: "0735619670"
                    }))
                )
            )


            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        margin: "10px",
                        width: "100%"
                    }
                })
                .append($("<label/>", {
                    for: "myscancomment",
                    text: "Kommentar",
                    class: "col-sm-4 col-form-label"
                }))
                .append($("<div/>", {
                        class: "col-sm-8"
                    })
                    .append($("<textarea/>", {
                        id: "myscancomment",
                        class: "form-control myscancomment",
                        "data-mini": "true",
                        title: "Kommentar",
                        rows: 5,
                        cols: 50
                        //value: "0735619670"
                    }))
                )
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
                    id: "mybookscanb2",
                    css: {
                        width: "40%",
                        "margin-left": "40%"
                    },
                    html: "Speichern",
                    click: function (evt) {
                        evt.preventDefault();
                        uihelper.clearMessage();
                        let comment = $("#myscancomment").val();
                        let box = $("#myscanbox").val();
                        let isbn = $("span.ISBN").attr("isbn");
                        if (typeof isbn === "string" && genhelper.isISBN(isbn)) {
                            mybookscan.storeData(isbn);
                            $("input.markedactive").removeClass("markedactive");
                        } else {
                            uihelper.putMessage("erst ein Buch anwählen, dann kann gespeichert werden", 3);
                        }
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
        $("#myscansearch").focus();
        mybookscan.speech();

    };



    $(document).on("change input", '.myscansearch', function (evt) {
        evt.preventDefault();
        let isbninput = $(this).val();
        if (genhelper.isISBN(isbninput)) {
            $("#mybookscanb1").click();
            return;
        }

    });

    /**
     * search
     */
    mybookscan.search = function () {
        // API-Aufruf booksearch
        let booksearch = $("#myscansearch").val();
        let jqxhr = $.ajax({
            method: "POST",
            crossDomain: false,
            url: "getbyisbn",
            data: {
                booksearch: booksearch
            }
        }).done(function (r1, textStatus, jqXHR) {
            let ret = JSON.parse(r1);
            $("body").css("cursor", "");
            //alert(JSON.parse(ret.book));
            let bookbox = $("#myscanbox").val();
            uihelper.setCookie("box", bookbox);
            activeBook = {};
            if (typeof ret.book === "object" && Object.keys(ret.book).length > 0) {
                activeBook = ret.book;
                mybookscan.showBook(ret.booksearch, ret.book, "#mybookscandata");
            } else if (typeof ret.booklist === "object" && Array.isArray(ret.booklist) && ret.booklist.length > 0) {
                mybookscan.showBookListe(ret.booksearch, ret.booklist, "#mybookscandata");
            } else {
                // hier wurde wirklich nichts gefunden
            }

            if (ret.error === false) {
                $("#myscansearch").val("");
            }
            $("#myscansearch").focus();
            return;
        }).fail(function (err) {
            alert(err);
            $("#myscansearch").focus();
            return;
        }).always(function () {
            // nope
        });
    };

    /**
     * showBook
     * @param {*} booksearch 
     * @param {*} book 
     * @param {*} container 
     */
    mybookscan.showBook = function (booksearch, book, datacontainer) {
        let hasthumb = false;

        $(datacontainer).children().remove();

        $(datacontainer)
            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        width: "100%",
                        "margin": "10px"
                    }
                })
                .append($("<button/>", {
                    class: "button-primary",
                    id: "mybookscanb3",
                    css: {
                        "margin-left": "10%",
                        width: "40%"
                    },
                    html: "Buchdaten editieren",
                    click: function (evt) {
                        evt.preventDefault();
                        uihelper.clearMessage();
                        $("#mybookscanb4").show();
                        let comment = $("#myscancomment").val();
                        let box = $("#myscanbox").val();
                        let isbn = $("span.ISBN").attr("isbn");
                        if (typeof isbn === "string" && genhelper.isISBN(isbn)) {
                            mybookscan.prepBook();
                            $("input.markedactive").removeClass("markedactive");
                            $("#mybookscanb3").hide();
                        } else {
                            uihelper.putMessage("erst ein Buch anwählen, dann kann gespeichert werden", 3);
                        }
                    }
                }))
                .append($("<button/>", {
                    class: "button-primary",
                    id: "mybookscanb4",
                    css: {
                        "margin-left": "10%",
                        width: "40%",
                        display: "none"
                    },
                    html: "Buchdaten speichern",
                    click: function (evt) {
                        evt.preventDefault();
                        uihelper.clearMessage();
                        let comment = $("#myscancomment").val();
                        let box = $("#myscanbox").val();
                        let isbn = $("span.ISBN").attr("isbn");
                        if (typeof isbn === "string" && genhelper.isISBN(isbn)) {
                            mybookscan.storeBookData(isbn);
                            $("input.markedactive").removeClass("markedactive");
                        } else {
                            uihelper.putMessage("erst ein Buch anwählen, dann kann gespeichert werden", 3);
                        }
                    }
                }))

            );
        let formcontainerid = $(datacontainer).attr("id") + "form";
        $(datacontainer)
            .append($("<div/>", {
                id: formcontainerid
            }));
        let container = "#" + formcontainerid;
        $(container)
            .append($("<br/>"));
        let bkeys = Object.keys(book);
        for (let ikey = 0; ikey < bkeys.length; ikey++) {
            let fieldname = bkeys[ikey];
            if (fieldname === "ISBN") {
                $(container)
                    .append($("<br/>"))
                    .append($("<span/>", {
                        html: bkeys[ikey] + " " + book[bkeys[ikey]],
                        class: "ISBN",
                        ISBN: book[bkeys[ikey]]
                    }));
            } else if (fieldname === "previewLink") {
                $(container)
                    .append($("<br/>"))
                    .append($("<a/>", {
                        href: book[fieldname],
                        target: "_blank",
                        html: fieldname + ": " + book[fieldname]
                    }));
            } else if (fieldname === "infoLink") {
                $(container)
                    .append($("<br/>"))
                    .append($("<a/>", {
                        href: book[fieldname],
                        target: "_blank",
                        html: fieldname + ": " + book[fieldname]
                    }));
            } else if (fieldname === "imageLinks") {
                let thumbnail = book[fieldname].thumbnail;
                if (typeof thumbnail !== "undefined" && thumbnail.length > 0) {
                    $(container)
                        .append($("<br/>"))
                        .append($("<img/>", {
                            src: thumbnail,
                            title: fieldname + ": " + thumbnail
                        }));
                } else {
                    let smallThumbnail = book[fieldname].smallThumbnail;
                    if (typeof smallThumbnail !== "undefined" && smallThumbnail.length > 0) {
                        $(container)
                            .append($("<br/>"))
                            .append($("<img/>", {
                                src: smallThumbnail,
                                title: fieldname + ": " + smallThumbnail
                            }));
                    }
                }
            } else if (fieldname === "thumbnail" && book.thumbnail.length > 0 && hasthumb === false) {
                hasthumb = true;
                let thumbnail = book.thumbnail;
                $(container)
                    .append($("<br/>"))
                    .append($("<img/>", {
                        src: thumbnail,
                        title: fieldname + ": " + thumbnail
                    }));
            } else if (fieldname === "smallThumbnail" && book.smallThumbnail.length > 0 && hasthumb === false) {
                hasthumb = true;
                let smallThumbnail = book.smallThumbnail;
                $(container)
                    .append($("<br/>"))
                    .append($("<img/>", {
                        src: smallThumbnail,
                        title: fieldname + ": " + smallThumbnail
                    }));
            } else if (fieldname === "bookcomment") {
                $("#myscancomment").val(book.bookcomment);
            } else if (fieldname === "bookbox") {
                $("#myscanbox").val(book.bookbox);
            } else {
                $(container)
                    .append($("<br/>"))
                    .append($("<span/>", {
                        html: bkeys[ikey] + " " + book[bkeys[ikey]]
                    }));
            }
        }
        if (typeof book.authors === "string" && book.authors.startsWith("[")) {
            book.authors = JSON.parse(book.authors);
        }
        let authors = book.authors.join(";");
        $("#bookhistory")
            .prepend($("<li/>", {
                html: "<b>" + book.title + " " + (book.subtitle || "") + "</b>" + " " + authors
            }));
    };


    /**
     * showBookListe
     * @param {*} booksearch - Titelsuche 
     * @param {*} bookliste - Array von Büchern als Trefferliste
     * @param {*} container 
     */
    mybookscan.showBookListe = function (booksearch, bookliste, container) {
        $(container).children().remove();
        $(container)
            .append($("<br/>"));
        $(container)
            .append($("<ul/>", {
                id: "mybookliste"
            }));
        bookliste.forEach(function (book, ibook) {
            let html = ibook + ". " + book.title + " " + JSON.stringify(book);
            let pubyear = book.publish_year.split(", ");
            if (pubyear.length > 5) {
                pubyear = pubyear.slice(0, 5).join(", ");
                pubyear += " ...";
            } else {
                pubyear = pubyear.join(", ");
            }

            $("#mybookliste")
                .append($("<li/>")
                    .append($("<span/>", {
                        html: "<b>" + book.title + "</b>"
                    }))
                    .append($("<span/>", {
                        css: {
                            "margin-left": "10px"
                        },
                        html: book.author_name + " " + pubyear
                    }))
                    .append($("<br/>"))
                    .append($("<span/>", {
                        id: "mybookliste" + (ibook + 1)
                    }))
                );

            let isbncontainer = "#mybookliste" + (ibook + 1);
            let isbncontainerx = isbncontainer + "x";
            let isbncontainerm = isbncontainer + "m";
            let isbns = book.ISBN.split(", ");
            isbns.forEach(function (isbn, iisbn) {
                if (iisbn <= 4) {
                    $(isbncontainer)
                        .append($("<button/>", {
                            class: "mybookscanchoice",
                            isbn: isbn,
                            html: (ibook + 1) + "," + (iisbn + 1)
                        }))
                        .append($("<span/>", {
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
                            class: "mybookscanchoice",
                            isbn: isbn,
                            html: (ibook + 1) + "," + (iisbn + 1)
                        }))
                        .append($("<span/>", {
                            html: isbn
                        }));
                }
            });
        });

    };

    $(document).on("click", ".mybookscanchoice", function (evt) {
        evt.preventDefault();
        let isbn = $(this).attr("isbn");
        $("#myscansearch").val(isbn);
        $("#mybookscanb1").click();
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
     * prepBook - Vorbereiten zum Editieren
     * @returns 
     */
    mybookscan.prepBook = function () {
        // Anzeigen zur Editierung
        if (Object.keys(activeBook).length === 0) {
            return;
        }
        let book = activeBook;
        let hasthumb = false;
        let container = "#mybookscandataform";
        $(container).children().remove();
        $(container)
            .append($("<br/>"));
        let bkeys = Object.keys(book);
        for (let ikey = 0; ikey < bkeys.length; ikey++) {
            let fieldname = bkeys[ikey];
            if (fieldname === "ISBN") {
                $(container)
                    .append($("<br/>"))
                    .append($("<span/>", {
                        html: "<b>" + bkeys[ikey] + "</b> " + book[bkeys[ikey]],
                        class: "ISBN",
                        ISBN: book[bkeys[ikey]]
                    }));
            } else if (fieldname === "previewLink") {
                $(container)
                    .append($("<br/>"))
                    .append($("<a/>", {
                        href: book[fieldname],
                        target: "_blank",
                        html: fieldname + ": " + book[fieldname]
                    }));
            } else if (fieldname === "infoLink") {
                $(container)
                    .append($("<br/>"))
                    .append($("<a/>", {
                        href: book[fieldname],
                        target: "_blank",
                        html: fieldname + ": " + book[fieldname]
                    }));
            } else if (fieldname === "imageLinks") {
                let thumbnail = book[fieldname].thumbnail;
                if (typeof thumbnail !== "undefined" && thumbnail.length > 0) {
                    $(container)
                        .append($("<br/>"))
                        .append($("<img/>", {
                            src: thumbnail,
                            title: fieldname + ": " + thumbnail
                        }));
                } else {
                    let smallThumbnail = book[fieldname].smallThumbnail;
                    if (typeof smallThumbnail !== "undefined" && smallThumbnail.length > 0) {
                        $(container)
                            .append($("<br/>"))
                            .append($("<img/>", {
                                src: smallThumbnail,
                                title: fieldname + ": " + smallThumbnail
                            }));
                    }
                }
            } else if (fieldname === "thumbnail" && book.thumbnail.length > 0 && hasthumb === false) {
                hasthumb = true;
                let thumbnail = book.thumbnail;
                $(container)
                    .append($("<br/>"))
                    .append($("<img/>", {
                        src: thumbnail,
                        title: fieldname + ": " + thumbnail
                    }));
            } else if (fieldname === "smallThumbnail" && book.smallThumbnail.length > 0 && hasthumb === false) {
                hasthumb = true;
                let smallThumbnail = book.smallThumbnail;
                $(container)
                    .append($("<br/>"))
                    .append($("<img/>", {
                        src: smallThumbnail,
                        title: fieldname + ": " + smallThumbnail
                    }));
            } else if ("tsserverupd,iostatus,industryIdentifiers".indexOf(fieldname) >= 0) {
                $(container)
                    .append($("<br/>"))
                    .append($("<span/>", {
                        html: "<b>" + bkeys[ikey] + "</b> " + book[bkeys[ikey]]
                    }));
            } else if (typeof book[fieldname] === "object") {
                $(container)
                    .append($("<br/>"))
                    .append($("<span/>", {
                        html: "<b>" + bkeys[ikey] + "</b> " + book[bkeys[ikey]]
                    }));
            } else {
                /*
                $(container)
                    .append($("<br/>"))
                    .append($("<span/>", {
                        html: "<b>" + bkeys[ikey] + "</b> " + book[bkeys[ikey]]
                    }));
                */
                $(container)
                    .append($("<div/>", {
                            class: "form-group row",
                            css: {
                                width: "100%"
                            }
                        })
                        .append($("<label/>", {
                            for: bkeys[ikey],
                            text: bkeys[ikey],
                            class: "col-sm-3 col-form-label"
                        }))
                        .append($("<div/>", {
                                class: "col-sm-9"
                            })
                            .append($("<input/>", {
                                id: bkeys[ikey],
                                class: "form-control mybookinput",
                                type: "text",
                                "data-mini": "true",
                                //title: "Box, Regal o.ä. eingeben",
                                value: book[bkeys[ikey]]
                                //value: "0735619670"
                            }))
                        )
                    );
            }
        }
    };



    /**
     * storeData
     */
    mybookscan.storeData = function (isbn) {
        // API-Aufruf Erfassen Kommentar und Box
        let bookbox = $("#myscanbox").val();
        let bookcomment = $("#myscancomment").val();
        uihelper.setCookie("box", bookbox);
        let jqxhr = $.ajax({
            method: "POST",
            crossDomain: false,
            url: "putinfobyisbn",
            data: {
                isbn: isbn,
                bookbox: bookbox,
                bookcomment: bookcomment,
                booktitle: activeBook.title,
                booksubtitle: activeBook.subtitle || ""
            }
        }).done(function (r1, textStatus, jqXHR) {
            let ret = JSON.parse(r1);
            $("body").css("cursor", "");
            //alert(JSON.parse(ret.book));
            return;
        }).fail(function (err) {
            alert(err);
            $("#myscansearch").focus();
            return;
        }).always(function () {
            // nope
        });
    };


    /**
     * storeBookData
     */
    mybookscan.storeBookData = function (isbn) {
        // API-Aufruf Erfassen Kommentar und Box
        let bookbox = $("#myscanbox").val();
        // nur netto-Änderungen
        // INPUT in container mybookscandataform
        // Abgleich mit activeBook
        let selfields = {
            ISBN: isbn
        };
        let insfields = {
            ISBN: isbn
        };
        let updfields = {};
        let table = "MYBOOKS";
        $('#mybookscandataform input').each(function (index, inputfeld) {
            console.log($(inputfeld).val());
            let id = $(inputfeld).attr("id");
            let oldvalue = activeBook[id];
            let newvalue = $(inputfeld).val();
            if (typeof oldvalue === typeof newvalue) {
                if (oldvalue !== newvalue) {
                    updfields[id] = newvalue;
                }
            } else {
                if (typeof oldvalue === "object" && Array.isArray(oldvalue) && typeof newvalue === "string") {
                    let newarray = newvalue.split(",");
                }
            }
        });
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
                $("#myscansearch").focus();
                return;
            }).always(function () {
                // nope
            });
        }
    };





    /**
     * speech - start recognition and operate speech input
     * dynamic recognition of focus-input fields and put input
     * keywords: Eingabefeld <Feldname> <Texteingabe> 
     *       und Button <Buttontext>
     * @returns 
     * https://codepen.io/GeorgePark/pen/gKrVJe wohl interessant
     * https://wiki.mozilla.org/Web_Speech_API_-_Speech_Recognition für NMozilla
     */
    mybookscan.speech = function () {

        //DOM load event
        window.addEventListener("DOMContentLoaded", function () {
            if(navigator.userAgent.indexOf("Chrome") < 0 &&  navigator.userAgent.indexOf("Edge") < 0) {
                console.log("Browser nicht getestet für Speech-Recognition");
                $("#microphoneok").html("&#x1F3A4;");
                $("#microphoneok").css("background-color", "red");
                return;
            }
            if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
                console.log("speech recognition API supported");
                $("#microphoneok").html("&#x1F3A4;");
                $("#microphoneok").css("background-color", "green");
                $("#microphoneok").attr("title", "Spracheingabe ist möglich");
            } else {
                console.log("speech recognition API not supported");
                $("#microphoneok").html("&#x1F3A4;");
                $("#microphoneok").css("background-color", "red");
            }

            //Set speech recognition
            // window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            // https://gist.github.com/alrra/3784549
            window.SpeechRecognition = window.webkitSpeechRecognition ||
                window.mozSpeechRecognition ||
                window.msSpeechRecognition ||
                window.oSpeechRecognition ||
                window.SpeechRecognition;

            const recognition = new SpeechRecognition();

            recognition.lang = "de-DE";
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            //Start speech recognition
            try {
                recognition.start();
                $("#microphoneok").html("&#x1F3A4;");
                $("#microphoneok").css("background-color", "green");
                $("#microphoneok").attr("title", "Spracheingabe ist möglich");
            } catch (err) {
                $("#microphoneok").html("&#x1F3A4;");
                $("#microphoneok").css("background-color", "red");
            }

            //Listen for when the user finishes talking
            recognition.addEventListener('result', function (e) {
                $("input.markedactive").removeClass("markedactive");
                //Get transcript of user speech & confidence percentage
                let transcript = e.results[0][0].transcript.toLowerCase(); //.replace(/\s/g, ''),
                let confidence = (e.results[0][0].confidence * 100).toFixed(1);

                //Check transcript
                transcript = transcript.trim();
                console.log("Erkannt (" + confidence + "):" + transcript);
                if (transcript.startsWith("eingabefeld")) {
                    //alert("EINGABEFELD:" + transcript);
                    let words = transcript.split(/\s+/);
                    // es werden alle label-Texte analysiert
                    $('label').each(function (index, label) {
                        console.log($(label).text());
                        let ltext = $(label).text();
                        let wtext = ltext.toLowerCase();
                        let lwords = wtext.split(/\s+/);
                        // words gegen lwords
                        let firstinput = -1;
                        if (words[1] === lwords[0]) {
                            // nix, wenn es zum Feld keine Eingabe gibt oder keine erkannt wurde!
                            if (words.length <= 2) {
                                return;
                            }
                            firstinput = 2;
                            // in jedem Fall ein Treffer, Konvention solle ein Wort sei, also SKIP-Check
                            let llen = lwords.length;
                            for (let i = 2; i < words.length; i++) {
                                if (i >= llen) {
                                    break;
                                }
                                if (words[i] === lwords[i - 1]) {
                                    // skip word, das noch zum Label gehört
                                    firstinput = i;
                                } else {
                                    break;
                                }
                            }
                            if (firstinput > -1) {
                                let newtext = words.slice(firstinput).join(" ");
                                // find input field
                                let inputid = $(label).attr("for");
                                $("#" + inputid).removeClass("markedactive");
                                $("#" + inputid).addClass("markedactive");
                                if (ltext.startsWith("Suche")) {
                                    // dediziert prüfen ISBN mit spezieller Aufbereitung
                                    let isbncandidate = newtext;
                                    isbncandidate = isbncandidate.replace(/-/g, "");
                                    isbncandidate = isbncandidate.replace(/ /g, "");
                                    if (genhelper.isISBN(isbncandidate)) {
                                        console.log("ISBN-Suche:" + isbncandidate);
                                        $("#" + inputid).val(isbncandidate);
                                        $("#mybookscanb1").click();
                                        return false;
                                    }
                                }
                                console.log("Eingabefeld " + ltext + ":" + newtext);
                                $("#" + inputid).val(newtext);
                                return false;
                            }
                        }

                        /*
                        var forAttr = $(this).attr('for');
                        $next = $(this).next();
                        if($next.attr('id') == forAttr) {
                            $(this).attr('for', forAttr + index);
                            $next.attr('id', forAttr + index);
                        }
                        */
                    });


                } else if (transcript.startsWith("button")) {
                    // alert("BUTTON:" + transcript);
                    let transcript1 = transcript.replace(/\./g, "");
                    let words = transcript1.split(/\s+/);
                    let transtext = words.slice(1).join(" ");
                    let found = false;
                    // es werden alle Button-Texte analysiert
                    // die Texte müssen immer komplett gesprochen werden
                    $('button').each(function (index, button) {
                        console.log($(button).text());
                        let btext = $(button).text();
                        let btextlow = btext.toLowerCase();
                        if (transtext === btextlow) {
                            $(button).click();
                            found = true;
                            return false;
                        }
                    });

                    // es kann auch input type=button,submit, geben, wäre zweiter Ansatz

                    // es gibt auch ICONs, die haben eigentlich keine Beschrifung

                } else {
                    //alert("UNCLEAR:" + transcript);
                    // check active 
                    
                    let focusedField = document.activeElement;
                    if (focusedField !== null && typeof focusedField !== "undefined" && focusedField.tagName === "TEXTAREA" ) {
                        let oldtext = $(focusedField).val();
                        $(focusedField).val(oldtext + "\n" + transcript);
                    } else {
                        uihelper.beep();
                        navigator.clipboard.writeText(transcript);
                    }
                }
            });

            recognition.onstart = function (event) {
                if (typeof event !== "undefined" && typeof event.error !== "undefined" && event.error !== null) {
                    console.log(event.error);
                }
            };

            recognition.onerror = function (event) {
                console.log(event.error);
                if (event.error !== "no-speech") {
                    $("#microphoneok").html("&#x1F3A4;");
                    $("#microphoneok").css("background-color", "red");
                    $("#microphoneok").attr("title", event.error);
                }
            };

            //Restart speech recognition after user has finished talking
            recognition.addEventListener('end', recognition.start);
            /*
            recognition.addEventListener('end', function () {
                console.log("end");
                try {
                    recognition.start();
                    console.log("neuer Start");
                } catch (err) {
                    console.log(err.stack);
                }
            });
            */

        });

    };

    /**
     * standardisierte Mimik zur Integration mit App, Browser und node.js
     */
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = mybookscan;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return mybookscan;
        });
    } else {
        // included directly via <script> tag
        root.mybookscan = mybookscan;
    }
}());