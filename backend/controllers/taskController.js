const db = require('../db');
const { logActivity } = require('./activityController');

exports.createTask = async (req, res) => {
    try {
        const { group_id, assigned_to, title, description, deadline } = req.body;
        
        await db.execute(
            'INSERT INTO tasks (group_id, assigned_to, title, description, deadline) VALUES (?, ?, ?, ?, ?)',
            [group_id, assigned_to, title, description, deadline]
        );

        await logActivity(group_id, req.user.id, `menambahkan tugas baru: "${title}"`);


        res.status(201).json({ message: 'Tugas berhasil dibuat' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGroupTasks = async (req, res) => {
    try {
        const { groupId } = req.params;
        const [tasks] = await db.execute(
            `SELECT t.*, u.name as assigned_name FROM tasks t 
             LEFT JOIN users u ON t.assigned_to = u.id 
             WHERE t.group_id = ?`,
            [groupId]
        );
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.assignTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { userId } = req.body;

        const [task] = await db.execute('SELECT title, group_id FROM tasks WHERE id = ?', [taskId]);
        await db.execute(
            'UPDATE tasks SET assigned_to = ? WHERE id = ?',
            [userId, taskId]
        );
        await logActivity(task[0].group_id, req.user.id, `menugaskan tugas "${task[0].title}" ke pengguna lain`);

        res.json({ message: 'Tugas berhasil ditugaskan' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


exports.updateTaskStatus = async (req, res) => {
    try {
        const { taskId } = req.params;
        const { status } = req.body;
        const proof_file = req.file ? req.file.filename : null;

        if (status == 2 && !proof_file) {
            return res.status(400).json({ message: 'Bukti tugas wajib diunggah untuk status Selesai' });
        }

        let query = 'UPDATE tasks SET status = ?';
        let params = [status];

        if (status == 2) {
            query += ', completed_at = NOW()';
        }

        if (proof_file) {
            query += ', proof_file = ?';
            params.push(proof_file);
        }

        query += ' WHERE id = ?';
        params.push(taskId);

        await db.execute(query, params);

        const [task] = await db.execute('SELECT title, group_id FROM tasks WHERE id = ?', [taskId]);
        const statusMap = { 0: 'Not Started', 1: 'In Progress', 2: 'Selesai' };
        await logActivity(task[0].group_id, req.user.id, `mengubah status tugas "${task[0].title}" ke ${statusMap[status]}`);

        res.json({ message: 'Status tugas diperbarui' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const [task] = await db.execute('SELECT title, group_id FROM tasks WHERE id = ?', [taskId]);
        await db.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
        await logActivity(task[0].group_id, req.user.id, `menghapus tugas: "${task[0].title}"`);
        res.json({ message: 'Tugas berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

