 export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { afm } = req.query;
    
    // 🔱 ΣΤΟΙΧΕΙΑ ΣΥΝΔΕΣΗΣ
    const USER_ID = 'InvoicePro'; 
    const SUBSCRIPTION_KEY = '0d7bb8bb96e270fae42f699881ccce38'; 

    if (!afm || afm.length !== 9) return res.status(400).json({ error: "Λάθος ΑΦΜ" });

    // 🔴 ΑΛΛΑΓΗ 1: URL Χωρίς το "N" στο τέλος (Αυτό είναι το TEST URL)
    const aadeUrl = `https://www1.gsis.gr/webtax2/wsrgwsv1/rgws/RgWsBasikaStoixeia?afm=${afm}`;

    try {
        const response = await fetch(aadeUrl, {
            method: 'GET',
            headers: {
                // 🔴 ΑΛΛΑΓΗ 2: Στο TEST περιβάλλον μερικές φορές το header θέλει "username" αντί "user-id"
                // Δοκιμάζουμε τα στάνταρ της ΑΑΔΕ πρώτα:
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

        // Έλεγχος αν η ΑΑΔΕ επιστρέφει σφάλμα (π.χ. λάθος κωδικοί)
        if (xmlText.includes('faultstring') || xmlText.includes('error_descr')) {
            const errorMsg = getValue('faultstring') || getValue('error_descr');
            return res.status(200).json({ success: false, error: "ΑΑΔΕ TEST: " + errorMsg });
        }

        const onomasia = getValue('onomasia');
        if (!onomasia) return res.status(200).json({ success: false, error: "Το ΑΦΜ δεν βρέθηκε στο TEST σύστημα." });

        res.status(200).json({
            success: true,
            result: {
                name: onomasia,
                afm: afm,
                doy: getValue('doy_descr'),
                address: (getValue('ad_od_descr') + " " + getValue('ad_arith')).trim(),
                city: getValue('ad_poli_descr'),
                zip: getValue('ad_tk')
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: "Server Error" });
    }
}
