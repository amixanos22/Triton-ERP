export default async function handler(req, res) {
    const { afm, user, key } = req.query;

    if (!afm || !user || !key) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    // 🔱 Χρησιμοποιούμε το URL για αναζήτηση στοιχείων Μητρώου
    const aadeUrl = `https://www.aade.gr/taxisnet/mytaxisnet/v1/opendata/rgwsBasikaStoixeiaN?afm=${afm}`;

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

        // 🔱 Μετατροπή XML σε JSON (απλό parsing) για να το διαβάζει εύκολα το Blogger
        const extract = (tag) => {
            const match = xmlData.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1].trim() : "";
        };

        const result = {
            success: xmlData.includes('onomasia'),
            name: extract('onomasia'),
            address: extract('ad_od_descr') + " " + extract('ad_arith'),
            city: extract('ad_poli_descr'),
            zip: extract('ad_tk'),
            error: xmlData.includes('error_descr') ? extract('error_descr') : null
        };

        res.status(200).json(result); // Στέλνουμε καθαρό JSON
    } catch (error) {
        res.status(500).json({ success: false, error: "Connection to AADE failed" });
    }
}
