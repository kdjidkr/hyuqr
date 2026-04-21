export default async function handler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

    const pyxisToken = req.headers['x-pyxis-auth-token'];
    
    if (!pyxisToken) {
        return res.status(401).json({ message: 'Missing Pyxis-Auth-Token' });
    }

    try {
        const fetchRes = await fetch('https://lib.hanyang.ac.kr/pyxis-api/2/api/smuf-dashboard?type=seat', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json;charset=UTF-8',
                'Pyxis-Auth-Token': pyxisToken,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/147.0.0.0 Safari/537.36',
                'Origin': 'https://information.hanyang.ac.kr',
                'Referer': 'https://information.hanyang.ac.kr/'
            }
        });

        if (!fetchRes.ok) {
            return res.status(fetchRes.status).json({ message: 'Failed to fetch seat data from Hanyang API' });
        }

        const data = await fetchRes.json();
        return res.status(200).json(data);

    } catch (err) {
        console.error('Seat API fetch error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}
