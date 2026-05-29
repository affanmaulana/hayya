import { getAppData, saveAppData } from './localStorageUtils';

// 1. MASTER MILESTONES (10 items, 0-5 years)
const MILESTONES = [
  {
    id: 'm1',
    ageMinMonths: 0,
    ageMaxMonths: 3,
    category: 'motorik_kasar',
    description: 'Bisa mengangkat kepala setinggi 45 derajat saat tengkurap',
    stimulationTips: 'Latih Tummy Time sesering mungkin (3-5 kali sehari selama 1-3 menit) sejak lahir saat terjaga.',
    illustrationUrl: '/assets/milestones/motorik-kasar-1.png',
    isCritical: true
  },
  {
    id: 'm2',
    ageMinMonths: 0,
    ageMaxMonths: 3,
    category: 'sosial',
    description: 'Membalas senyuman Bunda ketika diajak bicara atau bercanda',
    stimulationTips: 'Sering tatap mata si kecil, ajak mengobrol dengan ekspresi wajah yang ceria, dan puji ketika dia tersenyum.',
    illustrationUrl: '/assets/milestones/sosial-1.png',
    isCritical: true
  },
  {
    id: 'm3',
    ageMinMonths: 3,
    ageMaxMonths: 6,
    category: 'motorik_kasar',
    description: 'Membalikkan badan dari posisi terlentang ke tengkurap sendiri',
    stimulationTips: 'Letakkan mainan menarik atau cermin di sampingnya saat tengkurap agar memicu usahanya membalikkan badan.',
    illustrationUrl: '/assets/milestones/motorik-kasar-2.png',
    isCritical: true
  },
  {
    id: 'm4',
    ageMinMonths: 3,
    ageMaxMonths: 6,
    category: 'bahasa',
    description: 'Tertawa keras atau mengeluarkan suara gembira ketika diajak bermain',
    stimulationTips: 'Ajak bermain ci-ba-ba, tirukan celotehannya, dan ajak tertawa bersama secara interaktif.',
    illustrationUrl: '/assets/milestones/bahasa-1.png',
    isCritical: false
  },
  {
    id: 'm5',
    ageMinMonths: 6,
    ageMaxMonths: 9,
    category: 'motorik_kasar',
    description: 'Duduk sendiri dengan tegak tanpa dibantu atau disangga bantal',
    stimulationTips: 'Posisikan si kecil duduk di lantai dengan pengawasan, taruh mainan di depannya untuk melatih keseimbangan tangan.',
    illustrationUrl: '/assets/milestones/motorik-kasar-3.png',
    isCritical: true
  },
  {
    id: 'm6',
    ageMinMonths: 6,
    ageMaxMonths: 9,
    category: 'motorik_halus',
    description: 'Memindahkan benda atau mainan dari tangan satu ke tangan yang lain',
    stimulationTips: 'Berikan mainan genggam berukuran aman yang menarik di satu tangan, lalu tawarkan mainan lain agar ia memindahkan mainan pertama.',
    illustrationUrl: '/assets/milestones/motorik-halus-1.png',
    isCritical: false
  },
  {
    id: 'm7',
    ageMinMonths: 9,
    ageMaxMonths: 12,
    category: 'kognitif',
    description: 'Menunjuk benda, mainan, atau gambar yang diinginkannya',
    stimulationTips: 'Sering bacakan buku bergambar besar, tunjuk gambarnya dan sebutkan namanya, lalu tanyakan "Mana gajah, sayang?".',
    illustrationUrl: '/assets/milestones/kognitif-1.png',
    isCritical: true
  },
  {
    id: 'm8',
    ageMinMonths: 9,
    ageMaxMonths: 12,
    category: 'bahasa',
    description: 'Mengucapkan 1-2 kata bermakna spesifik seperti "Mama" atau "Papa"',
    stimulationTips: 'Gunakan kata-kata pendek yang konsisten saat berinteraksi, dan respon celotehannya seolah sedang berdialog.',
    illustrationUrl: '/assets/milestones/bahasa-2.png',
    isCritical: true
  },
  {
    id: 'm9',
    ageMinMonths: 12,
    ageMaxMonths: 18,
    category: 'motorik_kasar',
    description: 'Berjalan beberapa langkah sendiri dengan stabil tanpa berpegangan',
    stimulationTips: 'Posisikan diri Bunda beberapa langkah di depannya dengan tangan terbuka, beri semangat agar si kecil melangkah menuju Bunda.',
    illustrationUrl: '/assets/milestones/motorik-kasar-4.png',
    isCritical: true
  },
  {
    id: 'm10',
    ageMinMonths: 18,
    ageMaxMonths: 24,
    category: 'motorik_halus',
    description: 'Menyusun menara menggunakan 4 buah kubus kecil',
    stimulationTips: 'Sediakan mainan balok susun, beri contoh menyusunnya ke atas, lalu biarkan si kecil mencoba dan merobohkannya kembali.',
    illustrationUrl: '/assets/milestones/motorik-halus-2.png',
    isCritical: false
  }
];

