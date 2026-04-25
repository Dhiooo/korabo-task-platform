<?php
require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../auth.php';

class AssessmentController {
    public static function getReport($pdo, $groupId) {
        getAuthenticatedUser();

        // Get members
        $stmt = $pdo->prepare('
            SELECT u.id, u.name, u.nim 
            FROM users u 
            JOIN group_members gm ON u.id = gm.user_id 
            WHERE gm.group_id = ?
        ');
        $stmt->execute([$groupId]);
        $members = $stmt->fetchAll();

        $reportData = [];
        foreach ($members as $m) {
            $stmt = $pdo->prepare('
                SELECT completed_at, deadline FROM tasks 
                WHERE assigned_to = ? AND group_id = ? AND status = 2
            ');
            $stmt->execute([$m['id'], $groupId]);
            $tasks = $stmt->fetchAll();

            $totalDone = count($tasks);
            $onTimeCount = 0;

            foreach ($tasks as $t) {
                if (strtotime($t['completed_at']) <= strtotime($t['deadline'])) {
                    $onTimeCount++;
                }
            }

            $punctuality = $totalDone > 0 
                ? round(($onTimeCount / $totalDone) * 100) 
                : 0;

            $reportData[] = [
                'name' => $m['name'],
                'nim' => $m['nim'],
                'total_tasks' => $totalDone,
                'punctuality' => $punctuality . '%'
            ];
        }

        response($reportData);
    }
}
