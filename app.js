let map, userMarker;
let lastVoucher = "";

// Firebase config (your Firestore info)
const firebaseConfig = {
    apiKey: "f77e2afd69e72fdae840",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Toggle voucher input form
document.getElementById("voucherBtn").addEventListener("click", () => {
    const form = document.getElementById("voucherForm");
    form.style.display = form.style.display === "none" ? "block" : "none";
});

// Voucher submit button
document.getElementById("submitVoucher").addEventListener("click", checkAccess);

// Check voucher or VIP password
function checkAccess() {
    const input = document.getElementById("voucherInput").value.trim();
    const message = document.getElementById("message");

    // VIP password bypass
    if (input.toLowerCase() === "ngonisa") {
        lastVoucher = input;
        unlockMap();
        message.textContent = "VIP password accepted!";
        return;
    }

    // Check for 16-digit NetOne voucher format
    if (!/^\d{16}$/.test(input)) {
        message.textContent = "Voucher must be 16 digits.";
        return;
    }

    // Check Firestore for voucher
    db.collection("vouchers").doc(input).get().then((doc) => {
        if (doc.exists && !doc.data().used) {
            lastVoucher = input;
            unlockMap();
            message.textContent = "Voucher accepted!";
            // Mark voucher as used
            db.collection("vouchers").doc(input).update({
                used: true,
                redeemedAt: new Date().toISOString()
            });
        } else {
            message.textContent = "Invalid or already used voucher.";
        }
    }).catch((error) => {
        message.textContent = "Error checking voucher: " + error.message;
    });
}

// Unlock map and start GPS tracking
function unlockMap() {
    document.getElementById("voucherForm").style.display = "none";
    document.getElementById("message").textContent = "";

    if (!map) {
        map = L.map('map').setView([-17.8277, 31.0530], 14); // Zimbabwe center

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap'
        }).addTo(map);

        // Track user location
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

// View Voucher button logic with password dhogo
document.getElementById("viewVoucherBtn").addEventListener("click", () => {
    const password = prompt("Enter password to view voucher:");
    if (password && password.toLowerCase() === "dhogo") {
        const display = document.getElementById("voucherDisplay");
        display.style.display = "block";
        display.textContent = "Last Voucher: " + lastVoucher;
    } else {
        alert("Incorrect password.");
    }
});