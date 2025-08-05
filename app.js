const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdefg"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const PAYNOW_KEY = "YOUR_PAYNOW_CONSUMER_KEY";
const PAYNOW_SECRET = "YOUR_PAYNOW_CONSUMER_SECRET";
const PAYNOW_URL = "https://api.paynow.co.zw/interface/initiatetransaction"; // used with CORS proxy

const UPLOADCARE_KEY = "f77e2afd69e72fdae840";
const VIP_PASSWORD = "dhogo";
let uploadUnlocked = false;

async function unlockUpload() {
  const pass = document.getElementById("vipPassword").value;
  const name = document.getElementById("payerName").value;
  const email = document.getElementById("payerEmail").value;
  const phone = document.getElementById("payerPhone").value;

  if (pass === VIP_PASSWORD) {
    document.getElementById("uploadForm").style.display = "block";
    document.getElementById("paymentMessage").innerText = "✅ VIP Access Granted";
    uploadUnlocked = true;
    return;
  }

  if (!name || !email || !phone) {
    return alert("Please fill in your name, email, and phone to pay.");
  }

  // Initiate payment request
  const payload = new URLSearchParams();
  payload.append("id", PAYNOW_KEY);
  payload.append("key", PAYNOW_SECRET);
  payload.append("reference", `APPUPLOAD-${Date.now()}`);
  payload.append("amount", "1");
  payload.append("additionalinfo", "App Store Upload");
  payload.append("returnurl", "https://yourdomain.com/success"); // optional
  payload.append("resulturl", "https://yourdomain.com/result"); // optional
  payload.append("authemail", email);
  payload.append("status", "Message");
  payload.append("buyer_email", email);
  payload.append("buyer_name", name);
  payload.append("buyer_phone", phone);

  try {
    const res = await fetch("https://corsproxy.io/?" + PAYNOW_URL, {
      method: "POST",
      headers: {"Content-Type": "application/x-www-form-urlencoded"},
      body: payload
    });

    const text = await res.text();
    const status = new URLSearchParams(text);

    if (status.get("status") === "Ok") {
      const payUrl = status.get("browserurl");
      const pollUrl = status.get("pollurl");

      window.open(payUrl, "_blank");

      // Poll for confirmation every 5 seconds
      const interval = setInterval(async () => {
        const check = await fetch("https://corsproxy.io/?" + pollUrl);
        const resultText = await check.text();
        const result = new URLSearchParams(resultText);

        if (result.get("status") === "Paid") {
          clearInterval(interval);
          uploadUnlocked = true;
          document.getElementById("uploadForm").style.display = "block";
          document.getElementById("paymentMessage").innerText = "✅ Payment Verified. Upload unlocked.";

          // Save payment log
          await db.collection("payments").add({
            name, email, phone,
            transaction: result.get("reference"),
            amount: 1,
            status: "Paid",
            date: new Date()
          });
        }
      }, 5000);
    } else {
      document.getElementById("paymentMessage").innerText = "❌ Payment failed to initiate.";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("paymentMessage").innerText = "❌ Error connecting to Paynow.";
  }
}

async function uploadApp() {
  if (!uploadUnlocked) return alert("Pay first or enter VIP password");

  const file = document.getElementById("appFile").files[0];
  const name = document.getElementById("appName").value;
  if (!file || !name) return alert("Please fill in all fields");

  const formData = new FormData();
  formData.append("UPLOADCARE_STORE", "1");
  formData.append("UPLOADCARE_PUB_KEY", UPLOADCARE_KEY);
  formData.append("file", file);

  const res = await fetch("https://upload.uploadcare.com/base/", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  const fileUrl = `https://ucarecdn.com/${data.file}/`;

  await db.collection("apps").add({
    name,
    downloadURL: fileUrl,
    ratings: {1:0,2:0,3:0,4:0,5:0},
    comments: [],
    timestamp: new Date()
  });

  alert("✅ App uploaded!");
  window.location.reload();
}

function loadApps(apps = null) {
  const list = document.getElementById('appList');
  list.innerHTML = '';

  const render = (doc, id) => {
    const app = doc.data();
    const div = document.createElement('div');
    div.className = 'app-card';
    div.innerHTML = `
      <h3>${app.name}</h3>
      <a href="${app.downloadURL}" download><button>Download</button></a>

      <div class="rating-stars">
        Rate: ${[1,2,3,4,5].map(star => 
          `<button onclick="rateApp('${id}', ${star})">${'★'.repeat(star)}</button>`).join(' ')}
      </div>

      <div class="comment-section">
        <input type="text" placeholder="Comment..." id="comment-${id}">
        <button onclick="addComment('${id}')">Submit</button>
      </div>

      <div id="comments-${id}">${(app.comments || []).map(c => `<p>${c}</p>`).join('')}</div>
    `;
    list.appendChild(div);
  };

  const renderList = (snapshots) => {
    snapshots.forEach(doc => render(doc, doc.id));
  };

  if (apps) {
    renderList(apps);
  } else {
    db.collection("apps").get().then(renderList);
  }
}

function rateApp(appId, rating) {
  const appRef = db.collection("apps").doc(appId);
  appRef.get().then(doc => {
    const ratings = doc.data().ratings;
    ratings[rating] = (ratings[rating] || 0) + 1;
    appRef.update({ratings});
    alert(`Thanks for rating ${rating}★`);
  });
}

function addComment(appId) {
  const input = document.getElementById(`comment-${appId}`);
  const text = input.value.trim();
  if (!text) return;

  const appRef = db.collection("apps").doc(appId);
  appRef.get().then(doc => {
    const comments = doc.data().comments || [];
    comments.push(text);
    appRef.update({comments});
    input.value = "";
    loadApps();
  });
}

function searchApps() {
  const term = document.getElementById('searchInput').value.toLowerCase();
  db.collection("apps").get().then(snapshot => {
    const filtered = snapshot.docs.filter(doc => doc.data().name.toLowerCase().includes(term));
    loadApps(filtered);
  });
}

loadApps();