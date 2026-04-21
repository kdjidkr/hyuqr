    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });
    
    const pyxisToken = req.headers['x-pyxis-auth-token'];
    if (!pyxisToken) return res.status(401).json({ message: 'Missing X-Pyxis-Auth-Token Header' });
    
    try {
        const fetchRes = await fetch('https://lib.hanyang.ac.kr/pyxis-api/2/api/my-membership-card?type=qrcode', {
            method: 'GET',
            headers: {
                'Pyxis-Auth-Token': pyxisToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*'
            }
        });

        if (!fetchRes.ok) {
            return res.status(fetchRes.status).json({ message: 'Failed to fetch QR data', status: fetchRes.status });
        }

        const data = await fetchRes.json();
        
        return res.status(200).json({
            success: true,
            data: data
        });

    } catch (err) {
        console.error('QR fetch error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
