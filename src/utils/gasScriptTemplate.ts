export const GAS_CODE_GS = `/**
 * ============================================================================
 * SALON CUKUR KILAT - BACKEND & WEB APP GOOGLE APPS SCRIPT (Code.gs)
 * ============================================================================
 * Fitur Otomatisasi:
 * 1. Auto-Create 8 Sheet Database + Data Awal (setupSalonSheets)
 * 2. Proteksi Anti-Bentrok Jadwal Real-Time (LockService.getScriptLock)
 * 3. Perhitungan Komisi Barber Otomatis (Default 40% - 45%)
 * 4. Sistem Stempel Loyalitas 15x Kunjungan + Validasi Rating Bintang 5
 * 5. Auto-Create Folder Google Drive untuk Foto Potong & Berkas KTP/KK
 * 6. Mendukung Mode Web App Mandiri (HtmlService) & REST API JSON (fetch)
 * ============================================================================
 */

// Opsional: Isi jika ingin memakai folder Drive tertentu.
// Jika dibiarkan kosong "", sistem otomatis membuat folder di Google Drive Anda!
const CUSTOM_FOLDER_FOTO_ID = "";
const CUSTOM_FOLDER_DOKUMEN_ID = "";

/**
 * 1. ENTRY POINT GET (Membuka Aplikasi Web / Mengambil Data JSON)
 */
function doGet(e) {
  // Pastikan semua 8 sheet sudah tersedia
  ensureDatabaseInitialized();

  const action = e && e.parameter ? e.parameter.action : null;

  // Jika dipanggil sebagai API JSON (misal: ?action=getAllData)
  if (action === "getAllData") {
    return jsonResponse(getAllSalonData());
  }
  if (action === "getSlots") {
    return jsonResponse(getAvailableSlots(e.parameter.date, e.parameter.barberId));
  }
  if (action === "getPublicGallery") {
    return jsonResponse(getGalleryData());
  }
  if (action === "ping") {
    return jsonResponse({
      status: "ok",
      app: "SalonCukurKilat GAS Backend v2.0",
      timestamp: new Date().toISOString()
    });
  }

  // Jika dibuka langsung di browser tanpa parameter action, tampilkan file Index.html
  try {
    let htmlOutput;
    try {
      htmlOutput = HtmlService.createHtmlOutputFromFile("Index");
    } catch (e1) {
      htmlOutput = HtmlService.createHtmlOutputFromFile("index");
    }
    return htmlOutput
      .setTitle("SalonCukurKilat — Barbershop & Home Service")
      .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    // Jika file Index.html belum dibuat, tampilkan halaman status panduan
    return HtmlService.createHtmlOutput(
      "<div style='font-family:sans-serif;background:#062320;color:#fff;padding:24px;border-radius:12px;max-width:500px;margin:40px auto;border:1px solid #e5a93c;'>" +
      "<h2 style='color:#e5a93c;margin-top:0;'>✅ Backend SalonCukurKilat Aktif!</h2>" +
      "<p>Database 8 Sheet telah siap di Google Spreadsheet Anda.</p>" +
      "<p>Untuk menampilkan aplikasi penuh, klik tanda <b>+ (Tambah File) &gt; HTML</b> di editor Apps Script, beri nama <b>Index</b>, lalu tempelkan kode dari file <b>gas/Index.html</b>.</p>" +
      "</div>"
    ).setTitle("SalonCukurKilat Backend Status");
  }
}

/**
 * 2. ENTRY POINT POST (Transaksi dengan Proteksi LockService)
 */
function doPost(e) {
  ensureDatabaseInitialized();
  const lock = LockService.getScriptLock();
  try {
    // Tunggu giliran eksekusi maksimal 10 detik untuk mencegah bentrok jadwal
    lock.waitLock(10000);

    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(rawBody);
    const action = data.action;
    const payload = data.payload || {};

    switch (action) {
      case "createBooking":
        return jsonResponse(handleCreateBooking(payload));
      case "updateBookingStatus":
        return jsonResponse(handleUpdateBookingStatus(payload.id, payload.status));
      case "processPayment":
        return jsonResponse(handleProcessPayment(payload));
      case "addRiwayatPotong":
        return jsonResponse(handleAddRiwayatPotong(payload));
      case "submitReview":
        return jsonResponse(handleSubmitReview(payload.id, payload.rating, payload.review));
      case "toggleGaleri":
        return jsonResponse(handleToggleGaleri(payload.id));
      case "updateStock":
        return jsonResponse(handleUpdateStock(payload.id, payload.delta));
      case "applyJob":
        return jsonResponse(handleApplyJob(payload));
      case "updateApplicantStatus":
        return jsonResponse(handleUpdateApplicantStatus(payload.id, payload.status, payload.catatan));
      case "updateLoyalty":
        return jsonResponse(handleUpdateLoyalty(payload));
      default:
        return jsonResponse({ success: false, error: "Aksi tidak dikenal: " + action });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 3. FUNGSI HELPER UNTUK google.script.run (Jika memakai Index.html di GAS)
 */
function gasGetInitialData() {
  ensureDatabaseInitialized();
  return getAllSalonData();
}

function gasDispatchAction(action, payload) {
  const fakeEvent = {
    postData: {
      contents: JSON.stringify({ action: action, payload: payload })
    }
  };
  const output = doPost(fakeEvent).getContent();
  return JSON.parse(output);
}

/**
 * 4. HANDLER ANTI-BENTROK BOOKING
 * Kolom Sheet Booking:
 * [0] ID Booking | [1] ID Pelanggan | [2] Nama Pelanggan | [3] No WA |
 * [4] Jenis Layanan | [5] Alamat | [6] Tanggal | [7] Jam |
 * [8] ID Layanan | [9] Nama Layanan | [10] Biaya |
 * [11] ID Kapster | [12] Nama Kapster | [13] Status | [14] Catatan | [15] Timestamp
 */
function handleCreateBooking(booking) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Booking");
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowDate = formatDateYMD(row[6]);
    const rowJam = String(row[7]).trim();
    const rowKapsterId = String(row[11]).trim();
    const rowStatus = String(row[13]).trim();

    if (
      rowDate === booking.tanggal &&
      rowJam === booking.jam &&
      rowKapsterId === booking.kapsterId &&
      rowStatus !== "Batal"
    ) {
      return {
        success: false,
        message: "Waduh! Slot jam " + booking.jam + " bersama " + booking.kapsterNama + " baru saja terisi. Silakan pilih jam lain."
      };
    }
  }

  const newId = "BKG-" + new Date().getTime().toString().slice(-4);
  const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");

  sheet.appendRow([
    newId,
    booking.pelangganId || "CUST-NEW",
    booking.pelangganNama,
    booking.pelangganWa,
    booking.jenisLayanan,
    booking.alamatHomeService || "-",
    booking.tanggal,
    booking.jam,
    booking.layananId || "srv-1",
    booking.layananNama || "Gentleman Classic Cut",
    Number(booking.biaya) || 50000,
    booking.kapsterId,
    booking.kapsterNama,
    "Menunggu",
    booking.catatanKhusus || "",
    nowStr
  ]);

  // Pastikan pelanggan tercatat di Sheet Pelanggan
  upsertCustomer(booking.pelangganId, booking.pelangganNama, booking.pelangganWa, booking.alamatHomeService, 0);

  return {
    success: true,
    bookingId: newId,
    message: "Booking berhasil dicatat ke Google Sheets!"
  };
}

function getAvailableSlots(dateStr, barberId) {
  const allSlots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:30", "17:30", "19:00", "20:00"];
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Booking");
  const values = sheet.getDataRange().getValues();
  const booked = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const rowDate = formatDateYMD(row[6]);
    const rowJam = String(row[7]).trim();
    const rowKapster = String(row[11]).trim();
    const rowStatus = String(row[13]).trim();

    if (rowDate === dateStr && rowKapster === barberId && rowStatus !== "Batal") {
      booked.push(rowJam);
    }
  }

  return {
    date: dateStr,
    barberId: barberId,
    availableSlots: allSlots.filter(function(s) { return booked.indexOf(s) === -1; }),
    bookedSlots: booked
  };
}

function handleUpdateBookingStatus(bookingId, newStatus) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Booking");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(bookingId)) {
      sheet.getRange(i + 1, 14).setValue(newStatus);
      return { success: true };
    }
  }
  return { success: false, message: "Booking ID tidak ditemukan" };
}

/**
 * 5. HANDLER PEMBAYARAN & KOMISI BARBER OTOMATIS
 */
function handleProcessPayment(payment) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetBayar = ss.getSheetByName("Pembayaran");
  const sheetBarber = ss.getSheetByName("Barber");
  const sheetBooking = ss.getSheetByName("Booking");

  let persentase = 40;
  const barberData = sheetBarber.getDataRange().getValues();
  for (let i = 1; i < barberData.length; i++) {
    if (String(barberData[i][0]) === String(payment.barberId)) {
      persentase = Number(barberData[i][5]) || 40;
      // Tambah total potong barber (+1)
      const currentCuts = Number(barberData[i][8]) || 0;
      sheetBarber.getRange(i + 1, 9).setValue(currentCuts + 1);
      break;
    }
  }

  const nominal = Number(payment.nominal) || 0;
  const komisiNominal = Math.round(nominal * (persentase / 100));
  const newTrxId = "TRX-" + new Date().getTime().toString().slice(-4);
  const nowStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm");

  sheetBayar.appendRow([
    newTrxId,
    payment.bookingId,
    payment.pelangganNama,
    payment.barberId,
    payment.barberNama,
    nowStr,
    payment.metodeBayar,
    nominal,
    "Lunas",
    payment.noReferensi || (payment.metodeBayar + "-" + Math.floor(100000 + Math.random() * 900000)),
    payment.catatan || "Pembayaran layanan SalonCukurKilat",
    persentase,
    komisiNominal,
    payment.adminPencatat || "Admin (Pemilik)"
  ]);

  // Update status booking menjadi Selesai & ambil nomor WA pelanggan
  let custWa = "";
  let custId = "";
  const bData = sheetBooking.getDataRange().getValues();
  for (let j = 1; j < bData.length; j++) {
    if (String(bData[j][0]) === String(payment.bookingId)) {
      sheetBooking.getRange(j + 1, 14).setValue("Selesai");
      custId = String(bData[j][1]);
      custWa = String(bData[j][3]);
      break;
    }
  }

  // Tambah kunjungan loyalitas pelanggan (+1)
  const updatedVisits = upsertCustomer(custId, payment.pelangganNama, custWa, "", 1);

  return {
    success: true,
    trxId: newTrxId,
    komisiBarber: komisiNominal,
    persentase: persentase,
    totalKunjunganBaru: updatedVisits
  };
}

/**
 * 6. HANDLER RIWAYAT POTONG, REVIEW, STOK, DAN PELAMAR KERJA
 */
function handleAddRiwayatPotong(riwayat) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Riwayat_Potong");
  const newId = "RWY-" + new Date().getTime().toString().slice(-4);
  let fotoUrl = riwayat.fotoUrl || "";

  if (riwayat.base64Photo) {
    fotoUrl = saveBase64FileToDrive(riwayat.base64Photo, "Potong_" + newId + ".jpg", "FOTO");
  }

  sheet.appendRow([
    newId,
    riwayat.pelangganId || "CUST-001",
    riwayat.pelangganNama,
    riwayat.barberId,
    riwayat.barberNama,
    riwayat.tanggal || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd"),
    riwayat.modelPotongan,
    riwayat.catatanGaya || "",
    fotoUrl,
    Number(riwayat.rating) || 5,
    riwayat.review || "",
    riwayat.tampilkanDiGaleri !== false
  ]);

  return { success: true, id: newId, fotoUrl: fotoUrl };
}

function handleSubmitReview(riwayatId, rating, review) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Riwayat_Potong");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(riwayatId)) {
      sheet.getRange(i + 1, 10).setValue(Number(rating));
      sheet.getRange(i + 1, 11).setValue(review);
      return { success: true };
    }
  }
  return { success: false, message: "ID Riwayat tidak ditemukan" };
}

function handleToggleGaleri(riwayatId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Riwayat_Potong");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(riwayatId)) {
      const current = Boolean(values[i][11]);
      sheet.getRange(i + 1, 12).setValue(!current);
      return { success: true, tampilkanDiGaleri: !current };
    }
  }
  return { success: false };
}

function getGalleryData() {
  const all = getAllSalonData();
  return all.riwayatPotong.filter(function(r) { return r.tampilkanDiGaleri; });
}

function handleUpdateStock(stockId, delta) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Stok_Produk");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(stockId)) {
      const currentQty = Number(values[i][3]) || 0;
      const nextQty = Math.max(0, currentQty + Number(delta));
      sheet.getRange(i + 1, 4).setValue(nextQty);
      return { success: true, stokSaatIni: nextQty };
    }
  }
  return { success: false };
}

function handleApplyJob(payload) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pendaftaran_Pegawai");
  const newId = "PEL-" + new Date().getTime().toString().slice(-4);
  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");

  let ktpFile = payload.ktpFileName || "KTP_Uploaded.pdf";
  let kkFile = payload.kkFileName || "KK_Uploaded.pdf";

  if (payload.ktpBase64) {
    ktpFile = saveBase64FileToDrive(payload.ktpBase64, "KTP_" + payload.nama + ".pdf", "DOKUMEN");
  }
  if (payload.kkBase64) {
    kkFile = saveBase64FileToDrive(payload.kkBase64, "KK_" + payload.nama + ".pdf", "DOKUMEN");
  }

  sheet.appendRow([
    newId,
    payload.nama,
    payload.noWa,
    payload.alamat || "-",
    Number(payload.pengalamanTahun) || 1,
    payload.spesialisasi || "Fade & Grooming",
    ktpFile,
    kkFile,
    "Baru",
    todayStr,
    payload.catatanInterview || ""
  ]);

  return { success: true, id: newId };
}

function handleUpdateApplicantStatus(id, status, catatan) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Pendaftaran_Pegawai");
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id)) {
      sheet.getRange(i + 1, 9).setValue(status);
      if (catatan) {
        sheet.getRange(i + 1, 11).setValue(catatan);
      }

      // Jika diterima, otomatis tambahkan ke Sheet Barber
      if (status === "Diterima") {
        const sheetBarber = ss.getSheetByName("Barber");
        const bCount = sheetBarber.getLastRow();
        const newBarberId = "BRB-0" + bCount;
        const nama = String(values[i][1]);
        sheetBarber.appendRow([
          newBarberId,
          nama,
          nama.split(" ")[0],
          String(values[i][2]),
          String(values[i][5]),
          40,
          "Aktif",
          5.0,
          0,
          "10:00",
          "21:00",
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80"
        ]);
      }
      return { success: true };
    }
  }
  return { success: false };
}

function handleUpdateLoyalty(settings) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pengaturan_Loyalty");
  if (sheet.getLastRow() < 2) {
    sheet.appendRow([settings.jumlahKunjunganReward || 15, 5, true, 60000]);
  } else {
    sheet.getRange(2, 1, 1, 4).setValues([[
      Number(settings.jumlahKunjunganReward) || 15,
      Number(settings.syaratRatingMin) || 5,
      Boolean(settings.syaratReviewWajib),
      Number(settings.diskonGratisNominal) || 60000
    ]]);
  }
  return { success: true };
}

/**
 * 7. HELPER DATABASE & GOOGLE DRIVE OTOMATIS
 */
function upsertCustomer(id, nama, noWa, alamat, visitDelta) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Pelanggan");
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) === String(id) || String(values[i][2]) === String(noWa)) {
      const currentVisits = Number(values[i][4]) || 0;
      const nextVisits = currentVisits + (Number(visitDelta) || 0);
      sheet.getRange(i + 1, 5).setValue(nextVisits);
      if (alamat && alamat !== "-") {
        sheet.getRange(i + 1, 4).setValue(alamat);
      }
      return nextVisits;
    }
  }
  const newCustId = id || ("CUST-00" + values.length);
  const initialVisits = Math.max(1, Number(visitDelta) || 1);
  sheet.appendRow([newCustId, nama, noWa, alamat || "-", initialVisits, "Aktif", true]);
  return initialVisits;
}

function saveBase64FileToDrive(base64Data, fileName, type) {
  try {
    let folderId = type === "FOTO" ? CUSTOM_FOLDER_FOTO_ID : CUSTOM_FOLDER_DOKUMEN_ID;
    let folder;
    if (folderId) {
      folder = DriveApp.getFolderById(folderId);
    } else {
      const folderName = type === "FOTO" ? "SalonCukurKilat_Foto_Potong" : "SalonCukurKilat_Dokumen_Pelamar";
      const folders = DriveApp.getFoldersByName(folderName);
      folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);
    }
    const splitBase64 = base64Data.indexOf(",") > -1 ? base64Data.split(",")[1] : base64Data;
    const contentType = base64Data.indexOf("pdf") > -1 ? "application/pdf" : "image/jpeg";
    const blob = Utilities.newBlob(Utilities.base64Decode(splitBase64), contentType, fileName);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (e) {
    return fileName;
  }
}

function formatDateYMD(val) {
  if (!val) return "";
  if (Object.prototype.toString.call(val) === "[object Date]" && !isNaN(val.getTime())) {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return String(val).slice(0, 10);
}

/**
 * 8. PEMBACAAN SELURUH DATA SHEET KE FORMAT JSON FRONTEND
 */
function getAllSalonData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const custRows = ss.getSheetByName("Pelanggan").getDataRange().getValues().slice(1);
  const customers = custRows.map(function(r) {
    return {
      id: String(r[0]),
      nama: String(r[1]),
      noWa: String(r[2]),
      alamat: String(r[3]),
      totalKunjungan: Number(r[4]) || 0,
      statusMember: String(r[5]) || "Aktif",
      riwayatBintang5Konsisten: Boolean(r[6]),
      poinTerkumpul: Number(r[4]) || 0
    };
  });

  const barberRows = ss.getSheetByName("Barber").getDataRange().getValues().slice(1);
  const barbers = barberRows.map(function(r) {
    return {
      id: String(r[0]),
      nama: String(r[1]),
      nickname: String(r[2]),
      noWa: String(r[3]),
      spesialisasi: String(r[4]),
      persentaseKomisi: Number(r[5]) || 40,
      status: String(r[6]) || "Aktif",
      rating: Number(r[7]) || 4.9,
      totalPotong: Number(r[8]) || 0,
      jamMulai: String(r[9] || "09:00"),
      jamSelesai: String(r[10] || "21:00"),
      avatar: String(r[11] || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80")
    };
  });

  const bookingRows = ss.getSheetByName("Booking").getDataRange().getValues().slice(1);
  const bookings = bookingRows.map(function(r) {
    return {
      id: String(r[0]),
      pelangganId: String(r[1]),
      pelangganNama: String(r[2]),
      pelangganWa: String(r[3]),
      jenisLayanan: String(r[4]),
      alamatHomeService: String(r[5]) === "-" ? "" : String(r[5]),
      tanggal: formatDateYMD(r[6]),
      jam: String(r[7]),
      layananId: String(r[8]),
      layananNama: String(r[9]),
      biaya: Number(r[10]) || 50000,
      kapsterId: String(r[11]),
      kapsterNama: String(r[12]),
      status: String(r[13]),
      catatanKhusus: String(r[14] || ""),
      createdAt: String(r[15] || "")
    };
  });

  const riwayatRows = ss.getSheetByName("Riwayat_Potong").getDataRange().getValues().slice(1);
  const riwayatPotong = riwayatRows.map(function(r) {
    return {
      id: String(r[0]),
      pelangganId: String(r[1]),
      pelangganNama: String(r[2]),
      barberId: String(r[3]),
      barberNama: String(r[4]),
      tanggal: formatDateYMD(r[5]),
      modelPotongan: String(r[6]),
      catatanGaya: String(r[7]),
      fotoUrl: String(r[8]),
      rating: Number(r[9]) || 5,
      review: String(r[10]),
      tampilkanDiGaleri: Boolean(r[11])
    };
  });

  const bayarRows = ss.getSheetByName("Pembayaran").getDataRange().getValues().slice(1);
  const pembayaran = bayarRows.map(function(r) {
    return {
      id: String(r[0]),
      bookingId: String(r[1]),
      pelangganNama: String(r[2]),
      barberId: String(r[3]),
      barberNama: String(r[4]),
      tanggal: String(r[5]),
      metodeBayar: String(r[6]),
      nominal: Number(r[7]) || 0,
      status: String(r[8]),
      noReferensi: String(r[9]),
      catatan: String(r[10]),
      persentaseKomisi: Number(r[11]) || 40,
      komisiBarber: Number(r[12]) || 0,
      adminPencatat: String(r[13])
    };
  });

  const stokRows = ss.getSheetByName("Stok_Produk").getDataRange().getValues().slice(1);
  const stok = stokRows.map(function(r) {
    return {
      id: String(r[0]),
      namaProduk: String(r[1]),
      kategori: String(r[2]),
      stokSaatIni: Number(r[3]) || 0,
      minimumStok: Number(r[4]) || 5,
      harga: Number(r[5]) || 0,
      satuan: String(r[6] || "pcs")
    };
  });

  const pelamarRows = ss.getSheetByName("Pendaftaran_Pegawai").getDataRange().getValues().slice(1);
  const pendaftaran = pelamarRows.map(function(r) {
    return {
      id: String(r[0]),
      nama: String(r[1]),
      noWa: String(r[2]),
      alamat: String(r[3]),
      pengalamanTahun: Number(r[4]) || 1,
      spesialisasi: String(r[5]),
      ktpFileName: String(r[6]),
      kkFileName: String(r[7]),
      statusLamaran: String(r[8]),
      tanggalDaftar: formatDateYMD(r[9]),
      catatanInterview: String(r[10] || "")
    };
  });

  const loyaltyRows = ss.getSheetByName("Pengaturan_Loyalty").getDataRange().getValues();
  const loyaltySettings = loyaltyRows.length > 1 ? {
    jumlahKunjunganReward: Number(loyaltyRows[1][0]) || 15,
    syaratRatingMin: Number(loyaltyRows[1][1]) || 5,
    syaratReviewWajib: Boolean(loyaltyRows[1][2]),
    diskonGratisNominal: Number(loyaltyRows[1][3]) || 60000
  } : {
    jumlahKunjunganReward: 15,
    syaratRatingMin: 5,
    syaratReviewWajib: true,
    diskonGratisNominal: 60000
  };

  return {
    customers: customers,
    barbers: barbers,
    bookings: bookings,
    riwayatPotong: riwayatPotong,
    pembayaran: pembayaran,
    stok: stok,
    pendaftaran: pendaftaran,
    loyaltySettings: loyaltySettings
  };
}

/**
 * 9. SETUP OTOMATIS 8 SHEET DATABASE + DATA AWAL (Jalankan sekali atau otomatis)
 */
function ensureDatabaseInitialized() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName("Pelanggan")) {
    setupSalonSheets();
  }
}

function setupSalonSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const schema = [
    {
      name: "Pelanggan",
      cols: ["ID Pelanggan", "Nama", "No WhatsApp", "Alamat", "Total Kunjungan", "Status Member", "Bintang 5 Konsisten"],
      seed: [
        ["CUST-001", "Andi Prasetyo", "081398765432", "Jl. Melati No. 14, Kebayoran Baru", 13, "Aktif", true],
        ["CUST-002", "Bambang Sudibyo", "081287654321", "Cluster Palm View B-7, BSD", 15, "Aktif", true],
        ["CUST-003", "Dimas Kurniawan", "085712349988", "Apartemen Sudirman Tower 2 Lt. 18", 4, "Aktif", true]
      ]
    },
    {
      name: "Booking",
      cols: ["ID Booking", "ID Pelanggan", "Nama Pelanggan", "No WA", "Jenis Layanan", "Alamat", "Tanggal", "Jam", "ID Layanan", "Nama Layanan", "Biaya", "ID Kapster", "Nama Kapster", "Status", "Catatan", "Timestamp"],
      seed: [
        ["BKG-101", "CUST-001", "Andi Prasetyo", "081398765432", "Studio", "-", "2026-10-17", "10:00", "srv-1", "Gentleman Classic Cut", 50000, "BRB-01", "Budi 'The Fade'", "Dikonfirmasi", "Fade tipis samping", "2026-10-16 19:40"],
        ["BKG-102", "CUST-002", "Bambang Sudibyo", "081287654321", "Home Service", "Cluster Palm View B-7, BSD", "2026-10-17", "14:00", "srv-2", "Royal Shave + Fade Cut", 120000, "BRB-02", "Dani 'Razor Edge'", "Menunggu", "Bawa cermin cadangan", "2026-10-16 20:15"]
      ]
    },
    {
      name: "Riwayat_Potong",
      cols: ["ID Riwayat", "ID Pelanggan", "Nama Pelanggan", "ID Barber", "Nama Barber", "Tanggal", "Model Potongan", "Catatan Gaya", "Link Foto Drive", "Rating", "Review", "Galeri Depan"],
      seed: [
        ["RWY-01", "CUST-001", "Andi Prasetyo", "BRB-01", "Budi 'The Fade'", "2026-10-02", "Low Skin Fade + Textured Fringe", "Guard #1 bawah, blending rapi, matte paste.", "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=500&q=80", 5, "Hasil potong Mas Budi selalu presisi!", true],
        ["RWY-02", "CUST-002", "Bambang Sudibyo", "BRB-02", "Dani 'Razor Edge'", "2026-09-28", "Classic Executive Pompadour", "Garis kumis lurus bersih, rahang 45 derajat.", "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=500&q=80", 5, "Home service tepat waktu dan sangat bersih!", true]
      ]
    },
    {
      name: "Pembayaran",
      cols: ["ID Transaksi", "ID Booking", "Pelanggan", "ID Barber", "Barber", "Tanggal", "Metode", "Nominal", "Status", "Referensi", "Catatan", "Persen Komisi", "Nominal Komisi", "Admin"],
      seed: [
        ["TRX-8901", "BKG-103", "Dimas Kurniawan", "BRB-01", "Budi 'The Fade'", "2026-10-16 17:15", "QRIS", 50000, "Lunas", "QRIS-BCA-993812", "Potong studio reguler", 40, 20000, "Admin (Pemilik)"]
      ]
    },
    {
      name: "Barber",
      cols: ["ID Barber", "Nama", "Nickname", "No WhatsApp", "Spesialisasi", "Persen Komisi", "Status", "Rating", "Total Potong", "Jam Mulai", "Jam Selesai", "Avatar URL"],
      seed: [
        ["BRB-01", "Budi Santoso", "Budi 'The Fade'", "081234567891", "Low/Mid Skin Fade & Texture Crop", 40, "Aktif", 4.9, 348, "09:00", "21:00", "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"],
        ["BRB-02", "Dani Firmansyah", "Dani 'Razor Edge'", "081234567892", "Traditional Hot Shave & Pompadour", 45, "Aktif", 4.8, 289, "10:00", "20:00", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80"],
        ["BRB-03", "Rian Pratama", "Rian 'Stylist'", "081234567893", "Korean Two-Block & Comma Hair", 40, "Aktif", 4.9, 215, "11:00", "21:30", "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"]
      ]
    },
    {
      name: "Pendaftaran_Pegawai",
      cols: ["ID Pelamar", "Nama", "No WhatsApp", "Alamat", "Pengalaman (Thn)", "Spesialisasi", "Link KTP", "Link KK", "Status Lamaran", "Tanggal Daftar", "Catatan Interview"],
      seed: [
        ["PEL-001", "Yusuf Arifin", "082199887766", "Jl. Radio Dalam No. 45", 3, "Fade modern, Hair Tattoo", "KTP_Yusuf_Arifin.pdf", "KK_Yusuf_Arifin.pdf", "Baru", "2026-10-15", "Portofolio rapi, teknik skin fade bersih."]
      ]
    },
    {
      name: "Stok_Produk",
      cols: ["ID Produk", "Nama Produk", "Kategori", "Stok Saat Ini", "Minimum Stok", "Harga", "Satuan"],
      seed: [
        ["STK-01", "Suavecito Pomade Firme Hold 113g", "Styling Pomade", 4, 6, 165000, "jar"],
        ["STK-02", "Gatsby Water Gloss Hard 100g", "Styling Gel", 14, 5, 35000, "jar"],
        ["STK-03", "Proraso Shaving Cream Eucalyptus 150ml", "Shaving Cream", 3, 5, 95000, "tube"],
        ["STK-04", "Beard Oil Sandalwood Organic 30ml", "Perawatan Jenggot", 8, 4, 75000, "botol"]
      ]
    },
    {
      name: "Pengaturan_Loyalty",
      cols: ["Target Kunjungan Reward", "Min Rating", "Review Wajib", "Nominal Gratis"],
      seed: [
        [15, 5, true, 60000]
      ]
    }
  ];

  schema.forEach(function(item) {
    let s = ss.getSheetByName(item.name);
    if (!s) {
      s = ss.insertSheet(item.name);
      s.appendRow(item.cols);
      s.getRange(1, 1, 1, item.cols.length)
        .setFontWeight("bold")
        .setBackground("#082f2c")
        .setFontColor("#e5a93c");
      item.seed.forEach(function(row) {
        s.appendRow(row);
      });
      s.setFrozenRows(1);
    }
  });
}
`;