// 2. MASTER VACCINES (12 items, IDAI guidelines)
const VACCINES = [
  {
    id: 'v1',
    name: 'Hepatitis B 0',
    shortName: 'HepB 0',
    description: 'Melindungi bayi dari virus Hepatitis B yang dapat merusak hati secara permanen.',
    recommendedAgeMonths: 0,
    maxAgeMonths: 1,
    doseNumber: 1,
    parentVaccineId: null,
    sideEffectsInfo: 'Nyeri atau kemerahan ringan di bekas suntikan.'
  },
  {
    id: 'v2',
    name: 'BCG',
    shortName: 'BCG',
    description: 'Mencegah penyakit tuberkulosis (TBC) paru berat dan TBC selaput otak.',
    recommendedAgeMonths: 1,
    maxAgeMonths: 3,
    doseNumber: 1,
    parentVaccineId: null,
    sideEffectsInfo: 'Muncul bisul bernanah kecil di lengan setelah 2-6 minggu, yang akan sembuh meninggalkan jaringan parut.'
  },
  {
    id: 'v3',
    name: 'Polio 1',
    shortName: 'Polio 1',
    description: 'Mencegah kelumpuhan permanen pada otot kaki dan pernapasan akibat virus Polio.',
    recommendedAgeMonths: 0,
    maxAgeMonths: 1,
    doseNumber: 1,
    parentVaccineId: null,
    sideEffectsInfo: 'Jarang menimbulkan efek samping. Beberapa bayi rewel ringan.'
  },
  {
    id: 'v4',
    name: 'Polio 2',
    shortName: 'Polio 2',
    description: 'Dosis lanjutan untuk memperkuat kekebalan terhadap virus Polio.',
    recommendedAgeMonths: 2,
    maxAgeMonths: 3,
    doseNumber: 2,
    parentVaccineId: 'v3',
    sideEffectsInfo: 'Sama seperti Polio 1.'
  },
  {
    id: 'v5',
    name: 'DPT-HB-Hib 1',
    shortName: 'DPT-HB-Hib 1',
    description: 'Mencegah Difteri (penyumbatan jalan napas), Pertusis (batuk rejan), Tetanus, Hepatitis B, dan radang otak Meningitis Hib.',
    recommendedAgeMonths: 2,
    maxAgeMonths: 3,
    doseNumber: 1,
    parentVaccineId: null,
    sideEffectsInfo: 'Demam tinggi 1-2 hari, rewel, nyeri dan bengkak di area suntikan.'
  },
  {
    id: 'v6',
    name: 'DPT-HB-Hib 2',
    shortName: 'DPT-HB-Hib 2',
    description: 'Dosis lanjutan vaksin kombinasi DPT-HB-Hib.',
    recommendedAgeMonths: 3,
    maxAgeMonths: 4,
    doseNumber: 2,
    parentVaccineId: 'v5',
    sideEffectsInfo: 'Demam tinggi 1-2 hari, rewel.'
  },
  {
    id: 'v7',
    name: 'DPT-HB-Hib 3',
    shortName: 'DPT-HB-Hib 3',
    description: 'Dosis ketiga vaksin kombinasi DPT-HB-Hib untuk perlindungan dasar lengkap.',
    recommendedAgeMonths: 4,
    maxAgeMonths: 5,
    doseNumber: 3,
    parentVaccineId: 'v6',
    sideEffectsInfo: 'Demam tinggi, bengkak bekas suntikan.'
  },
  {
    id: 'v8',
    name: 'PCV 1',
    shortName: 'PCV 1',
    description: 'Mencegah penyakit radang paru-paru (Pneumonia) dan radang selaput otak akibat bakteri pneumokokus.',
    recommendedAgeMonths: 2,
    maxAgeMonths: 3,
    doseNumber: 1,
    parentVaccineId: null,
    sideEffectsInfo: 'Demam ringan, rewel, kemerahan di area suntikan.'
  },
  {
    id: 'v9',
    name: 'PCV 2',
    shortName: 'PCV 2',
    description: 'Dosis kedua vaksin PCV untuk bayi.',
    recommendedAgeMonths: 3,
    maxAgeMonths: 4,
    doseNumber: 2,
    parentVaccineId: 'v8',
    sideEffectsInfo: 'Demam ringan, nyeri area suntikan.'
  },
  {
    id: 'v10',
    name: 'Rotavirus 1',
    shortName: 'Rotavirus 1',
    description: 'Mencegah diare cair parah akibat infeksi virus Rotavirus yang memicu dehidrasi fatal pada bayi.',
    recommendedAgeMonths: 2,
    maxAgeMonths: 3,
    doseNumber: 1,
    parentVaccineId: null,
    sideEffectsInfo: 'Vaksin tetes mulut. Efek samping sangat minimal, kadang muntah atau diare ringan.'
  },
  {
    id: 'v11',
    name: 'Rotavirus 2',
    shortName: 'Rotavirus 2',
    description: 'Dosis kedua vaksin Rotavirus tetes mulut.',
    recommendedAgeMonths: 4,
    maxAgeMonths: 5,
    doseNumber: 2,
    parentVaccineId: 'v10',
    sideEffectsInfo: 'Jarang ada efek samping.'
  },
  {
    id: 'v12',
    name: 'Campak-Rubella (MR) 1',
    shortName: 'MR 1',
    description: 'Mencegah penyakit campak (memicu pneumonia dan kebutaan) dan rubella (campak Jerman).',
    recommendedAgeMonths: 9,
    maxAgeMonths: 12,
    doseNumber: 1,
    parentVaccineId: null,
    sideEffectsInfo: 'Demam ringan setelah 5-10 hari imunisasi, ruam kemerahan halus yang tidak berbahaya.'
  }
];

