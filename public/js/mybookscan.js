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
                    })
                    .append($("<table/>", {
                        id: "mybookscant1",
                        css: {
                            width: "100%"
                        }
                    }))
                )
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
                        class: "form-control",
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
            alert(JSON.parse(ret.book));
            return;
        }).fail(function (err) {
            alert(err);
            return;
        }).always(function () {
            // nope
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