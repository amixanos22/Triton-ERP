export default async function handler(req, res) {
    const { afm } = req.query;
    const USER_ID = 'wrapp1693208337'; 
    const SUBSCRIPTION_KEY = '4c245d648733e2decccc879d631c633c';

    const url = `https://www.aade.gr/taxisnet/mytaxisnet/v1/opendata/rgwsBasikaStoixeiaN?afm=${afm}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'aade-user-id': USER_ID,
                'ocp-apim-subscription-key': SUBSCRIPTION_KEY,
                'Accept': 'application/xml'
            }
        });
        const xml = await response.text();
        
        // Στέλνουμε το XML πίσω στο HTML σου
        res.status(200).send(xml);
    } catch (e) {
        res.status(500).json({ error: "Αποτυχία σύνδεσης" });
    }
}
