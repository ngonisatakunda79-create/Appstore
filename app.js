let map, userMarker, destinationMarker, routingControl;
let userPanned = false;

// ... VIP password code stays the same

function unlockMap() {
    if (!navigator.geolocation) { alert("Geolocation not supported."); return; }

    navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

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

        userMarker = L.marker([lat, lng], {
            title: "You",
            icon: L.icon({
                iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Flat_tick_icon_green.svg',
                iconSize: [25,25]
            })
        }).addTo(map);

        // Center on me button
        const centerBtn = L.control({position: 'topleft'});
        centerBtn.onAdd = function() {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            div.innerHTML = '📍';
            div.style.backgroundColor = 'white';
            div.style.width = '34px';
            div.style.height = '34px';
            div.style.fontSize = '20px';
            div.style.textAlign = 'center';
            div.style.cursor = 'pointer';
            div.title = "Center on me";
            div.onclick = () => {
                map.setView(userMarker.getLatLng(), 17);
                userPanned = false;
            };
            return div;
        };
        centerBtn.addTo(map);

        // Click for destination
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
                lineOptions: {styles:[{color:'red',opacity:0.9,weight:6}]},
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

            // Only auto-pan if user hasn't manually moved or zoomed
            if(!userPanned) map.panTo([newLat, newLng], {animate:true});

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