<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../jwt_helper.php';

class AuthController {
    public static function register($pdo) {
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? '';
        $nim = $data['nim'] ?? '';
        $email = $data['email'] ?? '';
        $password = $data['password'] ?? '';

        if (!$name || !$nim || !$email || !$password) {
            response(['message' => 'Semua field harus diisi'], 400);
        }

        // Check existing
        $stmt = $pdo->prepare('SELECT id FROM users WHERE nim = ? OR email = ?');
        $stmt->execute([$nim, $email]);
        if ($stmt->fetch()) {
            response(['message' => 'NIM atau Email sudah terdaftar'], 400);
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $pdo->prepare('INSERT INTO users (name, nim, email, password) VALUES (?, ?, ?, ?)');
        $stmt->execute([$name, $nim, $email, $hashedPassword]);

        response(['message' => 'Registrasi berhasil'], 201);
    }

    public static function login($pdo) {
        $data = json_decode(file_get_contents('php://input'), true);
        $nim = $data['nim'] ?? '';
        $password = $data['password'] ?? '';

        $stmt = $pdo->prepare('SELECT * FROM users WHERE nim = ?');
        $stmt->execute([$nim]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password'])) {
            response(['message' => 'NIM atau Password salah'], 401);
        }

        $token = JWTHelper::encode(['id' => $user['id']], JWT_SECRET);

        response([
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'nim' => $user['nim']
            ]
        ]);
    }
}