export function downloadTextFile(filename: string, content: string, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTanggalIndonesia(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function generateWhatsAppReceiptUrl(options: {
  phone: string;
  trxId: string;
  customerName: string;
  barberName: string;
  serviceName: string;
  serviceType: string;
  nominal: number;
  paymentMethod: string;
  haircutNotes?: string;
  loyaltyVisits: number;
  loyaltyTarget: number;
}): string {
  const cleanPhone = options.phone.replace(/[^0-9]/g, '');
  const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  const visitsLeft = Math.max(0, options.loyaltyTarget - options.loyaltyVisits);
  const loyaltyStatus =
    visitsLeft === 0
      ? '🎉 SELAMAT! Kupon Potong Rambut GRATIS Anda sudah terbuka!'
      : `⭐ Kunjungan ke-${options.loyaltyVisits}/${options.loyaltyTarget} (${visitsLeft}x potong lagi menuju CUKUR GRATIS)`;

  const message = `💈 *SALON CUKUR KILAT - STRUK DIGITAL RESMI* 💈
----------------------------------------
No. Transaksi : *${options.trxId}*
Pelanggan     : *${options.customerName}*
Barber        : *${options.barberName}*
Layanan       : *${options.serviceName}* (${options.serviceType})
Total Biaya   : *${formatRupiah(options.nominal)}*
Status Bayar  : *LUNAS (${options.paymentMethod})*
----------------------------------------
✂️ *Catatan Gaya*:
${options.haircutNotes || 'Fade presisi + grooming premium'}

🎯 *Program Loyalitas*:
${loyaltyStatus}

Terima kasih atas kunjungan Anda! Kami siap melayani ketampanan maksimal Anda kembali.
_SalonCukurKilat — Studio & Home Service_`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}
