let map, userMarker, destinationMarker, routingControl;
let userPanned = false;

// Sample POIs in Zimbabwe (replace or expand as needed)
const POIs = [
    {name: "St. Mary's School", lat: -17.825, lng: 31.050, type:"school"},
    {name: "Total Fuel Station", lat: -17.826, lng: 31.051, type:"fuel"},
    {name: "Main Shop", lat: -17.827, lng: 31.052, type:"shop"},
    {name: "Growth Point A", lat: -17.828, lng: 31.053, type:"growth"},
    {name: "Community School", lat: -17.829, lng: 31.054, type:"school"},
    {name: "Shell Fuel Station", lat: -17.830, lng: 31.055, type:"fuel"},
    {name: "Village Shop", lat: -17.831, lng: 31.056, type:"shop"},
    {name: "Growth Point B", lat: -17.832, lng: 31.057, type:"growth"}
];

// VIP password logic
document.getElementById("vipBtn").addEventListener("click", () => {
    const form = document.getElementById("vipForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
    document.getElementById("vipInput").focus();
});

document.getElementById("submitVIP").addEventListener("click", checkPassword);
document.getElementById("vipInput").addEventListener("keyup", function(e) { if(e.key==="Enter") checkPassword(); });

function checkPassword() {
    const input = document.getElementById("vipInput").value.trim();
    const message = document.getElementById("message");

    if(input.toLowerCase() === "ngonisa") {
        message.textContent = "Password accepted! Map unlocked.";
        document.getElementById("vipForm").style.display = "none";
        initMap();
    } else {
        message.textContent = "Incorrect password.";
    }
}

function initMap() {
    if(!navigator.geolocation) { alert("Geolocation not supported."); return; }

    navigator.geolocation.getCurrentPosition(pos => {
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

        // User marker
        userMarker = L.marker([lat, lng], {
            title: "You",
            icon: L.icon({
                iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Flat_tick_icon_green.svg',
                iconSize: [25,25]
            })
        }).addTo(map);

        // Add POIs
        POIs.forEach(poi => {
            let iconUrl = poi.type === 'school' ? 'https://upload.wikimedia.org/wikipedia/commons/5/51/School_icon.png' :
                          poi.type === 'fuel' ? 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Fuel_icon.png' :
                          poi.type === 'shop' ? 'https://upload.wikimedia.org/wikipedia/commons/6/6f/Shop_icon.png' :
                          'https://upload.wikimedia.org/wikipedia/commons/2/2f/Growth_icon.png';
            L.marker([poi.lat, poi.lng], {
                title: poi.name,
                icon: L.icon({iconUrl: iconUrl, iconSize:[25,25]})
            }).addTo(map).bindPopup(poi.name);
        });

        // Center-on-me button
        const centerControl = L.control({position: 'topleft'});
        centerControl.onAdd = function() {
            const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            div.innerHTML = '📍';
            div.style.backgroundColor = 'white';
            div.style.width = '34px';
            div.style.height = '34px';
            div.style.textAlign = 'center';
            div.style.cursor = 'pointer';
            div.title = "Center on me";
            div.onclick = () => {
                map.setView(userMarker.getLatLng(), 17);
                userPanned = false;
            };
            return div;
        };
        centerControl.addTo(map);

        // Click to set destination
        map.on('click', e => {
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
                lineOptions: {styles:[{color:'red', opacity:0.9, weight:6}]},
                routeWhileDragging: false,
                addWaypoints: false,
                draggableWaypoints: false,
                createMarker: () => null
            }).addTo(map);
        });

        // Track user location
        navigator.geolocation.watchPosition(p => {
            const newLat = p.coords.latitude;
            const newLng = p.coords.longitude;

            userMarker.setLatLng([newLat, newLng]);

            if(!userPanned) map.panTo([newLat, newLng], {animate:true});

            if(routingControl && destinationMarker) {
                routingControl.setWaypoints([
                    L.latLng(newLat, newLng),
                    L.latLng(destinationMarker.getLatLng().lat, destinationMarker.getLatLng().lng)
                ]);
            }
        }, err => alert("Error getting location: "+err.message), {enableHighAccuracy:true, maximumAge:0, timeout:5000});

        map.on('dragstart', () => userPanned = true);
        map.on('zoomstart', () => userPanned = true);

    }, err => alert("Error getting initial location: "+err.message), {enableHighAccuracy:true});
}