<?php
require_once 'lib/common.php';
use Namshi\JOSE\SimpleJWS;

if($tok_user==""){
    json_error('auth required');
}
//debug
$un = "test";
$ver = 1;
if(isset($_GET['ver'])){
    json_response(["version"=>$ver]);
    exit;
}

if(!isset($_GET['db'])){
    json_error('database name required');
}
if(!isset($_REQUEST['action'])){
    json_error('action required');
}
$db     = $_GET['db'];
$action = $_REQUEST['action'];

if(!in_array($db,$tok_readable) && !in_array($db,$tok_writable)){
    json_error('access denied');
}
if(!in_array($db,$tok_writable) && $action=="put"){
    json_error('access denied for write');
}
$pdo = _db_connect_one($db);

try {
    $tmp = db_execute_one($db,"select id from syncdb limit 1",$pdo);
} catch (Exception $er){
    if(strpos($er->getMessage(),'no such table') !== false){
        $tmp = db_execute_one($db,"CREATE TABLE syncdb(
            id TEXT primary key,
            rev INTEGER,
            data TEXT
            ) ",$pdo);
    }else{
        die;
        json_error($er);
    }
}

if($action=='list'){
    $tmp = db_execute_one($db,"select id,rev from syncdb",$pdo);
    $ret = [];
    foreach($tmp as $k=>$v){
        $ret[$v['id']]=$v['rev'];
    }
    json_response($ret);
}else if($action=='get'){
    $ids = $_REQUEST['ids'];
    $ids = explode(",",$ids);
    $idsq = [];
    foreach($ids as $v){
        $idsq[] = "'".sanitizeStr($v)."'";
    }
    $sql = "select id,rev,data from syncdb where id in (". implode(",",$idsq) . ")";
    $tmp = db_execute_one($db,$sql,$pdo);
    $tmp2 = [];
    foreach($tmp as $k=>$v){
        $tmp2[$k]=$tmp[$k];
        $tmp2[$k]["data"] = json_decode($tmp[$k]["data"]);
    }
    json_response($tmp2);
}else if($action=="put"){
    $data = $_REQUEST['data'];
    $data = json_decode($data);
    foreach($data as $datum){
        $dat = [
                $datum->rev,
                json_encode($datum->data),
                $datum->id];
        $sql = "update syncdb set rev=?,data=? where id=?;";
        $tmp = db_executequery_one($db,$sql,$pdo,$dat);
        if($tmp->rowCount()==0){
            $sql = "insert into syncdb (rev,data,id) values (?,?,?);";
            $tmp = db_executequery_one($db,$sql,$pdo,$dat);  
        }
        $tmp = "ok";
    }
    json_response($tmp);
}

?>