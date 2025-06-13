const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let unsubscribe = null;

const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const entryForm = document.getElementById("entryForm");
const table = document.getElementById("recordTable");
const totalBalance = document.getElementById("totalBalance");
const userInfo = document.getElementById("userInfo");
const title = document.getElementById("title");

loginBtn.style.display = "inline";
logoutBtn.style.display = "none";

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(console.error);
}

function signOut() {
  auth.signOut();
}

auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline";
    entryForm.style.display = "block";
    document.querySelector("table").style.display = "table";
    document.getElementById("exportBtn").style.display = "inline";
    document.getElementById("exportPDFBtn").style.display = "inline";
    document.getElementById("resetBtn").style.display = "inline";
    document.getElementById("filterStart").style.display = "inline";
    document.getElementById("filterEnd").style.display = "inline";
    document.getElementById("applyFilter").style.display = "inline";
    document.getElementById("clearFilter").style.display = "inline";
    userInfo.innerText = `Login sebagai: ${user.displayName} (${user.email})`;
    title.innerText = `Pembukuan Otomatis - ${user.displayName.split(" ")[0]}`;
    listenToData();
  } else {
    currentUser = null;
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    entryForm.style.display = "none";
    document.querySelector("table").style.display = "none";
    document.getElementById("exportBtn").style.display = "none";
    document.getElementById("exportPDFBtn").style.display = "none";
    document.getElementById("resetBtn").style.display = "none";
    document.getElementById("filterStart").style.display = "none";
    document.getElementById("filterEnd").style.display = "none";
    document.getElementById("applyFilter").style.display = "none";
    document.getElementById("clearFilter").style.display = "none";
    userInfo.innerText = "";
    title.innerText = "Pembukuan Otomatis";
    if (unsubscribe) unsubscribe();
    table.innerHTML = "";
    totalBalance.innerText = "Rp 0";
  }
});

function listenToData() {
  if (unsubscribe) unsubscribe();
  unsubscribe = db.collection("pembukuan")
    .where("uid", "==", currentUser.uid)
    .orderBy("tanggal")
    .onSnapshot(snapshot => {
      let total = 0;
      table.innerHTML = "";
      snapshot.forEach(doc => {
        const data = doc.data();
        const row = document.createElement("tr");
        row.innerHTML = `
          <td><input type="date" value="${data.tanggal}" onchange="updateField('${doc.id}', 'tanggal', this.value)"></td>
          <td><input type="text" value="${data.deskripsi}" onchange="updateField('${doc.id}', 'deskripsi', this.value)"></td>
          <td><input type="number" value="${data.pemasukan}" onchange="updateField('${doc.id}', 'pemasukan', parseInt(this.value) || 0)"></td>
          <td><input type="number" value="${data.pengeluaran}" onchange="updateField('${doc.id}', 'pengeluaran', parseInt(this.value) || 0)"></td>
          <td>${data.pemasukan - data.pengeluaran}</td>
          <td><button onclick="deleteRow('${doc.id}')">Hapus</button></td>
        `;
        total += data.pemasukan - data.pengeluaran;
        table.appendChild(row);
      });
      totalBalance.innerText = `Rp ${total.toLocaleString()}`;
    });
}

entryForm.addEventListener("submit", e => {
  e.preventDefault();
  const tanggal = document.getElementById("date").value;
  const deskripsi = document.getElementById("desc").value;
  const pemasukan = parseInt(document.getElementById("income").value) || 0;
  const pengeluaran = parseInt(document.getElementById("expense").value) || 0;
  db.collection("pembukuan").add({ uid: currentUser.uid, tanggal, deskripsi, pemasukan, pengeluaran });
  entryForm.reset();
});

function updateField(id, field, value) {
  db.collection("pembukuan").doc(id).update({ [field]: value });
}

function deleteRow(id) {
  if (confirm("Hapus data ini?")) {
    db.collection("pembukuan").doc(id).delete();
  }
}

// Export XLS dan PDF akan ditambahkan menyusul sesuai versi sebelumnya