// 3. MASTER MPASI RECIPES (15 items, budget level & textures)
const RECIPES = [
  {
    id: 'r1',
    name: 'Bubur Puree Alpukat Manis',
    ageMinMonths: 6,
    ageMaxMonths: 8,
    textureStage: 'puree',
    estimatedCostIdr: 8000,
    ingredients: [
      { name: 'Alpukat Mentega Matang', amount: 0.5, unit: 'buah' },
      { name: 'ASI atau Susu Formula Hangat', amount: 3, unit: 'sdm' }
    ],
    steps: [
      'Kerok daging alpukat mentega yang matang secara higienis.',
      'Saring menggunakan saringan kawat halus atau blender hingga benar-benar lembut.',
      'Campurkan dengan ASI atau sufor hangat untuk menyesuaikan kekentalan lumat bayi.',
      'Sajikan langsung segar (jangan disimpan untuk makan berikutnya).'
    ],
    nutritionInfo: { energi: '130 kkal', lemak: '9 gr', serat: '3 gr' },
    allergens: [],
    mealType: 'breakfast',
    photoUrl: '/assets/recipes/alpukat-puree.png'
  },
  {
    id: 'r2',
    name: 'Bubur Saring Hati Ayam & Wortel',
    ageMinMonths: 6,
    ageMaxMonths: 8,
    textureStage: 'puree',
    estimatedCostIdr: 12000,
    ingredients: [
      { name: 'Beras Putih', amount: 2, unit: 'sdm' },
      { name: 'Hati Ayam Segar', amount: 1, unit: 'potong' },
      { name: 'Wortel Kupas Parut', amount: 1, unit: 'sdm' },
      { name: 'Minyak Kelapa (Lemak Tambahan)', amount: 0.5, unit: 'sdt' }
    ],
    steps: [
      'Cuci bersih beras, hati ayam, dan wortel.',
      'Rebus beras dengan air secukupnya hingga menjadi bubur yang sangat lembek.',
      'Masukkan hati ayam cincang dan wortel parut, masak dengan api kecil hingga matang sempurna.',
      'Masukkan minyak kelapa, aduk merata lalu matikan api.',
      'Saring semua bahan selagi hangat dengan saringan kawat, kerok bagian bawah saringan.',
      'Sajikan dengan kehangatan pas untuk si kecil.'
    ],
    nutritionInfo: { energi: '115 kkal', protein: '6.2 gr', zat_besi: '2.5 mg' },
    allergens: [],
    mealType: 'lunch',
    photoUrl: '/assets/recipes/bubur-hati-ayam.png'
  },
  {
    id: 'r3',
    name: 'Bubur Puree Pepaya & Pisang',
    ageMinMonths: 6,
    ageMaxMonths: 8,
    textureStage: 'puree',
    estimatedCostIdr: 5000,
    ingredients: [
      { name: 'Pepaya Matang Manis', amount: 1, unit: 'potong sedang' },
      { name: 'Pisang Ambon Matang', amount: 0.5, unit: 'buah' }
    ],
    steps: [
      'Kupas buah pepaya, buang bijinya, cuci bersih dengan air matang.',
      'Kupas pisang ambon, ambil bagian daging buahnya.',
      'Haluskan kedua buah secara terpisah atau bersamaan menggunakan saringan halus.',
      'Aduk rata buah halus tersebut dan berikan sebagai selingan makan buah pagi.'
    ],
    nutritionInfo: { energi: '75 kkal', serat: '2 gr', vitamin_c: '45 mg' },
    allergens: [],
    mealType: 'snack',
    photoUrl: '/assets/recipes/puree-pepaya.png'
  },
  {
    id: 'r4',
    name: 'Bubur Lembut Daging Sapi & Bayam',
    ageMinMonths: 8,
    ageMaxMonths: 10,
    textureStage: 'porridge',
    estimatedCostIdr: 18000,
    ingredients: [
      { name: 'Beras Putih', amount: 2, unit: 'sdm' },
      { name: 'Daging Sapi Giling halus', amount: 20, unit: 'gr' },
      { name: 'Daun Bayam Organik cincang', amount: 10, unit: 'lembar' },
      { name: 'Unsalted Butter (UB)', amount: 1, unit: 'sachet kecil' }
    ],
    steps: [
      'Rebus beras giling dengan kaldu sapi rumahan hingga menjadi bubur yang kental lambat mengalir.',
      'Tumis daging sapi giling dengan unsalted butter hingga harum dan matang sempurna.',
      'Masukkan tumisan daging dan bayam cincang ke dalam bubur hangat, masak 3-5 menit.',
      'Ulek ringan atau saring kasar agar bertekstur bubur kental lembut dengan bulir halus.',
      'Sajikan hangat untuk melatih otot mulut mengunyah.'
    ],
    nutritionInfo: { energi: '140 kkal', protein: '7.8 gr', zat_besi: '3.1 mg' },
    allergens: [],
    mealType: 'lunch',
    photoUrl: '/assets/recipes/bubur-daging-bayam.png'
  },
  {
    id: 'r5',
    name: 'Bubur Oats Tempe & Keju',
    ageMinMonths: 8,
    ageMaxMonths: 10,
    textureStage: 'porridge',
    estimatedCostIdr: 10000,
    ingredients: [
      { name: 'Oatmeal Instan / Rolled Oats', amount: 3, unit: 'sdm' },
      { name: 'Tempe Potong Dadu', amount: 2, unit: 'iris kecil' },
      { name: 'Keju Cheddar Parut', amount: 1, unit: 'sdt' },
      { name: 'Susu Formula / ASI hangat', amount: 5, unit: 'sdm' }
    ],
    steps: [
      'Kukus tempe hingga matang empuk, lalu haluskan dengan garpu.',
      'Seduh oatmeal dengan air panas mendidih hingga mengembang kental.',
      'Campurkan oatmeal hangat, tempe lumat, dan parutan keju cheddar.',
      'Tambahkan ASI/sufor untuk melarutkan hingga mencapai tekstur bubur oatmeal kental lumat.'
    ],
    nutritionInfo: { energi: '125 kkal', protein: '5.5 gr', kalsium: '60 mg' },
    allergens: ['susu_sapi'],
    mealType: 'breakfast',
    photoUrl: '/assets/recipes/oat-tempe-keju.png'
  },
  {
    id: 'r6',
    name: 'Nasi Tim Cincang Ayam Brokoli',
    ageMinMonths: 10,
    ageMaxMonths: 12,
    textureStage: 'soft_chunk',
    estimatedCostIdr: 15000,
    ingredients: [
      { name: 'Nasi Putih Lembek', amount: 4, unit: 'sdm' },
      { name: 'Daging Ayam Cincang Kasar', amount: 25, unit: 'gr' },
      { name: 'Brokoli Cincang Halus', amount: 1, unit: 'kuntum kecil' },
      { name: 'Minyak Wijen', amount: 0.5, unit: 'sdt' }
    ],
    steps: [
      'Campurkan nasi lembek dengan kuah kaldu ayam hangat di dalam mangkuk tahan panas.',
      'Tata ayam cincang kasar, brokoli cincang, dan minyak wijen di atas nasi.',
      'Kukus mangkuk tersebut di atas panci kukusan selama 20-30 menit hingga air terserap dan nasi tim menjadi super empuk berair.',
      'Aduk nasi tim hingga tercampur rata, hidangkan hangat tanpa disaring.'
    ],
    nutritionInfo: { energi: '155 kkal', protein: '8 gr' },
    allergens: [],
    mealType: 'dinner',
    photoUrl: '/assets/recipes/nasi-tim-brokoli.png'
  },
  {
    id: 'r7',
    name: 'Nasi Cincang Kakap Labu Kuning',
    ageMinMonths: 10,
    ageMaxMonths: 12,
    textureStage: 'soft_chunk',
    estimatedCostIdr: 20000,
    ingredients: [
      { name: 'Beras Putih', amount: 3, unit: 'sdm' },
      { name: 'Fillet Ikan Kakap cincang', amount: 30, unit: 'gr' },
      { name: 'Labu Kuning Parut', amount: 2, unit: 'sdm' },
      { name: 'Minyak Zaitun (EVOO)', amount: 1, unit: 'sdt' }
    ],
    steps: [
      'Masak beras dan parutan labu kuning dengan air kaldu ikan hingga air menyusut dan nasi sangat lembek/tim kasar.',
      'Masukkan fillet kakap cincang, masak 5-7 menit dengan api kecil hingga ikan berubah warna matang.',
      'Angkat nasi, beri tetesan minyak zaitun EVOO, aduk rata dan sajikan.'
    ],
    nutritionInfo: { energi: '165 kkal', protein: '8.5 gr', omega_3: '120 mg' },
    allergens: ['seafood'],
    mealType: 'lunch',
    photoUrl: '/assets/recipes/nasi-kakap-labu.png'
  },
  {
    id: 'r8',
    name: 'Nasi Goreng Mentega Telur Dadar',
    ageMinMonths: 12,
    ageMaxMonths: 24,
    textureStage: 'family',
    estimatedCostIdr: 9000,
    ingredients: [
      { name: 'Nasi Putih Biasa hangat', amount: 1, unit: 'piring bayi' },
      { name: 'Telur Ayam', amount: 1, unit: 'butir' },
      { name: 'Margarin / Butter leleh', amount: 1, unit: 'sdm' },
      { name: 'Bawang Putih Halus', amount: 0.5, unit: 'sdt' }
    ],
    steps: [
      'Panaskan margarin di wajan, tumis bawang putih hingga layu dan harum.',
      'Masukkan telur, buat orak-arik matang empuk.',
      'Masukkan nasi hangat, aduk merata di atas wajan dengan api sedang selama 2 menit.',
      'Sajikan hangat sebagai menu sarapan pagi praktis berenergi.'
    ],
    nutritionInfo: { energi: '210 kkal', protein: '7.2 gr' },
    allergens: ['telur'],
    mealType: 'breakfast',
    photoUrl: '/assets/recipes/nasgor-mentega.png'
  },
  {
    id: 'r9',
    name: 'Sup Bola Daging Wortel Ceria',
    ageMinMonths: 12,
    ageMaxMonths: 24,
    textureStage: 'family',
    estimatedCostIdr: 22000,
    ingredients: [
      { name: 'Daging Sapi Cincang bulat', amount: 4, unit: 'bola kecil' },
      { name: 'Wortel Potong Bintang', amount: 0.5, unit: 'batang kecil' },
      { name: 'Kentang Kupas Potong Dadu', amount: 0.5, unit: 'buah' },
      { name: 'Bawang Merah & Putih goreng', amount: 1, unit: 'sdt' }
    ],
    steps: [
      'Didihkan air kaldu daging sapi.',
      'Masukkan bola-bola daging sapi empuk, masak hingga mengapung.',
      'Masukkan potongan wortel dan kentang dadu, masak hingga empuk lunak dikunyah balita.',
      'Beri taburan bawang merah dan putih goreng harum, matikan api dan hidangkan dengan kuah hangat segar.'
    ],
    nutritionInfo: { energi: '185 kkal', protein: '9.2 gr' },
    allergens: [],
    mealType: 'dinner',
    photoUrl: '/assets/recipes/sup-bola-daging.png'
  },
  {
    id: 'r10',
    name: 'Perkedel Kentang Ayam Panggang',
    ageMinMonths: 12,
    ageMaxMonths: 24,
    textureStage: 'family',
    estimatedCostIdr: 14000,
    ingredients: [
      { name: 'Kentang Kupas', amount: 1.5, unit: 'buah' },
      { name: 'Daging Ayam Cincang', amount: 20, unit: 'gr' },
      { name: 'Telur Ayam Kocok', amount: 0.5, unit: 'butir' },
      { name: 'Minyak Goreng', amount: 2, unit: 'sdm' }
    ],
    steps: [
      'Potong kentang, goreng hingga matang kecoklatan, lalu haluskan selagi panas.',
      'Campur kentang halus dengan ayam cincang matang dan bumbu bawang.',
      'Bentuk bulat pipih sesuai ukuran genggaman tangan balita.',
      'Celupkan ke kocokan telur hangat, lalu goreng atau panggang hingga matang kuning keemasan.'
    ],
    nutritionInfo: { energi: '135 kkal', protein: '5 gr' },
    allergens: ['telur'],
    mealType: 'snack',
    photoUrl: '/assets/recipes/perkedel-kentang.png'
  },
  {
    id: 'r11',
    name: 'Bubur Halus Pisang Susu',
    ageMinMonths: 6,
    ageMaxMonths: 8,
    textureStage: 'puree',
    estimatedCostIdr: 6000,
    ingredients: [
      { name: 'Pisang Mas / Ambon matang', amount: 1, unit: 'buah' },
      { name: 'ASI hangat / Sufor', amount: 3, unit: 'sdm' }
    ],
    steps: [
      'Haluskan buah pisang dengan saringan.',
      'Campur rata dengan ASI hangat, sajikan hangat.'
    ],
    nutritionInfo: { energi: '80 kkal', protein: '1.2 gr' },
    allergens: [],
    mealType: 'snack',
    photoUrl: '/assets/recipes/puree-pisang.png'
  },
  {
    id: 'r12',
    name: 'Bubur Saring Salmon Labu',
    ageMinMonths: 6,
    ageMaxMonths: 8,
    textureStage: 'puree',
    estimatedCostIdr: 25000,
    ingredients: [
      { name: 'Fillet Salmon Segar', amount: 20, unit: 'gr' },
      { name: 'Labu Kuning Kukus', amount: 2, unit: 'sdm' },
      { name: 'Beras Putih', amount: 2, unit: 'sdm' }
    ],
    steps: [
      'Rebus beras putih dan labu kuning hingga lembek.',
      'Tambahkan ikan salmon cincang, masak hingga salmon matang.',
      'Saring halus dengan kawat, kerok sisa saringan, sajikan hangat.'
    ],
    nutritionInfo: { energi: '150 kkal', protein: '8.5 gr', omega_3: '180 mg' },
    allergens: ['seafood'],
    mealType: 'dinner',
    photoUrl: '/assets/recipes/bubur-salmon-labu.png'
  },
  {
    id: 'r13',
    name: 'Nasi Tim Daging Cincang Tahu',
    ageMinMonths: 10,
    ageMaxMonths: 12,
    textureStage: 'soft_chunk',
    estimatedCostIdr: 16000,
    ingredients: [
      { name: 'Nasi Lembek', amount: 4, unit: 'sdm' },
      { name: 'Daging Sapi cincang halus', amount: 20, unit: 'gr' },
      { name: 'Tahu Putih Lembut hancur', amount: 1, unit: 'kotak kecil' }
    ],
    steps: [
      'Campur semua bahan di dalam mangkuk aluminium.',
      'Kukus hingga matang tim empuk dan berkaldu, hidangkan hangat.'
    ],
    nutritionInfo: { energi: '160 kkal', protein: '8.2 gr' },
    allergens: ['kedelai'],
    mealType: 'lunch',
    photoUrl: '/assets/recipes/nasi-tim-tahu.png'
  },
  {
    id: 'r14',
    name: 'Pancake Pisang Ceria',
    ageMinMonths: 12,
    ageMaxMonths: 24,
    textureStage: 'family',
    estimatedCostIdr: 10000,
    ingredients: [
      { name: 'Tepung Terigu', amount: 3, unit: 'sdm' },
      { name: 'Pisang Halus', amount: 1, unit: 'buah' },
      { name: 'Telur Ayam Kocok', amount: 1, unit: 'butir' }
    ],
    steps: [
      'Campur pisang lumat, tepung terigu, dan kocokan telur dadar.',
      'Panggang di teflon anti lengket dengan sedikit mentega hingga matang coklat keemasan.'
    ],
    nutritionInfo: { energi: '170 kkal', protein: '6 gr' },
    allergens: ['telur', 'gandum'],
    mealType: 'snack',
    photoUrl: '/assets/recipes/pancake-pisang.png'
  },
  {
    id: 'r15',
    name: 'Sup Krim Kentang Ayam Keju',
    ageMinMonths: 12,
    ageMaxMonths: 24,
    textureStage: 'family',
    estimatedCostIdr: 24000,
    ingredients: [
      { name: 'Kentang Halus kukus', amount: 1, unit: 'buah' },
      { name: 'Ayam Suwir Cincang', amount: 25, unit: 'gr' },
      { name: 'Keju parut & Susu cair', amount: 0.5, unit: 'gelas' }
    ],
    steps: [
      'Tumis ayam dengan margarin.',
      'Masukkan kentang lumat dan susu cair hangat, masak hingga mendidih.',
      'Beri parutan keju melimpah gurih, angkat dan sajikan hangat.'
    ],
    nutritionInfo: { energi: '210 kkal', protein: '8.8 gr' },
    allergens: ['susu_sapi'],
    mealType: 'dinner',
    photoUrl: '/assets/recipes/sup-krim-kentang.png'
  }
];

