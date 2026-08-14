const data = {
  role: "Mahasiswa",
  name: "Test Mhs 2",
  phone: "081234567826",
  password: "password123",
  kelurahan: "Dago",
  provinsi: "Jawa Barat",
  kabupaten: "Kota Bandung",
  nim: "12345678",
  fakultas: "S1 - Fakultas Teknik - UNIKOM",
  jurusan: "Teknik Informatika (DPL: Bpk. Budi)",
};

fetch("http://157.10.252.252:3000/api/v1/auth/register/mahasiswa-kkn", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
})
.then(res => res.json().then(j => console.log(res.status, j)))
.catch(console.error);
