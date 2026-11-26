/* =====================================================
   Tuntas – Aplikasi To-Do List dengan JavaScript Murni
   Praktikum 3A: manipulasi DOM dan localStorage
   ===================================================== */

// ---------- Konstanta & state ----------
const KUNCI_TUGAS = "tuntas-tugas";
const KUNCI_TEMA = "tuntas-tema";
const KELILING_RING = 2 * Math.PI * 52; // keliling lingkaran r = 52
const URUTAN_PRIORITAS = { tinggi: 0, sedang: 1, rendah: 2 };
const LABEL_PRIORITAS = { tinggi: "Prioritas tinggi", sedang: "Prioritas sedang", rendah: "Prioritas rendah" };

let tugas = [];          // [{ id, teks, prioritas, selesai }]
let filterAktif = "semua";
let idEdit = null;       // id tugas yang sedang diedit

// ---------- Elemen DOM ----------
const form = document.getElementById("form-tugas");
const inputTugas = document.getElementById("input-tugas");
const pilihPrioritas = document.getElementById("pilih-prioritas");
const pesanError = document.getElementById("pesan-error");
const daftar = document.getElementById("daftar-tugas");
const filterWadah = document.getElementById("filter");
const tombolBersih = document.getElementById("hapus-selesai");
const tombolTema = document.getElementById("tombol-tema");
const temaTeks = document.getElementById("tema-teks");
const sapaan = document.getElementById("sapaan");
const tanggal = document.getElementById("tanggal");
const persen = document.getElementById("persen");
const ringIsi = document.getElementById("ring-isi");
const ringLabel = document.getElementById("ring-label");
const ringkasan = document.getElementById("ringkasan");

// ---------- localStorage ----------
function simpanTugas() {
  try {
    localStorage.setItem(KUNCI_TUGAS, JSON.stringify(tugas));
  } catch (e) {
    console.warn("Gagal menyimpan ke localStorage:", e);
  }
}

function muatTugas() {
  try {
    const mentah = localStorage.getItem(KUNCI_TUGAS);
    if (mentah === null) {
      // Pertama kali dibuka: isi contoh supaya tampilan tidak kosong
      tugas = [
        { id: 1, teks: "Kerjakan laporan praktikum 3A", prioritas: "tinggi", selesai: false },
        { id: 2, teks: "Push proyek ke GitHub", prioritas: "sedang", selesai: false },
        { id: 3, teks: "Minum air putih", prioritas: "rendah", selesai: true },
      ];
      simpanTugas();
    } else {
      const data = JSON.parse(mentah);
      tugas = Array.isArray(data) ? data : [];
    }
  } catch (e) {
    tugas = [];
  }
}

// ---------- Tema ----------
function terapkanTema(tema) {
  document.documentElement.setAttribute("data-theme", tema);
  temaTeks.textContent = tema === "dark" ? "Mode terang" : "Mode gelap";
  try { localStorage.setItem(KUNCI_TEMA, tema); } catch (e) {}
}

tombolTema.addEventListener("click", () => {
  const sekarang = document.documentElement.getAttribute("data-theme");
  terapkanTema(sekarang === "dark" ? "light" : "dark");
});

