/*jshint esversion:6,laxbreak:true,evil:true,sub:true */
/*global $,uihelper,sysbase,dotize,console,root,global,self,document,uientry,define */
/*global async */
(function () {
    "use strict";
    let mybooksplash = {};

    let root = typeof self === 'object' && self.self === self && self ||
        typeof global === 'object' && global.global === global && global ||
        this;

    let userdata;

    let myidcode = "mybooksplash";
    let myidhash = "#" + myidcode;

    let options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };

    mybooksplash.show = function () {
        /**
         * mybooksplash - generische Kontrolle Tabellen und JSON-Inhalte
         */
        // uihelper.init("online");

        $("body").removeClass("overflow-hidden");
        $("body").addClass("overflow-hidden");
        if ($(".klicontainer").length <= 0) {
            $("body")
                .append($("<div/>", {
                        class: "container-fluid klicontainer",
                        pageid: "mybooksplash",
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

        if (document.title != "Welcome in MYBOOKS") {
            document.title = "Welcome in MYBOOKS";
        }
        $('meta[name="description"]').attr("content", "Welcome in MYBOOKS");

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
                    class: "col-12,col-sm-8,col-md-4,col-lg-2,col-xl-2",
                    id: "mybooksplashc1wrapper",
                    css: {
                        "background-color": "white",
                        display: "block",
                        "text-align": "center",
                        overflow: "auto"
                    }
                })
                .append($("<div/>", {
                    id: "mybooksplashc1",
                    css: {
                        width: "100%"
                    }
                }))
            );

        $("#mybooksplashc1")
            .append($("<h2/>", {
                html: "Willkommen bei MYBOOKS",
                css: {
                    "background-color": "yellow"
                }
            }));
        $("#mybooksplashc1")
            .append($("<h3/>", {
                html: "Scanne, erfasse und kommentiere Deine Bücher mit MYBOOKS",
            }));
        $("#mybooksplashc1")
            .append($("<p/>", {
                    class: "marquee"
                })

                .append($("<span/>", {
                    html: "&#x1F4DA;"
                }))

                .append($("<span/>", {
                    html: "&#x1F4D5;"
                }))

                .append($("<span/>", {
                    html: "&#x1F4D7;"
                }))

                .append($("<span/>", {
                    html: "&#x1F4D8;"
                }))

                .append($("<span/>", {
                    html: "&#x1F4D9;"
                }))

                .append($("<span/>", {
                    html: "&#x1F4DA;"
                }))
            );
        let logindata = {
            username: "",
            welcome: ""
        };
        //let userdata = {};
        userdata = uihelper.getLoginData();
        let userstring = uihelper.getCookie("user");
        if (userstring === null) {
            userdata = {
                username: "",
                lastcall: ""
            };
            $("#mybooksplashc1")
                .append($("<div/>", {
                        class: "form-group row",
                        css: {
                            width: "100%",
                            display: "block"
                        }
                    })
                    .append($("<label/>", {
                        for: "username",
                        text: "Dein Name",
                        class: "col-sm-3 col-form-label"
                    }))
                    .append($("<div/>", {
                            class: "col-sm-9"
                        })
                        .append($("<input/>", {
                            id: "username",
                            title: "Bitte den Vornamen oder Nickname eingeben",
                            class: "form-control username",
                            type: "text",
                            "data-mini": "true",
                            value: ""
                        }))
                    )
                );
        } else {
            if (typeof userstring === "string") {
                userdata = JSON.parse(userstring);
            } else {
                userdata = userstring;
            }

            logindata.username = userdata.username;
            $("#mybooksplashc1")
                .append($("<br/>"))
                .append($("<h3/>", {
                    html: "Hi " + logindata.username + ",<br> schön, dass Du wieder da bist"
                }));
        }

        let html = "";
        let doenter = false;
        if (userdata.lastcall !== "") {
            // Differenz berechnen
            let startDate = new Date(userdata.lastcall);
            let endDate = new Date();
            let diffInMs = new Date(endDate) - new Date(startDate);
            let diffInDays = diffInMs / (1000 * 60 * 60 * 24);

            if (diffInDays > 3) {
                logindata.welcome = "Schön, dass Du nach " + Math.floor(diffInDays) + " Tagen MYBOOKS weiter benutzt.";
            }
            logindata.welcome += "<br>";
            logindata.welcome += "letzter Aufruf:";
            logindata.welcome += startDate.toLocaleDateString('de-DE', options);
        }

        $("#mybooksplashc1")
            .append($("<h3/>", {
                html: logindata.welcome
            }));

        if (logindata.username === "") {
            $("#mybooksplashc1")
                .append($("<button/>", {
                    text: "Bitte den Namen eingeben und dann hier clicken",
                    click: function (evt) {
                        evt.preventDefault();
                        logindata.username = $("#username").val();
                        if (logindata.username.trim().length < 1) {
                            alert("Bitte einen Namen eingeben");
                            return;
                        }
                        let now = new Date();
                        userdata = uihelper.getLoginData();
                        userdata.username = logindata.username;
                        userdata.lastcall = now.toISOString();

                        uihelper.setCookie("user", JSON.stringify(userdata));
                        uihelper.navigateTo("mybookscan.show", {
                            cb6000: function (err) {

                            }
                        });
                    }
                }));
        } else {
            $("#mybooksplashc1")
                .append($("<button/>", {
                    text: "Weiter",
                    css: {
                        "font-size": "30px",
                        "font-weight": "bold",
                        margin: "5px"
                    },
                    click: function (evt) {
                        evt.preventDefault();
                        let now = new Date();
                        userdata = uihelper.getLoginData();
                        userdata.username = logindata.username;
                        userdata.lastcall = now.toISOString();

                        uihelper.setCookie("user", JSON.stringify(userdata));
                        uihelper.navigateTo("mybookscan.show", {
                            cb6000: function (err) {

                            }
                        });
                    }
                }));
        }


        // capability Tests
        // Unicode Character 'BLACK DOWN-POINTING TRIANGLE' (U+25BC)
        // html: "&#x25BC; " + table.text
        // https://unicode-table.com/en/sets/check/
        // html: "&#x2705;" // OK Haken grün
        // html: "&#x274C;" // Nicht OK Diagonalkreuz rot
        let statuscontainerid = "mybooksplashc1" + "st";
        let statuscontainerhash = "#" + statuscontainerid;
        $("#mybooksplashc1")
            .append($("<br/>"));
        $("#mybooksplashc1")
            .append($("<p/>", {
                id: statuscontainerid,
                css: {
                    width: "400px",
                    "text-align": "left",
                    "margin-top": "10px",
                    display: "inline-block",
                }
            }));
        let devicename = "";
        if (navigator.userAgent.match(/Android/i)) {
            devicename = "Android";
            devidename += " Mobile";
        } else if (navigator.userAgent.match(/BlackBerry/i)) {
            devicename = "BlackBerry";
            devidename += " Mobile";
        } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
            devicename = "Apple";
            devidename += " Mobile";
        } else if (navigator.userAgent.match(/Opera Mini/i)) {
            devicename = "Opera";
            devidename += " Mobile";
        } else if (navigator.userAgent.match(/IEMobile/i)) {
            devicename = "IE";
            devidename += " Mobile";
        } else {

        }
        if (devicename !== "") {
            $(statuscontainerhash)
                .append($("<span/>", {
                    html: "&#x2705; " + devicename
                }));
        } else {
            $(statuscontainerhash)
                .append($("<span/>", {
                    html: "&#x2705; " + navigator.userAgent
                }));
        }

        $(statuscontainerhash)
            .append($("<br/>"));

        let displaytype = "";
        if (window.innerWidth < 768) {
            // Extra Small Device
            displaytype = "xs";
        } else if (window.innerWidth < 991) {
            // Small Device
            displaytype = "sm";
        } else if (window.innerWidth < 1199) {
            // Medium Device
            displaytype = "md";
        } else {
            // Large Device
            displaytype = "lg";
        }
        $(statuscontainerhash)
            .append($("<span/>", {
                html: "&#x2705; " + displaytype
            }));

    };

    mybooksplash.showclock = function (clockcontainer) {
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
        module.exports = mybooksplash;
    } else if (typeof define === 'function' && define.amd) {
        // AMD / RequireJS
        define([], function () {
            return mybooksplash;
        });
    } else {
        // included directly via <script> tag
        root.mybooksplash = mybooksplash;
    }
}());