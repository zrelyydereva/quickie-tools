<?php

//何らかのSQLサーバにつなぐ処理
function _db_connect(){
    $pdo = new PDO('sqlite:db/sqldb.db');
    
    // SQL実行時にもエラーの代わりに例外を投げるように設定
    // (毎回if文を書く必要がなくなる)
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // デフォルトのフェッチモードを連想配列形式に設定
    // (毎回PDO::FETCH_ASSOCを指定する必要が無くなる)
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    return $pdo;
}
//SQL実行
function db_execute($sql,$params = []){
    $pdo = _db_connect();
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $r2 = $stmt->fetchAll();
    return $r2;
}
function _db_connect_one($fn){
    $pdo = new PDO('sqlite:db/sqldb_'.urldecode($fn).'.db');
    
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    return $pdo;
}
//SQL実行
function db_execute_one($fn,$sql,$pdo = null , $params = []){
    $stmt = db_executequery_one($fn,$sql,$pdo,$params);
    
    $r2 = $stmt->fetchAll();
    return $r2;
}
function db_executequery_one($fn,$sql,$pdo = null,$params = []){
    if($pdo == null){
        $pdo = _db_connect_one($fn);
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    return $stmt;
}
?>