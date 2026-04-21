import { encrypt } from './_lib/crypto.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    
    const { loginId, password } = req.body || {};
    if (!loginId || !password) {
        return res.status(400).json({ message: 'Missing login credentials' });
    }

    try {
        const fetchRes = await fetch('https://lib.hanyang.ac.kr/pyxis-api/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({ loginId, password })
        });

        if (!fetchRes.ok) {
            return res.status(401).json({ message: 'Login failed from Hanyang API' });
        }

        const setCookies = fetchRes.headers.getSetCookie();
        const pyxisCookieStr = setCookies.find(c => c.startsWith('HYU_PYXIS3='));

        if (!pyxisCookieStr) {
            return res.status(401).json({ message: 'HYU_PYXIS3 cookie not found, login may have failed.' });
        }

        // Extract value
        const cookieVal = pyxisCookieStr.split(';')[0].substring('HYU_PYXIS3='.length);
        const decoded = decodeURIComponent(cookieVal);
        const pyxisData = JSON.parse(decoded);
        const accessToken = pyxisData.accessToken;

        if (!accessToken) {
            return res.status(401).json({ message: 'Access token not found in cookie' });
        }

        const encryptedCredentials = encrypt(JSON.stringify({ loginId, password }));

        return res.status(200).json({
            success: true,
            accessToken,
            name: pyxisData.name,
            encryptedCredentials
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