// ---------- Sapaan & tanggal ----------
function tampilkanSapaan() {
  const jam = new Date().getHours();
  let teks = "Selamat malam";
  if (jam >= 4 && jam < 11) teks = "Selamat pagi";
  else if (jam >= 11 && jam < 15) teks = "Selamat siang";
  else if (jam >= 15 && jam < 18) teks = "Selamat sore";
  sapaan.textContent = teks;

  tanggal.textContent = new Date().toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

// ---------- Render ----------
function ambilTugasTampil() {
  return tugas
    .filter((t) => {
      if (filterAktif === "aktif") return !t.selesai;
      if (filterAktif === "selesai") return t.selesai;
      return true;
    })
    .sort((a, b) => {
      if (a.selesai !== b.selesai) return a.selesai ? 1 : -1;
      return URUTAN_PRIORITAS[a.prioritas] - URUTAN_PRIORITAS[b.prioritas];
    });
}

function buatItem(t) {
  const li = document.createElement("li");
  li.className = "item" + (t.selesai ? " selesai" : "");
  li.dataset.prioritas = t.prioritas;
  li.dataset.id = t.id;

  // Checkbox
  const cek = document.createElement("input");
  cek.type = "checkbox";
  cek.className = "cek";
  cek.checked = t.selesai;
  cek.setAttribute("aria-label", "Tandai tuntas: " + t.teks);
  cek.addEventListener("change", () => ubahStatus(t.id));
  li.appendChild(cek);

  // Badan (teks atau input edit)
  const badan = document.createElement("div");
  badan.className = "badan";

  if (idEdit === t.id) {
    const edit = document.createElement("input");
    edit.type = "text";
    edit.className = "edit-input";
    edit.value = t.teks;
    edit.maxLength = 120;
    edit.setAttribute("aria-label", "Ubah tugas");
    edit.addEventListener("keydown", (e) => {
      if (e.key === "Enter") simpanEdit(t.id, edit.value);
      if (e.key === "Escape") { idEdit = null; render(); }
    });
    badan.appendChild(edit);
    setTimeout(() => { edit.focus(); edit.select(); }, 0);
  } else {
    const teks = document.createElement("span");
    teks.className = "teks";
    teks.textContent = t.teks;
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = LABEL_PRIORITAS[t.prioritas];
    badan.appendChild(teks);
    badan.appendChild(chip);
  }
  li.appendChild(badan);

  // Tombol aksi
  const aksi = document.createElement("div");
  aksi.className = "aksi";

  if (idEdit === t.id) {
    const simpan = document.createElement("button");
    simpan.type = "button";
    simpan.textContent = "Simpan";
    simpan.addEventListener("click", () => simpanEdit(t.id, badan.querySelector("input").value));
    aksi.appendChild(simpan);
  } else {
    const ubah = document.createElement("button");
    ubah.type = "button";
    ubah.textContent = "Ubah";
    ubah.addEventListener("click", () => { idEdit = t.id; render(); });

    const hapus = document.createElement("button");
    hapus.type = "button";
    hapus.className = "hapus";
    hapus.textContent = "Hapus";
    hapus.addEventListener("click", () => hapusTugas(t.id, li));

    aksi.appendChild(ubah);
    aksi.appendChild(hapus);
  }
  li.appendChild(aksi);

  return li;
}

function renderDaftar() {
  daftar.innerHTML = "";
  const tampil = ambilTugasTampil();

  if (tampil.length === 0) {
    const kosong = document.createElement("li");
    kosong.className = "kosong";
    const judul = document.createElement("strong");
    const isi = document.createElement("span");
    if (tugas.length === 0) {
      judul.textContent = "Belum ada tugas";
      isi.textContent = "Tulis tugas pertamamu di kolom atas, lalu tekan Tambah.";
    } else {
      judul.textContent = "Tidak ada tugas di sini";
      isi.textContent = "Coba pilih filter lain.";
    }
    kosong.appendChild(judul);
    kosong.appendChild(isi);
    daftar.appendChild(kosong);
    return;
  }

  tampil.forEach((t) => daftar.appendChild(buatItem(t)));
}

function renderProgres() {
  const total = tugas.length;
  const tuntas = tugas.filter((t) => t.selesai).length;
  const nilai = total === 0 ? 0 : Math.round((tuntas / total) * 100);

  persen.textContent = nilai + "%";
  ringIsi.style.strokeDashoffset = KELILING_RING * (1 - nilai / 100);
  ringLabel.setAttribute("aria-label", "Progres " + nilai + " persen");

  if (total === 0) {
    ringkasan.textContent = "Belum ada tugas. Mulai dari yang kecil dulu.";
  } else if (tuntas === total) {
    ringkasan.textContent = "Semua tugas tuntas. Kerja bagus!";
  } else {
    const sisa = total - tuntas;
    ringkasan.textContent = sisa + " tugas lagi, " + tuntas + " sudah tuntas.";
  }

  tombolBersih.hidden = tuntas === 0;
}

function renderFilter() {
  filterWadah.querySelectorAll("button").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.filter === filterAktif));
  });
}

function render() {
  renderDaftar();
  renderProgres();
  renderFilter();
}

// ---------- Aksi ----------
function tambahTugas(teks, prioritas) {
  tugas.push({ id: Date.now(), teks, prioritas, selesai: false });
  simpanTugas();
  render();
}

function ubahStatus(id) {
  const t = tugas.find((x) => x.id === id);
  if (t) t.selesai = !t.selesai;
  simpanTugas();
  render();
}

function simpanEdit(id, teksBaru) {
  teksBaru = teksBaru.trim();
  if (teksBaru) {
    const t = tugas.find((x) => x.id === id);
    if (t) t.teks = teksBaru;
  }
  idEdit = null;
  simpanTugas();
  render();
}

function hapusTugas(id, elemen) {
  elemen.classList.add("keluar");
  setTimeout(() => {
    tugas = tugas.filter((x) => x.id !== id);
    simpanTugas();
    render();
  }, 220);
}

// ---------- Event ----------
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const teks = inputTugas.value.trim();

  if (teks === "") {
    pesanError.textContent = "Tugas masih kosong. Tulis dulu, baru tekan Tambah.";
    inputTugas.focus();
    return;
  }

  pesanError.textContent = "";
  tambahTugas(teks, pilihPrioritas.value);
  inputTugas.value = "";
  inputTugas.focus();
});

filterWadah.addEventListener("click", (e) => {
  const tombol = e.target.closest("button[data-filter]");
  if (!tombol) return;
  filterAktif = tombol.dataset.filter;
  render();
});

tombolBersih.addEventListener("click", () => {
  tugas = tugas.filter((t) => !t.selesai);
  simpanTugas();
  render();
});

// ---------- Mulai ----------
terapkanTema(document.documentElement.getAttribute("data-theme"));
tampilkanSapaan();
muatTugas();
render();
