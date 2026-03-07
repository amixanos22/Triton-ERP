 export default async function handler(req, res) {
    const { afm } = req.query;
    
    // Εδώ βάλε τους δικούς σου κωδικούς ΑΑΔΕ
    const USER_ID = 'ΤΟ_USER_ID_ΣΟΥ'; 
    const SUBSCRIPTION_KEY = 'ΤΟ_KEY_ΣΟΥ';

    if (!afm) return res.status(400).json({ error: "Λείπει το ΑΦΜ" });

    const aadeUrl = `https://data.aade.gr/retriever/reserver/declaration/v1/afmInfo?afm=${afm}`;

    try {
        const response = await fetch(aadeUrl, {
            method: 'GET',
            headers: {
                'aade-user-id': USER_ID,
                'ocp-apim-subscription-key': SUBSCRIPTION_KEY,
                'Accept': 'application/xml'
            }
        });

        const xmlText = await response.text();
        
        // Βοηθητική λειτουργία για να παίρνουμε τα στοιχεία από το XML
        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`));
            return match ? match[1].trim() : "";
        };

        // Επιστρέφουμε τα στοιχεία σε μορφή JSON που καταλαβαίνει η Index
        res.status(200).json({
            success: xmlText.includes('<onomasia>'),
            result: {
                onomasia: getValue('onomasia'),
                doy_descr: getValue('doy_descr'),
                drastiriotita: getValue('j031_descr'),
                dieythinsi: getValue('ad_od_descr') + " " + getValue('ad_arith'),
                poli: getValue('ad_poli_descr'),
                tk: getValue('ad_tk')
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Αποτυχία σύνδεσης" });
    }
}
