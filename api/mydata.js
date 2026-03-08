 export default async function handler(req, res) {
    // 🔱 Ρυθμίσεις πρόσβασης (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { afm } = req.query;
    
    // 🔱 ΟΙ ΔΙΚΟΙ ΣΟΥ ΚΑΘΑΡΟΙ ΚΩΔΙΚΟΙ TRITON
    const USER_ID = 'wrapp1693208337'; 
    const SUBSCRIPTION_KEY = 'dee254ebbe145e68a4b7077f5afa5bb8'; 

    if (!afm) return res.status(400).json({ error: "Λείπει το ΑΦΜ" });

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
        if (!onomasia) return res.status(200).json({ success: false, error: "ΑΦΜ μη έγκυρο" });

        // 🔱 ΕΠΙΤΥΧΙΑ! Επιστροφή στοιχείων
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
        res.status(500).json({ success: false, error: "Αποτυχία σύνδεσης" });
    }
}
