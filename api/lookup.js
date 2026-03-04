export default async function handler(req, res) {
    const { afm, user, key } = req.query;

    if (!afm || !user || !key) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const aadeUrl = `https://data.aade.gr/retriever/reserver/declaration/v1/afmInfo?afm=${afm}`;

    try {
        const response = await fetch(aadeUrl, {
            method: 'GET',
            headers: {
                'aade-user-id': user,
                'ocp-apim-subscription-key': key,
                'Accept': 'application/xml'
            }
        });

        const xmlData = await response.text();
        res.setHeader('Content-Type', 'text/xml');
        res.status(200).send(xmlData);
    } catch (error) {
        res.status(500).json({ error: "Connection failed" });
    }
}