// 4. MASTER DISEASES (5 items)
const DISEASES = [
  {
    id: 'd1',
    name: 'Demam Biasa',
    medicalName: 'Febris Akut',
    description: 'Kenaikan suhu tubuh anak di atas batas normal (> 37.5 derajat Celcius). Biasanya merupakan reaksi imun alami tubuh dalam melawan infeksi virus ringan.',
    commonSymptoms: ['Suhu tubuh > 37.5°C', 'Badan hangat', 'Anak rewel', 'Nafsu makan menurun'],
    causes: 'Respon normal tubuh terhadap infeksi virus musiman, flu ringan, atau paska imunisasi.',
    homeRemedies: 'Beri kompres hangat di dahi, lipatan ketiak, dan lipatan paha. Pakaikan baju yang tipis, longgar, dan menyerap keringat. Beri banyak cairan seperti ASI hangat, air putih hangat, atau sup.',
    recommendedMeds: ['Paracetamol sirup khusus anak (sesuaikan dosis berat badan)'],
    warningSigns: ['Suhu tubuh naik cepat > 39°C', 'Anak mengalami kejang demam', 'Lemas ekstrem tidak mau menyusu atau minum', 'Muntah terus menerus'],
    urgencyDefault: 'doctor'
  },
  {
    id: 'd2',
    name: 'Diare Ringan',
    medicalName: 'Gastroenteritis Ringan',
    description: 'BAB cair dengan konsistensi lembek hingga cair dengan frekuensi lebih sering dari biasanya (lebih dari 3 kali sehari).',
    commonSymptoms: ['BAB cair > 3 kali sehari', 'Sakit perut/kram', 'Rewel', 'Kembung'],
    causes: 'Infeksi Rotavirus, alergi makanan, susu formula tidak cocok, atau kebersihan tangan dan alat makan kurang terjaga.',
    homeRemedies: 'Beri larutan Oralit khusus bayi/anak setiap kali habis BAB cair untuk mencegah dehidrasi. Teruskan pemberian ASI sesering mungkin.',
    recommendedMeds: ['Suplemen Zink sirup (wajib diminum 10 hari berturut-turut meskipun diare sudah mampet)'],
    warningSigns: ['Tanda dehidrasi sedang/berat: ubun-ubun cekung, mata cekung, tidak keluar air mata saat menangis, air seni pekat atau tidak pipis > 6 jam', 'Tinja bercampur darah atau lendir merah', 'Diare tidak membaik setelah 3 hari'],
    urgencyDefault: 'doctor'
  },
  {
    id: 'd3',
    name: 'Batuk Pilek (Common Cold)',
    medicalName: 'Infeksi Saluran Pernapasan Akut Ringan',
    description: 'Infeksi saluran pernapasan bagian atas akibat virus ringan, menyebabkan penumpukan dahak dan bersin.',
    commonSymptoms: ['Hidung tersumbat/meler', 'Batuk berdahak atau kering', 'Bersin-bersin', 'Suara serak'],
    causes: 'Infeksi Rhinovirus ringan yang menyebar di udara bebas.',
    homeRemedies: 'Beri ASI hangat secara teratur. Hirup uap air hangat suam kuku yang ditetesi minyak telon di ruangan aman. Bersihkan sumbatan lendir hidung bayi secara lembut.',
    recommendedMeds: ['Tetes hidung NaCl fisiologis / saline steril untuk mengencerkan ingus'],
    warningSigns: ['Napas cepat (sesak napas)', 'Terdengar tarikan dinding dada ke dalam saat menarik napas', 'Bibir atau ujung kuku kebiruan', 'Napas berbunyi mengi (wheezing) atau ngorok keras'],
    urgencyDefault: 'home'
  },
  {
    id: 'd4',
    name: 'Muntah Ringan',
    medicalName: 'Muntah Non-Spesifik',
    description: 'Pengeluaran isi lambung melalui mulut. Berbeda dengan gumoh yang mengalir santai, muntah menyembur kuat dipicu kontraksi perut.',
    commonSymptoms: ['Muntah cairan atau makanan', 'Mual', 'Keringat dingin', 'Lemas pasca muntah'],
    causes: 'Lambung sensitif setelah makan berlebih, mabuk perjalanan, masuk angin, atau gastritis ringan.',
    homeRemedies: 'Istirahatkan lambung balita selama 30-60 menit setelah muntah (jangan diberi makan/minum dulu). Berikan larutan Oralit atau ASI menggunakan sendok teh kecil demi sedikit (1-2 sendok tiap 10 menit) secara perlahan setelah lambung tenang.',
    recommendedMeds: ['Cairan rehidrasi oral (Oralit)'],
    warningSigns: ['Muntah menyembur berwarna hijau kehijauan (indikasi sumbatan usus)', 'Tidak ada cairan yang bisa masuk sama sekali selama 4 jam berturut-turut', 'Disertai demam tinggi atau diare berat'],
    urgencyDefault: 'doctor'
  },
  {
    id: 'd5',
    name: 'Ruam Popok',
    medicalName: 'Diaper Dermatitis',
    description: 'Peradangan kulit lokal berwarna kemerahan yang gatal di area selangkangan, pantat, dan lipatan kulit yang tertutup popok.',
    commonSymptoms: ['Kulit kemerahan di area popok', 'Gatal/perih saat tersentuh urin', 'Anak rewel saat dibersihkan pantatnya'],
    causes: 'Kondisi popok yang basah/lembab terlalu lama bercampur urin/feses, gesekan popok yang terlalu ketat, atau alergi tissue basah beralkohol.',
    homeRemedies: 'Lepaskan popok dan biarkan area kulit pantat terbuka/kering di udara bebas sesering mungkin. Bersihkan pantat bayi dengan air mengalir tanpa sabun keras atau alkohol. Ganti popok setiap 2-3 jam sekali.',
    recommendedMeds: ['Salep pelindung kulit dengan kandungan Zinc Oxide / Petroleum Jelly'],
    warningSigns: ['Ruam berubah memerah bernanah, melepuh, atau luka berdarah', 'Ruam menyebar naik ke area perut atau punggung anak', 'Ruam tidak kunjung sembuh setelah 5 hari perawatan rumah'],
    urgencyDefault: 'home'
  }
];

