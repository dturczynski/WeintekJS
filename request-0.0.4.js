// Changelogs:
// 0.0.4 (2024-08-09):
// - Use encodeURIComponent and decodeURIComponent to replace embedded QueryString module
// 0.0.3 (2022-08-05):
// - Added methods for PUT, PATCH, DELETE
// - Move shared codes into _perform_single_easy
// 0.0.2:
// - Set onmessage to null to release unused web connections
// 0.0.1:
// - First release

var request = {
    post: requestPost,
    get: requestGet,
    put: requestPut,
    patch: requestPatch,
    delete: requestDelete,
    version: "0.0.4",
};

/**
 * Make HTTP GET request
 * @param {Object}   opt                - options for get request. example: `{url: 'http://www.google.com'}`
 * @param {string}   opt.url            - target url
 * @param {string}   opt.useragent      - useragent to use in the header
 * @param {Boolean}  opt.followlocation - follow redirect responses
 * @param {Array.Object} opt.header     - headers to use in the request. example: `{"Content-Type": "application/json"}`
 * @param {function(string,object,string)} cb - callback for any results. example: `function (error, info, body) {}`
 */
function requestGet(opt, cb) {
    var easy = new net.Curl.Easy();
    var data = opt.data || {};

    // retrieve url from options and combine existing query string with current data
    // find existing query string
    var qsPos = opt.url.indexOf('?');
    // combine existing query string with current data
    // for example, url is "http://localhost:8080/q?a=1&b=2" and data is {"a":100,"b":2,"c":3}.
    // they will be combined as "http://localhost:8080/q?a=100&b=2&c=3"
    if (qsPos > -1) {
        var dataInUrl = parse(opt.url.substring(qsPos + 1));
        // existing data has higher precedence than ones in url
        Object.assign(dataInUrl, data);
        // reassign to data
        data = dataInUrl
        // cleanup url
        opt.url = opt.url.substring(0, qsPos);
    }
    var qs = stringify(data);
    if (qs.length > 0) {
        opt.url += "?" + stringify(data);
    }

    easy.setOpt(net.Curl.Easy.option.HTTPGET, true);
    _perform_single_easy(easy, opt, cb)
}

/**
 * Make HTTP POST request
 * @param {Object}   opt                - options for get request. example: `{url: 'http://www.google.com'}`
 * @param {string}   opt.url            - target url
 * @param {string}   opt.useragent      - useragent to use in the header
 * @param {Boolean}  opt.followlocation - follow redirect responses
 * @param {Array.Object} opt.header     - headers to use in the request. example: `{"Content-Type": "application/json"}`
 * @param {Object}   opt.form           - form to use in the request. example: `{"key": "value"}`
 * @param {String}   opt.data           - string to send as the request body. example: `"{\"value\":10,\"ts\":\"2020-12-10T00:00:00Z\"}"`. This overwrites opt.form.
 * @param {function(string,object,string)} cb - callback for any results. example: `function (error, info, body) {}`
 */
function requestPost(opt, cb) {
    _perform_single_easy_with_body(opt, cb)
}

function requestPut(opt, cb) {
    opt.customrequest = "PUT";
    _perform_single_easy_with_body(opt, cb)
}

function requestPatch(opt, cb) {
    opt.customrequest = "PATCH";
    _perform_single_easy_with_body(opt, cb)
}

function requestDelete(opt, cb) {
    opt.customrequest = "DELETE";
    _perform_single_easy_with_body(opt, cb)
}

function _perform_single_easy_with_body(opt, cb) {
    var easy = new net.Curl.Easy();

    // set the customerequest option (PUT/PATCH/DELETE)
    if (opt.customrequest !== undefined) {
        easy.setOpt(net.Curl.Easy.option.CUSTOMREQUEST, opt.customrequest);
    }

    // put/patch/delete may or may not contain body
    var requestBody = null;
    if (opt.data !== undefined) {
        requestBody = opt.data;
    } else if (opt.form !== undefined) {
        requestBody = stringify(opt.form);
    }
    if (requestBody !== null) {
        easy.setOpt(net.Curl.Easy.option.POSTFIELDS, requestBody);
    }

    _perform_single_easy(easy, opt, cb)
}

function _perform_single_easy(easy, opt, cb) {
    const decoder = new TextDecoder('utf-8');

    var url = opt.url || "";
    // url may contain spaces or \0. use polyfilled trim() and remove \0 too
    url = url.replace(/^[\s\uFEFF\xA0\0]+|[\s\uFEFF\xA0\0]+$/g, "");
    easy.setOpt(net.Curl.Easy.option.URL, url);

    if (typeof cb !== 'function') {
        return;
    }
    var responseData = "";
    var useragent = opt.useragent || "curl/7";
    // If it is a 300 response, follow the redirection
    var followLocation = opt.followlocation || true;
    // On HMI we do not have CA root certificate chains, so we will not verify the certificate
    var sslVerifypeer = opt.ssl_verifypeer || false;


    // If it is a 300 response, follow the redirection
    easy.setOpt(net.Curl.Easy.option.FOLLOWLOCATION, followLocation);
    easy.setOpt(net.Curl.Easy.option.USERAGENT, useragent);
    // On HMI we do not have CA root certificate chains, so we will not verify the certificate
    easy.setOpt(net.Curl.Easy.option.SSL_VERIFYPEER, sslVerifypeer);
    if (opt.header) {
        var headerList = [];
        for (var key in opt.header) {
            headerList.push(key + ": " + opt.header[key]);
        }
        easy.setOpt(net.Curl.Easy.option.HTTPHEADER, headerList);
    }

    easy.setOpt(net.Curl.Easy.option.WRITEFUNCTION, function (buf) {
        var resp = decoder.decode(buf);
        responseData += resp;
    });

    var multi = new net.Curl.Multi();
    multi.onMessage((easyHandle, result) => {
        var error = net.Curl.Easy.strError(result);
        var info = {
            href: easyHandle.getInfo(net.Curl.info.EFFECTIVE_URL),
            statusCode: easyHandle.getInfo(net.Curl.info.RESPONSE_CODE),
            totalTime: easyHandle.getInfo(net.Curl.info.TOTAL_TIME),
            connectTime: easyHandle.getInfo(net.Curl.info.CONNECT_TIME),
            contentType: easyHandle.getInfo(net.Curl.info.CONTENT_TYPE),
            localIP: easyHandle.getInfo(net.Curl.info.LOCAL_IP),
            localPort: easyHandle.getInfo(net.Curl.info.LOCAL_PORT),
            requestSize: easyHandle.getInfo(net.Curl.info.REQUEST_SIZE),
        };
        var body = responseData;
        multi.removeHandle(easyHandle);
        multi.onMessage(null);
        cb(error, info, body);
    });

    multi.addHandle(easy);
    return;
}

// Stringify an object into a query string
function stringify(obj) {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]))
        .join('&');
}

// Parse a query string into an object
function parse(queryString) {
    return queryString.split('&')
        .reduce((acc, pair) => {
            const [key, value] = pair.split('=').map(decodeURIComponent);
            acc[key] = value;
            return acc;
        }, {});
}

module.exports = request;
