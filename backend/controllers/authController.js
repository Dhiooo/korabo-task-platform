const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { name, nim, email, password } = req.body;
        
        // Check if user exists
        const [existing] = await db.execute('SELECT id FROM users WHERE nim = ? OR email = ?', [nim, email]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'NIM atau Email sudah terdaftar' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
            'INSERT INTO users (name, nim, email, password) VALUES (?, ?, ?, ?)',
            [name, nim, email, hashedPassword]
        );

        res.status(201).json({ message: 'Registrasi berhasil' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { nim, password } = req.body;
        const [users] = await db.execute('SELECT * FROM users WHERE nim = ?', [nim]);
        
        if (users.length === 0) {
            return res.status(401).json({ message: 'NIM tidak ditemukan' });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Password salah' });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        res.json({
            message: 'Login berhasil',
            token,
            user: { id: user.id, name: user.name, nim: user.nim }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
