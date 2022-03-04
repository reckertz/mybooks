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
                        title: "Barcode Scannen oder eingeben",
                        value: "0735619670"
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
            );


    };



    $(document).on("change", '.myscansearch', function () {
        let isbninput = $(this).val();
        isbninput = isbninput.replace(/-/g, "");
        isbninput = isbninput.replace(/ /g, "");
        if (isbninput.trim().length === 10) {
            // dedizierte Prüfung
            let sum = 0;
            let isbnok = false;
            for (let i = 0; i < 9; i++) {
                let num = parseInt(isbninput.substr(i, 1));
                sum += (i + 1) * num;
            }
            let pz = sum % 11;
            if (pz !== 10) {
                if (pz !== parseInt(isbninput[9])) {
                    return; // falsche ISBN-10
                } else {
                    $("#mybookscanb1").click();
                }
            } else {
                if (isbninput.substr(9, 1) === "X" || isbninput.substr(9, 1) === "0") {
                    $("#mybookscanb1").click();
                }
            }
        }
        if (isbninput.trim().length === 13) {
            // dedizierte Prüfung
            let sum = 0;
            let isbnok = false;
            for (let i = 0; i < 12; i++) {
                let num = parseInt(isbninput.substr(i, 1));
                let z = i + 1;
                if (z % 2 === 0) {
                    sum += 3 * num; // geradzahlig
                } else {
                    sum += num; // ungeradzahlig
                }
                console.log(z + ":" + i + " num:" + num + " sum: " + sum);
            }
            //let pz = (10 - sum % 10) % 10;
            let pz = sum % 10;
            pz = 10 - pz;
            pz = pz % 10;
            console.log(isbninput + "=>" + sum + "=>" + pz);
            if (pz !==  parseInt(isbninput.substr(12, 1))) {
                return; // falsche ISBN-13
            } else {
                $("#mybookscanb1").click();
            }
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
                booksearch: booksearch
            }
        }).done(function (r1, textStatus, jqXHR) {
            var ret = JSON.parse(r1);
            $("body").css("cursor", "");
            //alert(JSON.parse(ret.book));
            mybookscan.showBook(ret.book, "#mybookscandata");
            return;
        }).fail(function (err) {
            alert(err);
            return;
        }).always(function () {
            // nope
        });
    };

    mybookscan.showBook = function (book, container) {
        $(container).children().remove();
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
            } else {
                $(container)
                    .append($("<br/>"))
                    .append($("<span/>", {
                        html: bkeys[ikey] + " " + book[bkeys[ikey]]
                    }));
            }
        }

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