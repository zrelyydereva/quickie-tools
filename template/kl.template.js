// -------------------------
// 簡易テンプレートエンジン
// 2016.07 @ZrelyyDereva
// License: MIT 
// -------------------------
(function(global) {
    if (!global.$kl) global.$kl = {};
    if (!global.$kl.t) global.$kl.t = {};
    var templates = {};
    var escapeMap = {
        '&': '&amp;',
        '\x27': '&#39;',
        '"': '&quot;',
        '<': '&lt;',
        '>': '&gt;',
    };

    function escapeCallback(char) {
        if (!escapeMap.hasOwnProperty(char)) {
            throw new Error;
        }
        return escapeMap[char];
    }

    global.$kl.t.escapeHtml = function(str) {
        return String(str).replace(/[&"'<>]/g, escapeCallback);
    }
    global.$kl.t.getTemplate = function(holderId) {
            var template = $("#" + holderId + " > .template").prop('outerHTML');
            $("#" + holderId + " > .template").remove();
            return template;
        }
        //テンプレートを奪い取ってしまうやつ
    global.$kl.t.setupTemplate = function(holderId) {
        templates[holderId] = global.$kl.t.getTemplate(holderId);
        //Updateされたら、中身を再度レンダリングして更新する
        $("#" + holderId).on('update', function(e, params) {
            //独自イベント：レンダリング
            $("#" + holderId + " > .template").remove();
            var all = "";
            var data = params.list;
            if (params.list.length == 0) {
                $("#" + holderId).css('display', 'none');
                return;
            }
            $("#" + holderId).css('display', '');
            for (var k in data) {
                var row = templates[holderId];
                row = row.replace(/\{\{(.*?)\}\}/g, function(all, key) {
                    return !data[k][key] ? "" : data[k][key];
                });
                row = row.replace(/\{(.*?)\}/g, function(all, key) {
                    return !data[k][key] ? "" : global.$kl.t.escapeHtml(data[k][key]);
                });
                all += row;
            }
            $("#" + holderId).html(all);
        });
        $("#" + holderId).trigger('update', {
            list: []
        });
    }

})((this || 0).self || global);