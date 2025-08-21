let map, userMarker;

// Toggle VIP form
document.getElementById("vipBtn").addEventListener("click", () => {
    const form = document.getElementById("vipForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
    document.getElementById("vipInput").focus();
});

// Submit VIP password
document.getElementById("submitVIP").addEventListener("click", checkPassword);

// Enter key support
document.getElementById("vipInput").addEventListener("keyup", function(e) {
    if (e.key === "Enter") checkPassword();
});

// Check VIP password
function checkPassword() {
    const input = document.getElementById("vipInput").value.trim();
    const message = document.getElementById("message");

    if (input.toLowerCase() === "ngonisa") {
        message.textContent = "Password accepted! Map unlocked.";
        document.getElementById("vipForm").style.display = "none";
        unlockMap();
    } else {
        message.textContent = "Incorrect password.";
    }
}

// Unlock map and track real-time location
function unlockMap() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by this browser.");
        return;
    }

    // Get initial position and center map
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        map = L.map('map').setView([lat, lng], 17); // zoomed in directly on user

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Add green flag marker
        userMarker = L.marker([lat, lng], {
            title: "You",
            icon: L.icon({
                iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Flat_tick_icon_green.svg',
                iconSize: [25, 25]
            })
        }).addTo(map);

        // Start continuous tracking
        navigator.geolocation.watchPosition(
            (pos) => {
                const newLat = pos.coords.latitude;
                const newLng = pos.coords.longitude;
                userMarker.setLatLng([newLat, newLng]);
                map.panTo([newLat, newLng], {animate: true});
            },
            (err) => alert("Error getting location: " + err.message),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

    }, (error) => {
        alert("Error getting initial location: " + error.message);
    }, { enableHighAccuracy: true });
}