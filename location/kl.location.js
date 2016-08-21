// -------------------------
// HTML5での位置情報取得を少しだけ楽にする
// 2016.07 @ZrelyyDereva
// License: MIT 
// -------------------------
(function (global) {
    //ブラウザ以外では使わない
    if (!("document" in global)) return;
    global.$kl = global.$kl || {};

    global.$kl.messages = global.$kl.messages || {};
    global.$kl.messages.LOCATION_ERROR_NOT_SUPPORTED = "サポートされていません";
    global.$kl.messages.LOCATION_ERROR_NOT_ALLOWED = "利用が許可されていません";
    global.$kl.messages.LOCATION_ERROR_NOT_SUPPLIED = "デバイスの位置が判定できません";
    global.$kl.messages.LOCATION_ERROR_TIMED_OUT = "タイムアウトしました";
    global.$kl.messages.LOCATION_ERROR_OTHER = "その他のエラー";
    global.$kl.consts = global.$kl.consts || {};

    var s = function (callback) {
        var _callback = callback;
        return function getlocationsuccess(position) {
            var latlng = position.coords.latitude + "," + position.coords.longitude;
            _callback({
                latlng: latlng,
            });
            var latlng = position.coords.latitude + "," + position.coords.longitude;
            var uri = "./geocode.php?latlng=" + latlng;
            if (!$kl.ajax) {
                _callback = null;
                return
            };
            $kl.ajax({
                url: uri,
                method: "GET"
            }, function (r) {
                var r2 = JSON.parse(r);
                var addr = ""
                if (r2.results && r2.results[0]) {
                    addr = (r2.results[0].formatted_address).replace("日本, ", "");
                }
                _callback({
                    latlng: latlng,
                    address: addr
                });
                _callback = null;
            });
        }
    }
    var f = function (callback) {
        var _callback = callback;
        return function locationfaiulre(params) {
            switch (error.code) {
                case 1:
                    _callback(global.$kl.messages.LOCATION_ERROR_NOT_ALLOWED);
                    break;
                case 2:
                    _callback(global.$kl.messages.LOCATION_ERROR_NOT_SUPPLIED);
                    break;
                case 3:
                    _callback(global.$kl.messages.LOCATION_ERROR_TIMED_OUT);
                    break;
                default:
                    _callback(global.$kl.messages.LOCATION_ERROR_OTHER);
            }
            _callback = null;
        }
    }

    global.$kl.getLocation = function getLocation(success, failure) {
        if (!global.navigator) return failure(global.$kl.messages.LOCATION_ERROR_NOT_SUPPORTED);
        try {
            global.navigator.geolocation.getCurrentPosition(s(success), f(failure));
        } catch (e) {
            return failure(global.$kl.messages.LOCATION_ERROR_OTHER);
        }
    }
})((this || 0).self || global);