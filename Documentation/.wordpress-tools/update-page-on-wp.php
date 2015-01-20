#!/usr/bin/php
<?php

$longopts  = array(
    "url:",			// Required value
    "id:",			// Required value
    "title:",		// Required value
    "content:",     // Required value
    "user:",		// Required value
    "password:",	// Required value
);
$options = getopt("", $longopts);

if(!(
		array_key_exists("url", $options) &&
		array_key_exists("id", $options) &&
		array_key_exists("title", $options) &&
		array_key_exists("content", $options) &&
		array_key_exists("user", $options) &&
		array_key_exists("password", $options)
	)) {
	die("Usage:\n\t$argv[0] --url <wp-url> --id <post-id>  --user <user> --password <password> --title <title> --content <content>\n\n");
}

$blogUrl = $options['url'];							// The url of the wordpress site
$postId = $options['id'];							// The page/post id of the page to update
$title = $options['title'];							// The title of the post
// file_get_contents does not work with <() bash documents (it's a bug in php):
$content = shell_exec('cat '.$options['content']);	// The body of the post
$username = $options['user'];						// The wordpress account
$password = $options['password'];					// The wordpress account's credentials

if(!(
		$blogUrl !== '' &&
		$postId !== '' &&
		$title !== '' &&
		$content !== '' &&
		$username !== '' &&
		$password !== ''
	)) {
	echo("Mandatory option value has empty string:\n");
	var_dump($options);
	exit(1);
}

//var_dump($options);
//var_dump($content);
//exit(1);

set_time_limit(0);
require_once("IXR_Library.php.inc");
$client->debug = true; // Set it to fase in Production Environment

// Create the client object
$client = new IXR_Client($blogUrl.'/xmlrpc.php');

$contentparams = array('title'=>$title, 'description'=>$content);
$params = array($postId,$username,$password,$contentparams,1);

// Run a query for PHP
if (!$client->query('metaWeblog.editPost', $params)) {
    die('Something went wrong - '.$client>getErrorCode().' : '.$client->getErrorMessage());
} else {
	echo("Post updated successfully.\n");
}

?>
