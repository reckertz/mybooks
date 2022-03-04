/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*global $,window,module,document,define,root,global,self,var,this,sysbase,uihelper */
/*global uientry,planetaryjs, */
(function () {
    "use strict";
    //
    let mybookscan = {};

    let root = (typeof self === 'object' && self.self === self && self) || (typeof global === 'object' && global.global === global && global) || this;

    mybookscan.show = function () {
        uihelper.init("online");

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
                    text: "ISBN oder Titel",
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
                        title: "Barcode Scannen oder eingeben"
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
                        title: "Box, Regal o.ä. eingeben"
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
        var jqxhr = $.ajax({
            method: "POST",
            crossDomain: false,
            url: "getbyisbn",
            data: {
                booksearch: booksearch,
                bookbox: $("#myscanbox").val(),
                bookcomment: $("#myscancomment").val()
            }
        }).done(function (r1, textStatus, jqXHR) {
            var ret = JSON.parse(r1);
            $("body").css("cursor", "");
            //alert(JSON.parse(ret.book));
            mybookscan.showBook(ret.booksearch, ret.book, "#mybookscandata");
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

    mybookscan.showBook = function (booksearch, book, container) {
        let hasthumb = false;
        $(container).children().remove();
        $(container)
            .append($("<br/>"))
            .append($("<span/>", {
                html: "ISBN" + " " + booksearch
            }));
        let bkeys = Object.keys(book);
        for (let ikey = 0; ikey < bkeys.length; ikey++) {
            let fieldname = bkeys[ikey];
            if (fieldname === "previewLink") {
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
            } else if (fieldname === "smallThumbnail" && book.smallThumbnail.length > 0  && hasthumb === false) {
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