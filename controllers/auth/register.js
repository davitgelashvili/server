'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../../db');

const fs = require('fs')
const path = require('path')

const {
    signAccessToken,
    signRefreshToken,
    sha256,
    refreshCookieOptions
} = require('../../utils/tokens');

function isEmail(s) {
    return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function generateUserId() {
    return 'u_' + crypto.randomBytes(9).toString('hex'); // 18 chars
}

async function createUniqueUserId() {
    for (let i = 0; i < 10; i++) {
        const userId = generateUserId();
        const [rows] = await pool.execute(
            'SELECT user_id FROM users WHERE user_id = ? LIMIT 1',
            [userId]
        );
        if (!rows.length) return userId;
    }
    throw new Error('Cannot generate unique userId');
}

async function register(req, res) {
    try {
        const { email, fullname, password, link, cover, status } = req.body;
        
        const avatar = req.file; //მულტერი რექვესტიდან იღებს ავატარის ფოტოს როგორც ფაილს

        if (!isEmail(email))
            return res.status(400).json({ success: false, message: 'Invalid email' });

        if (!fullname || fullname.trim().length < 2)
            return res.status(400).json({ success: false, message: 'Invalid fullname' });

        if (!password || password.length < 8)
            return res.status(400).json({ success: false, message: 'Password must be 8+ chars' });

        const [exists] = await pool.execute(
            'SELECT user_id FROM users WHERE email = ? LIMIT 1',
            [email]
        );
        if (exists.length)
            return res.status(409).json({ success: false, message: 'Email already exists' });

        const userId = await createUniqueUserId();
        const passwordHash = await bcrypt.hash(password, 12);

        await pool.execute(
            `INSERT INTO users (user_id, email, fullname, password_hash, link, cover, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                userId,
                email, 
                fullname.trim(),
                passwordHash,
                link || null,
                cover || null,
                status || 'Visitor'
            ]
        );

        let avatarBase64 = null; //ავატარის ცვლადი base64 ფორმატში
        if (avatar) {
            try {
                const data = await fs.promises.readFile(avatar.path); //fs კითხულობს ავატარის ფოტოს და აბრუნებს პასუხს
                await pool.query('UPDATE users SET avatar = ? WHERE user_id = ?', [data, userId]); 
                avatarBase64 = data.toString('base64');//თუ ვალიდურია დატაბაზაში შეგვაქვს და ავატარის ცვლადს ვანიჭებს ამ მნიშვნელობას
            } catch (err) {//თუ არავალიდურია (fs-მა თუ არ მიიღო ამ ტიპის იმეიჯი)ერრორს ვაბრუნებთ და ავატარის ფოტოდ დეფაულტ ფოტოს ვირჩევთ (/public/avatar-default.svg)
                console.error(err);
                const defaultAvatarPath = path.join(__dirname, '../../public/avatar-default.svg');
                const defaultAvatarBuffer = fs.readFileSync(defaultAvatarPath);
                avatarBase64 = defaultAvatarBuffer.toString('base64');
            }
        } else {//თუ იუზერს არ ექნება ავატარის ფოტო არჩეული , ვიყენებთ დეფაულტ ავატარის ფოტოს
            const defaultAvatarPath = path.join(__dirname, '../../public/avatar-default.svg');
            const defaultAvatarBuffer = fs.readFileSync(defaultAvatarPath);
            avatarBase64 = defaultAvatarBuffer.toString('base64');
        }

        const accessToken = signAccessToken({ userId });
        const refreshToken = signRefreshToken({ userId });

        const tokenHash = sha256(refreshToken);
        const expiresAt = new Date(
            Date.now() + Number(process.env.REFRESH_TTL_DAYS || 30) * 24 * 60 * 60 * 1000
        );

        await pool.execute(
            'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
            [userId, tokenHash, expiresAt]
        );

        res.cookie('refresh_token', refreshToken, refreshCookieOptions());

        return res.status(201).json({
            success: true,
            accessToken,
            user: {
                userId,
                email,
                fullname,
                link: link || null,
                cover: cover || null,
                status : status || null,
                avatar: avatarBase64 //ავატარის ფოტო base64 ფორმატში
            }//როდესაც ყველა ინფორმაცია ვალიდური იქნება ფრონტენდზე დავაბრუნებთ ამ მონაცემებს
        });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = register;