// 5. MASTER ARTICLES (5 items)
const ARTICLES = [
  {
    id: 'a1',
    title: 'Panduan Sukses Menyusui Bayi Baru Lahir (Newborn)',
    contentType: 'article',
    contentBody: `Menyusui bayi baru lahir (newborn) adalah petualangan luar biasa yang membutuhkan kesabaran. Kunci utamanya terletak pada **Pelekatan (Latch-On)** yang benar. 

### Tanda Pelekatan Menyusui yang Benar:
1. Mulut bayi terbuka lebar melingkupi areola (bagian gelap di sekitar puting), bukan hanya menempel di ujung puting.
2. Bibir bawah bayi melipat ke luar secara sempurna.
3. Dagu bayi menempel erat pada payudara Bunda.
4. Bunda tidak merasakan nyeri perih melainkan tarikan memompa yang ritmis dan kuat.

Beri ASI setiap kali si kecil menunjukkan tanda lapar (*hunger cues*) seperti mengisap jari, memutar kepala, atau rewel, biasanya setiap 2-3 jam sekali.`,
    mediaUrl: '/assets/articles/menyusui-newborn.png',
    category: 'menyusui',
    targetAgeMin: 0,
    targetAgeMax: 6,
    isPublished: true
  },
  {
    id: 'a2',
    title: 'Tips Praktis Mengatasi GTM (Gerakan Tutup Mulut) pada Bayi',
    contentType: 'article',
    contentBody: `Gerakan Tutup Mulut (GTM) adalah tantangan umum saat bayi memasuki usia MPASI (6 bulan ke atas). Bunda jangan panik atau memaksa menyuapi ya.

### Cara Cerdas Hadapi GTM:
- **Terapkan Feeding Rules:** Buat jadwal makan teratur yang konsisten (maksimal 30 menit). Batasi pemberian camilan/ASI 1-2 jam sebelum makan utama agar si kecil merasakan lapar.
- **Variasikan Tekstur & Rasa:** Terkadang bayi bosan atau gusinya gatal mau tumbuh gigi. Sesuaikan fase teksturnya (puree, bubur saring, cincang kasar).
- **Hias Tampilan Menarik:** Sajikan MPASI dalam mangkuk berwarna-warni yang menggugah selera.
- **Beri Finger Foods:** Biarkan anak melatih kemandirian makan dengan menggenggam potongan brokoli atau wortel kukus sendiri.`,
    mediaUrl: '/assets/articles/mengatasi-gtm.png',
    category: 'gizi',
    targetAgeMin: 6,
    targetAgeMax: 24,
    isPublished: true
  },
  {
    id: 'a3',
    title: 'Mengenal Tanda Bahaya (Red Flags) Tumbuh Kembang Balita',
    contentType: 'article',
    contentBody: `Tumbuh kembang anak memiliki rentang usia pencapaian yang bervariasi. Namun, Bunda wajib waspada terhadap beberapa tanda peringatan kritis (*red flags*).

### Segera Periksakan ke Bidan / Dokter jika si kecil:
- **Usia 3 bulan:** Belum bisa menegakkan kepala, tidak bereaksi terhadap suara keras, atau tidak membalas senyuman Bunda.
- **Usia 9 bulan:** Belum bisa duduk mandiri, tidak merespon saat dipanggil namanya.
- **Usia 12 bulan:** Belum bisa merangkak, belum bisa menunjuk benda yang diinginkannya.
- **Usia 18 bulan:** Belum bisa berjalan sendiri tanpa ditopang sama sekali.
- **Kapan saja:** Mengalami kemunduran kemampuan (misal: sebelumnya bisa mengoceh tapi kemudian diam total).`,
    mediaUrl: '/assets/articles/red-flags-milestones.png',
    category: 'newborn',
    targetAgeMin: 0,
    targetAgeMax: 60,
    isPublished: true
  },
  {
    id: 'a4',
    title: 'Tips Stimulasi Sederhana untuk Motorik Kasar Anak Usia 1-2 Tahun',
    contentType: 'article',
    contentBody: `Pada usia 12-24 bulan, si kecil sedang senang-senangnya menjelajah sekeliling rumah. Latih otot kaki dan keseimbangannya dengan stimulasi sederhana.

### Kegiatan Stimulasi Seru di Rumah:
1. **Bermain Lempar Tangkap Bola:** Melatih koordinasi mata, kaki, dan genggaman tangan.
2. **Meniti Garis Lurus:** Buat garis lurus menggunakan solatip warna di lantai, lalu contohkan cara berjalan menapak di atas garis tersebut.
3. **Naik Turun Tangga Aman:** Latih si kecil naik turun anak tangga rendah dengan diawasi penuh di sampingnya.
4. **Menari Bersama Musik:** Putar lagu anak yang ceria dan ajak si kecil bergoyang mengikuti irama musik kesukaannya.`,
    mediaUrl: '/assets/articles/stimulasi-motorik.png',
    category: 'toddler',
    targetAgeMin: 12,
    targetAgeMax: 24,
    isPublished: true
  },
  {
    id: 'a5',
    title: 'Pentingnya Imunisasi Dasar Lengkap untuk Imunitas Si Kecil',
    contentType: 'article',
    contentBody: `Imunisasi adalah perisai pelindung paling aman bagi buah hati Bunda dari serangan wabah penyakit mematikan seperti campak, difteri, tetanus, dan polio.

### Mengapa Imunisasi Wajib Tepat Waktu?
- **Kekebalan Kelompok (Herd Immunity):** Melindungi bayi-bayi lain di sekitar si kecil yang belum cukup umur untuk diimunisasi.
- **Mencegah Komplikasi Permanen:** Imunisasi mengurangi risiko kecacatan permanen akibat polio dan kerusakan otak akibat virus TBC selaput otak.
- **Efek Samping Umum (KIPI):** Demam setelah imunisasi adalah bukti sistem pertahanan tubuh si kecil sedang berlatih membentuk antibodi tangguh. Beri paracetamol sirup anak jika ia rewel demam.`,
    mediaUrl: '/assets/articles/pentingnya-imunisasi.png',
    category: 'newborn',
    targetAgeMin: 0,
    targetAgeMax: 60,
    isPublished: true
  }
];

