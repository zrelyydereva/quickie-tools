// -------------------------
// 同期するIDB
// 2016.08 @ZrelyyDereva 
// License: MIT
// -------------------------
(function(global) {
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.mozIDBKeyRange || window.msIDBKeyRange;
    var IDBCursor = window.IDBCursor || window.webkitIDBCursor;

    global.$kl.syncdb = {};
    global.$kl.syncdb.open = function(name, remoteUrl, callback) {
        global.$kl.idb.open(name, function(e, r) {
            if (e) {
                callback('could not use IndexedDB');
                return;
            }
            var db = r._db;
            $kl.tryAjax({
                url: remoteUrl,
                json: true,
                method: "POST",
                query: {
                    "db": name,
                    ver: "?"
                },
                params: []
            }, function(err, ret) {
                if (!ret || !ret.version) {
                    //callback("server error");
                    //return;
                    //callback('net work is offline');
                }
            });
            var obj = {
                _db: db,
                _remote: remoteUrl,
                _name: name,
                _sendToRemote: function(data, callback) {
                    if (!window.navigator.onLine) {
                        callback('we are offline now');
                        return;
                    }
                    $kl.tryAjax({
                        url: this._remote,
                        json: true,
                        method: "POST",
                        query: {
                            "db": this._name,
                            "action": "put"
                        },
                        data: {
                            data: JSON.stringify([{
                                id: data.id,
                                rev: data.rev,
                                data: data
                            }])
                        }
                    }, callback);
                },
                put: function(data, callback) {
                    r.put(data, function(e, r) {
                        if (!e) {
                            setTimeout(function() {
                                obj._sendToRemote(data, function(e, r) {
                                    if (e) {
                                        if (callback) callback(e);
                                        return;
                                    }
                                    if (r && r.error) {
                                        if (callback) callback(null, {
                                            msg: r.error
                                        });
                                        return;
                                    }
                                    if (r) {
                                        if (callback) callback(null, {
                                            msg: "サーバに送信しました"
                                        });
                                    }
                                })
                            }, 0);
                        }
                        if (callback) callback(e, r);
                    })
                },
                set: r.set,
                get: r.get,
                each:r.each,
                getAsArray: r.getAsArray,
                sync: function(callback) {
                    var _this = this;
                    callback(null, {
                        key: 'sync',
                        msg: "同期対象のチェック中"
                    });
                    $kl.tryAjax({
                        url: this._remote,
                        json: true,
                        method: "POST",
                        query: {
                            "db": name,
                            "action": "list"
                        },
                        data: {}
                    }, function(err, ret) {
                        if (err) {
                            callback('listing error');
                            callback(null, {
                                key: 'sync',
                                msg: "リスト取得エラー"
                            });
                            return;
                        };
                        if (ret.error) {
                            callback(null, {
                                key: 'sync',
                                msg: "リスト取得エラー"
                            });
                            callback('listing error:' + ret.error);
                            return;
                        }
                        var list = ret;
                        var getlist = JSON.parse(JSON.stringify(list));
                        var transaction = db.transaction([_this._name], "readwrite");
                        var store = transaction.objectStore(_this._name);
                        var request = store.openCursor();
                        request.onsuccess = function(event) {
                            //全部終わったときは、リストに残ってるものを取得して保存する
                            if (event.target.result == null) {
                                var reqs = [];
                                for (var k in getlist) {
                                    if (k == "") continue;
                                    if (getlist.hasOwnProperty(k)) reqs.push(k);
                                }
                                if (reqs.length == 0) {
                                    callback(null, {
                                        key: 'synccomplete',
                                        msg: "更新はありません"
                                    });
                                } else {
                                    callback(null, {
                                        key: 'sync',
                                        msg: reqs.length + "件の更新を受信します"
                                    });
                                }
                                if (reqs.length > 0) $kl.tryAjax({
                                    url: _this._remote,
                                    json: true,
                                    method: "POST",
                                    query: {
                                        "db": _this._name,
                                        "action": "get"
                                    },
                                    data: {
                                        "ids": reqs.join(",")
                                    }
                                }, function(err, ret) {
                                    if (err) {
                                        callback('retriving error');
                                        return;
                                    }
                                    if (ret.error) {
                                        callback('retriving error:' + ret.error);
                                        return;
                                    }
                                    var compCount = 0;
                                    for (var l in ret) {
                                        ret[l]['rev'] = +ret[l]['rev'];
                                        var request = db.transaction(_this._name, "readwrite")
                                            .objectStore(_this._name).put(ret[l]['data']);
                                        request.onsuccess = function(e) {
                                            compCount++;
                                            callback(null, {
                                                key: 'put',
                                                msg: "更新しました(" + compCount + "件目)"
                                            });

                                            if (compCount == ret.length) {
                                                callback(null, {
                                                    key: 'synccomplete',
                                                    msg: "同期が完了しました"
                                                });
                                            }
                                        };
                                        request.onerror = function(e) {
                                            compCount++;
                                            callback(null, {
                                                key: 'put',
                                                msg: "更新に失敗しました(" + compCount + "件目)"
                                            });
                                            if (compCount == ret.length) {
                                                callback(null, {
                                                    key: 'synccomplete',
                                                    msg: "同期が完了しました"
                                                });
                                            }
                                            //callback("sync store error");
                                        }
                                    }

                                    callback(null, "alldone");
                                });
                                return;
                            }
                            var cursor = event.target.result;
                            var datum = cursor.value;
                            if (!ret[datum.id]) {
                                //サーバが持ってないものがあった
                                _this._sendToRemote(datum, function(e, ret) {
                                    //callback(null, "send to server" + datum.id);
                                    if (e) {
                                        callback(null, {
                                            key: 'send' + datum.id,
                                            msg: "サーバに登録できませんでした"
                                        });
                                    } else {
                                        callback(null, {
                                            key: 'send' + datum.id,
                                            msg: "サーバにローカルデータを登録しました"
                                        });
                                    }
                                })
                            } else {
                                if (ret[datum.id] < datum.rev) {
                                    //サーバのほうが古い
                                    _this._sendToRemote(datum, function(e, ret) {
                                        if (e) {
                                            callback(null, {
                                                key: 'send' + datum.id,
                                                msg: "サーバの情報を更新できませんでした"
                                            });
                                        } else {
                                            callback(null, {
                                                key: 'send' + datum.id,
                                                msg: "サーバの情報を更新しました"
                                            });
                                        }
                                    });
                                    delete getlist[datum.id];
                                } else if (ret[datum.id] == datum.rev) {
                                    //ローカルと同じリビジョン
                                    delete getlist[datum.id];
                                }
                            }
                            //callback(null, datum);
                            cursor.continue();
                        }
                        request.onerror = function(event) {
                            callback('each error');
                        }

                    });
                }
            };
            callback(null, obj);
        });
    }

})((this || 0).self || global);