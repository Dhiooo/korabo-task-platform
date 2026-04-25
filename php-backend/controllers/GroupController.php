<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth.php';

class GroupController {
    private static function logActivity($pdo, $groupId, $userId, $message) {
        $stmt = $pdo->prepare('INSERT INTO activities (group_id, user_id, message) VALUES (?, ?, ?)');
        $stmt->execute([$groupId, $userId, $message]);
    }

    public static function createGroup($pdo) {
        $user = getAuthenticatedUser();
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? '';

        if (!$name) response(['message' => 'Nama grup harus diisi'], 400);

        $code = substr(str_shuffle("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, 6);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO `groups` (name, code, admin_id) VALUES (?, ?, ?)');
            $stmt->execute([$name, $code, $user['id']]);
            $groupId = $pdo->lastInsertId();

            $stmt = $pdo->prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
            $stmt->execute([$groupId, $user['id']]);

            self::logActivity($pdo, $groupId, $user['id'], "membuat grup '$name'");

            $pdo->commit();
            response(['message' => 'Grup berhasil dibuat', 'code' => $code], 201);
        } catch (Exception $e) {
            $pdo->rollBack();
            response(['message' => $e->getMessage()], 500);
        }
    }

    public static function joinGroup($pdo) {
        $user = getAuthenticatedUser();
        $data = json_decode(file_get_contents('php://input'), true);
        $code = $data['code'] ?? '';

        $stmt = $pdo->prepare('SELECT id, name FROM `groups` WHERE code = ?');
        $stmt->execute([$code]);
        $group = $stmt->fetch();

        if (!$group) response(['message' => 'Kode grup tidak valid'], 404);

        // Check if already member
        $stmt = $pdo->prepare('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?');
        $stmt->execute([$group['id'], $user['id']]);
        if ($stmt->fetch()) response(['message' => 'Anda sudah bergabung di grup ini'], 400);

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
            $stmt->execute([$group['id'], $user['id']]);

            self::logActivity($pdo, $group['id'], $user['id'], "bergabung ke dalam grup");

            $pdo->commit();
            response(['message' => 'Berhasil bergabung ke grup']);
        } catch (Exception $e) {
            $pdo->rollBack();
            response(['message' => $e->getMessage()], 500);
        }
    }

    public static function getMyGroups($pdo) {
        $user = getAuthenticatedUser();
        $stmt = $pdo->prepare('
            SELECT g.* FROM `groups` g
            JOIN group_members gm ON g.id = gm.group_id
            WHERE gm.user_id = ?
        ');
        $stmt->execute([$user['id']]);
        response($stmt->fetchAll());
    }

    public static function getGroupMembers($pdo, $groupId) {
        getAuthenticatedUser();
        $stmt = $pdo->prepare('
            SELECT u.id, u.name, u.nim, 
            (u.id = g.admin_id) as is_admin
            FROM users u
            JOIN group_members gm ON u.id = gm.user_id
            JOIN `groups` g ON gm.group_id = g.id
            WHERE gm.group_id = ?
        ');
        $stmt->execute([$groupId]);
        response($stmt->fetchAll());
    }


    public static function updateGroup($pdo, $groupId) {
        $user = getAuthenticatedUser();
        $data = json_decode(file_get_contents('php://input'), true);
        $name = $data['name'] ?? '';

        // Check admin
        $stmt = $pdo->prepare('SELECT id FROM `groups` WHERE id = ? AND admin_id = ?');
        $stmt->execute([$groupId, $user['id']]);
        if (!$stmt->fetch()) response(['message' => 'Hanya admin yang dapat mengubah grup'], 403);

        $stmt = $pdo->prepare('UPDATE `groups` SET name = ? WHERE id = ?');
        $stmt->execute([$name, $groupId]);

        self::logActivity($pdo, $groupId, $user['id'], "mengubah nama grup menjadi '$name'");

        response(['message' => 'Grup berhasil diperbarui']);
    }

    public static function deleteGroup($pdo, $groupId) {
        $user = getAuthenticatedUser();

        // Check admin
        $stmt = $pdo->prepare('SELECT id FROM `groups` WHERE id = ? AND admin_id = ?');
        $stmt->execute([$groupId, $user['id']]);
        if (!$stmt->fetch()) response(['message' => 'Hanya admin yang dapat menghapus grup'], 403);

        $stmt = $pdo->prepare('DELETE FROM `groups` WHERE id = ?');
        $stmt->execute([$groupId]);

        response(['message' => 'Grup berhasil dihapus']);
    }

    public static function leaveGroup($pdo, $groupId) {
        $user = getAuthenticatedUser();

        $stmt = $pdo->prepare('SELECT admin_id FROM `groups` WHERE id = ?');
        $stmt->execute([$groupId]);
        $group = $stmt->fetch();

        if (!$group) response(['message' => 'Grup tidak ditemukan'], 404);
        if ($group['admin_id'] == $user['id']) response(['message' => 'Admin tidak bisa keluar grup, hapus grup saja'], 400);

        $pdo->beginTransaction();

        try {
            $stmt = $pdo->prepare('DELETE FROM group_members WHERE group_id = ? AND user_id = ?');
            $stmt->execute([$groupId, $user['id']]);

            self::logActivity($pdo, $groupId, $user['id'], "keluar dari grup");

            $pdo->commit();
            response(['message' => 'Berhasil keluar dari grup']);
        } catch (Exception $e) {
            $pdo->rollBack();
            response(['message' => $e->getMessage()], 500);
        }
    }
}
