<?php

$callback = $_GET['callback'];
if($callback) {
  header("Content-Type: application/json; charset=utf-8");
  $path = 'json/1.json';
  $file = file_get_contents($path);
  echo sprintf("%s(%s)", $callback ,$file);
} else {
  header("HTTP/1.1 400 Bad Request");
}

?>
