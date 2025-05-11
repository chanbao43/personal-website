<?php

namespace App;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;

class HttpClient
{
    private Client $client;

    public function __construct()
    {
        $this->client = new Client([
            'timeout' => 10,
            'verify' => false // 在开发环境中可以禁用SSL验证
        ]);
    }

    /**
     * 发送GET请求
     * @param string $url
     * @return string
     * @throws GuzzleException
     */
    public function get(string $url): string
    {
        $response = $this->client->get($url);
        return $response->getBody()->getContents();
    }

    /**
     * 发送POST请求
     * @param string $url
     * @param array $data
     * @return string
     * @throws GuzzleException
     */
    public function post(string $url, array $data = []): string
    {
        $response = $this->client->post($url, [
            'json' => $data
        ]);
        return $response->getBody()->getContents();
    }
} 