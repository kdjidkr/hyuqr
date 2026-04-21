export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

    const pyxisToken = req.headers['x-pyxis-auth-token'];
    const { seatCharge } = req.body || {};
    
    if (!pyxisToken) {
        return res.status(401).json({ message: 'Missing Pyxis-Auth-Token' });
    }
    if (!seatCharge) {
        return res.status(400).json({ message: 'Missing seatCharge ID' });
    }

    try {
        const fetchRes = await fetch(`https://lib.hanyang.ac.kr/pyxis-api/2/api/seat-charges/${seatCharge}?smufMethodCode=PC&_method=delete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Pyxis-Auth-Token': pyxisToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0 Safari/537.36',
                'Origin': 'https://information.hanyang.ac.kr',
                'Referer': 'https://information.hanyang.ac.kr/'
            },
            body: null
        });

        const data = await fetchRes.json();

        if (!fetchRes.ok) {
            return res.status(fetchRes.status).json(data);
        }

        return res.status(200).json(data);

    } catch (err) {
        console.error('Seat Cancel API error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
