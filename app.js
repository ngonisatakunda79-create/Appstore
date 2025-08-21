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
        unlockMap();
        message.textContent = "Password accepted! Map unlocked.";
        document.getElementById("vipForm").style.display = "none";
    } else {
        message.textContent = "Incorrect password.";
    }
}

// Unlock map and start GPS tracking
function unlockMap() {
    if (!map) {
        map = L.map('map').setView([-17.8277, 31.0530], 14);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    if (!userMarker) {
                        userMarker = L.marker([lat, lng], {
                            title: "You",
                            icon: L.icon({
                                iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Flat_tick_icon_green.svg',
                                iconSize: [25, 25]
                            })
                        }).addTo(map);
                        map.setView([lat, lng], 16);
                    } else {
                        userMarker.setLatLng([lat, lng]);
                        map.panTo([lat, lng]);
                    }
                },
                (error) => alert("Error getting location: " + error.message),
                { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
        }
    }
}