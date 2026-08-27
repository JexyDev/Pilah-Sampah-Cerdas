import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * syncStudents.ts — SINKRONISASI 537 DATA MAHASISWA KKN 2026
 * Sumber: Pengelompokan KKN 2026 (UPDATE).xlsx + Koreksi Manual User
 * Koreksi:
 * 1. Azwal Dimas -> NIM: 21224071, Kelompok: Kelompok 2 Dago
 * 2. Siti Maryam Hopiyah -> HP: +6285295275593, NIM: 10524112, Kelompok: Kelompok 2 Sadang Serang
 * 3. Alexa Rochman -> NIM: 10524050, Kelompok: Kelompok 5 Sekeloa
 * 4. Zelgi Raidansyah -> NIM: 10524032, Kelompok: Kelompok 1 Sekeloa
 */

const studentsData: { name: string; nim: string; phone: string; group: string; prodi?: string }[] = [
  {
    "name": "Amelya Rizqi Rachmadani",
    "nim": "21224027",
    "phone": "+6282115280051",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Novia Sri Wahyuni",
    "nim": "21224165",
    "phone": "+6283897917262",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rizka Rahma Kamila",
    "nim": "21224029",
    "phone": "+6283844209035",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Zahra Puteri Qintara",
    "nim": "21224017",
    "phone": "+628979745547",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Aldrin Juandika",
    "nim": "21224031",
    "phone": "+6281511722253",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "NAAILA RIZKY KURNIAWAN",
    "nim": "21224040",
    "phone": "+6281803930324",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ahmad Shadiq",
    "nim": "21224005",
    "phone": "+628978123352",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rika Yuseliana",
    "nim": "21224037",
    "phone": "+6283823067530",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Kesya Putri Fibrianto",
    "nim": "21224012",
    "phone": "+6281386759563",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Juan Morgan Pakpahan",
    "nim": "21224036",
    "phone": "+62895388814138",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "MUHAMMAD RENDI ANSARI",
    "nim": "21224019",
    "phone": "+6281563500163",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Reynaldi Pasha Nugraha",
    "nim": "21224009",
    "phone": "+6289516528208",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Dimas Aditiya",
    "nim": "21224042",
    "phone": "+6284898521015",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Dwi Anggeria Maulana",
    "nim": "21224041",
    "phone": "+6285759973751",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Bunga Sefrizanti",
    "nim": "21224164",
    "phone": "+6283839324380",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "EVANIA SALSABILA",
    "nim": "21224026",
    "phone": "+628886002536",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Nanda Puspita Dewi",
    "nim": "21224028",
    "phone": "+62895700887431",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Anindia Geisya Lauria",
    "nim": "21224004",
    "phone": "+6285189951204",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Laila Nazifa Sanjaya",
    "nim": "21224008",
    "phone": "+6285759177652",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Virginia Putri Andeida",
    "nim": "21224018",
    "phone": "+6285189951218",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Riky wildan hepyliyadi",
    "nim": "21224011",
    "phone": "+628985506581",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Saepul anwar",
    "nim": "21224034",
    "phone": "+628561404113",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "DEVITASARI",
    "nim": "21224030",
    "phone": "+6285769680649",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Maryam Agatha Islami",
    "nim": "21224010",
    "phone": "+6287717774587",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "risa marseliana",
    "nim": "21224022",
    "phone": "+6281511687598",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rajnan khairul akhyar",
    "nim": "21224175",
    "phone": "+6281220505575",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Cicy Fauzzyah Rifqi Iskandar Sunu Saranani",
    "nim": "21224003",
    "phone": "+6281323194418",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ana Alailla",
    "nim": "21224166",
    "phone": "+6289506697457",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Salma Fauziyyah Firdaus",
    "nim": "21224007",
    "phone": "+6285797295168",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Lukman Hakim",
    "nim": "21224176",
    "phone": "+6282119092783",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Mesya siti nuralia",
    "nim": "21224002",
    "phone": "+6282219712650",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Melisa Febrianty Effendi",
    "nim": "21224038",
    "phone": "+6289646841703",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Bilhaqqi Kitabullah",
    "nim": "21224024",
    "phone": "+6283849025045",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Muhamad Rizkal Jatnika",
    "nim": "21224001",
    "phone": "+62895617526772",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Mochamad mir’an kholid",
    "nim": "21224039",
    "phone": "+6281321384239",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "M Ghassan Rabbani H",
    "nim": "21225023",
    "phone": "+628990054657",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rio Islami Pasha",
    "nim": "21224020",
    "phone": "+6285872823913",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Devan Elka Raihansyah",
    "nim": "21224025",
    "phone": "+628973142285",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Darrell Rafif Rizky Ramadhan",
    "nim": "21224033",
    "phone": "+628818366327",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Yazdaniar Alfaathir",
    "nim": "21224014",
    "phone": "+62895370305522",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Giandhika Bambang Supriatna",
    "nim": "21224006",
    "phone": "+6281395481402",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Muhammad Rachil Tri Gusti",
    "nim": "21224021",
    "phone": "+6281219521365",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "kaesya Prasetya gandhi",
    "nim": "21224035",
    "phone": "+6287775676469",
    "group": "Kelompok 1 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ivana Agustin Ragil Ayomi",
    "nim": "21224072",
    "phone": "+6282195176008",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Gaberiela Br Bangun",
    "nim": "21224074",
    "phone": "+628817877256",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Vera Cornelia",
    "nim": "21224059",
    "phone": "+6282158665230",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Devina Mutiara Aghisna",
    "nim": "21224077",
    "phone": "+6281224790197",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Afifatul khasanah",
    "nim": "21224050",
    "phone": "+6287754486452",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Sofia Dafa Fadhilah",
    "nim": "21224048",
    "phone": "+6285174164181",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Annisa Octavia",
    "nim": "21224056",
    "phone": "+6285795181569",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Naira Azzahra",
    "nim": "21224081",
    "phone": "+6281917113086",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Dewi Azra Tami",
    "nim": "21224173",
    "phone": "+6283890542228",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Salwa Nur Fadilah",
    "nim": "21224065",
    "phone": "+62895358490228",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Salma Nur Fadilah",
    "nim": "21224064",
    "phone": "+6285846160400",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Melinda",
    "nim": "21224057",
    "phone": "+628987830220",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ester Intan Sinurat",
    "nim": "21224083",
    "phone": "+6283895345440",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Nadiya Nur Fauziyah",
    "nim": "21224080",
    "phone": "+6281313804028",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Hirani Zahra Febriyanti",
    "nim": "21224079",
    "phone": "+6281324831783",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Nasya Destianti",
    "nim": "21224053",
    "phone": "+6285795533802",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Cantika Putri Felisha",
    "nim": "21224073",
    "phone": "+62859113375004",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Naillah Izzaf Rahadatul Aissy Gultom",
    "nim": "21224063",
    "phone": "+6281319030001",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Farhan Musthopa",
    "nim": "21224044",
    "phone": "+6281223670035",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "sultan nurzamzam",
    "nim": "21224884",
    "phone": "+6281320760468",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Alma Sri Maharani",
    "nim": "21224060",
    "phone": "+6285722154395",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rasyidah wardani",
    "nim": "21224070",
    "phone": "+628996064729",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Eva Nurmah Salsabilla",
    "nim": "21224055",
    "phone": "+628889368346",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "virgi triharyandri",
    "nim": "21224058",
    "phone": "+6288291330000",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Maranatha Jaya Nainggolan",
    "nim": "21224046",
    "phone": "+6282118971151",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Livia Dhayang Rifani",
    "nim": "21224061",
    "phone": "+6285158668915",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rizki Maulana",
    "nim": "21224078",
    "phone": "+628211500633",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Muhammad Novan Maulana",
    "nim": "21224075",
    "phone": "+6282119393893",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rafliano Putra Purnama",
    "nim": "21224067",
    "phone": "+6289525033833",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ariq Ghassan Fadhillah",
    "nim": "21224047",
    "phone": "+6285795196508",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Muhammad Rizqi Ramadhani",
    "nim": "21224174",
    "phone": "+628995125554",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "AMPRI PRINGGO W",
    "nim": "21224052",
    "phone": "+6282258665540",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ahmad Faisal",
    "nim": "21224049",
    "phone": "+6283851785523",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ailsha Azka SN",
    "nim": "21224062",
    "phone": "+6288706317498",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Fani Andini",
    "nim": "21224043",
    "phone": "+6282318183722",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Sukma Cahaya M",
    "nim": "21224066",
    "phone": "+6288220934370",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Maylia Kristiviani S",
    "nim": "21224068",
    "phone": "+6282319283427",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Willyam Immanuel",
    "nim": "21224051",
    "phone": "+62857975191",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Annisa Rafa",
    "nim": "21224082",
    "phone": "+6285863001647",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Azwal Dimas",
    "nim": "21224071",
    "phone": "+6283156658230",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rafli Nugroho",
    "nim": "21224069",
    "phone": "",
    "group": "Kelompok 2 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "NAZWAIASHA ASYURA",
    "nim": "21224169",
    "phone": "+6283116984764",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Dewan Noel Jonatan S",
    "nim": "21224110",
    "phone": "+6281282645771",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Didan Nugraha",
    "nim": "21224085",
    "phone": "+6281224153036",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Najma Mutiara Jasmine",
    "nim": "21224115",
    "phone": "+62881022832251",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Olivia Pebrianti Sihombing",
    "nim": "21224120",
    "phone": "+6287827619437",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Litan Mardian Saparini",
    "nim": "21224177",
    "phone": "+6283148289991",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Sianipar Rianti Debora",
    "nim": "21224121",
    "phone": "+62‪087711796723‬",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rosinta Hutauruk",
    "nim": "21224090",
    "phone": "+6282120844233",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Dea Syafira",
    "nim": "21224122",
    "phone": "+6287717192033",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Desi Rahmawati",
    "nim": "21224107",
    "phone": "+6282111139288",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "ghevania ramadhani",
    "nim": "21224096",
    "phone": "+6285703177882",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Suci Alpi Yanti",
    "nim": "21224100",
    "phone": "+6289507903585",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Nabila Cecillia Putri",
    "nim": "21224124",
    "phone": "+6282353630640",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Nabilul Kafi",
    "nim": "21224112",
    "phone": "+6285189951112",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Melly Amelia",
    "nim": "21224118",
    "phone": "+6281311800184",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "FERDI RIZKY RAMADHAN",
    "nim": "21224101",
    "phone": "+6281220625671",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Andhika Putra",
    "nim": "21224117",
    "phone": "+6282240299206",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Muhammad Faiz Gunawan",
    "nim": "21224087",
    "phone": "+6281293136429",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Natasha Greciella Rahma Zahira",
    "nim": "21224106",
    "phone": "+6289678280308",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Reihan Razaka Permana",
    "nim": "21224092",
    "phone": "+6287717798568",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Hafidz Dwi Putra",
    "nim": "21224111",
    "phone": "+6281462216348",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Vallent Ferdinand",
    "nim": "21224167",
    "phone": "+6287715776714",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Abyan putra",
    "nim": "21224109",
    "phone": "+6282116321702",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "DIMAS ABIMANYU",
    "nim": "21224094",
    "phone": "+6282176610429",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Lutfi Bahtiar",
    "nim": "21224104",
    "phone": "+6283165567309",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Fira sabrina setiawan putri",
    "nim": "21224091",
    "phone": "+6285351014171",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Varel Yosephin",
    "nim": "21224099",
    "phone": "+6283101438384",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Marcellino Gerrard",
    "nim": "21224093",
    "phone": "+62895422514414",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Imanuel Steven Djauhari",
    "nim": "21224089",
    "phone": "+6285945315016",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ananda Daffa Fauzan Hendayana",
    "nim": "21224097",
    "phone": "+6285624036958",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Farrel Aulia daniswara",
    "nim": "21222088",
    "phone": "+6281547620005",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Wanda Shaumia Muthmainnah",
    "nim": "21224113",
    "phone": "+6289604552149",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Trimay sarah",
    "nim": "21224095",
    "phone": "+628131675694",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Adinda Aulia",
    "nim": "21224084",
    "phone": "+6289517043643",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Robyansyah",
    "nim": "21224116",
    "phone": "+6282297452725",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Fadhil Ghoufar",
    "nim": "21224168",
    "phone": "+6285755985220",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Nayla Irdiana Pratiwi",
    "nim": "21224108",
    "phone": "+6281224533255",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Alfira Ramadhaniar Diniyati",
    "nim": "21224123",
    "phone": "+6282246474166",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Muhammad Reyhan Abdulgani",
    "nim": "21224119",
    "phone": "+6285692830244",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Tubagus Azman Pauzan",
    "nim": "21224098",
    "phone": "+6285155375885",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Fadhilah Aisya Nabila",
    "nim": "21224088",
    "phone": "+6281276236978",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "AKBAR",
    "nim": "21224114",
    "phone": "+6285757487725",
    "group": "Kelompok 3 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "NABIL RAHMA PUTRA SUHENDI",
    "nim": "21224903",
    "phone": "+6281775467166",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ahmad Morenno suliawan",
    "nim": "21224148",
    "phone": "+6281293072550",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ester Hasianna",
    "nim": "21224146",
    "phone": "+6282219556950",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Bellamida amanda putri",
    "nim": "21224158",
    "phone": "+6281372526217",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "YESSIKA VITRIA WATI",
    "nim": "21224157",
    "phone": "+6285654051690",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ilyas daud sirojul huda",
    "nim": "21224149",
    "phone": "+6281394934993",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "JAENUDIN SOPIYAN SANI",
    "nim": "21224170",
    "phone": "+6283874417569",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "bani haykal permana",
    "nim": "21224142",
    "phone": "+6283824585228",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "RAYHAN DEANCARINDA SUPARDI",
    "nim": "21224132",
    "phone": "+6281931712757",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Naufal Rabani",
    "nim": "21224153",
    "phone": "+6285934462167",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Launa Shafa Nadira",
    "nim": "21224145",
    "phone": "+6282128014219",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Shofia Afiyatunnisa",
    "nim": "21224171",
    "phone": "+6289636456272",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "NUR SYIFA MARYAM",
    "nim": "21224143",
    "phone": "+6282126490757",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Hasna Putri Fadhilah",
    "nim": "21224138",
    "phone": "+62881022108729",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Rafly Isyandie",
    "nim": "21224140",
    "phone": "+6282246461248",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "janet nur afifah",
    "nim": "21224152",
    "phone": "+62881023218517",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ajeng Eka Rahmawati",
    "nim": "21224154",
    "phone": "+62895703172150",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Najhani Farhatani Ats Tsaniyah",
    "nim": "21224144",
    "phone": "+6282126329827",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Sofie Aprilia Putri",
    "nim": "21224151",
    "phone": "+6285722573334",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Zahra Akhrian Widiani",
    "nim": "21224125",
    "phone": "+62895338661228",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Raji Rafsanjani",
    "nim": "21224155",
    "phone": "+6285722401125",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ajang Gunawan",
    "nim": "21224130",
    "phone": "+6281292690092",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Septian Muhammad Saputra",
    "nim": "21224134",
    "phone": "+6282218910613",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "bintang syahruuramadhan",
    "nim": "21224137",
    "phone": "+6281214421750",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Nayla Malva Manika",
    "nim": "21224128",
    "phone": "+6287735522636",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Meisya Triphosa",
    "nim": "21224129",
    "phone": "+6285862845702",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Revitha Lestari",
    "nim": "21224160",
    "phone": "+6281224793817",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Vira Nazwa Rianti",
    "nim": "21224136",
    "phone": "+6285603679106",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ghaida Nur Qolbi",
    "nim": "21224172",
    "phone": "+6281220084181",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Vanka Aulia Alfanda",
    "nim": "21224135",
    "phone": "+6282120101043",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Enjel Cheriyl Ruitha",
    "nim": "21224150",
    "phone": "+6285759336603",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "DIKI HERDIANA",
    "nim": "21224133",
    "phone": "+6285864421367",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "HAGIA SOPHIA PUTRI SHANDY",
    "nim": "21224126",
    "phone": "+6281285394545",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Lexa Indriyani Sitorus",
    "nim": "21224127",
    "phone": "+6285212928423",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Muhammad Ihsan Muttaqien",
    "nim": "21224802",
    "phone": "+6282219910112",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "ARVIA ARDHIVA MAHARANI",
    "nim": "21224141",
    "phone": "+62882002534835",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "Ajeng Nur Fatimah",
    "nim": "21224161",
    "phone": "+6282262872564",
    "group": "Kelompok 4 Dago",
    "prodi": "Manajemen S1"
  },
  {
    "name": "PAGUH SANTOSO",
    "nim": "10420053",
    "phone": "+6285283427117",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Steven Cornelius",
    "nim": "51923209",
    "phone": "+6282215880071",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "Dewi Handayani",
    "nim": "31624009",
    "phone": "+62895622055669",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "Harun arrosyd",
    "nim": "10524003",
    "phone": "+6281809679880",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Hana Husniyah",
    "nim": "63824012",
    "phone": "+6282130567689",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Ahmad Faiz arfan",
    "nim": "10323009",
    "phone": "+6282360763837",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "Raja Maudia Farhan",
    "nim": "13022002",
    "phone": "+6281276746732",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Ananda Fityan Syakur",
    "nim": "10123024",
    "phone": "+6283159700340",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Arif Hardyansyah",
    "nim": "10123042",
    "phone": "+6281235533185",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Tias Nurrohman Hidayat",
    "nim": "10123053",
    "phone": "+6281383827707",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Maulana Saputra",
    "nim": "10123064",
    "phone": "+6288222143008",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Mufti Alhamdani",
    "nim": "10123080",
    "phone": "+6285199218729",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Randy Fawwaz Aditya",
    "nim": "10123106",
    "phone": "+6285718105773",
    "group": "Kelompok 1 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Subhan Kurnia Rohman",
    "nim": "21124038",
    "phone": "+6289675367080",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Naufal Nashshar Fahlevy",
    "nim": "10423026",
    "phone": "+628882340292",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Mochammad Mujib Abdillah",
    "nim": "44324064",
    "phone": "+6282130925558",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Siti Selma Artanti",
    "nim": "41824064",
    "phone": "+6282120971897",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Muhammad ervan daffa wardana",
    "nim": "10523072",
    "phone": "+6283839706455",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Septian muqtiyana",
    "nim": "10523161",
    "phone": "+6285117604737",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Aldha Febriyani",
    "nim": "10524011",
    "phone": "+6281292888274",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Nabil Al-Ghifari",
    "nim": "63824016",
    "phone": "+6289612144030",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Rahil Septian",
    "nim": "10323018",
    "phone": "+6283821737676",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "Muhammad Murfid Nurhadi",
    "nim": "10123014",
    "phone": "+6281394784696",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rizky Nugraha Kadar",
    "nim": "10123039",
    "phone": "+628983743989",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Fikri Taufiqurrahman Suryaman",
    "nim": "10123044",
    "phone": "+6281770459643",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Yusuf Ardiansyah",
    "nim": "10123056",
    "phone": "+6281221999138",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Surya Muhammad Atallah",
    "nim": "10123065",
    "phone": "+6281221610620",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rangga Arya Daffa Putra Kusdiana",
    "nim": "10123081",
    "phone": "+6281224026414",
    "group": "Kelompok 2 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Fakhry Arief Rahman",
    "nim": "11024006",
    "phone": "+6283111296074",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "D3 Akuntansi (Komputerisasi Akuntansi)"
  },
  {
    "name": "ArbyAzhali",
    "nim": "52124001",
    "phone": "+6282215325293",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "D3 Desain Grafis"
  },
  {
    "name": "Nauval Dzikri Gofari",
    "nim": "44324041",
    "phone": "+6283896685944",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Khansa Zulfa Nurhaibah",
    "nim": "41823074",
    "phone": "+6285794226717",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Muhammad Ikram Fathan Yasmkn",
    "nim": "10523076",
    "phone": "+6285872214755",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Sucipto Makalalag",
    "nim": "10523193",
    "phone": "+62895806307527",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Alif Muhammad Rama Jungjunan",
    "nim": "10924003",
    "phone": "+6283190777713",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "D3 Manajemen Informatika"
  },
  {
    "name": "Kautsar Akbar Rasyi",
    "nim": "10224007",
    "phone": "+6281382278042",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Sistem Komputer"
  },
  {
    "name": "ilham fathurrahman",
    "nim": "13022018",
    "phone": "+6285624208958",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Yoan Ready Syavera",
    "nim": "10123015",
    "phone": "+6281953171433",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rikza Danan Irdian",
    "nim": "10123040",
    "phone": "+6282123419510",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Adira Radzan Badriana",
    "nim": "10123047",
    "phone": "+6281221909802",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Rifqi Adiyuwana",
    "nim": "10123057",
    "phone": "+6281210820209",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Tongku Nevin Federico",
    "nim": "10123073",
    "phone": "+6282368036106",
    "group": "Kelompok 3 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Farhan Ramadhan Riyadhul Hanan",
    "nim": "10422038",
    "phone": "+6287747934281",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Okan Dwi Ramdani",
    "nim": "52024013",
    "phone": "+6289699945266",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Desain Interior"
  },
  {
    "name": "Chandra Nur Mulyani",
    "nim": "31624019",
    "phone": "+62895338789991",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "Najwa Intan Putri Permata",
    "nim": "41823031",
    "phone": "+6281298102636",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Febrian Ardianto",
    "nim": "10524002",
    "phone": "+6285846221380",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Naqiyya Ufaira",
    "nim": "63724011",
    "phone": "+62895326526550",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Sastra Inggris"
  },
  {
    "name": "Rafi Madani",
    "nim": "10224020",
    "phone": "+6281546894967",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Sistem Komputer"
  },
  {
    "name": "Argi Hasya Prasetya",
    "nim": "13124005",
    "phone": "+6283813319980",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "mitsaal sallih",
    "nim": "13022009",
    "phone": "+6282117244607",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Muhammad Rizki Aliansyah",
    "nim": "10123041",
    "phone": "+6287829623083",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Nur Ain Salimah",
    "nim": "10123049",
    "phone": "+6283133926574",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Wa Ode Syahwa Salsabilah",
    "nim": "10123062",
    "phone": "+6281290808347",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Dani Nurhalim",
    "nim": "10123076",
    "phone": "+6287817066930",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Fikri Faizul Haq",
    "nim": "10124114",
    "phone": "+6289526490236",
    "group": "Kelompok 4 Lebak Gede",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Nita Triana",
    "nim": "21124802",
    "phone": "+6283143224685",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Habib sidiq mauluddin",
    "nim": "10421023",
    "phone": "+6282125725966",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Nabil Makarim",
    "nim": "44324026",
    "phone": "+6281253638240",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "kayla zahra",
    "nim": "41824054",
    "phone": "+6282128111807",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Zelgi Raidansyah",
    "nim": "10524032",
    "phone": "+6281286174969",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "ANIS WIDYA",
    "nim": "10524056",
    "phone": "+6282120468245",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Rizki Firmansyah",
    "nim": "10923007",
    "phone": "+6283197727852",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "D3 Manajemen Informatika"
  },
  {
    "name": "ADEN ADHYAKSA WASTIKA",
    "nim": "10224011",
    "phone": "+6283835782323",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Sistem Komputer"
  },
  {
    "name": "Muhammad Adnan Firmansyah",
    "nim": "13124010",
    "phone": "+6289687976529",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Davy Pardomuan",
    "nim": "13022008",
    "phone": "+6281222761737",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Muhammad Zaidan Azhari",
    "nim": "10123136",
    "phone": "+6285624709908",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Benyamin Benedecthus Nikolaus Maryen",
    "nim": "10123239",
    "phone": "+6285782116995",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Achmad Chasanuddin",
    "nim": "10123367",
    "phone": "+6281461173586",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Denish Kafaulloh Arasyid",
    "nim": "10123433",
    "phone": "+6283892668197",
    "group": "Kelompok 1 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Haifa Afina",
    "nim": "10123415",
    "phone": "+6281293357879",
    "group": "Kelompok 1 Sekeloa",
    "prodi": ""
  },
  {
    "name": "Akmal Al Jihad",
    "nim": "21124808",
    "phone": "+6285182327492",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Fahmi syahrul romdhoni",
    "nim": "10421060",
    "phone": "+6289527237309",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Nur Shalehatun Nisa",
    "nim": "44324015",
    "phone": "+6285220590156",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Alya Rachel",
    "nim": "41822157",
    "phone": "+6281312923808",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Raka Bintang Syahputra",
    "nim": "10524034",
    "phone": "+6281297531268",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Lucky Lazuardi",
    "nim": "10524057",
    "phone": "+6281314692013",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "ADINDA DWI ZALKIA",
    "nim": "63724014",
    "phone": "+6282127617060",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Sastra Inggris"
  },
  {
    "name": "Maulana Rimba Zhansasi Anugrah",
    "nim": "13025031",
    "phone": "+6289607789635",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Idin Naufal Hakim",
    "nim": "10123157",
    "phone": "+6282119678835",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Ananda Fadhilah Putra",
    "nim": "10123328",
    "phone": "+6281320387478",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Satria Jalalludin",
    "nim": "10123373",
    "phone": "+62895707867060",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Mochamad Syabill Putra Ramadhan",
    "nim": "10123436",
    "phone": "+6283173277565",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Reyhan Pratama",
    "nim": "10124058",
    "phone": "+6289527514308",
    "group": "Kelompok 2 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Viki Ayu Armaita",
    "nim": "21124806",
    "phone": "+6287821641891",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Mohammad farhan Alif Akbar",
    "nim": "51924064",
    "phone": "+6281223532154",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "Esmenia Maria Ximenes Pereira",
    "nim": "31624015",
    "phone": "+6285862005434",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "Vernanda Zahra Nurrachman",
    "nim": "41824058",
    "phone": "+6285798428562",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Muhammad Farhan Rasyad",
    "nim": "10524035",
    "phone": "+6282217891422",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Ramzi Fitrah",
    "nim": "10524063",
    "phone": "+6287887851769",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Moch. Fadzar Wahiddin",
    "nim": "63823036",
    "phone": "+628813083287",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Muhammad Raihan Nur Yusup",
    "nim": "13124016",
    "phone": "+6288223220280",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Muhammad Irfan Fadhilah",
    "nim": "10324009",
    "phone": "+6285775011750",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "Salman Alfarizzi",
    "nim": "13022019",
    "phone": "+6285641638629",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Aldo Revaldo",
    "nim": "10123163",
    "phone": "+6281321250689",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muthia Andini",
    "nim": "10123345",
    "phone": "+6288270987096",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Abdul Mujib Mubarok",
    "nim": "10123385",
    "phone": "+6283169942795",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Nazriel Alfarizi",
    "nim": "10123442",
    "phone": "+6289508900031",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Bilal",
    "nim": "10124060",
    "phone": "+62895412955532",
    "group": "Kelompok 3 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Ghazwan Rifat Al-Faris",
    "nim": "11024013",
    "phone": "+6285642178320",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "D3 Akuntansi (Komputerisasi Akuntansi)"
  },
  {
    "name": "REIHAN RENALDI",
    "nim": "52024009",
    "phone": "+6281398458958",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Desain Interior"
  },
  {
    "name": "Dean Amando Mendrofa",
    "nim": "31624001",
    "phone": "+6282294699273",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "Ferdinan Pasaribu",
    "nim": "41724008",
    "phone": "+6281919966556",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Ilmu Pemerintahan"
  },
  {
    "name": "Ahmad Suud Huzaemi",
    "nim": "10524048",
    "phone": "+6281297531268",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Danus Rosan",
    "nim": "10524065",
    "phone": "+6283153709000",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Neval melyuko soedarmasto",
    "nim": "63824025",
    "phone": "+6281319699159",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Surya Willy Syahputra",
    "nim": "13124007",
    "phone": "+6287880854805",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Cepi Muhamad Faisal",
    "nim": "10323023",
    "phone": "+6282118217775",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "Restu Harry Lugina",
    "nim": "13022016",
    "phone": "+6285624049306",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Muhammad Fathan Fadilah Ihsan",
    "nim": "10123217",
    "phone": "+6281906589606",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Raditya Reskyananta Saputra",
    "nim": "10123255",
    "phone": "+6281223189894",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Desta Adi Nugraha",
    "nim": "10123353",
    "phone": "+6285524435339",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Farhan Nawwafal Pramudia",
    "nim": "10123470",
    "phone": "+6282336702004",
    "group": "Kelompok 4 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "SAN DIVANTRI SINAGA",
    "nim": "10423024",
    "phone": "+6282164092648",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Haifa Azalia Dzulkarnaen",
    "nim": "41823072",
    "phone": "+628996977312",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "AMIRULSAMSU SAN",
    "nim": "10524018",
    "phone": "+6282128790630",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "ALEXA ROCHMAN",
    "nim": "10524050",
    "phone": "+6282120468245",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Ghazwan Jabbar Khairullah",
    "nim": "10524067",
    "phone": "+6282115134061",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Farrel Deryl Herwansyah",
    "nim": "63824026",
    "phone": "+6287771375516",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Doni enda barus",
    "nim": "13124702",
    "phone": "+6281214581208",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Keandra Indraputra",
    "nim": "10824011",
    "phone": "+6282216838241",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "D3 Teknik Komputer"
  },
  {
    "name": "Diaz Garcia Pratama",
    "nim": "10123224",
    "phone": "+6285591331132",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Faris Yuda Putra",
    "nim": "10123357",
    "phone": "+6281313256843",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhamad Alif",
    "nim": "10123421",
    "phone": "+6285893250407",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Reza Alam",
    "nim": "10124052",
    "phone": "+6282217066573",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Egi Nugraha",
    "nim": "10124063",
    "phone": "+6282135183580",
    "group": "Kelompok 5 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Arnold Jaya Daeli",
    "nim": "10423035",
    "phone": "+6281288102229",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Farsha Bilqis NurulHusna",
    "nim": "51924013",
    "phone": "+628882000819146",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "Renata Rufaidah",
    "nim": "44324078",
    "phone": "+62881023654486",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Agung Utama Kusuma",
    "nim": "10524024",
    "phone": "+6281286174969",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Muhamad irsyad fajar",
    "nim": "10524053",
    "phone": "+62895411926401",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Reisya Fricilla Achmad",
    "nim": "10524075",
    "phone": "+6282343456058",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Khairul",
    "nim": "13025027",
    "phone": "+6285765163177",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Dimas Perkasa Agung Putra",
    "nim": "10123133",
    "phone": "+6281222191512",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Hasbi Arsyan Anugrah Firdaus",
    "nim": "10123237",
    "phone": "+6285797040347",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rafael Rangga",
    "nim": "10123265",
    "phone": "+6282113079402",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Iqbal Noor Iskandar",
    "nim": "10123366",
    "phone": "+6289670447000",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Nadhira Aprillia",
    "nim": "10123425",
    "phone": "+628782395724",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Fikri Sofyansyah",
    "nim": "10124045",
    "phone": "+6281313043411",
    "group": "Kelompok 6 Sekeloa",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Edi Junaedi",
    "nim": "10123005",
    "phone": "+62895339601932",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Hizkia Imanuel Edho",
    "nim": "10123020",
    "phone": "+6285624705371",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Irfan Putra Hendari",
    "nim": "10123021",
    "phone": "+6281221515809",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhamad Nauval Pamungkas",
    "nim": "10123022",
    "phone": "+62895330583940",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Fadhil Muhammad Akram",
    "nim": "10523016",
    "phone": "+6281324800622",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Raffi Revanza",
    "nim": "10523036",
    "phone": "+628882285069",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Angga Prasetyo",
    "nim": "21124803",
    "phone": "+6282319759917",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Shafira Nurazizah Baeha",
    "nim": "51923704",
    "phone": "+6285359945775",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "Iqbal Hapidin Febrian",
    "nim": "44324061",
    "phone": "+6289527901171",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Fitri Najla Salsabila",
    "nim": "31624005",
    "phone": "+6282121373288",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "Putri Andini",
    "nim": "41824048",
    "phone": "+6285924808433",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Aulia Zahwa Putri",
    "nim": "63824024",
    "phone": "+6282111146907",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Aufa Fauzan",
    "nim": "63824023",
    "phone": "+6281224821553",
    "group": "Kelompok 1 Lebak Siliwangi",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Rizky Al Farid Hafizh",
    "nim": "10123028",
    "phone": "+6287884667371",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Rizki",
    "nim": "10123030",
    "phone": "+6282121730722",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Naufal Putra Firmansyah",
    "nim": "10123036",
    "phone": "+6282129566829",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhamad Irsad Assopi",
    "nim": "10123038",
    "phone": "+6282315347187",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rimo Saptazi",
    "nim": "10924010",
    "phone": "+6288802293356",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "D3 Manajemen Informatika"
  },
  {
    "name": "Novi Fitriani",
    "nim": "21124804",
    "phone": "+6289658155892",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Muhammad Luthfi Berlian",
    "nim": "52023013",
    "phone": "+6285800135813",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Desain Interior"
  },
  {
    "name": "Lion star sabolo gaho",
    "nim": "41724013",
    "phone": "+6281228906205",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Ilmu Pemerintahan"
  },
  {
    "name": "Fadilah Aulia Rahman",
    "nim": "10422046",
    "phone": "+6287764627819",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Arasya Melandri Winardi",
    "nim": "13024003",
    "phone": "+6289517214700",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Pebi Pitra Rahman",
    "nim": "10223012",
    "phone": "+6283895107436",
    "group": "Kelompok 2 Lebak Siliwangi",
    "prodi": "S1 Sistem Komputer"
  },
  {
    "name": "Fikar wiguna nugraha",
    "nim": "10524005",
    "phone": "+6283805225393",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Sistem Informasi"
  },
  {
    "name": "Rayhana Aqila Gefira",
    "nim": "10524010",
    "phone": "+6281320368738",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Sistem Informasi"
  },
  {
    "name": "Salma Fahrezi",
    "nim": "10223022",
    "phone": "+6285863730151",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Sistem komputer"
  },
  {
    "name": "Hilma Humaeroh",
    "nim": "63724015",
    "phone": "+6288299491714",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "S1 Sastra Inggris"
  },
  {
    "name": "Raffa Muhammed Arridho",
    "nim": "13124012",
    "phone": "+6285723024117",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Teknik Elektro"
  },
  {
    "name": "Naufal Akbar Subarna",
    "nim": "13124023",
    "phone": "+6285722143518",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Teknik Elektro"
  },
  {
    "name": "Widia Rizqi Gusti Amandani",
    "nim": "41824153",
    "phone": "+6283897010513",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Ilmu Komunikasi"
  },
  {
    "name": "Muhamad Azhwar Aji Kurnia",
    "nim": "10324003",
    "phone": "+6289637331211",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Teknik Industri"
  },
  {
    "name": "M. Ilyas Fachrezy Nur'ichsan",
    "nim": "10123027",
    "phone": "+6287798960157",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Teknik Informatika"
  },
  {
    "name": "MUHAMMAD ARKAN GIFARI",
    "nim": "10421028",
    "phone": "+6282126144109",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Teknik Arsitektur"
  },
  {
    "name": "Lidya Anjani",
    "nim": "10624008",
    "phone": "+6287882731641",
    "group": "Kelompok 3 Lebak Siliwangi",
    "prodi": "Teknik Perencanaan Wilayah dan Kota"
  },
  {
    "name": "Anugrah Rizky Agustian",
    "nim": "21124805",
    "phone": "+6289517607195",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Miko Pratama",
    "nim": "10422035",
    "phone": "+6283802480630",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Zhanifa Meluna Fatiha",
    "nim": "44324071",
    "phone": "+6285715546672",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "RIZKI ADITIA RIFALDI",
    "nim": "41724012",
    "phone": "+6281574454957",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Ilmu Pemerintahan"
  },
  {
    "name": "Muhammad Hafidz Zidan Sukri",
    "nim": "10524132",
    "phone": "+6281586336263",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "muhammad dafa ikhlashul amal",
    "nim": "10923004",
    "phone": "+6282217417415",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "D3 Manajemen Informatika"
  },
  {
    "name": "RIZKI SAPUTRA",
    "nim": "10324013",
    "phone": "+6281312658717",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "faisal syahrul gufron",
    "nim": "13024009",
    "phone": "+6285174230539",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Khoirunnisa Arpandi",
    "nim": "10124157",
    "phone": "+6282280795516",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Malfin Jaffan Inggil Waskito",
    "nim": "10124225",
    "phone": "+62895606173928",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Asep Saepul",
    "nim": "10124324",
    "phone": "+6282315261498",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Ihsan",
    "nim": "10124384",
    "phone": "+6285718158861",
    "group": "Kelompok 1 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "diaz mahram",
    "nim": "10423032",
    "phone": "+6287786555511",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "zazkya bunga pratiwi",
    "nim": "31624018",
    "phone": "+6282130120101",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "SITI MARYAM HOPIYAH",
    "nim": "10524112",
    "phone": "+6285295275593",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Furqon potabuga",
    "nim": "10524134",
    "phone": "+6285706204879",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "GHAZIALGHIFARI",
    "nim": "10624005",
    "phone": "+6285830402767",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Teknik PWK"
  },
  {
    "name": "Moch. Zaini Miftah",
    "nim": "10223002",
    "phone": "+6289516085578",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Sistem Komputer"
  },
  {
    "name": "Ibnu Achsan Taqwim",
    "nim": "10323006",
    "phone": "+62813873873140",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "Arya Yaga Rafi' Azaria",
    "nim": "10124115",
    "phone": "+6281211536756",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Wa Ode Calisyah Anastasya",
    "nim": "10124168",
    "phone": "+6285162992393",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Valyza Safina Zoia Azzura",
    "nim": "10124233",
    "phone": "+6283174565723",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Talitha Vania",
    "nim": "10124333",
    "phone": "+6282278497034",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Diwa",
    "nim": "10124387",
    "phone": "+6285789014173",
    "group": "Kelompok 2 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Dea Michelya Alba",
    "nim": "21124807",
    "phone": "+62881022275815",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Muhammad Rizky Laksana",
    "nim": "10422009",
    "phone": "+6281910596936",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Raka Habibi",
    "nim": "51924029",
    "phone": "+6285183497702",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "cindy mega amelia",
    "nim": "31624006",
    "phone": "+6289655323410",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "Fazlie Mawla Al Ammarik",
    "nim": "10524113",
    "phone": "+6281224110867",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Lisa Putri Maharani",
    "nim": "10524136",
    "phone": "+6285797950518",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Riska Aprilia",
    "nim": "63724017",
    "phone": "+6285862529929",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Sastra Inggris"
  },
  {
    "name": "Addin Ramadhan",
    "nim": "13123015",
    "phone": "+6287774076941",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Rilva Muhammad Akbar",
    "nim": "10323001",
    "phone": "+6283822577218",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "Angga Adhya Pratama",
    "nim": "10124119",
    "phone": "+6289531515716",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Siti Marhamah",
    "nim": "10124175",
    "phone": "+6285199528097",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Regita Setiani",
    "nim": "10124239",
    "phone": "+6281382968508",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Rakha Ikhsan",
    "nim": "10124336",
    "phone": "+6281916460333",
    "group": "Kelompok 3 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Teguh Muhammad Iqbal",
    "nim": "21124018",
    "phone": "+6287834711845",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Rully Aditia Ramadan",
    "nim": "31624012",
    "phone": "+6283897996269",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "SISKA LESTARI",
    "nim": "10524114",
    "phone": "+628217037621",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Deliyanti Aprilia",
    "nim": "10524143",
    "phone": "+6281220917393",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Robi Zoelfahmi",
    "nim": "63824038",
    "phone": "+6285189950361",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Muhammad Tauriq Khairy",
    "nim": "10824010",
    "phone": "+6285156157114",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "D3 Teknik Komputer"
  },
  {
    "name": "Sayyid Putra Ardano",
    "nim": "10124123",
    "phone": "+6281290468757",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Siti Nurhaliza",
    "nim": "10124178",
    "phone": "+6282260923780",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Iviani Gerbian",
    "nim": "10124262",
    "phone": "+6285722574462",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Salma Syarifah Muthi",
    "nim": "10124339",
    "phone": "+62881023359218",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rifki Audzikri Nurwahid",
    "nim": "10124398",
    "phone": "+6282118920881",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Haky Jawwad Al Hakim Effendi",
    "nim": "10124390",
    "phone": "+628996093081",
    "group": "Kelompok 4 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Dhafa bagas nurfaisal",
    "nim": "21124002",
    "phone": "+628176531899",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "Muhammad Syidik Hidayattuloh",
    "nim": "52124002",
    "phone": "+6285295877936",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "D3 Desain Grafis"
  },
  {
    "name": "Khalisa Mugia Rahayu",
    "nim": "51924103",
    "phone": "+6281223993761",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "Afifah Dwi Puspita",
    "nim": "41823078",
    "phone": "+6285722435449",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Nadia Ramadhani Maulana",
    "nim": "10524117",
    "phone": "+6285295275593",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Muhammad Palda Satrio",
    "nim": "10524144",
    "phone": "+6281257320600",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Muzna Mazandarani Sabian",
    "nim": "63824028",
    "phone": "+628814090320",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "REZA APRIANSYAH",
    "nim": "13124019",
    "phone": "+6285951801914",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "MUHAMMAD IHRAM NOOR RASYAD",
    "nim": "13024012",
    "phone": "+6287822897263",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Wildan Madani",
    "nim": "10124129",
    "phone": "+6281323813632",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Genta Nugraha",
    "nim": "10124180",
    "phone": "+6282129647814",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Ginda Nugraha Pratama",
    "nim": "10124274",
    "phone": "+6285925727279",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Akbar Taupiq Alamsyah",
    "nim": "10124341",
    "phone": "+6282320397605",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Dimas Rizki Nugraha",
    "nim": "10124439",
    "phone": "+6282118388672",
    "group": "Kelompok 5 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Adjie Muhammad Iqbal",
    "nim": "11024007",
    "phone": "+6282230884065",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "D3 Akuntansi (Komputerisasi Akuntansi)"
  },
  {
    "name": "Faris Farhan Al Fauzi",
    "nim": "52024015",
    "phone": "+6283107409486",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Desain Interior"
  },
  {
    "name": "Naila Zefanya",
    "nim": "51923096",
    "phone": "+6287875713449",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "Ni Luh Lina Susanti",
    "nim": "41823005",
    "phone": "+6281916667550",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Rifqi Mukhtarullah Azzaki",
    "nim": "10524120",
    "phone": "+6285295275593",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Muhammad Nadhif Fawwaz",
    "nim": "10524145",
    "phone": "+62895806585554",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Sintya Ramadani",
    "nim": "63824039",
    "phone": "+6285640391031",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Mutiara Nurul Hidayah",
    "nim": "13024014",
    "phone": "+6282113741298",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Muhammad Raffi Nurragi",
    "nim": "10124139",
    "phone": "+628812076070",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Febri Kurniawan",
    "nim": "10124189",
    "phone": "+62895355205081",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Zaki Imamul Umam",
    "nim": "10124286",
    "phone": "+6281315150602",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Farhan Farel Nauli Tanjung",
    "nim": "10124347",
    "phone": "+6282277924502",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rd. Fariz Nur Syawaluddin",
    "nim": "10124445",
    "phone": "+6281313509451",
    "group": "Kelompok 6 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Mohammad Agung Arrifai",
    "nim": "21324004",
    "phone": "+6289516171044",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "D3 Akuntansi"
  },
  {
    "name": "Ahmad Rusydan As Shidqi",
    "nim": "52023006",
    "phone": "+6287780786466",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Desain Interior"
  },
  {
    "name": "Aristyan Akhsan",
    "nim": "51923197",
    "phone": "+6282239290335",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "Denara Anindita",
    "nim": "41824169",
    "phone": "+628999235712",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Zahra Orva Lannisa",
    "nim": "10524121",
    "phone": "+6281398147718",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Rindu Syurga",
    "nim": "10524157",
    "phone": "+6283833936383",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Serena Indriani",
    "nim": "63824036",
    "phone": "+6282285017405",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Angga Nugraha",
    "nim": "13124021",
    "phone": "+6282298255474",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Niko Adrian Farizi",
    "nim": "13025028",
    "phone": "+6281384200878",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Rania",
    "nim": "10124196",
    "phone": "+6283126162164",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Farid Maulana Yusuf",
    "nim": "10124288",
    "phone": "+6282223414588",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Raida Layla Safa",
    "nim": "10124349",
    "phone": "+6285523994165",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Arya Bisma Hartono",
    "nim": "10124452",
    "phone": "+6282117279601",
    "group": "Kelompok 7 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "DAVID SETIAWAN",
    "nim": "10423005",
    "phone": "+62895331171595",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Zahira Nandhifa Syifarany",
    "nim": "44324016",
    "phone": "+6287717319320",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Mohammad fiqri rizky permana",
    "nim": "41824056",
    "phone": "+6281903971730",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Anindya Nusa Kalimah Syahadah",
    "nim": "10524123",
    "phone": "+6283142940023",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Renadiya Amelinda",
    "nim": "63824015",
    "phone": "+6287774922001",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Muhammad Fauzi Al-Ghifari",
    "nim": "13124013",
    "phone": "+6287735289557",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Nur Handayani",
    "nim": "13022001",
    "phone": "+6285934587972",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Muhammad Muflih Izdihar",
    "nim": "10124142",
    "phone": "+6282145468148",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Reyga Reynaldi",
    "nim": "10124199",
    "phone": "+6281271927712",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rani Amaliyah",
    "nim": "10124296",
    "phone": "+6285715943251",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Ibda Muhafid Romdoni",
    "nim": "10124350",
    "phone": "+6282262930148",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Salsabila Khoirunnisa",
    "nim": "10124465",
    "phone": "+6285732078194",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Fahrian Ahsan",
    "nim": "21424017",
    "phone": "",
    "group": "Kelompok 8 Sadang Serang",
    "prodi": "D3 Manajemen Pemasaran"
  },
  {
    "name": "ABDUL GOFUR SAEPUDIN",
    "nim": "10421001",
    "phone": "+6282217258956",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Audry Rafi Setiawan",
    "nim": "44324022",
    "phone": "+62895603407311",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Naisya Salsabila",
    "nim": "41824111",
    "phone": "+6282118447939",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Sofia Nur Putri",
    "nim": "10524125",
    "phone": "+6289626360843",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Muhammad Rizqi Amirudin",
    "nim": "10524186",
    "phone": "+6281384336722",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Angga Adittya lrawan",
    "nim": "13123013",
    "phone": "+6283101183602",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Muhammad Raffi Sauki Rifani",
    "nim": "13024020",
    "phone": "+6287819432735",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Alya Rahmawati",
    "nim": "10124143",
    "phone": "+628818239716",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Hafidh Tedi Setiawan",
    "nim": "10124201",
    "phone": "+6289648354570",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Amanda Maretha Putri Lestari",
    "nim": "10124304",
    "phone": "+6281312977873",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Alif Abdul Latif",
    "nim": "10124351",
    "phone": "+6281320317855",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "M Farrel Chandrawijaya",
    "nim": "10124467",
    "phone": "+6281219739130",
    "group": "Kelompok 9 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Rahi Sultani Rohman Roshan",
    "nim": "10422005",
    "phone": "+6285167799326",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Chistya Lamisa Balqis",
    "nim": "44324072",
    "phone": "+6289682326222",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Rivan Kurniawan",
    "nim": "41824141",
    "phone": "+6285211307737",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Javiersa Naufal Algani",
    "nim": "10524127",
    "phone": "+6285294845952",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Robi Nugraha Fadilah",
    "nim": "10524200",
    "phone": "+6285694740755",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Shifa khairiyah",
    "nim": "13024004",
    "phone": "+6288220375399",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Raditya Muhammad Alghifary",
    "nim": "10124150",
    "phone": "+6289509981860",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Ubaidah Akbar",
    "nim": "10124206",
    "phone": "+6285600841390",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Amelia Vega",
    "nim": "10124307",
    "phone": "+6285703723540",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Halki Nurhakim",
    "nim": "10124352",
    "phone": "+62895411964698",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Ernest Tristan Rafael Siringoringo",
    "nim": "10124469",
    "phone": "+6282217849130",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Azzahra Fitri Ramadhanti Sutarso",
    "nim": "51923211",
    "phone": "+6282120233789",
    "group": "Kelompok 10 Sadang Serang",
    "prodi": "S1 Desain Komunikasi Visual"
  },
  {
    "name": "TIAN TARDIANSAH",
    "nim": "10422032",
    "phone": "+6285720301033",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Salma Khaerunissa",
    "nim": "44324018",
    "phone": "+6282130876806",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Reyhan Ahmad Firdaus",
    "nim": "41823003",
    "phone": "+6285175239753",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Selfy Oktapiani Permana",
    "nim": "10524131",
    "phone": "+6287752463618",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Dede Sutarjo",
    "nim": "10524201",
    "phone": "+6285183166183",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Rendy Kusuma",
    "nim": "10223015",
    "phone": "+6285862286700",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Sistem Komputer"
  },
  {
    "name": "Dini Novalia Fitriani",
    "nim": "13024016",
    "phone": "+6283816767482",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Zilky Azriel Ramadhan",
    "nim": "10124151",
    "phone": "+628882347758",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Harits Ramdhani Nugraha",
    "nim": "10124215",
    "phone": "+6281312459367",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Repi Saepul Milah",
    "nim": "10124322",
    "phone": "+6282262403045",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Radja Alkahfi Siregar",
    "nim": "10124354",
    "phone": "+628988248277",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Ragil Yuni Wulandari",
    "nim": "10124707",
    "phone": "+6289524863162",
    "group": "Kelompok 11 Sadang Serang",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Yosan Suparman",
    "nim": "21124020",
    "phone": "+62881022759682",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "ILYAS FATURAHMAN",
    "nim": "10422024",
    "phone": "+6285700669767",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Elga Aulia Zamita Damopolii",
    "nim": "31624002",
    "phone": "+6285954452051",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "Salma Khairunnisa",
    "nim": "41824168",
    "phone": "+6282190465563",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Fauzan Ahmad Dhani",
    "nim": "10524098",
    "phone": "+6285364067510",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Sahrul Muhamad",
    "nim": "10524104",
    "phone": "+6281320357232",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Ameldio Furqon",
    "nim": "10524110",
    "phone": "+628217037621",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Dzaki Ghufron RahmanDanu Putra",
    "nim": "63824011",
    "phone": "+6285710279506",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Bariq Syauqi Fathulloh",
    "nim": "13124018",
    "phone": "+6285724110038",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Azhar Sayyid Ramadhan",
    "nim": "10324025",
    "phone": "+6210324015",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "Risna Dwi Putera",
    "nim": "13024023",
    "phone": "+6285861041608",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Panji Gumilang",
    "nim": "10124071",
    "phone": "+6282126577575",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Andi Muhamad Hakim Ramadhan Mangussara",
    "nim": "10124079",
    "phone": "+6287777081360",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Abdhika Maestra Harmonasora",
    "nim": "10124088",
    "phone": "+6289517832715",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Nico Luthfiano Santoso",
    "nim": "10124096",
    "phone": "+6285795522173",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Faisal Hawari",
    "nim": "10124110",
    "phone": "+6281224017174",
    "group": "Kelompok 1 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Nova fitriana",
    "nim": "21124801",
    "phone": "+62895346193872",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Akuntansi"
  },
  {
    "name": "ANSYARULLAH SYATHIR AL-ZAYTUNI",
    "nim": "10420020",
    "phone": "+6282134330763",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Safira Oktaviani Fathimah",
    "nim": "44324024",
    "phone": "+6287724298110",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Renata Fatricia Oktaviani",
    "nim": "31624010",
    "phone": "+6282126628491",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Ilmu Hukum"
  },
  {
    "name": "Abiyu Ramadhan",
    "nim": "41823004",
    "phone": "+6281315207870",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Nova Tri Hapsari",
    "nim": "10524099",
    "phone": "+6282391069343",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Regan Pradiva Kusuma Wijaya",
    "nim": "10524106",
    "phone": "+6281915331929",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Shandy Putra Pranoto",
    "nim": "10924004",
    "phone": "+628813002848",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "D3 Manajemen Informatika"
  },
  {
    "name": "Ajeng Retno Handayani Wijatmoko",
    "nim": "63824040",
    "phone": "+6283838724468",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Raihan Nur Zahran",
    "nim": "13124031",
    "phone": "+6281318443400",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Nazraansyah",
    "nim": "10324014",
    "phone": "+6287771298254",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Industri"
  },
  {
    "name": "Mochammad Maliki Fadhlan Hasya",
    "nim": "13024019",
    "phone": "+6285189951040",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Excel Al Kautsar",
    "nim": "10124072",
    "phone": "+6285697292897",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Praditya Mahardika Ali A. K.",
    "nim": "10124082",
    "phone": "+6283829920145",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Putrama Rahis Akbar Abdullah",
    "nim": "10124090",
    "phone": "+6281224576473",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "M. Maliq Firdaus",
    "nim": "10124097",
    "phone": "+62895636866796",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Fahrossi Azra",
    "nim": "10124111",
    "phone": "+6282219421703",
    "group": "Kelompok 2 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Oki Ramdani",
    "nim": "11024016",
    "phone": "+6289525438941",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "D3 Akuntansi (Komputerisasi Akuntansi)"
  },
  {
    "name": "Naila Nurfaiza Hasibuan",
    "nim": "52124005",
    "phone": "+6285220183273",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "D3 Desain Grafis"
  },
  {
    "name": "Dame rosalinda gurning",
    "nim": "44324042",
    "phone": "+6289610555335",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Hasna Aliya Romani",
    "nim": "41824073",
    "phone": "+62895377624090",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Musdalifa",
    "nim": "41724004",
    "phone": "+6282347758517",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Ilmu Pemerintahan"
  },
  {
    "name": "Naila Rahma Azzahra",
    "nim": "10524101",
    "phone": "+6281285882506",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Adri Ramadhan",
    "nim": "10524108",
    "phone": "+6281910588356",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Naila hasna huwaida",
    "nim": "63724010",
    "phone": "+6285723401744",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Sastra Inggris"
  },
  {
    "name": "Muhamad Gilang Ramadhan",
    "nim": "13124028",
    "phone": "+6285794439285",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "Azriel Al Khafidz",
    "nim": "10824007",
    "phone": "+628976423365",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "D3 Teknik Komputer"
  },
  {
    "name": "Firjill Shyfazzarqy Cleverst Sampouw",
    "nim": "13024021",
    "phone": "+6283808786513",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Muhammad Rigan Marezka Permana",
    "nim": "10124074",
    "phone": "+6285723785340",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Mochammad Syafiq Eka Prasetyo",
    "nim": "10124085",
    "phone": "+6289662121307",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Farrel Gusti Hakim",
    "nim": "10124094",
    "phone": "+6282115758800",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Lingga Pasya Raifansyah",
    "nim": "10124098",
    "phone": "+6285659876076",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Anna Alicya Padek",
    "nim": "10124112",
    "phone": "+6285399897151",
    "group": "Kelompok 3 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Fidlal Husna Fikri Fuadi",
    "nim": "10420054",
    "phone": "+6282120806607",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Teknik Arsitektur"
  },
  {
    "name": "Eva Natalia Br. Sinurat",
    "nim": "44324038",
    "phone": "+62881023686354",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Hubungan Internasional"
  },
  {
    "name": "Hasanudin Abdullah",
    "nim": "41824063",
    "phone": "+6285624531503",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Ilmu Komunikasi"
  },
  {
    "name": "Aditya Indra Rahman",
    "nim": "10524088",
    "phone": "+6282247445835",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "RHADITH EKA ERLANGGA SHAPUTRA",
    "nim": "10524103",
    "phone": "+6285364067510",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Nayla Thalita Sabrina",
    "nim": "10524109",
    "phone": "+6281312184479",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Sistem Informasi"
  },
  {
    "name": "Ivan Fuziyaman",
    "nim": "63823023",
    "phone": "+6281318416305",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Sastra Jepang"
  },
  {
    "name": "Yusup budiman",
    "nim": "13124022",
    "phone": "+6285559116440",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Teknik Elektro"
  },
  {
    "name": "AGIL",
    "nim": "13024010",
    "phone": "+6281342797309",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Teknik Sipil"
  },
  {
    "name": "Gifari Raya Shahizidan",
    "nim": "10124067",
    "phone": "+6288297202815",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Muhammad Nazib Al Qoys",
    "nim": "10124077",
    "phone": "+6285814411633",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Kayla Yusuf Sumantri",
    "nim": "10124095",
    "phone": "+6281320241715",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  },
  {
    "name": "Defrianif1",
    "nim": "10124107",
    "phone": "+6287744480152",
    "group": "Kelompok 4 Cipaganti",
    "prodi": "S1 Teknik Informatika"
  }
];

