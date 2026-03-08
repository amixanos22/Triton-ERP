 export default async function handler(req, res) {
    // 🔱 1. ΡΥΘΜΙΣΕΙΣ CORS (Για να επιτρέπεται η κλήση από το Triton ERP)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 🔱 2. ΠΑΡΑΜΕΤΡΟΙ & ΚΛΕΙΔΙΑ
    const { afm } = req.query;
    const USER_ID = 'wrapp1693208337'; 
    const SUBSCRIPTION_KEY = '4c245d648733e2decccc879d631c633c';

    if (!afm) return res.status(400).json({ error: "Λείπει το ΑΦΜ" });

    const aadeUrl = `https://www.aade.gr/taxisnet/mytaxisnet/v1/opendata/rgwsBasikaStoixeiaN?afm=${afm}`;

    try {
        // Χρησιμοποιούμε το ενσωματωμένο fetch του Node.js (Vercel)
        const response = await fetch(aadeUrl, {
            method: 'GET',
            headers: {
                'aade-user-id': USER_ID,
                'ocp-apim-subscription-key': SUBSCRIPTION_KEY,
                'Accept': 'application/xml'
            }
        });

        const xmlText = await response.text();
        
        // Helper function για το XML
        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1].trim() : "";
        };

        // 🔱 3. ΕΛΕΓΧΟΣ ΣΦΑΛΜΑΤΩΝ ΑΑΔΕ
        if (xmlText.includes('error_descr') || xmlText.includes('faultstring')) {
            const errorMsg = getValue('error_descr') || "Λάθος κωδικοί ΑΑΔΕ ή μη εξουσιοδοτημένη πρόσβαση";
            return res.status(200).json({ success: false, error: errorMsg });
        }

        // 🔱 4. ΕΠΙΣΤΡΟΦΗ ΔΕΔΟΜΕΝΩΝ ΣΕ JSON
        res.status(200).json({
            success: xmlText.includes('onomasia'),
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
        console.error("Fetch Error:", error);
        res.status(500).json({ success: false, error: "Αποτυχία σύνδεσης με ΑΑΔΕ" });
    }
}
