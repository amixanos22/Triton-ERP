 export default async function handler(req, res) {
    // 🔱 1. ΡΥΘΜΙΣΕΙΣ CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 🔱 2. ΠΑΡΑΜΕΤΡΟΙ & ΚΛΕΙΔΙΑ (Από το wrapp που μου έστειλες)
    const { afm } = req.query;
    const USER_ID = 'wrapp1693208337'; 
    const SUBSCRIPTION_KEY = '4c245d648733e2decccc879d631c633c';

    if (!afm) return res.status(400).json({ error: "Λείπει το ΑΦΜ" });

    // ✅ ΑΛΛΑΓΗ ΣΤΟ ΚΛΑΣΙΚΟ URL (Πιο συμβατό με παλιότερα wrapp)
    const aadeUrl = `https://www.aade.gr/taxisnet/mytaxisnet/v1/opendata/rgwsBasikaStoixeiaN?afm=${afm}`;

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
        
        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1].trim() : "";
        };

        // 🔱 3. ΕΛΕΓΧΟΣ ΣΦΑΛΜΑΤΩΝ
        if (xmlText.includes('error_descr') || xmlText.includes('faultstring')) {
            const errorMsg = getValue('error_descr') || "Λάθος κωδικοί ή μη εξουσιοδοτημένη πρόσβαση";
            return res.status(200).json({ success: false, error: errorMsg });
        }

        const onomasia = getValue('onomasia');

        if (!onomasia) {
            return res.status(200).json({ success: false, error: "Δεν βρέθηκαν στοιχεία στην ΑΑΔΕ" });
        }

        // 🔱 4. ΕΠΙΣΤΡΟΦΗ ΔΕΔΟΜΕΝΩΝ
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
        res.status(500).json({ success: false, error: "Αποτυχία σύνδεσης" });
    }
}
