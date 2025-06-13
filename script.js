let tableBody = document.querySelector("#recordTable tbody");
let form = document.getElementById("entryForm");
let totalBalanceEl = document.getElementById("totalBalance");
let data = [];
let saldo = 0;


function updateTable(entry) {
  let row = document.createElement("tr");
  row.innerHTML = `
    <td>${entry.tanggal}</td>
    <td>${entry.deskripsi}</td>
    <td>${entry.pemasukan ? `Rp ${entry.pemasukan.toLocaleString("id-ID")}` : ""}</td>
    <td>${entry.pengeluaran ? `Rp ${entry.pengeluaran.toLocaleString("id-ID")}` : ""}</td>
    <td>Rp ${entry.saldo.toLocaleString("id-ID")}</td>
  `;
  tableBody.appendChild(row);
}

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
    totalBalanceEl.textContent = `Rp ${saldo.toLocaleString("id-ID")}`;
    data.forEach(updateTable);
  }
}

form.addEventListener("submit", function (e) {
  e.preventDefault();

  let tanggal = document.getElementById("date").value;
  let deskripsi = document.getElementById("desc").value;
  let pemasukan = parseFloat(document.getElementById("income").value) || 0;
  let pengeluaran = parseFloat(document.getElementById("expense").value) || 0;

  saldo += pemasukan - pengeluaran;
  totalBalanceEl.textContent = `Rp ${saldo.toLocaleString("id-ID")}`;

  let entry = {
    tanggal, 
    deskripsi,
    pemasukan,
    pengeluaran,
    saldo
  };
  data.push(entry);
  saveToLocal();
  updateTable(entry);

  form.reset();
});

loadFromLocal();
