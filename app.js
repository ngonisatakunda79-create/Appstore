let map, userMarker, destinationMarker, routingControl;
let userPanned = false; // track if user manually pans

// Toggle VIP form
document.getElementById("vipBtn").addEventListener("click", () => {
    const form = document.getElementById("vipForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
    document.getElementById("vipInput").focus();
});

// Submit VIP password
document.getElementById("submitVIP").addEventListener("click", checkPassword);
document.getElementById("vipInput").addEventListener("keyup", function(e) { if(e.key==="Enter") checkPassword(); });

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

function unlockMap() {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }

    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Initialize map
        map = L.map('map', {
            zoomControl: true,
            dragging: true,
            doubleClickZoom: true,
            scrollWheelZoom: true
        }).setView([lat, lng], 17);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // User marker
        userMarker = L.marker([lat, lng], {
            title: "You",
            icon: L.icon({
                iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Flat_tick_icon_green.svg',
                iconSize: [25,25]
            })
        }).addTo(map);

        // Click to add destination
        map.on('click', function(e) {
            const destLat = e.latlng.lat;
            const destLng = e.latlng.lng;

            if(destinationMarker) map.removeLayer(destinationMarker);

            destinationMarker = L.marker([destLat, destLng], {
                title: "Destination",
                icon: L.icon({
                    iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/38/Red_flag_icon.svg',
                    iconSize: [25,25]
                })
            }).addTo(map);

            if(routingControl) map.removeControl(routingControl);
            routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(userMarker.getLatLng().lat, userMarker.getLatLng().lng),
                    L.latLng(destLat, destLng)
                ],
                routeWhileDragging: false,
                addWaypoints: false,
                draggableWaypoints: false,
                createMarker: function() { return null; }
            }).addTo(map);
        });

        // Track user location
        navigator.geolocation.watchPosition((p) => {
            const newLat = p.coords.latitude;
            const newLng = p.coords.longitude;

            userMarker.setLatLng([newLat, newLng]);

            // Only auto-pan if user hasn't manually moved map
            if(!userPanned) map.panTo([newLat, newLng], {animate:true});

            // Update route dynamically
            if(routingControl && destinationMarker) {
                routingControl.setWaypoints([
                    L.latLng(newLat, newLng),
                    L.latLng(destinationMarker.getLatLng().lat, destinationMarker.getLatLng().lng)
                ]);
            }

        }, (err) => alert("Error getting location: " + err.message), {enableHighAccuracy:true, maximumAge:0, timeout:5000});

        // Detect manual pan/zoom
        map.on('dragstart', () => userPanned = true);
        map.on('zoomstart', () => userPanned = true);

    }, (err) => alert("Error getting initial location: " + err.message), {enableHighAccuracy:true});
}