const fs = require('fs');
const request = require('request-promise');
const cheerio = require('cheerio');

 // Fill this variable in with whatever country you want to get data for -  make sure the country is listed on http://magicseaweed.com/site-map.php
const countryMatch = "Fill This String In With Whatever Country You Want To Get Data for";

// CONFIGS
const url = 'http://magicseaweed.com/site-map.php';

// HELPER METHODS
const requestAsPromise = (url) => {
    return new Promise((resolve, reject) => {
        request(url, (err, resp, html) => {
            if (err) {
                reject(err);
                return;
            }
            resolve({ resp, html })
        });
    });
} // promise request

const timeoutPromise = (timeout, ...args) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(...args);
        }, timeout);
    });
} // promise timeout

const superGET = (url, query = null) => {
    return new Promise((resolve, reject) => {
        const callback = (err, res, html) => {

            if (err) return console.error(err);

            var $ = cheerio.load(html, { xmlMode: true });
            if ($("script:contains('requirejs.config')")) {
                const lastScript = $("script:contains('requirejs.config')")[0].children[0].data;
                const scriptSplit = lastScript.split("'js/config':")[1];
                const scritSplitBefore = scriptSplit.split(",'js/i18n'")[0];
                const jsonFromScript = JSON.parse(JSON.stringify(scritSplitBefore));

                const parsed = JSON.parse(jsonFromScript);

                return parsed;
            }



        };
        let superobj = request(url, callback);
        if (query && typeof query === 'object') {
            superobj = superobj.query(query);
        }

       

        superobj.end((err, res) => {
            if (err || !res.ok) reject(err);
            if (res && res.body) resolve(res.body);
            else {
                console.log(`@@@@@@@@ FAILED @@@@@@@@`, query);
                reject(res);
            }
        })
    });
}// promise superagent

const populateCountry = ($, callback, max = 250) => {
    const h1 = Array.from($('h1'));
    return h1.reduce((_obj, currentH1, index) => {
        if (index > max) return _obj;
        currentH1 = $(currentH1)
        const country = currentH1
            .text()
            .toLowerCase()
            .split(' surf reports')
            .shift();

        const dataSource = currentH1.next('table').find('a');
        const townsArray = callback($, country, dataSource);
        
        
        if (country === countryMatch) {
                
                
                console.log(`making inside if conditional - townsarray: ${townsArray}, country: ${country}`)
                if (townsArray.length > 0) {
                    _obj[country] = townsArray;
                }
            }

        return _obj;
    }, {});
}


const populateTownsByCountry = ($, country, els, max = 250) => {
    return Array.from(els).reduce((_arr, currCountry, index) => {
        if (index > max) return _arr;

        const data = $(currCountry);
        const town = data.text();
        const href = data.attr('href');
        const spotId = href.split('/')[2];

        _arr.push({
            href,
            town,
            spotId,
        });

        return _arr;
    }, []);
}

const convertToPromises = (jsonData) => {
    return Object.keys(jsonData).reduce((promise, country) => {
        return jsonData[country].reduce((promise2, town, index) => {
                 console.log(`--------------- REQUESTING ${country}, ${town}, ${town.href} ---------------`);
            var options = {
                uri: `https://magicseaweed.com${town.href}`,
                simple: false    //  <---  <---  <---  <---
            };
            return promise2.then(data => request(options).then(res => {
                console.log(res.statusCode)
                if (res.statusCode === '404') {
                    console.log(`######### FAILED ${country}, ${town} #########`);
                    return data;
                }
                
                var $ = cheerio.load(res, { xmlMode: true });
                if ($("script:contains('requirejs.config')")[0]) {
                    const lastScript = $("script:contains('requirejs.config')")[0].children[0].data;
                    const scriptSplit = lastScript.split("'js/config':")[1];
                    const scritSplitBefore = scriptSplit.split(",'js/i18n'")[0];
                    const jsonFromScript = JSON.parse(JSON.stringify(scritSplitBefore));

                    const parsed = JSON.parse(jsonFromScript);
                    
                     data[country][index].lat = parsed.spot.lat;
                     data[country][index].lng = parsed.spot.lon;
                     data[country][index].timeZone = parsed.spot.timezone;
                     data[country][index].hasHourlyForecast = parsed.spot.hasHourly;
                     data[country][index].isBigWave = parsed.spot.isBigWave;
                    console.log(data) // log the data to terminal
                    return data;
                }
                else {
                    return data;
                }
            }).catch(function (err) {
                console.error(err); // This will print any error that was thrown in the previous error handler.
            }))
        }, Promise.resolve(jsonData));
    }, Promise.resolve(jsonData));
}

// IMPLEMENTATION
requestAsPromise(url).then(({ response, html }) => {
    const $ = cheerio.load(html);
    const json = populateCountry($, populateTownsByCountry, 1e9);
    convertToPromises(json).then(data => fs.appendFile('surfSpots.json', JSON.stringify(data, null, 4), (err) => console.log('file written')))
});
