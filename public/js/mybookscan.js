/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper */
/*global uientry,planetaryjs,SpeechRecognition */
(function () {
    "use strict";
    //
    let mybookscan = {};

    let root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global) || this;

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
                        title: "Barcode Scannen oder ISBN eingeben oder Titel eingeben"
                        //value: "0735619670"
                    }))

                )
            )

            .append($("<div/>", {
                    class: "form-group row",
                    css: {
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
                        width: "100%"
                    }
                })
                .append($("<label/>", {
                    for: "myscancomment",
                    text: "Comment",
                    class: "col-sm-4 col-form-label"
                }))
                .append($("<div/>", {
                        class: "col-sm-8"
                    })
                    .append($("<input/>", {
                        id: "myscancomment",
                        class: "form-control myscancomment",
                        type: "text",
                        "data-mini": "true",
                        title: "Kommentar"
                        //value: "0735619670"
                    }))
                )
            )



            .append($("<div/>", {
                    class: "form-group row",
                    css: {
                        width: "100%",
                        "margin-top": "20px"
                    }
                })
                .append($("<button/>", {
                    class: "button-primary",
                    id: "mybookscanb1",
                    css: {
                        width: "40%"
                    },
                    html: "Suchen",
                    click: function (evt) {
                        evt.preventDefault();
                        mybookscan.search();
                        $("input.markedactive").removeClass("markedactive");
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

    mybookscan.search = function () {
        // API-Aufruf booksearch
        let booksearch = $("#myscansearch").val();
        let jqxhr = $.ajax({
            method: "POST",
            crossDomain: false,
            url: "getbyisbn",
            data: {
                booksearch: booksearch,
                bookbox: $("#myscanbox").val(),
                bookcomment: $("#myscancomment").val()
            }
        }).done(function (r1, textStatus, jqXHR) {
            let ret = JSON.parse(r1);
            $("body").css("cursor", "");
            //alert(JSON.parse(ret.book));
            let bookbox = $("#myscanbox").val();
            uihelper.setCookie("box", bookbox);
            if (typeof ret.book === "object" && Object.keys(ret.book).length > 0) {
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
    mybookscan.showBook = function (booksearch, book, container) {
        let hasthumb = false;
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
            $("#mybookliste")
                .append($("<li/>", {
                    html: html
                }));
        });




    };

    /**
     * speech - start recognition and operate speech input
     * dynamic recognition of focus-input fields and put input
     * keywords: Eingabefeld <Feldname> <Texteingabe> 
     *       und Button <Buttontext>
     * @returns 
     * https://codepen.io/GeorgePark/pen/gKrVJe wohl interessant
     */
    mybookscan.speech = function () {

        //DOM load event
        window.addEventListener("DOMContentLoaded", function () {

            //Set speech recognition
            window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognition = new SpeechRecognition();

            recognition.lang = "de-DE";
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            //Start speech recognition
            recognition.start();

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
                    let words = transcript.split(/\s+/);
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
                    uihelper.beep();
                }

            });

            //Restart speech recognition after user has finished talking
            recognition.addEventListener('end', recognition.start);

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