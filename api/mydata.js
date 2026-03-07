window.searchMyData = async function() {
    const afmInput = document.getElementById('newCustAfm');
    const afm = afmInput.value.trim();
    const btn = event.target;

    if (afm.length !== 9) {
        alert("⚠️ Το ΑΦΜ πρέπει να έχει 9 ψηφία!");
        return;
    }

    btn.innerText = "⏳ ΠΕΡΙΜΕΝΕ...";
    btn.disabled = true;

    try {
        // Καλούμε το API που μόλις φτιάξαμε στο φάκελο /api/
        const response = await fetch(`/api/mydata?afm=${afm}`);
        const data = await response.json();

        if (data && data.success) {
            // Γεμίζουμε τα πεδία αυτόματα
            document.getElementById('newCustName').value = data.result.onomasia || "";
            document.getElementById('newCustDoy').value = data.result.doy_descr || "";
            document.getElementById('newCustJob').value = data.result.drastiriotita || "";
            document.getElementById('newCustAddress').value = data.result.dieythinsi || "";
            document.getElementById('newCustCity').value = data.result.poli || "";
            document.getElementById('newCustZip').value = data.result.tk || "";
            
            console.log("✅ Στοιχεία ελήφθησαν από το Vercel API!");
        } else {
            alert("❌ Το ΑΦΜ δεν βρέθηκε στο myDATA.");
        }
    } catch (error) {
        alert("Σφάλμα συστήματος. Βεβαιωθείτε ότι κάνατε Deploy τον φάκελο /api στο Vercel.");
    } finally {
        btn.innerText = "🔍 myDATA";
        btn.disabled = false;
    }
};
