const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    if (password.length < 6)
      return res.status(400).json({ success: false, message: 'Password minimal 6 karakter.' });
    const existing = await User.findByEmail(email);
    if (existing)
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    const user = await User.create({ name, email, password, phone });
    const token = generateToken(user);
    res.status(201).json({ success: true, message: 'Registrasi berhasil!', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    const user = await User.findByEmail(email);
    if (!user)
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    const valid = await User.comparePassword(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    const token = generateToken(user);
    res.json({
      success: true, message: 'Login berhasil!', token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// GET /api/auth/me
const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, address, city, province, postal_code } = req.body;
    if (!name)
      return res.status(400).json({ success: false, message: 'Nama tidak boleh kosong.' });
    const user = await User.updateProfile(req.user.id, { name, phone, address, city, province, postal_code });
    res.json({ success: true, message: 'Profil berhasil diupdate.', user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengupdate profil.' });
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    if (!old_password || !new_password)
      return res.status(400).json({ success: false, message: 'Password lama dan baru wajib diisi.' });
    if (new_password.length < 6)
      return res.status(400).json({ success: false, message: 'Password baru minimal 6 karakter.' });

    const user = await User.findByEmail(req.user.email);
    const valid = await bcrypt.compare(old_password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Password lama salah.' });

    const hashed = await bcrypt.hash(new_password, 10);
    await require('../config/db').query(
      'UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2',
      [hashed, req.user.id]
    );
    res.json({ success: true, message: 'Password berhasil diubah.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ success: false, message: 'Gagal mengubah password.' });
  }
};

module.exports = { register, login, me, updateProfile, changePassword };
