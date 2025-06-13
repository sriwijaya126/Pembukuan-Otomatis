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
function renderTable(dataArray = data) {
  tableBody.innerHTML = "";
  dataArray.forEach((entry, index) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input type="date" value="${entry.tanggal}" data-index="${index}" data-field="tanggal"></td>
      <td><input type="text" value="${entry.deskripsi}" data-index="${index}" data-field="deskripsi"></td>
      <td><input type="number" value="${entry.pemasukan || ""}" data-index="${index}" data-field="pemasukan"></td>
      <td><input type="number" value="${entry.pengeluaran || ""}" data-index="${index}" data-field="pengeluaran"></td>
      <td>Rp ${entry.saldo.toLocaleString("id-ID")}</td>
      <td><button data-index="${index}" class="delete-btn">❌</button></td>
    `;

    row.querySelector(".delete-btn").addEventListener("click", () => {
      data.splice(index, 1);
      recalculateSaldo();
      saveToLocal();
      renderTable();
    });

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

// EXPORT EXCEL
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

// RESET ALL DATA
document.getElementById("resetBtn")?.addEventListener("click", function () {
  if (confirm("Yakin ingin menghapus semua data?")) {
    localStorage.clear();
    data = [];
    saldo = 0;
    tableBody.innerHTML = "";
    totalBalanceEl.textContent = "Rp 0";
  }
});

// FILTER BY DATE
document.getElementById("applyFilter").addEventListener("click", () => {
  const start = document.getElementById("filterStart").value;
  const end = document.getElementById("filterEnd").value;

  if (!start || !end) return renderTable();

  const filtered = data.filter(e => e.tanggal >= start && e.tanggal <= end);
  renderTable(filtered);
});

document.getElementById("clearFilter").addEventListener("click", () => {
  renderTable();
});


// EXPORT PDF
document.getElementById("exportPDFBtn").addEventListener("click", async () => {
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


// Load saat pertama buka
loadFromLocal();
