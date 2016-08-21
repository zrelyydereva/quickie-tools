<?php
require_once 'lib/db.inc.php';
require 'vendor/autoload.php';

define ("ROOT_DIR",dirname(str_replace("\\","/",dirname(__FILE__))."../"));
use Namshi\JOSE\SimpleJWS;

$tok_user = "";
try{
    $id = "";
    if(isset($_SERVER['HTTP_AUTHORIZATION'])){
        $id = substr($_SERVER['HTTP_AUTHORIZATION'],strlen("Bearer "));
    }
    $jws        = SimpleJWS::load($id);
    $public_key = openssl_pkey_get_public("file://".ROOT_DIR."/assets/ec256-key-pub.pem");
    if ($jws->isValid($public_key, 'ES256')) {
        //print_r("valid");
        $payload = $jws->getPayload();
        //print_r($payload);
        $tok_user = "";$tok_readable="";$tok_writable="";
        if(isset($payload['username'])) $tok_user = $payload['username'];
        if(isset($payload['readable'])) $tok_readable = $payload['readable'];
        if(isset($payload['writable'])) $tok_writable = $payload['writable'];
        
    }else{
        //NO OP
    }
}catch(Exception $e){
    //NO OP
}

function getToken($userobj){
    $date       = new DateTime('+7 days');
    $sign = $userobj;
    $jws  = new SimpleJWS(array(
    'alg' => 'ES256',
    'exp' => $date->format('U')
    ));
    $jws->setPayload(
    $sign
    );
    //echo ROOT_DIR;
    $privateKey = openssl_pkey_get_private("file://".ROOT_DIR."/assets/ec256-key-pri.pem","");
    $jws->sign($privateKey);
    return $jws->getTokenString();
}
function sanitizeStr($str){
    $str = stripslashes($str);
    $str = str_replace("'","''",$str);
    $str = str_replace("%","\%",$str);
    return $str;
}
function sanitizeStr4Lookup($str){
    $str = stripslashes($str);
    $str = str_replace("'","\'",$str);
    $str = str_replace("%","\%",$str);
    $str = str_replace("*","%",$str);
    return $str;
}

function json_header(){
    header('Content-Type: application/json');
}

function json_response($ret){
    json_header();
    print json_encode($ret);
}
function json_error($msg){
    $err = ['error'=>$msg];
    json_response($err);
    die;
}
?>