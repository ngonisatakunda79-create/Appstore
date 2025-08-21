function unlockMap() {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }

    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        // Initialize map with zoom & drag enabled
        map = L.map('map', {
            zoomControl: true,   // zoom buttons
            dragging: true,      // allow dragging
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

        // Allow user to click on map for destination
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

        // Continuous user location tracking
        navigator.geolocation.watchPosition((p) => {
            const newLat = p.coords.latitude;
            const newLng = p.coords.longitude;

            userMarker.setLatLng([newLat, newLng]);

            // Only pan if user is not manually moving map
            if(!map._userPanned) {
                map.panTo([newLat, newLng], {animate:true});
            }

            if(routingControl && destinationMarker) {
                routingControl.setWaypoints([
                    L.latLng(newLat, newLng),
                    L.latLng(destinationMarker.getLatLng().lat, destinationMarker.getLatLng().lng)
                ]);
            }

        }, (err) => alert("Error getting location: " + err.message), {enableHighAccuracy:true, maximumAge:0, timeout:5000});

        // Detect manual pan by user
        map.on('dragstart', () => map._userPanned = true);
        map.on('zoomstart', () => map._userPanned = true);

    }, (err) => alert("Error getting initial location: " + err.message), {enableHighAccuracy:true});
}