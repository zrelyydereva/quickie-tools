// -------------------------
// indexedDBラッパー
// 2016.08 @ZrelyyDereva 
// License: MIT
// -------------------------
(function (global) {
    var indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB || window.msIndexedDB;
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.mozIDBTransaction || window.msIDBTransaction;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.mozIDBKeyRange || window.msIDBKeyRange;
    var IDBCursor = window.IDBCursor || window.webkitIDBCursor;

    global.$kl.idb = {};
    global.$kl.idb.open = function (name, callback) {
        var idbReq = indexedDB.open(name, 2);
        idbReq.onupgradeneeded = function (event) {
            var db = event.target.result;
            try {
                db.deleteObjectStore(name);
            } catch (e) {

            }
            var data = db.createObjectStore(name, {
                keyPath: "id"
            });
        };
        idbReq.onerror = function (event) {
            callback("indexedDB Error");
        };
        idbReq.onsuccess = function (event) {
            var db = idbReq.result;
            var obj = {
                _db: db,
                _name: name,
                put: function (data, callback) {
                    data.id = "" + data.id;
                    var transaction = db.transaction(this._name, "readwrite");
                    var store = transaction.objectStore(this._name);
                    var request = store.put(data);
                    var _this = this;
                    request.onsuccess = function (event) {
                        if (callback) callback(null, data);
                    }
                    request.onerror = function (event) {
                        if (callback) callback(event);
                    }
                },
                set: function (data, callback) {
                    var _this = this;
                    this.get(data.id, function (e, s) {
                        if (e) {
                            return _this.put(data, callback);
                        }
                        for (var k in data) {
                            if (data.hasOwnProperty(k)) {
                                s[k] = data[k];
                            }
                        }
                        return _this.put(s, callback);
                    })
                },
                get: function (key, callback) {
                    var transaction = db.transaction([this._name], "readwrite");
                    var store = transaction.objectStore(this._name);
                    var request = store.get(key);
                    request.onsuccess = function (event) {
                        if (event.target.result === undefined) {
                            // キーが存在しない場合の処理
                            callback('not found')
                        } else {
                            callback(null, event.target.result)
                        }
                    }
                    request.onerror = function (event) {
                        callback('get error');
                    }
                },
                each: function (callback) {
                    var transaction = db.transaction([this._name], "readwrite");
                    var store = transaction.objectStore(this._name);
                    var request = store.openCursor();
                    request.onsuccess = function (event) {
                        if (event.target.result == null) {
                            return;
                        }
                        var cursor = event.target.result;
                        var datum = cursor.value;
                        callback(null, datum);
                        cursor.continue();
                    }
                    request.onerror = function (event) {
                        callback('each error');
                    }
                },
                clear: function (callback) {
                    var transaction = db.transaction([this._name], "readwrite");
                    var store = transaction.objectStore(this._name);
                    var request = store.clear();
                    request.onsuccess = function (event) {
                        callback(null);
                    }
                    request.onerror = function (event) {
                        callback('clear error');
                    }
                },
                getAsArray: function (params, conditions, callback) {
                    var transaction = db.transaction([this._name], "readwrite");
                    var store = transaction.objectStore(this._name);
                    var order = 'next';
                    if (params.order && params.order == "desc") {
                        order = 'prev';
                    }
                    var request = store.openCursor(null, order);
                    var ret = [];
                    var pushed = 0;
                    var skipped = 0;
                    var skip = params.skip | 0;
                    var limit = params.limit | 0;

                    request.onsuccess = function (event) {
                        if (event.target.result == null) {
                            callback(null, ret);
                            return;
                        }
                        if (limit > 0 && pushed >= limit) {
                            callback(null, ret);
                            return;
                        }
                        var cursor = event.target.result;
                        var datum = cursor.value;
                        if (conditions) {
                            if (conditions(datum)) {
                                if (skip > 0) {
                                    skip--;
                                } else {
                                    pushed++;
                                    ret.push(datum);
                                }
                            }
                        } else {
                            if (skip > 0) {
                                skip--;
                            } else {
                                pushed++;
                                ret.push(datum);
                            }
                        }
                        cursor.continue();
                    }
                    request.onerror = function (event) {
                        callback('each error');
                    }
                }
            };
            callback(null, obj);
        };
    }

})((this || 0).self || global);