<?php

require 'vendor/autoload.php';

use App\HttpClient;

try {
    $client = new HttpClient();
    
    // 测试GET请求
    $response = $client->get('https://api.github.com');
    echo "GitHub API Response:\n";
    echo $response . "\n";
    
    // 测试POST请求
    $postResponse = $client->post('https://postman-echo.com/post', [
        'test' => 'data',
        'hello' => 'world'
    ]);
    echo "\nPostman Echo Response:\n";
    echo $postResponse . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
} 