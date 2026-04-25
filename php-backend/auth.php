<?php
require_once 'config.php';
require_once 'jwt_helper.php';

function getAuthenticatedUser() {
    $authHeader = '';
    
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }
    
    if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    }

    
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
        $decoded = JWTHelper::decode($token, JWT_SECRET);
        
        if ($decoded) {
            return $decoded;
        }
    }
    
    response(['message' => 'Akses ditolak, token tidak valid atau tidak ada'], 401);
}

