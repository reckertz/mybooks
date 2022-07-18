// Snag our button
let btn = document.getElementById("getofferings");

chrome.runtime.onConnect.addListener(function (port) {
    console.assert(port.name === "knockknock");
    port.onMessage.addListener(function (msg) {
        // unbedingt die u.a. Mimik, sonst geht es nicht.
        console.log("Auswertung beendet");
        document.querySelector('#result2').innerHTML = JSON.stringify(msg);
    });
});

// Run on click
btn.addEventListener("click", async () => {
    let x = "test";
    let [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    }); // Find current tab
    console.log("Auswertung starten");
    chrome.scripting.executeScript({ // Run the following script on our tab
        target: {
            tabId: tab.id
        },
        function (x) {
            alert(x);
            let results = [];

            let purchasables = document.querySelectorAll('[data-cy="isbn-result-purchasable-item"]');
            if (typeof purchasables !== "undefined" && purchasables !== null && purchasables.length > 0) {
                for (let i = 0; i < purchasables.length; i++) {
                    let innertext = purchasables[i].innerText;
                    results.push({
                        type: "purchasable",
                        innertext: innertext
                    });
                    if (1 === 1) continue;

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
            }

            let unknowns = document.querySelectorAll('[data-cy="isbn-result-not-found-item"]');
            if (typeof unknowns !== "undefined" && unknowns !== null && unknowns.length > 0) {
                for (let i = 0; i < unknowns.length; i++) {
                    let innertext = unknowns[i].innerText;
                    results.push({
                        type: "unknown",
                        innertext: innertext
                    });
                    if (1 === 1) continue;

                    //      class="col">
                    // <strong _ngcontent-rebuy-app-c59="">EAN/ISBN:</strong> 9783644202511 
                    let unknown = unknowns[i].getElementsByClassName("col");
                    let ISBNtext = "";
                    for (let j = 0; j < unknown.length; j++) {
                        ISBNtext += unknown[j].innerText + ";";
                    }
                    console.log(i, ISBNtext, "unknown");
                    results.push({
                        ISBN: ISBNtext,
                        price: "unknown"
                    });
                }
            }

            let nobuys = document.querySelectorAll('[data-cy="isbn-result-non-purchasable-item"]');
            if (typeof nobuys !== "undefined" && nobuys !== null && nobuys.length > 0) {
                for (let i = 0; i < nobuys.length; i++) {
                    let innertext = nobuys[i].innerText;
                    results.push({
                        type: "nobuy",
                        innertext: innertext
                    });
                    if (1 === 1) continue;

                    //      class="col">
                    // <strong _ngcontent-rebuy-app-c59="">EAN/ISBN:</strong> 9783644202511 
                    let nobuy = nobuys[i].getElementsByClassName("mb-1");
                    let ISBNtext = "";
                    for (let j = 0; j < nobuy.length; j++) {
                        ISBNtext += nobuy[j].innerText + ";";
                    }
                    console.log(i, ISBNtext, "nobuy");
                    results.push({
                        ISBN: ISBNtext,
                        price: "nobuy"
                    });
                }
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
                .then(
                    function (response) {
                        if (response.status !== 200) {
                            console.log('Looks like there was a problem. Status Code: ' +
                                response.status);
                            return;
                        }
                        // Examine the text in the response
                        response.json().then(function (data) {
                            console.log(data);
                            // Bereitstellung mit postMessage
                            // https://developer.chrome.com/docs/extensions/mv3/messaging/
                            var port = chrome.runtime.connect({
                                name: "knockknock"
                            });
                            port.postMessage(data);
                        });
                    }
                )
                .catch(function (err) {
                    console.log('Fetch Error :-S', err);
                });

        }
    });
});