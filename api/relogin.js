import { decrypt } from './_lib/crypto.js';

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });
    
    const { encryptedCredentials } = req.body || {};
    if (!encryptedCredentials) {
        return res.status(400).json({ message: 'Missing encrypted credentials' });
    }

    try {
        const decryptedStr = decrypt(encryptedCredentials);
        const { loginId, password } = JSON.parse(decryptedStr);
        
        if (!loginId || !password) throw new Error('Invalid payload');

        const fetchRes = await fetch('https://lib.hanyang.ac.kr/pyxis-api/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({ loginId, password })
        });

        const responseBody = await fetchRes.json();

        if (!fetchRes.ok || (responseBody.success === false)) {
            return res.status(401).json({ 
                message: responseBody.message || 'Login failed from Hanyang API (Check your ID or Password)',
                details: responseBody 
            });
        }

        const accessToken = responseBody.data?.accessToken;
        const name = responseBody.data?.name;

        if (!accessToken) {
            return res.status(401).json({ 
                message: 'Access token not found in response JSON', 
                details: responseBody 
            });
        }

        return res.status(200).json({
            success: true,
            accessToken,
            name
        });

    } catch (err) {
        console.error('Relogin error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
