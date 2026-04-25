<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth.php';

class TaskController {
    private static function logActivity($pdo, $groupId, $userId, $message) {
        $stmt = $pdo->prepare('INSERT INTO activities (group_id, user_id, message) VALUES (?, ?, ?)');
        $stmt->execute([$groupId, $userId, $message]);
    }

    public static function createTask($pdo) {
        $user = getAuthenticatedUser();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $groupId = $data['group_id'] ?? null;
        $title = $data['title'] ?? '';
        $description = $data['description'] ?? '';
        $deadline = $data['deadline'] ?? null;
        $assignedTo = $data['assigned_to'] ?? null;

        if (!$groupId || !$title) response(['message' => 'Group ID dan Judul wajib diisi'], 400);

        $stmt = $pdo->prepare('INSERT INTO tasks (group_id, title, description, deadline, assigned_to) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$groupId, $title, $description, $deadline, $assignedTo]);

        self::logActivity($pdo, $groupId, $user['id'], "menambahkan tugas baru: $title");

        response(['message' => 'Tugas berhasil dibuat'], 201);
    }

    public static function getGroupTasks($pdo, $groupId) {
        getAuthenticatedUser();
        $stmt = $pdo->prepare('SELECT * FROM tasks WHERE group_id = ? ORDER BY id DESC');
        $stmt->execute([$groupId]);
        response($stmt->fetchAll());
    }


    public static function updateTaskStatus($pdo, $taskId) {
        $user = getAuthenticatedUser();
        
        // Handle Multipart/form-data for proof file
        $status = $_POST['status'] ?? null;
        $proofFile = null;

        if ($status === null) {
            $data = json_decode(file_get_contents('php://input'), true);
            $status = $data['status'] ?? null;
        }

        if ($status === null) response(['message' => 'Status wajib diisi'], 400);

        $stmt = $pdo->prepare('SELECT group_id, title, proof_file FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        if (!$task) response(['message' => 'Tugas tidak ditemukan'], 404);

        $updateSql = 'UPDATE tasks SET status = ?';
        $params = [$status];

        if (isset($_FILES['proof']) && $_FILES['proof']['error'] === UPLOAD_ERR_OK) {
            $ext = pathinfo($_FILES['proof']['name'], PATHINFO_EXTENSION);
            if (strtolower($ext) !== 'pdf') response(['message' => 'Hanya file PDF yang diperbolehkan'], 400);

            $filename = time() . '_' . uniqid() . '.pdf';
            if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0777, true);
            
            if (move_uploaded_file($_FILES['proof']['tmp_name'], UPLOAD_DIR . $filename)) {
                $updateSql .= ', proof_file = ?, completed_at = NOW()';
                $params[] = $filename;
            }
        } else if ($status == 1) {
             $updateSql .= ', completed_at = NULL, proof_file = NULL';
        }

        $updateSql .= ' WHERE id = ?';
        $params[] = $taskId;

        $stmt = $pdo->prepare($updateSql);
        $stmt->execute($params);

        $statusText = $status == 1 ? "memulai" : ($status == 2 ? "menyelesaikan" : "memperbarui");
        self::logActivity($pdo, $task['group_id'], $user['id'], "$statusText tugas: " . $task['title']);

        response(['message' => 'Status tugas diperbarui']);
    }

    public static function assignTask($pdo, $taskId) {
        $user = getAuthenticatedUser();
        $data = json_decode(file_get_contents('php://input'), true);
        $userId = $data['userId'] ?? null;

        $stmt = $pdo->prepare('SELECT group_id, title FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        if (!$task) response(['message' => 'Tugas tidak ditemukan'], 404);

        $stmt = $pdo->prepare('UPDATE tasks SET assigned_to = ? WHERE id = ?');
        $stmt->execute([$userId, $taskId]);

        $stmt = $pdo->prepare('SELECT name FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $targetUser = $stmt->fetch();
        $targetName = $targetUser ? $targetUser['name'] : 'seseorang';

        self::logActivity($pdo, $task['group_id'], $user['id'], "menugaskan '" . $task['title'] . "' kepada $targetName");

        response(['message' => 'Tugas berhasil ditugaskan']);
    }

    public static function deleteTask($pdo, $taskId) {
        $user = getAuthenticatedUser();

        $stmt = $pdo->prepare('SELECT group_id, title FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);
        $task = $stmt->fetch();
        if (!$task) response(['message' => 'Tugas tidak ditemukan'], 404);

        $stmt = $pdo->prepare('DELETE FROM tasks WHERE id = ?');
        $stmt->execute([$taskId]);

        self::logActivity($pdo, $task['group_id'], $user['id'], "menghapus tugas: " . $task['title']);

        response(['message' => 'Tugas berhasil dihapus']);
    }
}
