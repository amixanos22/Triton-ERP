 export default async function handler(req, res) {
    // CORS Headers για να επιτρέπεται η κλήση από το Triton Frontend
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { afm } = req.query;
    
    // 🔱 ΣΤΟΙΧΕΙΑ ΣΥΝΔΕΣΗΣ (Βεβαιώσου ότι το USER_ID είναι το Username σου από το GSIS)
    const USER_ID = 'InvoicePro'; 
    const SUBSCRIPTION_KEY = '0d7bb8bb96e270fae42f699881ccce38'; 

    if (!afm || afm.length !== 9) {
        return res.status(400).json({ success: false, error: "Το ΑΦΜ πρέπει να είναι 9 ψηφία." });
    }

    // Δοκιμάζουμε το βασικό URL της ΑΑΔΕ
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
        
        // Helper για εξαγωγή τιμών από το XML
        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1].trim() : "";
        };

        // Έλεγχος σφαλμάτων ΑΑΔΕ
        if (xmlText.includes('error_descr') || xmlText.includes('faultstring')) {
            const errorMsg = getValue('error_descr') || getValue('faultstring');
            return res.status(200).json({ success: false, error: errorMsg });
        }

        const onomasia = getValue('onomasia');
        if (!onomasia) {
            return res.status(200).json({ success: false, error: "Το ΑΦΜ δεν βρέθηκε ή δεν ανήκει σε επιχείρηση." });
        }

        // Επιστροφή δεδομένων σε JSON μορφή
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
        res.status(500).json({ success: false, error: "Αποτυχία σύνδεσης με την υπηρεσία ΑΑΔΕ." });
    }
}
