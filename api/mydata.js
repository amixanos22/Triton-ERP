 export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { afm } = req.query;
    
    // 🔱 ΒΑΛΕ ΕΔΩ ΤΑ ΣΤΟΙΧΕΙΑ ΠΟΥ ΜΟΛΙΣ ΕΒΓΑΛΕΣ
    const USER_ID = 'wrapp1693208337'; 
    const SUBSCRIPTION_KEY = '4c245d648733e2decccc879d631c633c'; 

    if (!afm || afm.length !== 9) {
        return res.status(400).json({ success: false, error: "Λάθος ΑΦΜ" });
    }

    // 🟢 ΧΡΗΣΙΜΟΠΟΙΟΥΜΕ ΤΟ LIVE URL (ΜΕ ΤΟ N)
    const aadeUrl = `https://www1.gsis.gr/webtax2/wsrgwsv1/rgws/RgWsBasikaStoixeiaN?afm=${afm}`;

    try {
        const response = await fetch(aadeUrl, {
            method: 'GET',
            headers: {
                'aade-user-id': USER_ID,
                'aade-subscription-key': SUBSCRIPTION_KEY,
                'Accept': 'application/xml'
            }
        });

        const xmlText = await response.text();
        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1].trim() : "";
        };

        const onomasia = getValue('onomasia');
        if (!onomasia) {
            const errorMsg = getValue('error_descr') || "Το ΑΦΜ δεν βρέθηκε στο Μητρώο.";
            return res.status(200).json({ success: false, error: errorMsg });
        }

        res.status(200).json({
            success: true,
            result: {
                name: onomasia,
                afm: afm,
                doy: getValue('doy_descr'),
                job: getValue('j031_descr'),
                address: (getValue('ad_od_descr') + " " + getValue('ad_arith')).trim(),
                city: getValue('ad_poli_descr'),
                zip: getValue('ad_tk')
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Σφάλμα διακομιστή ΑΑΔΕ" });
    }
}
