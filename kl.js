// -------------------------
// 最小限のajaxモジュール
// 2016.07 @ZrelyyDereva 
// License: MIT
// -------------------------
(function(global) {
    //ブラウザ以外では使わない
    if (!("document" in global)) return;
    global.$kl = global.$kl || {};

    global.$kl.objToParam = function objToParam(obj, prefix) {
        if (typeof(obj) == "string") return obj;
        var ret = [];
        if (!prefix) prefix = [];
        for (var k in obj) {
            if (!obj.hasOwnProperty(k)) continue;
            var tmpFix = ([].concat(prefix));
            tmpFix.push(k);
            if (typeof(obj[k]) == "object") {
                ret.push(objToParam(obj[k], tmpFix));
            } else if (typeof(obj[k]) == "string" || typeof(obj[k]) == "number") {
                ret.push(encodeURIComponent(tmpFix.join(".")) + "=" + encodeURIComponent(obj[k]));
            }
        }
        return ret.join("&").replace(/%20/g, '+');
    }
    global.$kl.ajaxAuthToken="";
    global.$kl.ajax = function ajax(params, callback,callbackerr) {
        try {
            var r = new XMLHttpRequest();
            if (!params.url) params.url = "";
            if (!params.method) params.method = "GET";
            params.headers = params.headers || {};
            //   params.query = params.query || {};
            params.data = params.data || {};
            params.json = params.json || false;
            params.blob = params.blob || false;

            switch (params.method) {
                case "POST":
                case "DELETE":
                case "PATCH":
                case "GET":
                    var qs = global.$kl.objToParam(params.query);
                    if (qs != "") qs = "?" + qs;
                    r.open(params.method, params.url + qs, true);
                    if (params.mime) {
                        r.overrideMimeType(params.mime);
                    }
                    if (params.blob) {
                        r.responseType = "blob";
                    }
                    //HTTPヘッダー付与、JSON ハイジャック対策
                    if (params.method != "GET") {
                        r.setRequestHeader("X-Requested-With", "XMLHttpRequest");
                        r.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    }
                    for (var i in params.headers) {
                        r.setRequestHeader(i, params.headers[i]);
                    }
                    if(global.$kl.ajaxAuthToken!="" && params.url.indexOf('//')==-1){
                        r.setRequestHeader("Authorization", "Bearer " + global.$kl.ajaxAuthToken);
                        r.withCredentials = true;
                    }
                    if(callbackerr) r.onerror = callbackerr;
                    r.onreadystatechange = function() {
                        if (r.readyState != 4 || r.status != 200) return;
                        if (!params.blob) {
                            if (params.json) return callback(JSON.parse(r.responseText));
                            if (!params.json) return callback(r.responseText);
                        }else{
                            //NO OP
                        }
                    }
                    if(params.blob){
                        r.onload = function(oEvent){
                            callback(r.response);
                        }
                    }
                    r.send(global.$kl.objToParam(params.data));
                    break;
                default:
                    throw "METHOD unknown";
            }
        } catch (ex) {
            throw ex;
        }
    }
    global.$kl.tryAjax = function ajax(params, callback) {
        try {
            global.$kl.ajax(params, function(r) {
                callback(null, r);
            },function(err){
                callback({'ajaxError':err});
            })
        } catch (e) {
            callback(e);
        }
    }
    
    global.$kl.isOnline = global.navigator.onLine;
    global.addEventListener("offline", function(e) {
        global.$kl.isOnline = false
    });
    global.addEventListener("online", function(e) {
        global.$kl.isOnline = true
    });

})((this || 0).self || global);