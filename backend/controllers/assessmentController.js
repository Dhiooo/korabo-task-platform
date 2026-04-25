const db = require('../db');

exports.getReport = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Ambil semua anggota grup
        const [members] = await db.execute(
            `SELECT u.id, u.name, u.nim 
             FROM users u 
             JOIN group_members gm ON u.id = gm.user_id 
             WHERE gm.group_id = ?`,
            [groupId]
        );

        const reportData = await Promise.all(members.map(async (m) => {
            // Ambil tugas yang sudah selesai (status 2)
            const [tasks] = await db.execute(
                `SELECT completed_at, deadline FROM tasks 
                 WHERE assigned_to = ? AND group_id = ? AND status = 2`,
                [m.id, groupId]
            );

            const totalDone = tasks.length;
            let onTimeCount = 0;

            tasks.forEach(t => {
                const completed = new Date(t.completed_at);
                const deadline = new Date(t.deadline);
                if (completed <= deadline) {
                    onTimeCount++;
                }
            });

            const punctuality = totalDone > 0 
                ? Math.round((onTimeCount / totalDone) * 100) 
                : 0;

            return {
                name: m.name,
                nim: m.nim,
                total_tasks: totalDone,
                punctuality: punctuality + '%'
            };
        }));

        res.json(reportData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Fungsi submitAssessment bisa tetap ada atau dihapus jika benar-benar tidak terpakai lagi
exports.submitAssessment = async (req, res) => {
    res.status(400).json({ message: 'Fitur rating sudah dinonaktifkan dan diganti dengan Ketepatan Waktu otomatis.' });
};