async function run() {
  console.log(`🚀 Memulai sinkronisasi ${studentsData.length} Mahasiswa KKN ke Kelompok KKN...`);
  
  const groups = await prisma.kelompokKkn.findMany();
  const groupMap = new Map(groups.map(g => [g.name.toLowerCase().trim(), g.id]));

  let updatedCount = 0;
  let notFoundCount = 0;
  const notFound: { nim: string; name: string; group: string }[] = [];

  for (const s of studentsData) {
    const cleanGroupName = (s.group || "").toLowerCase().trim();
    const groupId = groupMap.get(cleanGroupName);
    if (!groupId) {
      console.warn(`⚠️ Kelompok "${s.group}" tidak ditemukan di database untuk ${s.name}`);
      continue;
    }

    // Cari mahasiswa berdasarkan NIM (prioritas 1), nama (prioritas 2), atau no telepon (prioritas 3)
    let student = null;
    if (s.nim) {
      student = await prisma.studentKkn.findFirst({ where: { nim: s.nim } });
    }
    if (!student && s.name) {
      student = await prisma.studentKkn.findFirst({
        where: { user: { name: { equals: s.name, mode: "insensitive" } } }
      });
    }
    if (!student && s.phone && s.phone.length > 5) {
      student = await prisma.studentKkn.findFirst({
        where: { user: { phone: s.phone } }
      });
    }

    if (student) {
      await prisma.studentKkn.update({
        where: { id: student.id },
        data: {
          kelompokId: groupId,
          ...(s.nim ? { nim: s.nim } : {}),
          ...(s.prodi ? { jurusan: s.prodi } : {})
        }
      });
      updatedCount++;
    } else {
      notFoundCount++;
      notFound.push({ nim: s.nim, name: s.name, group: s.group });
    }
  }

  console.log(`✅ Selesai! Berhasil meng-assign ${updatedCount} dari ${studentsData.length} Mahasiswa KKN.`);
  if (notFoundCount > 0) {
    console.warn(`ℹ️  ${notFoundCount} mahasiswa belum memiliki record akun di DB:`);
    notFound.slice(0, 10).forEach(s => console.warn(`   NIM=${s.nim || "-"} | ${s.name} | Group=${s.group}`));
    if (notFound.length > 10) console.warn(`   ... dan ${notFound.length - 10} lainnya.`);
  }
}

run()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
