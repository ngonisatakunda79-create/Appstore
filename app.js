const firebaseConfig = {
  apiKey: "AIzaSyD9w0...YOUR_API_KEY...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdefg"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const APP_COLLECTION = 'apps';
const UPLOAD_PASSWORD = 'dhogo';
let uploadUnlocked = false;

function checkUploadAccess() {
  const pass = document.getElementById('vipPassword').value;
  if (pass === UPLOAD_PASSWORD) {
    alert("VIP Access Granted!");
    uploadUnlocked = true;
  } else {
    document.getElementById("payButton").style.display = "inline-block";
  }
}

function payWithPaynow() {
  window.open("https://www.paynow.co.zw/Payment/Link/?q=c2VhcmNoPW5nb25pc2E=", "_blank");
  alert("After payment, return and upload your app.");
  uploadUnlocked = true;
}

async function uploadApp() {
  if (!uploadUnlocked) return alert("Pay $1 or enter VIP password first.");

  const fileInput = document.getElementById('appFile');
  const name = document.getElementById('appName').value;
  const file = fileInput.files[0];

  if (!file || !name) return alert("Fill in all fields.");

  // Upload to Uploadcare
  const formData = new FormData();
  formData.append("UPLOADCARE_STORE", "1");
  formData.append("UPLOADCARE_PUB_KEY", "f77e2afd69e72fdae840");
  formData.append("file", file);

  const res = await fetch("https://upload.uploadcare.com/base/", {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  const fileUrl = `https://ucarecdn.com/${data.file}/`;

  await db.collection(APP_COLLECTION).add({
    name: name,
    downloadURL: fileUrl,
    ratings: {1:0,2:0,3:0,4:0,5:0},
    comments: []
  });

  alert("App uploaded!");
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

  if (apps) {
    apps.forEach(doc => render(doc, doc.id));
  } else {
    db.collection(APP_COLLECTION).get().then(snapshot => {
      snapshot.forEach(doc => render(doc, doc.id));
    });
  }
}

function rateApp(appId, rating) {
  const appRef = db.collection(APP_COLLECTION).doc(appId);
  appRef.get().then(doc => {
    const ratings = doc.data().ratings;
    ratings[rating] = (ratings[rating] || 0) + 1;
    appRef.update({ratings});
    alert(`Thanks for rating ${rating} star(s)!`);
  });
}

function addComment(appId) {
  const input = document.getElementById(`comment-${appId}`);
  const text = input.value.trim();
  if (!text) return;

  const appRef = db.collection(APP_COLLECTION).doc(appId);
  appRef.get().then(doc => {
    const comments = doc.data().comments || [];
    comments.push(text);
    appRef.update({comments});
    input.value = "";
    loadApps(); // Refresh comments
  });
}

function searchApps() {
  const term = document.getElementById('searchInput').value.toLowerCase();
  db.collection(APP_COLLECTION).get().then(snapshot => {
    const filtered = snapshot.docs.filter(doc => doc.data().name.toLowerCase().includes(term));
    loadApps(filtered);
  });
}

loadApps();