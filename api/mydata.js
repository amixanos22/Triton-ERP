export default async function handler(req, res) {
    // CORS & Security Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { afm } = req.query;
    
    // 🔱 ΤΑ ΣΤΟΙΧΕΙΑ ΣΟΥ (ΠΡΟΣΟΧΗ ΣΤΑ ΟΝΟΜΑΤΑ)
    const USER_ID = 'TritonPRO'; // Εδώ βάλε το Username από το gsis.gr
    const SUBSCRIPTION_KEY = '0d7bb8bb96e270fae42f699881ccce38'; 

    if (!afm || afm.length !== 9) return res.status(400).json({ error: "Λείπει το ΑΦΜ ή είναι λάθος" });

    // Το σωστό URL της ΑΑΔΕ
    const aadeUrl = `https://www1.gsis.gr/webtax2/wsrgwsv1/rgws/RgWsBasikaStoixeiaN?afm=${afm}`;

    try {
        const response = await fetch(aadeUrl, {
            method: 'GET',
            headers: {
                'aade-user-id': USER_ID,
                'aade-subscription-key': SUBSCRIPTION_KEY, // ΕΔΩ ΗΤΑΝ ΤΟ ΛΑΘΟΣ
                'Accept': 'application/xml'
            }
        });

        const xmlText = await response.text();
        
        // Helper συνάρτηση για να βγάζουμε τα δεδομένα από το XML
        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1].trim() : "";
        };

        // Έλεγχος για σφάλματα από την ΑΑΔΕ
        if (xmlText.includes('error_descr') || xmlText.includes('faultstring')) {
            const errorMsg = getValue('error_descr') || getValue('faultstring');
            return res.status(200).json({ success: false, error: errorMsg });
        }

        const onomasia = getValue('onomasia');
        if (!onomasia) return res.status(200).json({ success: false, error: "Το ΑΦΜ δεν βρέθηκε" });

        // Επιστροφή καθαρών δεδομένων στο Triton Frontend
        res.status(200).json({
            success: true,
            result: {
                onomasia: onomasia,
                doy_descr: getValue('doy_descr'),
                drastiriotita: getValue('j031_descr'),
                dieythinsi: (getValue('ad_od_descr') + " " + getValue('ad_arith')).trim(),
                poli: getValue('ad_poli_descr'),
                tk: getValue('ad_tk')
            }
        });
    } catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ success: false, error: "Αποτυχία σύνδεσης με την υπηρεσία της ΑΑΔΕ" });
    }
} 
     
