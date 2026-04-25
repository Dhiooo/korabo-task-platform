<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth.php';

class ActivityController {
    public static function getGroupActivities($pdo, $groupId) {
        getAuthenticatedUser();
        $stmt = $pdo->prepare('
            SELECT a.*, u.name as user_name 
            FROM activities a
            JOIN users u ON a.user_id = u.id
            WHERE a.group_id = ?
            ORDER BY a.created_at DESC
            LIMIT 50
        ');
        $stmt->execute([$groupId]);
        response($stmt->fetchAll());
    }

    public static function clearGroupActivities($pdo, $groupId) {
        $user = getAuthenticatedUser();
        
        // Check admin
        $stmt = $pdo->prepare('SELECT admin_id FROM `groups` WHERE id = ?');
        $stmt->execute([$groupId]);
        $group = $stmt->fetch();
        
        if (!$group || $group['admin_id'] != $user['id']) response(['message' => 'Hanya admin yang dapat menghapus log'], 403);


        $stmt = $pdo->prepare('DELETE FROM activities WHERE group_id = ?');
        $stmt->execute([$groupId]);
        
        response(['message' => 'Riwayat aktivitas berhasil dihapus']);
    }
}
