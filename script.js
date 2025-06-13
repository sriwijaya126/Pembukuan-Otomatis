const firebaseConfig = {
  apiKey: "AIzaSyBrX-rgREDaji7M2kzWHRCz0qI2SqMR0m4",
  authDomain: "edit-bareng-pembukuan-otomatis.firebaseapp.com",
  projectId: "edit-bareng-pembukuan-otomatis",
  storageBucket: "edit-bareng-pembukuan-otomatis.firebasestorage.app",
  messagingSenderId: "87099950898",
  appId: "1:87099950898:web:d5e457d67a9a7c0c36f92b",
  measurementId: "G-W6VKQPGQ53"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

let currentUser = null;
let data = [];

function signIn() {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider);
}

function signOut() {
  auth.signOut();
}

auth.onAuthStateChanged(user => {
  const userInfo = document.getElementById("userInfo");
  if (user) {
    currentUser = user;
    userInfo.textContent = `Masuk sebagai: ${user.displayName}`;
    listenToData();
  } else {
    currentUser = null;
    userInfo.textContent = "Belum login.";
    document.getElementById("recordTable").innerHTML = "";
  }
});

function listenToData() {
  db.collection("pembukuan")
    .where("uid", "==", currentUser.uid)
    .orderBy("tanggal")
    .onSnapshot(snapshot => {
      data = [];
      snapshot.forEach(doc => {
        const item = doc.data();
        item.id = doc.id;
        data.push(item);
      });
      recalculateSaldo();
      renderTable();
    });
}

document.getElementById("entryForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const tanggal = document.getElementById("date").value;
  const deskripsi = document.getElementById("desc").value;
  const pemasukan = parseFloat(document.getElementById("income").value) || 0;
  const pengeluaran = parseFloat(document.getElementById("expense").value) || 0;

  await db.collection("pembukuan").add({
    uid: currentUser.uid,
    tanggal,
    deskripsi,
    pemasukan,
    pengeluaran
  });

  this.reset();
});

function recalculateSaldo() {
  let saldo = 0;
  data.forEach(item => {
    saldo += (item.pemasukan || 0) - (item.pengeluaran || 0);
    item.saldo = saldo;
  });
  document.getElementById("totalBalance").textContent = `Rp ${saldo.toLocaleString("id-ID")}`;
}

function renderTable(filteredData = data) {
  const tbody = document.getElementById("recordTable");
  tbody.innerHTML = "";

  filteredData.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="date" value="${item.tanggal}" data-id="${item.id}" data-field="tanggal"></td>
      <td><input type="text" value="${item.deskripsi}" data-id="${item.id}" data-field="deskripsi"></td>
      <td><input type="number" value="${item.pemasukan}" data-id="${item.id}" data-field="pemasukan"></td>
      <td><input type="number" value="${item.pengeluaran}" data-id="${item.id}" data-field="pengeluaran"></td>
      <td>Rp ${item.saldo.toLocaleString("id-ID")}</td>
      <td><button onclick="deleteEntry('${item.id}')">❌</button></td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll("#recordTable input").forEach(input => {
    input.addEventListener("change", handleEdit);
  });
}

async function handleEdit(e) {
  const input = e.target;
  const id = input.dataset.id;
  const field = input.dataset.field;
  let value = input.value;
  if (field === "pemasukan" || field === "pengeluaran") value = parseFloat(value) || 0;
  await db.collection("pembukuan").doc(id).update({ [field]: value });
}

async function deleteEntry(id) {
  await db.collection("pembukuan").doc(id).delete();
}

document.getElementById("applyFilter").addEventListener("click", () => {
  const start = document.getElementById("filterStart").value;
  const end = document.getElementById("filterEnd").value;
  if (!start || !end) return renderTable();

  const filtered = data.filter(e => e.tanggal >= start && e.tanggal <= end);
  renderTable(filtered);
});

document.getElementById("clearFilter").addEventListener("click", () => renderTable());

document.getElementById("exportBtn").addEventListener("click", () => {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Tanggal", "Deskripsi", "Pemasukan", "Pengeluaran", "Saldo"],
    ...data.map(e => [e.tanggal, e.deskripsi, e.pemasukan, e.pengeluaran, e.saldo])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Pembukuan");
  XLSX.writeFile(wb, "pembukuan.xlsx");
});

document.getElementById("exportPDFBtn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text("Laporan Pembukuan", 10, 10);
  let y = 20;
  data.forEach((item, i) => {
    doc.text(`${i + 1}. ${item.tanggal} | ${item.deskripsi} | Rp ${item.pemasukan || 0} | Rp ${item.pengeluaran || 0} | Rp ${item.saldo}`, 10, y);
    y += 10;
  });
  doc.save("pembukuan.pdf");
});

document.getElementById("resetBtn").addEventListener("click", async () => {
  if (confirm("Hapus semua data?")) {
    const snapshot = await db.collection("pembukuan").where("uid", "==", currentUser.uid).get();
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
});
