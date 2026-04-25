<?php
ob_start();
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

require_once 'config.php';


require_once 'controllers/AuthController.php';
require_once 'controllers/GroupController.php';
require_once 'controllers/TaskController.php';
require_once 'controllers/ActivityController.php';
require_once 'controllers/AssessmentController.php';

$method = $_SERVER['REQUEST_METHOD'];

// Handle both .htaccess (path) and PHP built-in server (REQUEST_URI)
$path = $_GET['path'] ?? parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim($path, '/');

// If running in a subdirectory, strip it
$path = str_replace('Daily_Project7/php-backend/', '', $path);
$path = str_replace('php-backend/', '', $path);
$path = str_replace('api/', '', $path);

$parts = explode('/', $path);



header('Content-Type: application/json');

try {
    // Auth Routes
    if ($path === 'register' && $method === 'POST') AuthController::register($pdo);
    if ($path === 'login' && $method === 'POST') AuthController::login($pdo);

    // Group Routes
    if ($path === 'groups') {
        if ($method === 'POST') GroupController::createGroup($pdo);
        if ($method === 'GET') GroupController::getMyGroups($pdo);
    }
    if ($path === 'groups/join' && $method === 'POST') GroupController::joinGroup($pdo);

    
    if ($parts[0] === 'groups' && isset($parts[1])) {
        if (!isset($parts[2])) {
            if ($method === 'PUT') GroupController::updateGroup($pdo, $parts[1]);
            if ($method === 'DELETE') GroupController::deleteGroup($pdo, $parts[1]);
        } elseif ($parts[2] === 'members' && $method === 'GET') {
            GroupController::getGroupMembers($pdo, $parts[1]);
        } elseif ($parts[2] === 'leave' && $method === 'POST') {
            GroupController::leaveGroup($pdo, $parts[1]);
        }
    }

    // Task Routes
    if ($path === 'tasks' && $method === 'POST') TaskController::createTask($pdo);
    
    if ($parts[0] === 'tasks' && isset($parts[1])) {
        if (!isset($parts[2]) && $method === 'GET') {
            TaskController::getGroupTasks($pdo, $parts[1]);
        } elseif (isset($parts[2])) {
            if ($parts[2] === 'status' && ($method === 'PUT' || $method === 'POST')) TaskController::updateTaskStatus($pdo, $parts[1]);
            if ($parts[2] === 'assign' && $method === 'PUT') TaskController::assignTask($pdo, $parts[1]);
        }

        if (!isset($parts[2]) && $method === 'DELETE') TaskController::deleteTask($pdo, $parts[1]);
    }

    // Activity Logs
    if ($parts[0] === 'activities' && isset($parts[1])) {
        if ($method === 'GET') ActivityController::getGroupActivities($pdo, $parts[1]);
        if ($method === 'DELETE') ActivityController::clearGroupActivities($pdo, $parts[1]);
    }

    // Assessment / Report
    if ($parts[0] === 'reports' && isset($parts[1]) && $method === 'GET') {
        AssessmentController::getReport($pdo, $parts[1]);
    }

    response(['message' => 'Resource not found: ' . $path], 404);


} catch (Exception $e) {
    response(['message' => 'Internal server error: ' . $e->getMessage()], 500);
}
