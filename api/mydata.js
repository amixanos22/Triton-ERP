 import fetch from 'node-fetch';

export default async function handler(req, res) {
    // 🔱 ΕΠΙΤΡΕΠΟΥΜΕ ΤΗΝ ΠΡΟΣΒΑΣΗ ΑΠΟ ΠΑΝΤΟΥ (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { afm } = req.query;
    const USER_ID = 'wrapp1693208337'; 
    const SUBSCRIPTION_KEY = '4c245d648733e2decccc879d631c633c';

    // ... ο υπόλοιπος κώδικας (fetch στην ΑΑΔΕ κλπ)
}
export default async function handler(req, res) {
    const { afm } = req.query;
    
    // ⚠️ ΒΕΒΑΙΩΣΟΥ ΟΤΙ ΑΥΤΑ ΕΙΝΑΙ ΤΑ ΣΩΣΤΑ Subscription Keys από το myDATA portal
    const USER_ID = 'wrapp1693208337'; 
    const SUBSCRIPTION_KEY = '4c245d648733e2decccc879d631c633c';

    if (!afm) return res.status(400).json({ error: "Λείπει το ΑΦΜ" });

    // 🔱 ΤΟ ΣΩΣΤΟ URL ΓΙΑ ΒΑΣΙΚΑ ΣΤΟΙΧΕΙΑ ΜΗΤΡΩΟΥ
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
        
        // Debugging: Αν θέλεις να δεις τι απαντάει η ΑΑΔΕ στην κονσόλα του Vercel
        console.log("AADE Response:", xmlText);

        const getValue = (tag) => {
            const match = xmlText.match(new RegExp(`<${tag}>(.*?)<\/${tag}>`, 'i'));
            return match ? match[1].trim() : "";
        };

        // Έλεγχος αν η ΑΑΔΕ επέστρεψε σφάλμα (π.χ. λάθος κωδικοί)
        if (xmlText.includes('error_descr') || xmlText.includes('faultstring')) {
            const errorMsg = getValue('error_descr') || "Λάθος κωδικοί ΑΑΔΕ ή μη εξουσιοδοτημένη πρόσβαση";
            return res.status(200).json({ success: false, error: errorMsg });
        }

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
