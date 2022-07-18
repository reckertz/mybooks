// Snag our button
let btn = document.getElementById("getofferings");

// Set our button's color to the color that we stored
chrome.storage.sync.get("color", ({
    color
}) => {
    btn.style.backgroundColor = color
});

// Run on click
btn.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    }); // Find current tab

    chrome.scripting.executeScript({ // Run the following script on our tab
        target: {
            tabId: tab.id
        },
        function () {
            let purchasables = document.querySelectorAll('[data-cy="isbn-result-purchasable-item"]');
            let results = [];
            if (typeof purchasables !== "undefined" && purchasables !== null && purchasables.length > 0) {
                for (let i = 0; i < purchasables.length; i++) {
                    let ISBN = purchasables[i].getElementsByClassName("mb-1");
                    let price = purchasables[i].getElementsByClassName("bulk-isbn-result");
                    let ISBNtext = "";
                    for (let j = 0; j < ISBN.length; j++) {
                        ISBNtext += ISBN[j].innerText + ";";
                    }
                    let pricetext = "";
                    for (let j = 0; j < price.length; j++) {
                        pricetext += price[j].innerText + ";";
                    }
                    console.log(i, ISBNtext, pricetext);
                    results.push({
                        ISBN: ISBNtext,
                        price: pricetext
                    });
                }
                // Übergeben an eigenen Server
                fetch("https://localhost:3031/setofferings", {
                        method: 'POST',
                        headers: {
                            'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
                            'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
                        },
                        body: 'results=' + JSON.stringify(results)
                    })
                    // https://stackoverflow.com/questions/71008162/how-can-i-fetch-data-in-my-content-script-chrome-extension
                    /*
                    .then(function (response) {
                        console.log("after fetch");
                        debugger;
                        if (response.status !== 200) {
                            console.log('Looks like there was a problem. Status Code: ' +
                                response.status);
                            let result = document.getElementById("result");
                            result.text = JSON.stringify({
                                error: true,
                                message: response.status
                            });
                        }
                    })
                    */
                    .then(function (response) {
                        console.log("sendResponse");
                        return(JSON.stringify({
                            error: false,
                            message: "OK",
                            data: response
                        }));
                        /*
                        response.json().then(function (data) {
                            console.log(data);
                            debugger;
                            return(JSON.stringify({
                                error: false,
                                message: "OK",
                                data: data
                            }));
                        });
                        */
                    })

                    .catch(function (err) {
                        console.log('Fetch Error :-S', err);
                        let result = document.getElementById("result2");
                        result.text = JSON.stringify({
                            error: true,
                            message: "Error"
                        });
                    });
                /*
                .then(response => response.json())
                .then(function (response) {
                    console.log(response.json);
                })
                .then(response => sendResponse(response))
                .catch(error => console.log('Error:', error));
                */
            }
        },
        function (res) {
            // diese Funktion wird von chrome aufgerufen, nachdem die o.a. Funktion beendet wurde
            // es wird res übergeben als String oder JSON, DOM-Objekte sind nicht zugelassen
            console.log("Response:" + res);
            let result = document.getElementById("result2");
            result.text = res;
        }

    });
});