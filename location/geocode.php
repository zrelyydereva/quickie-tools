<?php

require_once 'lib/common.php';
if($tok_user=="") {
    json_error("auth required");
}
$apikey = "xxxxxxxxxx"; // YOUR API CODE HERE
$db = "geocodes";


if(!isset($_GET['latlng'])){
    json_error("latlng required");
}
$latlng = isset($_GET['latlng'])?$_GET['latlng']:"";

$pdo = _db_connect_one($db);

try {
    $tmp = db_execute_one($db,"select latlng from geocodes limit 1",$pdo);
} catch (Exception $er){
    if(strpos($er->getMessage(),'no such table') !== false){
        $tmp = db_execute_one($db,"CREATE TABLE geocodes(
        latlng TEXT primary key,
        data TEXT
        ) ",$pdo);
    }else{
        json_error($er);
        die;
    }
}

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');

$tmp = db_execute_one($db,"select data from geocodes where latlng='".urlencode($latlng)."'",$pdo);
//print_r($tmp);
if(count($tmp)==0){
    $uri = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" . $latlng . "&key=". $apikey ."&language=ja";
    $data = file_get_contents($uri);
    $sql = "insert into geocodes (latlng,data) values (?,?);";
    $tmp = db_executequery_one($db,$sql,$pdo,[urlencode($latlng),$data]);
}
$tmp = db_execute_one($db,"select data from geocodes where latlng='".urlencode($latlng)."'",$pdo);

echo $tmp[0]['data'];


?>