 export default async function handler(req, res) {
    // 🔱 1. CORS SETTINGS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 🔱 2. ΣΤΟΙΧΕΙΑ ΠΟΥ ΕΙΝΑΙ ΗΔΗ ΕΝΕΡΓΑ ΣΤΟ WRAPP
    const { afm } = req.query;
    const USER_ID = 'wrapp1693208337'; 
    const SUBSCRIPTION_KEY = '4c245d648733e2decccc879d631c633c';

    if (!afm) return res.status(400).json({ error: "Λείπει το ΑΦΜ" });

    // ✅ ΧΡΗΣΗ ΤΟΥ GSIS URL ΠΟΥ ΕΙΝΑΙ ΓΙΑ ΤΟΥΣ "ΕΙΔΙΚΟΥΣ ΚΩΔΙΚΟΥΣ"
    const aadeUrl = `https://www1.gsis.gr/webtax2/wsrgwsv1/rgws/RgWsBasikaStoixeiaN?afm=${afm}`;

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
        
        // Καθαρισμός των δεδομένων από το XML
        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1].trim() : "";
        };

        // 🔱 3. ΕΛΕΓΧΟΣ ΓΙΑ ΣΦΑΛΜΑΤΑ
        if (xmlText.includes('error_descr') || xmlText.includes('faultstring')) {
            const errorMsg = getValue('error_descr') || getValue('faultstring');
            return res.status(200).json({ success: false, error: errorMsg || "Λάθος κωδικοί" });
        }

        const onomasia = getValue('onomasia');

        if (!onomasia) {
             return res.status(200).json({ success: false, error: "Το ΑΦΜ δεν βρέθηκε ή οι κωδικοί δεν έχουν δικαίωμα αναζήτησης" });
        }

        // 🔱 4. ΕΠΙΣΤΡΟΦΗ ΣΤΟ TRITON
        res.status(200).json({
            success: true,
            result: {
                onomasia: onomasia,
                doy_descr: getValue('doy_descr'),
                drastiriotita: getValue('j031_descr'),
                dieythinsi: getValue('ad_od_descr') + " " + getValue('ad_arith'),
                poli: getValue('ad_poli_descr'),
                tk: getValue('ad_tk')
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, error: "Σφάλμα διακομιστή" });
    }
}
