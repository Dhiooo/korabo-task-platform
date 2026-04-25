const db = require('../db');
const { logActivity } = require('./activityController');

const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
};

exports.createGroup = async (req, res) => {
    try {
        const { name } = req.body;
        const admin_id = req.user.id;
        const code = generateCode();

        const [result] = await db.execute(
            'INSERT INTO `groups` (name, admin_id, code) VALUES (?, ?, ?)',
            [name, admin_id, code]
        );
        const group_id = result.insertId;

        await db.execute(
            'INSERT INTO group_members (group_id, user_id) VALUES (?, ?)',
            [group_id, admin_id]
        );

        res.status(201).json({ message: 'Grup berhasil dibuat', code });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.joinGroup = async (req, res) => {
    try {
        const { code } = req.body;
        const user_id = req.user.id;

        const [group] = await db.execute('SELECT id FROM `groups` WHERE code = ?', [code]);
        if (group.length === 0) return res.status(404).json({ message: 'Kode grup tidak valid' });

        const group_id = group[0].id;
        const [check] = await db.execute('SELECT * FROM group_members WHERE group_id = ? AND user_id = ?', [group_id, user_id]);
        if (check.length > 0) return res.status(400).json({ message: 'Anda sudah bergabung di grup ini' });

        await db.execute('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [group_id, user_id]);
        
        await logActivity(group_id, user_id, `telah bergabung ke dalam grup`);

        res.json({ message: 'Berhasil bergabung ke grup' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyGroups = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [groups] = await db.execute(
            `SELECT g.* FROM \`groups\` g 
             JOIN group_members gm ON g.id = gm.group_id 
             WHERE gm.user_id = ?`,
            [user_id]
        );
        res.json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const [members] = await db.execute(
            `SELECT u.id, u.name, u.nim, 
             (u.id = g.admin_id) as is_admin
             FROM users u 
             JOIN group_members gm ON u.id = gm.user_id 
             JOIN \`groups\` g ON gm.group_id = g.id
             WHERE gm.group_id = ?`,
            [groupId]
        );

        res.json(members);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name } = req.body;
        const user_id = req.user.id;

        const [group] = await db.execute('SELECT admin_id FROM `groups` WHERE id = ?', [groupId]);
        if (group.length === 0) return res.status(404).json({ message: 'Grup tidak ditemukan' });
        if (group[0].admin_id !== user_id) return res.status(403).json({ message: 'Hanya admin yang bisa mengubah grup' });

        await db.execute('UPDATE `groups` SET name = ? WHERE id = ?', [name, groupId]);
        res.json({ message: 'Nama grup berhasil diperbarui' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const user_id = req.user.id;

        const [group] = await db.execute('SELECT admin_id FROM `groups` WHERE id = ?', [groupId]);
        if (group.length === 0) return res.status(404).json({ message: 'Grup tidak ditemukan' });
        if (group[0].admin_id !== user_id) return res.status(403).json({ message: 'Hanya admin yang bisa menghapus grup' });

        await db.execute('DELETE FROM `groups` WHERE id = ?', [groupId]);
        res.json({ message: 'Grup dan seluruh isinya berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const user_id = req.user.id;

        const [group] = await db.execute('SELECT admin_id FROM `groups` WHERE id = ?', [groupId]);
        if (group.length === 0) return res.status(404).json({ message: 'Grup tidak ditemukan' });
        
        if (group[0].admin_id === user_id) {
            return res.status(400).json({ message: 'Admin tidak bisa keluar grup, gunakan Hapus Grup untuk membubarkan.' });
        }

        await logActivity(groupId, user_id, 'telah keluar dari grup');
        await db.execute('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, user_id]);
        
        res.json({ message: 'Berhasil keluar dari grup' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
