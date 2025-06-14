  const firebaseConfig = {
    apiKey: "AIzaSyBCHzv-tL9Z-kpqH0QrG-VJei-yjlmNfhA",
    authDomain: "pembukuan-firebase.firebaseapp.com",
    projectId: "pembukuan-firebase",
    storageBucket: "pembukuan-firebase.firebasestorage.app",
    messagingSenderId: "990859921680",
    appId: "1:990859921680:web:79ad10069c6f98c5593d95"
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
const filterStart = document.getElementById("filterStart");
const filterEnd = document.getElementById("filterEnd");
const applyFilter = document.getElementById("applyFilter");
const clearFilter = document.getElementById("clearFilter");

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
    document.getElementById("mainTable").style.display = "table";
    document.getElementById("exportBtn").style.display = "inline";
    document.getElementById("exportPDFBtn").style.display = "inline";
    document.getElementById("resetBtn").style.display = "inline";
    filterStart.style.display = "inline";
    filterEnd.style.display = "inline";
    applyFilter.style.display = "inline";
    clearFilter.style.display = "inline";
    userInfo.innerText = `Login sebagai: ${user.displayName} (${user.email})`;
    title.innerText = `Pembukuan Otomatis - ${user.displayName.split(" ")[0]}`;
    listenToData();
  } else {
    currentUser = null;
    loginBtn.style.display = "inline";
    logoutBtn.style.display = "none";
    entryForm.style.display = "none";
    document.getElementById("mainTable").style.display = "none";
    document.getElementById("exportBtn").style.display = "none";
    document.getElementById("exportPDFBtn").style.display = "none";
    document.getElementById("resetBtn").style.display = "none";
    filterStart.style.display = "none";
    filterEnd.style.display = "none";
    applyFilter.style.display = "none";
    clearFilter.style.display = "none";
    userInfo.innerText = "";
    title.innerText = "Pembukuan Otomatis";
    if (unsubscribe) unsubscribe();
    table.innerHTML = "";
    totalBalance.innerText = "Rp 0";
  }
});

function listenToData(filter = null) {
  if (unsubscribe) unsubscribe();
  let ref = db.collection("pembukuan")
    .where("uid", "==", currentUser.uid);
  if (filter && filter.start && filter.end) {
    ref = ref.where("tanggal", ">=", filter.start).where("tanggal", "<=", filter.end);
  }
  unsubscribe = ref.orderBy("tanggal").onSnapshot(snapshot => {
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

applyFilter.addEventListener("click", () => {
  const start = filterStart.value;
  const end = filterEnd.value;
  listenToData({ start, end });
});

clearFilter.addEventListener("click", () => {
  filterStart.value = "";
  filterEnd.value = "";
  listenToData();
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Hapus semua data?") && currentUser) {
    db.collection("pembukuan").where("uid", "==", currentUser.uid).get().then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      return batch.commit();
    });
  }
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const rows = [["Tanggal", "Deskripsi", "Pemasukan", "Pengeluaran", "Saldo"]];
  table.querySelectorAll("tr").forEach(row => {
    const cells = Array.from(row.querySelectorAll("input, td:not(:has(button))"));
    rows.push(cells.map(cell => cell.value || cell.textContent));
  });
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Pembukuan");
  XLSX.writeFile(wb, "pembukuan.xlsx");
});

document.getElementById("exportPDFBtn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Pembukuan", 10, 10);
  let y = 20;
  table.querySelectorAll("tr").forEach(row => {
    const cells = Array.from(row.querySelectorAll("input, td:not(:has(button))"));
    const line = cells.map(cell => cell.value || cell.textContent).join(" | ");
    doc.text(line, 10, y);
    y += 10;
  });
  doc.save("pembukuan.pdf");
});
