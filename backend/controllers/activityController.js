const db = require('../db');

exports.getGroupActivities = async (req, res) => {
    try {
        const { groupId } = req.params;
        const [rows] = await db.execute(
            `SELECT a.*, u.name as user_name 
             FROM activities a 
             JOIN users u ON a.user_id = u.id 
             WHERE a.group_id = ? 
             ORDER BY a.created_at DESC`,
            [groupId]
        );
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Internal helper to log activity
exports.logActivity = async (groupId, userId, message) => {
    try {
        if (!groupId || !userId) {
            console.error('Missing groupId or userId for logging:', { groupId, userId });
            return;
        }
        await db.execute(
            'INSERT INTO activities (group_id, user_id, message) VALUES (?, ?, ?)',
            [groupId, userId, message]
        );
        console.log(`Activity Logged: ${message}`);
    } catch (error) {
        console.error('CRITICAL: Failed to log activity:', error);
    }
};

exports.clearGroupActivities = async (req, res) => {
    try {
        const { groupId } = req.params;
        await db.execute('DELETE FROM activities WHERE group_id = ?', [groupId]);
        res.json({ message: 'Log aktivitas berhasil dibersihkan' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