/**
 * Seeds all static master data tables if they are empty in LocalStorage.
 * Does not overwrite existing data.
 * 
 * @param {boolean} [force=false] - If true, overwrites data regardless.
 */
export function seedAllData(force = false) {
  try {
    const data = getAppData();
    let mutated = false;
    
    // Seed Milestones
    if (force || data.milestones.length === 0) {
      data.milestones = [...MILESTONES];
      mutated = true;
      console.log('Seeded milestones data...');
    }
    
    // Seed Vaccines
    if (force || data.vaccines.length === 0) {
      data.vaccines = [...VACCINES];
      mutated = true;
      console.log('Seeded vaccines data...');
    }
    
    // Seed MPASI Recipes
    if (force || data.mpasiRecipes.length === 0) {
      data.mpasiRecipes = [...RECIPES];
      mutated = true;
      console.log('Seeded MPASI recipes data...');
    }
    
    // Seed Diseases
    if (force || data.diseases.length === 0) {
      data.diseases = [...DISEASES];
      mutated = true;
      console.log('Seeded diseases data...');
    }
    
    // Seed Articles
    if (force || data.articles.length === 0) {
      data.articles = [...ARTICLES];
      mutated = true;
      console.log('Seeded articles data...');
    }
    
    if (mutated) {
      saveAppData(data);
      console.log('All static master data seeded successfully to LocalStorage! 🧡');
    } else {
      console.log('Static master data already exists in LocalStorage. Seeding skipped.');
    }
  } catch (error) {
    console.error('Error during data seeding:', error);
  }
}
