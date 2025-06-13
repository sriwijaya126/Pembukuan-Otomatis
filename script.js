let tableBody = document.querySelector("#recordTable tbody");
let form = document.getElementById("entryForm");
let totalBalanceEl = document.getElementById("totalBalance");
let data = [];
let saldo = 0;

form.addEventListener("submit", function (e) {
  e.preventDefault();

  let tanggal = document.getElementById("date").value;
  let deskripsi = document.getElementById("desc").value;
  let pemasukan = parseFloat(document.getElementById("income").value) || 0;
  let pengeluaran = parseFloat(document.getElementById("expense").value) || 0;

  let entry = {
    tanggal,
    deskripsi,
    pemasukan,
    pengeluaran,
    saldo: 0 // sementara
  };
  data.push(entry);
  recalculateSaldo();
  saveToLocal();
  renderTable();

  form.reset();
});

// 🧠 Hitung ulang saldo setiap kali data berubah
function recalculateSaldo() {
  let total = 0;
  data.forEach((item) => {
    total += (item.pemasukan || 0) - (item.pengeluaran || 0);
    item.saldo = total;
  });
  saldo = total;
  totalBalanceEl.textContent = `Rp ${saldo.toLocaleString("id-ID")}`;
}

function saveToLocal() {
  localStorage.setItem("pembukuanData", JSON.stringify(data));
  localStorage.setItem("totalSaldo", saldo);
}

function loadFromLocal() {
  const savedData = localStorage.getItem("pembukuanData");
  const savedSaldo = localStorage.getItem("totalSaldo");

  if (savedData) {
    data = JSON.parse(savedData);
    saldo = parseFloat(savedSaldo) || 0;
    recalculateSaldo();
    renderTable();
  }
}

// 🔄 Render ulang semua tabel berdasarkan array `data`
function renderTable() {
  tableBody.innerHTML = "";
  data.forEach((entry, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input type="date" value="${entry.tanggal}" data-index="${index}" data-field="tanggal"></td>
      <td><input type="text" value="${entry.deskripsi}" data-index="${index}" data-field="deskripsi"></td>
      <td><input type="number" value="${entry.pemasukan || ""}" data-index="${index}" data-field="pemasukan"></td>
      <td><input type="number" value="${entry.pengeluaran || ""}" data-index="${index}" data-field="pengeluaran"></td>
      <td>Rp ${entry.saldo.toLocaleString("id-ID")}</td>
    `;

    tableBody.appendChild(row);
  });

  // Tambahkan event listener untuk semua input setelah render
  const inputs = tableBody.querySelectorAll("input");
  inputs.forEach(input => {
    input.addEventListener("change", handleEdit);
  });
}

// ✏️ Saat isi input diubah → update `data`, hitung ulang
function handleEdit(e) {
  const input = e.target;
  const index = parseInt(input.dataset.index);
  const field = input.dataset.field;
  const value = input.value;

  if (field === "pemasukan" || field === "pengeluaran") {
    data[index][field] = parseFloat(value) || 0;
  } else {
    data[index][field] = value;
  }

  recalculateSaldo();
  saveToLocal();
  renderTable();
}

// Export Excel
document.getElementById("exportBtn").addEventListener("click", function () {
  const wb = XLSX.utils.book_new();
  const wsData = [
    ["Tanggal", "Deskripsi", "Pemasukan", "Pengeluaran", "Saldo"],
    ...data.map(e => [e.tanggal, e.deskripsi, e.pemasukan, e.pengeluaran, e.saldo])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, "Pembukuan");
  XLSX.writeFile(wb, "pembukuan.xlsx");
});

// Reset
document.getElementById("resetBtn")?.addEventListener("click", function () {
  if (confirm("Yakin ingin menghapus semua data?")) {
    localStorage.clear();
    data = [];
    saldo = 0;
    tableBody.innerHTML = "";
    totalBalanceEl.textContent = "Rp 0";
  }
});

// Load saat pertama buka
loadFromLocal();
