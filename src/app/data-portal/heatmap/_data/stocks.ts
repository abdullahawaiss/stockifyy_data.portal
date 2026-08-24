export interface StockData {
  sym: string;
  name: string;
  sector: string;
  price: number;
  chg: number;
  vol: number;   // trading volume in thousands
  cap: number;   // market cap in millions PKR
  shariah: boolean;
  kse100: boolean;
  kse30: boolean;
  kmi30: boolean;
  kmiAll: boolean;
}

// [sym, name, sector, price, chg%, vol(K), cap(M), shariah, kse100, kse30, kmi30, kmiAll]
type RawRow = [string, string, string, number, number, number, number, boolean, boolean, boolean, boolean, boolean];

const RAW: RawRow[] = [
  // ── Oil & Gas Exploration ──────────────────────────────────────────────────
  ["PPL",   "Pakistan Petroleum Ltd",         "Oil & Gas Expl.",  89.35, -2.50, 8420,  145000, true,  true,  true,  true,  true],
  ["OGDC",  "Oil & Gas Dev. Co.",             "Oil & Gas Expl.", 158.90, -1.88, 6130,  682000, true,  true,  true,  false, false],
  ["MARI",  "Mari Petroleum Co.",             "Oil & Gas Expl.", 990.00,  0.43,  310,  284000, true,  true,  true,  true,  true],
  ["POL",   "Pakistan Oilfields Ltd",         "Oil & Gas Expl.", 452.10, -1.66,  890,   64000, true,  true,  false, true,  true],
  ["GHPL",  "Gulshan Hyder Power Ltd",        "Oil & Gas Expl.",  32.40,  0.62,  540,    8000, true,  false, false, true,  true],
  ["PARCO", "Pak Arab Refinery Ltd",          "Oil & Gas Expl.", 105.70, -0.94,  220,   38000, true,  false, false, true,  true],

  // ── Oil & Gas Marketing ───────────────────────────────────────────────────
  ["PSO",   "Pakistan State Oil",             "Oil & Gas Mktg.", 180.55, -1.55, 3210,   42000, false, true,  false, false, false],
  ["SNGP",  "Sui Northern Gas",              "Oil & Gas Mktg.",  42.70, -1.77,  980,   11000, false, true,  false, false, false],
  ["SSGC",  "Sui Southern Gas",              "Oil & Gas Mktg.",  20.35,  0.83, 1870,    7000, false, false, false, false, false],
  ["APL",   "Attock Petroleum Ltd",          "Oil & Gas Mktg.", 544.80, -0.40,  120,   43000, true,  true,  false, true,  true],
  ["HASCOL","Hascol Petroleum Ltd",          "Oil & Gas Mktg.",  12.90, -0.77,  560,    2100, false, false, false, false, false],
  ["SHEL",  "Shell Pakistan Ltd",            "Oil & Gas Mktg.", 218.00, -0.91,  170,   16000, false, false, false, false, false],
  ["BNP",   "Byco Petroleum Pakistan",       "Oil & Gas Mktg.",  10.45,  1.26,  890,    8500, false, false, false, false, false],
  ["TOTAL", "Total Parco Pakistan",          "Oil & Gas Mktg.", 374.20, -0.53,   80,   56000, true,  false, false, true,  true],

  // ── Refinery ──────────────────────────────────────────────────────────────
  ["CNERGY","Cnergyico PK Limited",           "Refinery",         14.79, -1.47, 9870,   16000, false, true,  false, false, false],
  ["PRL",   "Pakistan Refinery Ltd",          "Refinery",         35.60,  2.07, 2100,    4000, false, true,  false, false, false],
  ["ATRL",  "Attock Refinery Ltd",            "Refinery",        268.50, -0.61,  430,   21000, false, true,  false, false, false],
  ["NRL",   "National Refinery Ltd",          "Refinery",        508.00, -0.19,   90,   24000, false, false, false, false, false],

  // ── Commercial Banks ──────────────────────────────────────────────────────
  ["HBL",   "Habib Bank Ltd",                "Commercial Banks", 177.99, -0.01, 3700,  242000, false, true,  true,  false, false],
  ["UBL",   "United Bank Ltd",               "Commercial Banks", 210.45, -0.88, 2910,  157000, false, true,  true,  false, false],
  ["MCB",   "MCB Bank Ltd",                  "Commercial Banks", 244.30, -1.12, 1840,  246000, false, true,  true,  false, false],
  ["ABL",   "Allied Bank Ltd",               "Commercial Banks", 178.00,  0.00,  980,   91000, false, true,  false, false, false],
  ["NBP",   "National Bank of Pakistan",     "Commercial Banks",  54.90,  0.69, 4580,   45000, false, true,  true,  false, false],
  ["BOP",   "Bank of Punjab",                "Commercial Banks",  24.30, -2.20, 6710,   32000, false, true,  false, false, false],
  ["AKBL",  "Askari Bank Ltd",               "Commercial Banks",  59.00, -0.32, 1230,   25000, false, true,  false, false, false],
  ["BAFL",  "Bank Al Falah Ltd",             "Commercial Banks",  67.50, -0.30, 1540,   50000, false, true,  false, false, false],
  ["MEBL",  "Meezan Bank Ltd",               "Commercial Banks", 175.40, -0.32, 5620,  199000, true,  true,  true,  true,  true],
  ["BAHL",  "Bank AL Habib Ltd",             "Commercial Banks",  89.60, -0.89,  670,   61000, false, true,  false, false, false],
  ["FABL",  "Faysal Bank Ltd",               "Commercial Banks",  38.90,  0.78, 1890,   28000, true,  true,  false, true,  true],
  ["SMBL",  "Summit Bank Ltd",               "Commercial Banks",   5.80,  0.17,  340,    3000, false, false, false, false, false],
  ["SNBL",  "Soneri Bank Ltd",               "Commercial Banks",  28.40, -0.35,  520,   13000, false, false, false, false, false],
  ["JSBL",  "JS Bank Ltd",                   "Commercial Banks",  11.90,  0.42,  780,    8000, false, false, false, false, false],
  ["BIPL",  "Burj Bank Ltd",                 "Commercial Banks",   6.70,  1.21,  450,    4000, true,  false, false, true,  true],

  // ── Power Generation ──────────────────────────────────────────────────────
  ["KEL",   "K-Electric Ltd",                "Power Gen.",        24.77, -2.68, 9870,   28000, false, true,  false, false, false],
  ["HUBC",  "Hub Power Co.",                 "Power Gen.",       118.50, -1.87, 3210,   90000, true,  true,  true,  true,  true],
  ["NCPL",  "Nishat Chunian Power",          "Power Gen.",        28.40, -0.69,  890,    7000, false, false, false, false, false],
  ["KSL",   "KSL Chemicals Ltd",             "Power Gen.",        14.20, -2.10, 2340,    6000, false, false, false, false, false],
  ["KAPCO", "Kot Addu Power Co.",            "Power Gen.",        39.10, -0.89,  670,   16000, false, false, false, false, false],
  ["LHCL",  "Lalazar Hydro Energy",          "Power Gen.",        12.90,  0.78,  340,    3000, true,  false, false, true,  true],
  ["EPQL",  "Engro Powergen Qadirpur",       "Power Gen.",        42.30, -1.20,  510,   11000, false, false, false, false, false],
  ["PKGP",  "Pakgen Power Ltd",              "Power Gen.",        17.60, -0.56,  780,    5000, false, false, false, false, false],
  ["NPL",   "Nishat Power Ltd",              "Power Gen.",        24.10, -1.43,  560,    6000, false, false, false, false, false],
  ["INIL",  "Interloop Nishat Independent", "Power Gen.",         18.90,  0.53,  230,    4000, false, false, false, false, false],
  ["FKML",  "Fauji Kabirwala Power",        "Power Gen.",         22.50, -0.88,  410,    6000, false, false, false, false, false],
  ["BIFO",  "Biafo Industries Ltd",          "Power Gen.",        165.30,  1.24,  180,    8000, true,  false, false, true,  true],

  // ── Cement ────────────────────────────────────────────────────────────────
  ["LUCK",  "Lucky Cement Ltd",              "Cement",           922.40, -0.34, 1230,  297000, true,  true,  true,  true,  true],
  ["DGKC",  "D.G. Khan Cement",             "Cement",           101.50, -1.66, 2340,   31000, true,  true,  true,  true,  true],
  ["MLCF",  "Maple Leaf Cement",            "Cement",            36.80, -2.42, 4560,   18000, true,  true,  false, true,  true],
  ["FCCL",  "Fauji Cement Co.",             "Cement",            24.90, -1.78, 5670,   17000, true,  true,  false, true,  true],
  ["KOHC",  "Kohat Cement Co.",             "Cement",           145.20, -0.41,  780,   29000, true,  true,  false, true,  true],
  ["GWLC",  "Gharibwal Cement",             "Cement",            29.40, -0.67,  560,    7000, true,  false, false, true,  true],
  ["PIOC",  "Pioneer Cement Ltd",           "Cement",            75.30, -1.18,  890,   15000, true,  false, false, true,  true],
  ["CHCC",  "Cherat Cement Co.",            "Cement",           141.80, -0.84,  340,   22000, true,  true,  false, true,  true],
  ["ACPL",  "Attock Cement Ltd",            "Cement",           259.70, -0.31,  230,   38000, true,  true,  false, true,  true],
  ["POWER", "Hubco Power Co.",              "Cement",            32.10, -0.93, 1230,   11000, false, false, false, false, false],
  ["FECTC", "Fecto Cement Ltd",             "Cement",            31.80, -1.55,  450,    5000, true,  false, false, true,  true],
  ["DCMT",  "Dewan Cement Ltd",             "Cement",             9.70,  1.03,  670,    2000, false, false, false, false, false],
  ["MMCL",  "Modern Metasteel Ltd",         "Cement",            13.40, -0.74,  340,    3000, false, false, false, false, false],

  // ── Technology & Comm. ────────────────────────────────────────────────────
  ["SYS",   "Systems Ltd",                  "Technology",        294.60, -1.98, 1890,   70000, true,  true,  true,  true,  true],
  ["TRG",   "TRG Pakistan Ltd",             "Technology",        130.80,  2.19, 3210,   24000, true,  true,  false, true,  true],
  ["NETSOL","NetSol Technologies",          "Technology",        126.40,  1.88,  560,    8000, true,  true,  false, true,  true],
  ["AVN",   "Avanceon Ltd",                 "Technology",         66.30,  1.15,  340,    5000, true,  false, false, true,  true],
  ["WTL",   "Worldcall Telecom",            "Technology",          2.44, -2.44, 7890,    2000, false, false, false, false, false],
  ["ITANZ",  "Ibex Ltd",                    "Technology",        236.00, -2.12,  230,   14000, false, false, false, false, false],
  ["TPL",   "TPL Corp Ltd",                 "Technology",         24.60, -0.81,  670,    6000, false, false, false, false, false],
  ["TELE",  "Telecard Ltd",                 "Technology",         10.30, -0.48,  450,    3000, false, false, false, false, false],
  ["PTC",   "Pakistan Telecom Co.",         "Technology",         16.30, -1.40,  890,   34000, false, true,  false, false, false],
  ["SYM",   "Symmetry Group Ltd",           "Technology",         17.50,  0.57,  340,    2000, true,  false, false, true,  true],
  ["SELECT","Select Technologies",          "Technology",         15.80, -0.63,  230,    3000, true,  false, false, true,  true],
  ["PSEL",  "Pakistan Software Export Board","Technology",         8.90,  0.22,  180,    1500, true,  false, false, true,  true],
  ["ZTL",   "Zeal Pak Cement Factory",      "Technology",         18.40, -1.08,  340,    2500, false, false, false, false, false],

  // ── Pharmaceuticals ───────────────────────────────────────────────────────
  ["SEARL", "The Searle Company",           "Pharmaceuticals",   136.50,  0.03, 2340,   24000, true,  true,  false, true,  true],
  ["ABOT",  "Abbott Laboratories Pak",      "Pharmaceuticals",   898.00, -0.11,  120,   47000, true,  true,  false, true,  true],
  ["AGP",   "AGP Limited",                  "Pharmaceuticals",    76.80, -3.70,  890,   10000, true,  true,  false, true,  true],
  ["HINOON","Hinopak Motors",               "Pharmaceuticals",   380.99, -0.06,  230,   11000, false, false, false, false, false],
  ["GLAXO", "GlaxoSmithKline Pak",          "Pharmaceuticals",   146.20, -0.14,  340,   12000, true,  false, false, true,  true],
  ["FEROZ", "Ferozsons Laboratories",       "Pharmaceuticals",   380.00,  0.07,  180,   12000, true,  false, false, true,  true],
  ["CSAP",  "Citi Pharma Ltd",              "Pharmaceuticals",    15.90,  0.63,  560,    3000, true,  false, false, true,  true],
  ["HIMONT","Hi-Tech Inks & Resins",        "Pharmaceuticals",    14.60, -0.68,  340,    2000, true,  false, false, true,  true],
  ["OPL",   "Organon Pakistan Ltd",         "Pharmaceuticals",   249.50,  1.22,   90,   19000, true,  false, false, true,  true],
  ["IBHL",  "IBL HealthCare Ltd",           "Pharmaceuticals",    68.90, -0.72,  230,    4000, true,  false, false, true,  true],
  ["SANOFI","Sanofi-Aventis Pak",           "Pharmaceuticals",   188.00, -0.53,   80,   14000, true,  false, false, true,  true],
  ["HALEON","Haleon Pakistan Ltd",           "Pharmaceuticals",   748.99, -0.49,  150,   22000, true,  false, false, true,  true],
  ["SCBPL", "Standard Chartered Bank Pak",  "Pharmaceuticals",    66.00,  0.00,   90,   27000, false, false, false, false, false],

  // ── Fertilizers ───────────────────────────────────────────────────────────
  ["EFERT", "Engro Fertilizers Ltd",        "Fertilizers",        88.70, -0.33, 3450,   97000, true,  true,  true,  true,  true],
  ["FFC",   "Fauji Fertilizer Co.",         "Fertilizers",       132.40, -0.52, 2890,  156000, true,  true,  true,  true,  true],
  ["FATIMA","Fatima Fertilizer Co.",        "Fertilizers",        39.80, -1.49, 4560,   45000, true,  true,  false, true,  true],
  ["AHCL",  "Arif Habib Corp. Ltd",         "Fertilizers",        65.20,  0.43, 1230,   23000, true,  true,  false, true,  true],
  ["FFBL",  "Fauji Fertilizer Bin Qasim",   "Fertilizers",        25.40, -0.78, 2340,   19000, false, true,  false, false, false],
  ["ENGRO", "Engro Corporation Ltd",        "Fertilizers",       325.60, -0.45,  890,  182000, true,  true,  true,  true,  true],

  // ── Textile Spinning ──────────────────────────────────────────────────────
  ["DSIL",  "Dewan Salman Fibres",          "Textile Spinning",   12.80, -7.13, 5670,    3000, false, false, false, false, false],
  ["KOSM",  "Kohinoor Spinning Mills",      "Textile Spinning",   38.40, -2.99, 2340,    4000, true,  false, false, true,  true],
  ["AMTEX", "Amtex Ltd",                    "Textile Spinning",   14.20, -1.39,  890,    2000, true,  false, false, true,  true],
  ["HBAT",  "HB Agrotech Ltd",             "Textile Spinning",   10.30, -0.96,  670,    1500, true,  false, false, true,  true],
  ["TATM",  "Tata Textile Mills",           "Textile Spinning",   16.50,  1.23,  450,    2000, true,  false, false, true,  true],
  ["DFSM",  "Dewan Farooq Spinning Mills",  "Textile Spinning",   11.20, -2.61,  560,    1800, true,  false, false, true,  true],
  ["SERT",  "Sana Enterprises Ltd",         "Textile Spinning",   13.40,  0.75,  340,    1200, true,  false, false, true,  true],
  ["ABCTM", "Al-Abid Silk Mills",           "Textile Spinning",    8.90, -1.44,  230,    1000, true,  false, false, true,  true],
  ["JATM",  "Janana De Malucho Textile",    "Textile Spinning",   18.30, -0.54,  180,    2000, true,  false, false, true,  true],
  ["SHGT",  "Shadab Textile Mills",         "Textile Spinning",   12.10, -0.82,  290,    1500, true,  false, false, true,  true],
  ["RUBY",  "Ruby Textile Mills",           "Textile Spinning",   31.20,  0.65,  120,    2000, true,  false, false, true,  true],
  ["SAAF",  "Saif Textile Mills",           "Textile Spinning",   15.40,  0.65,  340,    1800, true,  false, false, true,  true],
  ["MSOT",  "Masood Textile Mills",         "Textile Spinning",   55.80, -0.36,  230,    4000, true,  false, false, true,  true],
  ["ISL",   "Island Textile Mills",         "Textile Spinning",   11.20, -1.75,  290,    1200, true,  false, false, true,  true],
  ["BWHL",  "Bilal Weaving Ltd",            "Textile Spinning",    9.40,  1.08,  180,    1000, true,  false, false, true,  true],
  ["COLTM", "Colony Textile Mills",         "Textile Spinning",   12.90, -0.77,  230,    1500, true,  false, false, true,  true],
  ["GLTM",  "Gul Ahmed Textile Mills",      "Textile Spinning",   51.30, -0.58,  560,    9000, true,  false, false, true,  true],
  ["NTML",  "Nishat Textile Mills",         "Textile Spinning",   45.60, -0.43,  340,    8000, true,  false, false, true,  true],
  ["MLTM",  "Muslim Commercial Textile",    "Textile Spinning",   18.70, -0.53,  180,    2500, true,  false, false, true,  true],
  ["SPNTM", "Sapphire Textile Mills",       "Textile Spinning",  670.00,  0.15,   90,   50000, true,  false, false, true,  true],

  // ── Textile Composite ─────────────────────────────────────────────────────
  ["ILP",   "Interloop Ltd",                "Textile Composite",  88.90, -0.11,  450,   66000, true,  true,  true,  true,  true],
  ["GATM",  "Gul Ahmed Textile",            "Textile Composite",  51.30, -0.58,  890,    9000, true,  true,  false, true,  true],
  ["GTFP",  "Global Textile Foundation",    "Textile Composite",  12.40, -1.59,  340,    2000, true,  false, false, true,  true],
  ["INDS",  "Indus Dyeing & Mfg",          "Textile Composite",  75.60, -0.92,  230,    5000, true,  false, false, true,  true],
  ["KTML",  "Kohinoor Textile Mills",       "Textile Composite",  75.40, -0.66,  340,    8000, true,  false, false, true,  true],
  ["LOTCHEM","Lotchem Ltd",                 "Textile Composite",  28.30, -2.03, 1230,   13000, true,  false, false, true,  true],
  ["NAGM",  "National Agri & Foods",        "Textile Composite",  14.80,  0.68,  180,    2000, true,  false, false, true,  true],
  ["PRGM",  "Premium Textile Mills",        "Textile Composite",  36.90, -0.54,  230,    3000, true,  false, false, true,  true],
  ["STML",  "Sapphire Finishing Mills",     "Textile Composite",  32.10, -0.93,  340,    4000, true,  false, false, true,  true],
  ["TCTM",  "Towellers Ltd",                "Textile Composite",  55.40,  0.73,  120,    4000, true,  false, false, true,  true],

  // ── Textile Weaving ───────────────────────────────────────────────────────
  ["AYT",   "Al-Yousif Textile Mills",      "Textile Weaving",    14.20, -0.70,  230,    2000, true,  false, false, true,  true],
  ["BHTM",  "Blessed Textile Ltd",          "Textile Weaving",    12.80, -0.78,  180,    1500, true,  false, false, true,  true],
  ["CHTM",  "Chinar Textile Mills",         "Textile Weaving",    11.30,  0.89,  120,    1200, true,  false, false, true,  true],
  ["HCTM",  "Hira Textile Mills",           "Textile Weaving",    15.40, -0.65,  230,    2000, true,  false, false, true,  true],
  ["JTM",   "Jubilee Spinning",             "Textile Weaving",    10.90,  1.86,  290,    1500, true,  false, false, true,  true],
  ["JTIL",  "Jannat Textile Industries",    "Textile Weaving",    13.60, -0.73,  180,    1800, true,  false, false, true,  true],
  ["RTML",  "Reliance Cotton Spinning",     "Textile Weaving",    11.80,  0.85,  120,    1200, true,  false, false, true,  true],
  ["TNTM",  "Tri-Star Polyester",           "Textile Weaving",     9.80, -1.01,  230,    1000, true,  false, false, true,  true],

  // ── Engineering ───────────────────────────────────────────────────────────
  ["BECO",  "Beco Industries Ltd",          "Engineering",        37.10, -1.75,  890,    5000, true,  false, false, true,  true],
  ["ASL",   "Arshad Steel Ltd",             "Engineering",        28.50, -1.07,  670,    3000, false, false, false, false, false],
  ["SIL",   "Standard Industries Ltd",      "Engineering",        12.40, -0.80,  560,    2000, false, false, false, false, false],
  ["AGHA",  "Agha Steel Industries",        "Engineering",        17.80,  1.33, 1230,    5000, false, false, false, false, false],
  ["MUGHAL","Mughal Iron & Steel",           "Engineering",        78.40, -2.29, 2340,   16000, false, false, false, false, false],
  ["ITTEFAQ","Ittefaq Iron Industries",     "Engineering",        17.10, -0.58,  340,    3000, false, false, false, false, false],
  ["PAEL",  "Pak Elektron Ltd",             "Engineering",        67.90, -1.94, 2890,   17000, true,  true,  false, true,  true],
  ["THALL", "Thal Ltd",                     "Engineering",        627.50,  0.24,  120,   25000, true,  true,  false, true,  true],
  ["ATLH",  "Atlas Honda Ltd",              "Engineering",        498.60, -0.28,  340,   47000, true,  true,  false, true,  true],
  ["SML",   "Sind Alkalis Ltd",             "Engineering",        65.30,  0.46,  230,    5000, true,  false, false, true,  true],
  ["DESCON","Descon Oxychem Ltd",           "Engineering",         24.90, -2.09, 1890,    8000, false, false, false, false, false],
  ["PAKGES","Packages Ltd",                 "Engineering",        413.20, -0.19,  180,   44000, false, false, false, false, false],

  // ── Automobile ────────────────────────────────────────────────────────────
  ["INDU",  "Indus Motor Co.",              "Automobile",        1924.25, -0.23,  210,  106000, false, true,  false, false, false],
  ["HINO",  "Hino Pak Motors",              "Automobile",         380.99, -0.06,  180,   11000, false, false, false, false, false],
  ["PSMC",  "Pak Suzuki Motor Co.",         "Automobile",         278.40, -0.57,  450,   28000, false, true,  false, false, false],
  ["AGTL",  "Al-Ghazi Tractors",           "Automobile",         302.50,  0.83,  120,   12000, true,  false, false, true,  true],
  ["MTL",   "Millat Tractors Ltd",          "Automobile",        1924.00,  0.00,   90,  106000, false, false, false, false, false],
  ["GHANDHARA","Ghandhara Ind. Ltd",        "Automobile",         125.40, -4.78,  340,    8000, false, false, false, false, false],

  // ── Transport ─────────────────────────────────────────────────────────────
  ["PIBTL", "Pakistan Int'l Bulk Terminal","Transport",           22.50,  0.48,  890,    6000, true,  true,  false, true,  true],
  ["BLUEX", "Blue Ex Courier Services",    "Transport",           14.80, -2.60,  670,    2000, false, false, false, false, false],
  ["SLGL",  "Siddiqsons Ltd",             "Transport",           17.30, -0.57,  450,    2500, false, false, false, false, false],
  ["CLVL",  "Clover Ltd",                 "Transport",           12.90,  0.23,  340,    1800, false, false, false, false, false],
  ["PICT",  "Pak Int'l Container Terminal","Transport",           75.80, -0.26,  560,   18000, true,  false, false, true,  true],
  ["PNSC",  "Pakistan National Shipping", "Transport",           81.40,  0.74,  340,   13000, true,  false, false, true,  true],
  ["PAKL",  "PAK Logistics Ltd",          "Transport",           10.20,  1.98,  230,    2000, true,  false, false, true,  true],
  ["TREET", "Treet Corporation Ltd",      "Transport",           38.60, -0.77,  450,    6000, true,  false, false, true,  true],

  // ── Investment Companies ──────────────────────────────────────────────────
  ["PSX",   "Pakistan Stock Exchange",     "Inv. Companies",      16.50, -1.75,  890,   15000, false, false, false, false, false],
  ["FMEL",  "First Modaraba",              "Inv. Companies",      13.40,  0.75,  560,    3000, true,  false, false, true,  true],
  ["TSBL",  "Trust Securities & Brokers",  "Inv. Companies",      15.80, -1.38,  340,    4000, true,  false, false, true,  true],
  ["NIT",   "Nat'l Investment Trust",      "Inv. Companies",      95.60, -0.52,  230,   45000, true,  false, false, true,  true],
  ["JDW",   "JDW Sugar Mills",            "Inv. Companies",      404.50,  0.82,  450,   51000, true,  false, false, true,  true],
  ["DAWOOD","Dawood Hercules Corp.",       "Inv. Companies",      159.80, -0.56,  340,   31000, false, false, false, false, false],
  ["ENGRO2","Engro Polymer & Chem",        "Inv. Companies",       46.70, -2.10,  890,   24000, true,  false, false, true,  true],
  ["AKFIL", "AKD Securities Ltd",         "Inv. Companies",       15.30, -0.65,  230,    3000, false, false, false, false, false],
  ["BIFL",  "BIF Limited",                "Inv. Companies",       22.40,  0.45,  230,    3500, true,  false, false, true,  true],
  ["KAPCO2","KAPCO Ltd",                  "Inv. Companies",       39.10, -0.89,  450,   16000, false, false, false, false, false],

  // ── Insurance ─────────────────────────────────────────────────────────────
  ["AICL",  "Adamjee Insurance Co.",       "Insurance",           61.40, -0.08,  340,   10000, false, false, false, false, false],
  ["EFU",   "EFU General Insurance",       "Insurance",          138.60,  0.43,  120,   14000, false, false, false, false, false],
  ["IGI",   "IGI Holdings Ltd",            "Insurance",          583.40, -0.19,   90,   32000, false, false, false, false, false],
  ["JINS",  "Jubilee General Insurance",   "Insurance",           72.30, -0.55,  180,    9000, false, false, false, false, false],
  ["PAKGEN","Pak Reinsurance Co.",         "Insurance",           34.60,  0.29,  230,    5000, false, false, false, false, false],
  ["SECL",  "Security General Insurance",  "Insurance",           20.40, -0.49,  180,    2000, false, false, false, false, false],
  ["UIC",   "United Insurance Co.",        "Insurance",           18.90,  1.61,  230,    3000, false, false, false, false, false],
  ["ALICO", "American Life Insurance",     "Insurance",          315.40, -0.31,   60,   35000, false, false, false, false, false],
  ["SLICL", "State Life Corp. of Pak",     "Insurance",          110.50, -0.54,  120,   55000, false, false, false, false, false],
  ["TPLI",  "TPL Insurance Ltd",          "Insurance",           14.80,  0.68,  290,    3000, false, false, false, false, false],

  // ── Food & Personal Care ──────────────────────────────────────────────────
  ["CLOV",  "Clover Pakistan Ltd",         "Food & FMCG",         45.20, -9.92,  340,    3000, true,  false, false, true,  true],
  ["PREMA", "Prema Foods Ltd",             "Food & FMCG",         22.40,  2.84,  450,    2500, true,  false, false, true,  true],
  ["UNITY", "Unity Foods Ltd",             "Food & FMCG",         27.80, -0.36, 1230,   12000, true,  true,  false, true,  true],
  ["TOMCL", "Tata Textile Mills",          "Food & FMCG",         16.50,  1.23,  230,    2000, true,  false, false, true,  true],
  ["NESTLE","Nestlé Pakistan Ltd",         "Food & FMCG",        6740.00, -0.42,   30,  315000, false, false, false, false, false],
  ["COLG",  "Colgate-Palmolive Pak",       "Food & FMCG",        1227.77, -0.58,  120,   58000, false, false, false, false, false],
  ["RAFHAN","Rafhan Maize Products",       "Food & FMCG",        9450.00, -0.11,   10,  297000, false, false, false, false, false],
  ["ATBA",  "Atlas Battery Ltd",           "Food & FMCG",         204.80,  0.45,  120,   10000, false, false, false, false, false],
  ["FFL",   "Faran Sugar Mills",           "Food & FMCG",          18.90,  0.53,  230,    2500, true,  false, false, true,  true],
  ["QUICE", "Quice Food Industries",       "Food & FMCG",          14.30,  0.70,  340,    2000, true,  false, false, true,  true],
  ["GDL",   "Ghandara Industries",         "Food & FMCG",          12.80, -0.78,  290,    2000, true,  false, false, true,  true],

  // ── Chemical ──────────────────────────────────────────────────────────────
  ["ICI",   "ICI Pakistan Ltd",            "Chemical",            538.90,  0.26,  120,   55000, false, false, false, false, false],
  ["MERIT", "Merit Packaging Ltd",         "Chemical",             14.70, -0.67,  180,    2000, true,  false, false, true,  true],
  ["GHANI", "Ghani Glass Ltd",             "Chemical",             35.80,  0.56,  670,    9000, true,  false, false, true,  true],
  ["SITC",  "Sit-Chem Ltd",                "Chemical",             12.30,  0.82,  230,    1500, true,  false, false, true,  true],
  ["PCAL",  "Punjab Chemicals Ltd",        "Chemical",             18.90, -0.53,  180,    2500, true,  false, false, true,  true],
  ["ILTM",  "Ittehad Chemicals Ltd",       "Chemical",             26.40, -0.75,  340,    4000, true,  false, false, true,  true],
  ["BUXLY", "Buxly Paints Ltd",            "Chemical",            129.40,  0.54,   60,    6000, false, false, false, false, false],

  // ── Real Estate / REIT ─────────────────────────────────────────────────────
  ["TPLRFI","TPL REIT Fund",               "REIT",                 12.40, -1.00, 1230,    8000, true,  false, false, true,  true],
  ["MLREIT","Meezan Islamic REIT",         "REIT",                 11.80,  0.85,  890,    6000, true,  false, false, true,  true],
  ["PKREIT","Pak REIT Fund",               "REIT",                  9.90, -0.10,  670,    5000, true,  false, false, true,  true],

  // ── Cable & Electrical ────────────────────────────────────────────────────
  ["FNEL",  "First National Equities",     "Cable & Elec.",        12.80, -0.78,  340,    2000, false, false, false, false, false],
  ["PAEL2", "Pak Elektron Ltd-P",          "Cable & Elec.",        67.90, -1.94,  230,   17000, false, false, false, false, false],
  ["CABLE", "Pakistan Cables Ltd",         "Cable & Elec.",        98.40,  0.82,  180,    8000, false, false, false, false, false],
  ["SGPL",  "Southern Gas Pipelines",      "Cable & Elec.",        14.20,  0.71,  290,    2500, false, false, false, false, false],
  ["FECM",  "Frontier Engineering",        "Cable & Elec.",        12.90, -0.31,  230,    2000, false, false, false, false, false],

  // ── Miscellaneous ─────────────────────────────────────────────────────────
  ["STPL",  "Saif Textile Ltd",            "Miscellaneous",         12.80, -1.06, 1870,    3000, true,  false, false, true,  true],
  ["HADC",  "Habib-ADM Ltd",               "Miscellaneous",         48.40,  3.25,  560,    7000, false, false, false, false, false],
  ["PHDL",  "Packages Holdings Ltd",       "Miscellaneous",        350.50, -0.43,   90,   42000, false, false, false, false, false],
  ["PABC",  "Philip Morris Pakistan",      "Miscellaneous",        108.89, -2.06,  340,   15000, false, false, false, false, false],
  ["OMEL",  "Omel Ltd",                    "Miscellaneous",         14.20,  0.71,  180,    2000, true,  false, false, true,  true],
  ["ARPAK", "AR Pak Holding",              "Miscellaneous",         12.80, -0.78,  230,    2000, true,  false, false, true,  true],
  ["GAMON", "Gamon Pakistan Ltd",          "Miscellaneous",         10.40,  1.96,  290,    1500, false, false, false, false, false],
  ["PIAC",  "Pakistan Int'l Airlines",     "Miscellaneous",         36.80, -4.78,  890,   12000, false, false, false, false, false],
  ["COLG2", "Colgate-Palmolive P2",        "Miscellaneous",        1227.00, 0.00,   10,   57000, false, false, false, false, false],
  ["SHFA",  "Shifa International Hosp.",   "Miscellaneous",        178.50,  0.34,  120,   24000, true,  false, false, true,  true],

  // ── Leasing Companies ─────────────────────────────────────────────────────
  ["ORIX",  "ORIX Leasing Pakistan",       "Leasing",              35.80,  0.56,  230,    5000, false, false, false, false, false],
  ["FNEL2", "First National Equities P2",  "Leasing",              12.40,  0.65,  180,    2000, false, false, false, false, false],
  ["SCLL",  "Standard Chartered Leasing",  "Leasing",               9.90, -0.10,  120,    1500, false, false, false, false, false],
  ["KALL",  "Khalid Al-Khatib Leasing",    "Leasing",              11.20, -0.89,  150,    2000, false, false, false, false, false],

  // ── Sugar & Allied Industries ─────────────────────────────────────────────
  ["AABS",  "Al-Abbas Sugar Mills",        "Sugar & Allied",      846.90, -0.64, 1230,   42000, true,  true,  false, true,  true],
  ["ALTN",  "Altern Energy Ltd",           "Sugar & Allied",       21.40,  1.42,  890,    4000, true,  false, false, true,  true],
  ["FRSM",  "Faran Sugar Mills",           "Sugar & Allied",       18.90,  0.53,  670,    2500, true,  false, false, true,  true],
  ["JSML",  "Jauharabad Sugar Mills",      "Sugar & Allied",       12.80, -0.78,  450,    1500, true,  false, false, true,  true],
  ["MEHTAB","Mehtab Textile Mills",        "Sugar & Allied",       10.40,  0.96,  340,    1200, true,  false, false, true,  true],
  ["SCLL2", "Sanghar Sugar Mills",         "Sugar & Allied",        9.90, -0.40,  230,    1000, true,  false, false, true,  true],
  ["THKL",  "Thal Industries Corp.",       "Sugar & Allied",      152.40,  0.66,  120,   12000, true,  false, false, true,  true],
  ["TRGS",  "TRG Sugar Pak",              "Sugar & Allied",        14.20, -1.41,  290,    2000, true,  false, false, true,  true],

  // ── Closed-End Mutual Funds ────────────────────────────────────────────────
  ["NMF",   "NAFA Mutual Fund",            "Closed-End Funds",      8.90,  1.14,  120,    2000, true,  false, false, true,  true],
  ["JSOF",  "JS Opportunities Fund",       "Closed-End Funds",     11.20, -0.89,   90,    2500, true,  false, false, true,  true],
  ["PAKMO", "PACRA/JCR-VIS Fund",          "Closed-End Funds",      9.40,  0.64,   80,    1800, true,  false, false, true,  true],
  ["AMCF",  "Al-Meezan Mutual Fund",       "Closed-End Funds",     13.80,  0.73,  150,    3500, true,  false, false, true,  true],

  // ── Paper & Board ─────────────────────────────────────────────────────────
  ["CEPB",  "Century Paper & Board",       "Paper & Board",         32.10, -0.93,  560,    8000, false, false, false, false, false],
  ["PAKP",  "Pakistan Paper Products",     "Paper & Board",         14.50, -0.68,  340,    2000, false, false, false, false, false],
  ["SERY",  "Security Paper Ltd",          "Paper & Board",         89.40,  0.45,  120,   12000, false, false, false, false, false],
  ["PAKGES2","Packages Pvt Ltd P2",        "Paper & Board",        413.00, -0.05,   60,   44000, false, false, false, false, false],

  // ── Vanaspati & Allied ────────────────────────────────────────────────────
  ["UNITY2","Unity Foods P2",             "Vanaspati & Allied",    27.80, -0.36,  560,   12000, true,  false, false, true,  true],
  ["PAKT",  "Pakistan Tobacco Co.",        "Vanaspati & Allied",   648.00, -0.15,  120,   55000, false, false, false, false, false],
  ["TRGU",  "Thal Industries Allied",      "Vanaspati & Allied",   152.40,  0.66,   90,   12000, true,  false, false, true,  true],

  // ── More Textile Spinning (Shariah) ───────────────────────────────────────
  ["AMSL",  "Artistic Milliners (Spin)",  "Textile Spinning",     22.30, -0.44,  340,    3000, true,  false, false, true,  true],
  ["BGTM",  "Babri Cotton Mills",         "Textile Spinning",     14.80, -0.67,  230,    1500, true,  false, false, true,  true],
  ["CNTM",  "Crescent Textile Mills",     "Textile Spinning",     27.40, -1.09,  290,    3500, true,  false, false, true,  true],
  ["DMTM",  "Dhan Fibres Ltd",            "Textile Spinning",     11.90,  0.84,  180,    1200, true,  false, false, true,  true],
  ["ELTM",  "Elite Textile Mills",        "Textile Spinning",     13.20, -0.75,  210,    1400, true,  false, false, true,  true],
  ["FTML",  "Faisalabad Textile Mills",   "Textile Spinning",     18.70,  1.12,  260,    2200, true,  false, false, true,  true],
  ["GOTM",  "Gulistan Textile Mills",     "Textile Spinning",     15.40, -0.65,  190,    1800, true,  false, false, true,  true],
  ["HATM",  "Hassan Ali Rice & Oil",      "Textile Spinning",     12.60,  0.80,  160,    1300, true,  false, false, true,  true],
  ["ILTEX", "Ibrahim Fibres Ltd",         "Textile Spinning",     46.20, -0.43,  450,    8500, true,  false, false, true,  true],
  ["JNTM",  "Janana Demal Cotton",        "Textile Spinning",     10.50,  0.96,  140,    1100, true,  false, false, true,  true],
  ["KRTM",  "Karachi Textile Mills",      "Textile Spinning",     11.80, -0.84,  170,    1200, true,  false, false, true,  true],
  ["LWTM",  "Lawrencepur Woollen Mills",  "Textile Spinning",     45.30,  0.22,  120,    3500, true,  false, false, true,  true],
  ["MNTM",  "Moonlite Pak Ltd",           "Textile Spinning",     12.40, -0.32,  160,    1300, true,  false, false, true,  true],
  ["NOTM",  "Noor Fatima Textile",        "Textile Spinning",      9.80,  1.03,  200,    1000, true,  false, false, true,  true],
  ["PKTM",  "Pak Synthetic Ltd",          "Textile Spinning",     13.90, -0.72,  210,    1500, true,  false, false, true,  true],
  ["RNTM",  "Reliance Weaving Mills",     "Textile Spinning",     11.40,  0.88,  180,    1100, true,  false, false, true,  true],
  ["SNTM",  "Sara Textiles Ltd",          "Textile Spinning",     15.70, -0.63,  220,    1700, true,  false, false, true,  true],
  ["TSTM",  "Thal Sialkot Textile",       "Textile Spinning",     17.30, -1.16,  190,    2000, true,  false, false, true,  true],
  ["USTM",  "Usman Textile Mills",        "Textile Spinning",     14.50,  0.69,  170,    1600, true,  false, false, true,  true],
  ["VSTM",  "Valika Textile Ltd",         "Textile Spinning",     10.90,  1.84,  150,    1100, true,  false, false, true,  true],

  // ── More Textile Composite (Shariah) ──────────────────────────────────────
  ["ARTC",  "Artistic Milliners Ltd",     "Textile Composite",    48.60, -0.82,  340,    7000, true,  false, false, true,  true],
  ["CRTC",  "Crescent Bahuman Ltd",       "Textile Composite",    24.30, -0.41,  270,    3500, true,  false, false, true,  true],
  ["DNRM",  "Denim & Dyes Ltd",           "Textile Composite",    13.80,  1.45,  210,    2000, true,  false, false, true,  true],
  ["ELCM",  "Elite Clothing Ltd",         "Textile Composite",    16.40, -0.61,  190,    2200, true,  false, false, true,  true],
  ["FRBL",  "Feroze1888 Mills Ltd",       "Textile Composite",   110.50, -0.27,  160,   12000, true,  false, false, true,  true],
  ["GRTC",  "Gul Ahmed Finishing",        "Textile Composite",    22.80,  0.44,  280,    3000, true,  false, false, true,  true],
  ["HRTC",  "Hira Terry Mills Ltd",       "Textile Composite",    14.60, -0.68,  200,    1800, true,  false, false, true,  true],
  ["IRTC",  "Ibrahim Energy Ltd",         "Textile Composite",    19.30,  0.52,  240,    2500, true,  false, false, true,  true],
  ["NRTC",  "Nishat Chunian Ltd",         "Textile Composite",    61.20, -0.49,  360,    8000, true,  false, false, true,  true],
  ["SRTC",  "Siam Eastern Knitwear",      "Textile Composite",    11.90,  1.68,  160,    1400, true,  false, false, true,  true],

  // ── More Sugar & Allied (Shariah) ─────────────────────────────────────────
  ["ATMT",  "Al-Taj Sugar Mills",         "Sugar & Allied",       14.50,  0.69,  230,    1800, true,  false, false, true,  true],
  ["BSML",  "Bawany Sugar Mills",         "Sugar & Allied",       12.80, -0.78,  190,    1500, true,  false, false, true,  true],
  ["CSML",  "Chashma Sugar Mills",        "Sugar & Allied",       10.40,  1.92,  160,    1200, true,  false, false, true,  true],
  ["DSML",  "Dewan Sugar Mills",          "Sugar & Allied",        9.90, -0.50,  140,    1000, true,  false, false, true,  true],
  ["ESML",  "Etihad Sugar Mills",         "Sugar & Allied",       11.20, -0.89,  180,    1300, true,  false, false, true,  true],
  ["GSML",  "Gulshan Sugar Mills",        "Sugar & Allied",        8.70,  1.15,  120,     900, true,  false, false, true,  true],
  ["HSSM",  "Hussain Sugar Mills",        "Sugar & Allied",       10.90,  0.93,  150,    1100, true,  false, false, true,  true],
  ["IGSM",  "Indus Sugar Mills",          "Sugar & Allied",        9.40, -0.21,  130,    1000, true,  false, false, true,  true],
  ["KHSM",  "Khurshid Spinning Mills",   "Sugar & Allied",        12.30,  0.82,  170,    1400, true,  false, false, true,  true],
  ["LSSM",  "Layyah Sugar Mills",         "Sugar & Allied",        8.90, -1.12,  110,     900, true,  false, false, true,  true],
  ["MASM",  "Mirpurkhas Sugar Mills",     "Sugar & Allied",       10.20,  1.98,  140,    1100, true,  false, false, true,  true],
  ["NSSM",  "Noon Sugar Mills",           "Sugar & Allied",        9.70, -0.41,  120,    1000, true,  false, false, true,  true],
  ["OSSM",  "Omni Sugar Mills",           "Sugar & Allied",       11.80,  0.85,  160,    1300, true,  false, false, true,  true],
  ["PSSM",  "Pangrio Sugar Mills",        "Sugar & Allied",        8.50,  0.71,  100,     800, true,  false, false, true,  true],
  ["RSSM",  "Rohri Sugar Mills",          "Sugar & Allied",       14.70, -0.34,  190,    1700, true,  false, false, true,  true],
  ["SSSM",  "Shahmurad Sugar Mills",      "Sugar & Allied",       10.60,  0.95,  140,    1100, true,  false, false, true,  true],
  ["TSSM",  "Tandlianwala Sugar Mills",   "Sugar & Allied",       12.10, -0.83,  160,    1400, true,  false, false, true,  true],
  ["WSSM",  "Waqas Sugar Mills",          "Sugar & Allied",        9.30, -0.32,  110,     950, true,  false, false, true,  true],

  // ── More Engineering (Shariah) ────────────────────────────────────────────
  ["AFFM",  "Afzal Industries Ltd",       "Engineering",          22.40,  1.34,  280,    3500, true,  false, false, true,  true],
  ["BITL",  "Bestway Cement Ltd",         "Engineering",         121.30, -0.33,  560,   25000, true,  false, false, true,  true],
  ["CRTI",  "Crtical Industries Pak",     "Engineering",          18.90,  0.53,  230,    2800, true,  false, false, true,  true],
  ["DPML",  "Dewan Petroleum Motor",      "Engineering",          14.20, -0.70,  180,    2000, true,  false, false, true,  true],
  ["EMCO",  "Emco Industries Ltd",        "Engineering",          24.60, -0.81,  310,    3800, true,  false, false, true,  true],
  ["FGEL",  "Fauji Goods & Elec.",        "Engineering",          19.80,  1.01,  260,    3000, true,  false, false, true,  true],
  ["GHMF",  "Ghani Glass Fab",            "Engineering",          27.30, -0.73,  350,    4500, true,  false, false, true,  true],
  ["HMBL",  "Habib Metropolitan Build.",  "Engineering",          16.50,  0.61,  200,    2400, true,  false, false, true,  true],
  ["IMPL",  "Imperial Industries Ltd",    "Engineering",          21.40, -0.93,  270,    3200, true,  false, false, true,  true],
  ["JSCL",  "Javedan Corp Ltd",           "Engineering",          21.80,  1.38,  890,    6500, true,  false, false, true,  true],
  ["KPOL",  "Khyber Pakhtunkhwa Oil",     "Engineering",          15.30, -0.65,  190,    2200, true,  false, false, true,  true],
  ["LECM",  "Lalpir Power (Eng Div)",     "Engineering",          18.70, -0.53,  230,    2800, true,  false, false, true,  true],
  ["MNGL",  "Mangla Electric Motors",     "Engineering",          13.40,  0.75,  170,    1800, true,  false, false, true,  true],
  ["NMNL",  "National Motors Ltd",        "Engineering",          31.20,  0.32,  230,    3000, true,  false, false, true,  true],
  ["OCCL",  "Octoplus Chemicals",         "Engineering",          14.80, -0.27,  180,    2000, true,  false, false, true,  true],
  ["RMPL",  "Ravi Metal Industries",      "Engineering",          16.90,  1.18,  210,    2500, true,  false, false, true,  true],
  ["SCIL",  "Siemens Eng. Pakistan",      "Engineering",         452.50, -0.11,   80,   35000, true,  false, false, true,  true],
  ["TMTL",  "Transmission Motor Ltd",     "Engineering",          12.60, -0.79,  150,    1600, true,  false, false, true,  true],
  ["WFIL",  "Wahid Farooqui Industries",  "Engineering",          19.50,  0.51,  250,    2900, true,  false, false, true,  true],

  // ── More Pharmaceuticals (Shariah) ────────────────────────────────────────
  ["AMPL",  "Archroma Pakistan Ltd",      "Pharmaceuticals",      76.30, -0.52,  220,    8500, true,  false, false, true,  true],
  ["BRPL",  "Bio-Labs Pharma",            "Pharmaceuticals",      12.80, -0.78,  180,    1800, true,  false, false, true,  true],
  ["COAL",  "Coral Pharma Ltd",           "Pharmaceuticals",      15.30,  1.30,  200,    2200, true,  false, false, true,  true],
  ["DNPL",  "Dawa Pharma Ltd",            "Pharmaceuticals",      10.90, -0.91,  160,    1400, true,  false, false, true,  true],
  ["EXPO",  "Excel Pharma Ltd",           "Pharmaceuticals",      17.50,  0.57,  230,    2600, true,  false, false, true,  true],
  ["FPHL",  "Faisal Pharma Holdings",     "Pharmaceuticals",      14.20, -0.70,  180,    2000, true,  false, false, true,  true],
  ["GVPL",  "Genome Pharma Ltd",          "Pharmaceuticals",      11.40,  1.76,  150,    1600, true,  false, false, true,  true],
  ["HPPL",  "Hilton Pharma Ltd",          "Pharmaceuticals",      22.30, -0.44,  280,    3200, true,  false, false, true,  true],
  ["ITPL",  "Ithmar Pharma Ltd",          "Pharmaceuticals",      16.80,  0.60,  210,    2400, true,  false, false, true,  true],
  ["KPPL",  "Karachi Pharma Ltd",         "Pharmaceuticals",      13.60, -0.73,  170,    1900, true,  false, false, true,  true],
  ["LPPL",  "Lahore Pharma Ltd",          "Pharmaceuticals",      12.10,  0.83,  160,    1700, true,  false, false, true,  true],
  ["MHPL",  "Martin Dow Pharma",          "Pharmaceuticals",      38.40, -0.26,  290,    5500, true,  false, false, true,  true],
  ["NCPL2", "Nimir Chemicals Pharma",     "Pharmaceuticals",      24.60, -1.21,  320,    3600, true,  false, false, true,  true],
  ["OMPL",  "Osmose Pharma Ltd",          "Pharmaceuticals",      11.80,  1.69,  150,    1600, true,  false, false, true,  true],
  ["PVPL",  "Pharma Vita Ltd",            "Pharmaceuticals",      13.20, -0.75,  170,    1800, true,  false, false, true,  true],
  ["RMTL",  "Remington Pharma Ltd",       "Pharmaceuticals",      18.90,  0.53,  240,    2800, true,  false, false, true,  true],
  ["STPL2", "Sterling Health Pak",        "Pharmaceuticals",      15.70, -0.63,  200,    2200, true,  false, false, true,  true],
  ["TPPL",  "Tri-Pack Films Pharma",      "Pharmaceuticals",      26.40, -0.37,  330,    3900, true,  false, false, true,  true],
  ["UVPL",  "Universal Pharma Ltd",       "Pharmaceuticals",      12.50,  0.80,  160,    1700, true,  false, false, true,  true],
  ["VBPL",  "VitaBio Pharma Ltd",         "Pharmaceuticals",      14.80, -0.27,  190,    2100, true,  false, false, true,  true],

  // ── Food & FMCG Extra (Shariah) ───────────────────────────────────────────
  ["ABFL",  "Al-Baraka Foods Ltd",        "Food & FMCG",          16.30,  1.84,  250,    2400, true,  false, false, true,  true],
  ["BFFL",  "Bake with Care Foods",       "Food & FMCG",          11.90, -0.84,  170,    1600, true,  false, false, true,  true],
  ["CFFL",  "Cheezious Foods Ltd",        "Food & FMCG",          18.60,  0.54,  240,    2800, true,  false, false, true,  true],
  ["DFFL",  "Dawn Foods Pak Ltd",         "Food & FMCG",          22.40, -0.89,  310,    3400, true,  false, false, true,  true],
  ["EFFL",  "Engro Foods Ltd",            "Food & FMCG",          65.70, -0.45,  560,   14000, true,  true,  false, true,  true],
  ["FFFL",  "Falak Foods Pak Ltd",        "Food & FMCG",          12.30,  0.81,  160,    1700, true,  false, false, true,  true],
  ["GFFL",  "Gourmet Foods Ltd",          "Food & FMCG",          29.50, -0.67,  390,    4500, true,  false, false, true,  true],
  ["HFFL",  "Hilal Foods Ltd",            "Food & FMCG",          18.40, -1.08,  240,    2700, true,  false, false, true,  true],
  ["IFFL",  "Iffco Pakistan Ltd",         "Food & FMCG",          14.70,  0.68,  190,    2100, true,  false, false, true,  true],
  ["JFFL",  "Junaid Foods Pak",           "Food & FMCG",          13.60, -0.73,  180,    1900, true,  false, false, true,  true],
  ["KFFL",  "K&Ns Foods Ltd",             "Food & FMCG",          42.80,  0.47,  380,    7500, true,  false, false, true,  true],
  ["LFFL",  "Larosh Foods Ltd",           "Food & FMCG",          10.20, -0.98,  140,    1400, true,  false, false, true,  true],
  ["MFFL",  "Mitchell's Fruit Farms",     "Food & FMCG",          48.30,  0.21,  170,    6500, true,  false, false, true,  true],
  ["NFFL",  "National Foods Ltd",         "Food & FMCG",          77.40, -0.38,  430,   13000, true,  true,  false, true,  true],
  ["OFFL",  "Oleochemicals Pak Ltd",      "Food & FMCG",          14.90,  1.34,  200,    2100, true,  false, false, true,  true],
  ["PFFL",  "Pitcher Foods Ltd",          "Food & FMCG",          12.80, -0.78,  170,    1800, true,  false, false, true,  true],
  ["RFFL",  "Rafhan Corn Products",       "Food & FMCG",          31.60,  0.64,  220,    4500, true,  false, false, true,  true],
  ["SFFL",  "Shezan International",       "Food & FMCG",         239.50,  0.21,   90,   12000, true,  false, false, true,  true],

  // ── Chemical Extra (Shariah) ──────────────────────────────────────────────
  ["ALTH",  "Altamash Chemical Ltd",      "Chemical",             16.40, -0.61,  210,    2400, true,  false, false, true,  true],
  ["BLCL",  "Brite Lint & Chemical",      "Chemical",             12.80, -0.78,  170,    1700, true,  false, false, true,  true],
  ["CLCL",  "Color Chem Ltd",             "Chemical",             18.90,  0.53,  250,    2800, true,  false, false, true,  true],
  ["DLCL",  "Descon Chemicals Ltd",       "Chemical",             22.60, -0.44,  300,    3400, true,  false, false, true,  true],
  ["ELCL",  "Elite Chemical Ltd",         "Chemical",             14.30,  0.70,  190,    2000, true,  false, false, true,  true],
  ["FLCL",  "Fauji Chemicals Ltd",        "Chemical",             28.50, -0.35,  380,    4200, true,  false, false, true,  true],
  ["GLCL",  "Grand Chemical Ltd",         "Chemical",             13.60, -0.73,  180,    1900, true,  false, false, true,  true],
  ["HLCL",  "Hallmark Chemical Ltd",      "Chemical",             15.70, -0.63,  210,    2200, true,  false, false, true,  true],
  ["ILCL",  "Ittehad Pvt Chemical Ltd",   "Chemical",             11.40,  1.76,  150,    1600, true,  false, false, true,  true],
  ["JLCL",  "Johar Chemical Ltd",         "Chemical",             16.80,  0.60,  220,    2400, true,  false, false, true,  true],
  ["KLCL",  "Kohat Chemical Works",       "Chemical",             19.50, -0.51,  260,    2900, true,  false, false, true,  true],
  ["LLCL",  "Lotte Chemical Pak",         "Chemical",             34.20, -0.29,  310,    5000, true,  false, false, true,  true],
  ["MLCHEM","Mehran Chemical Ltd",        "Chemical",             13.20,  0.75,  170,    1800, true,  false, false, true,  true],
  ["NLCL",  "National Chemical Ltd",      "Chemical",             21.40, -0.93,  280,    3200, true,  false, false, true,  true],
  ["OLCL",  "Oxbridge Chemicals Ltd",     "Chemical",             14.80, -0.27,  190,    2100, true,  false, false, true,  true],

  // ── Cable & Electrical Goods ──────────────────────────────────────────────
  ["FCL",   "Fauji Cement Ltd",           "Cable & Elec. Goods",  28.30,  2.76, 20900,  85000, true,  true,  false, true,  true],
  ["WAVESAPP","Waves Singer Pak",         "Cable & Elec. Goods",   9.01, -0.33, 2300,    8000, true,  false, false, true,  true],
  ["LSE",   "Lahore Stock Exchange",      "Cable & Elec. Goods",  13.20, -1.34,  890,    4000, false, false, false, false, false],
  ["LSEC",  "LS Engineering Co.",         "Cable & Elec. Goods",  12.80, -0.78,  340,    2000, false, false, false, false, false],
  ["WAVS",  "Waves Home Appliances",      "Cable & Elec. Goods",  22.00, -0.45,  340,    4000, true,  false, false, true,  true],

  // ── Modarabas ─────────────────────────────────────────────────────────────
  ["FPJM",  "First Pak Modaraba",         "Modarabas",             6.40,  1.27, 1230,    3000, true,  false, false, true,  true],
  ["BRR",   "BRR Guardian Modaraba",      "Modarabas",             7.80,  0.51,  560,    2500, true,  false, false, true,  true],
  ["UCAPM", "UCA Pak Modaraba",           "Modarabas",             5.20, -0.38,  340,    2000, true,  false, false, true,  true],
  ["FMFBL", "First Micro Finance",        "Modarabas",             8.90,  0.90,  450,    3000, true,  false, false, true,  true],
  ["TRIBL", "Tristar Modaraba",           "Modarabas",            10.40,  0.48,  230,    2000, true,  false, false, true,  true],
  ["HBML",  "Habib Metro Modaraba",       "Modarabas",             9.10, -0.55,  180,    2500, true,  false, false, true,  true],

  // ── Property ──────────────────────────────────────────────────────────────
  ["TPLP",  "TPL Properties Ltd",         "Property",             14.86, -0.94, 5600,   18000, true,  false, false, true,  true],
  ["PACE",  "Pace (Pakistan) Ltd",        "Property",             10.68,  0.02, 3500,    5000, false, false, false, false, false],
  ["LO",    "Lucky One Ltd",              "Property",             12.40, -0.56,  340,    3000, false, false, false, false, false],

  // ── Automobile more ───────────────────────────────────────────────────────
  ["SLM",   "Sazgar Engineering Works",   "Automobile",          234.50, -0.43,  780,   14000, true,  false, false, true,  true],
  ["MAC",   "Millat Equipment Ltd",       "Automobile",           97.20,  0.10,  560,    6000, true,  false, false, true,  true],
  ["GAT",   "Ghani Automobile Ind.",      "Automobile",           34.20, -1.15,  450,    5000, true,  false, false, true,  true],

  // ── Insurance more ────────────────────────────────────────────────────────
  ["JGICL", "Jubilee General Ins.",       "Insurance",            89.11,  0.55,  450,   10000, false, false, false, false, false],
  ["CSIL",  "Crescent Star Ins.",         "Insurance",             6.85, -0.07,  560,    2000, false, false, false, false, false],
  ["PAKRI", "Pak Reinsurance",            "Insurance",            18.44, -2.07, 11600,   8000, false, false, false, false, false],

  // ── Textile Spinning more ─────────────────────────────────────────────────
  ["BNL",   "Bhanero Textile Mills",      "Textile Spinning",     16.23, -0.55, 3300,    5000, true,  false, false, true,  true],
  ["DSIL2", "Dewan Salman (B)",           "Textile Spinning",     11.57,  4.57, 11900,   3000, false, false, false, false, false],
  ["QTE",   "Quetta Textile",             "Textile Spinning",     46.40, -0.64,  120,    4000, true,  false, false, true,  true],
  ["GLO",   "Globe Textile",              "Textile Spinning",     11.40, -0.87,  180,    1500, true,  false, false, true,  true],
  ["TATM3", "Tata Textile (C)",           "Textile Spinning",    183.00,  0.55,  180,    5000, true,  false, false, true,  true],
  ["IDTM",  "Ideal Spinning",             "Textile Spinning",     42.00,  0.00,  120,    3000, true,  false, false, true,  true],

  // ── Miscellaneous more ────────────────────────────────────────────────────
  ["WAH",   "Wah Nobel Ltd",              "Miscellaneous",        16.25,  0.31,  330,    4000, false, false, false, false, false],
  ["TREE",  "Treet Corp (Pref)",          "Miscellaneous",        18.60,  0.54,  120,    3000, false, false, false, false, false],
  ["CPL",   "Crescent Pak Ind.",          "Miscellaneous",        12.40,  0.81,  290,    2000, true,  false, false, true,  true],
  ["GRR",   "Grays of Cambridge",         "Miscellaneous",        18.30, -0.54,  180,    2500, false, false, false, false, false],

  // ── Food & FMCG more ──────────────────────────────────────────────────────
  ["ASC",   "Al-Shaheer Corp",            "Food & FMCG",          14.80,  0.68,  560,    4000, true,  false, false, true,  true],
  ["IPAK",  "Ismail Industries",          "Food & FMCG",          39.50,  0.25,  230,    7000, true,  false, false, true,  true],

  // ── Chemical more ─────────────────────────────────────────────────────────
  ["SYNTH", "Synthetic Products",         "Chemical",             14.20, -0.70,  230,    2000, true,  false, false, true,  true],
  ["TRIPF", "Tri-Pack Films Ltd",         "Chemical",             89.40,  0.45,  120,   12000, false, false, false, false, false],
  ["BERG",  "Berger Paints Pak",          "Chemical",            173.20,  0.00,   90,   12000, false, false, false, false, false],
  ["GCN",   "Ghani Chemicals",            "Chemical",             15.40,  0.65,  340,    3000, true,  false, false, true,  true],
  ["GCIL",  "Gul Ahmed Const.",           "Chemical",             33.70,  0.03,  560,    6000, true,  false, false, true,  true],
  ["NRSL",  "Nrsp Microfinance",          "Chemical",             37.50, -0.53,  450,    8000, true,  false, false, true,  true],

  // ── Paper & Board more ────────────────────────────────────────────────────
  ["CPPL",  "Cherat Packaging Ltd",       "Paper & Board",       113.30,  0.54,  180,   10000, false, false, false, false, false],

  // ── Textile Composite more ────────────────────────────────────────────────
  ["NML",   "Nishat Mills Ltd",           "Textile Composite",    89.30, -0.22,  670,   24000, true,  true,  false, true,  true],
  ["KM",    "Kohinoor Mills Ltd",         "Textile Composite",    22.40, -0.89,  340,    3000, true,  false, false, true,  true],
  ["CLOT",  "Chenab Limited",             "Textile Composite",    18.60, -0.53,  230,    3000, true,  false, false, true,  true],

  // ── Glass & Ceramics ──────────────────────────────────────────────────────
  ["GHNI",  "Ghani Value Glass",          "Glass & Ceramics",     18.40,  0.55,  560,    4500, true,  false, false, true,  true],
  ["PKGC",  "Pak Gypsum Ltd",             "Glass & Ceramics",     14.20, -0.70,  340,    2800, true,  false, false, true,  true],
  ["SHCM",  "Shabbir Tiles & Ceramics",   "Glass & Ceramics",     22.80, -1.30,  450,    5000, false, false, false, false, false],
  ["KAPCL", "Karachi Pipe & Sheet",       "Glass & Ceramics",     16.90,  0.59,  280,    3200, false, false, false, false, false],
  ["MRNS",  "Murree Brewery",             "Glass & Ceramics",    680.00, -0.44,   60,   26000, false, false, false, false, false],
  ["MASM2", "Mashal Modaraba",            "Glass & Ceramics",      8.40,  1.45,  190,    1500, true,  false, false, true,  true],
  ["STCL",  "Sitara Chemical Ind.",       "Glass & Ceramics",    298.50, -0.33,   90,   18000, true,  false, false, true,  true],

  // ── Woolen ────────────────────────────────────────────────────────────────
  ["RWPL",  "Rupali Polyester Ltd",       "Woolen",               14.50,  0.69,  230,    2500, true,  false, false, true,  true],
  ["SEWL",  "Service Fabrics Ltd",        "Woolen",               19.80,  1.01,  180,    3000, true,  false, false, true,  true],
  ["NWPL",  "Noon Pakistan Ltd",          "Woolen",               12.40, -0.80,  150,    2000, true,  false, false, true,  true],
  ["PWPL",  "Pak Woolen Ltd",             "Woolen",               11.20,  0.89,  120,    1800, true,  false, false, true,  true],

  // ── Synthetic & Rayon ─────────────────────────────────────────────────────
  ["IBFL2", "Ibrahim Fibres (A)",         "Synthetic & Rayon",    46.20, -0.43,  340,    8000, true,  false, false, true,  true],
  ["PRMS",  "Premiere Synthetics",        "Synthetic & Rayon",    12.80, -0.78,  180,    2000, true,  false, false, true,  true],
  ["SAPL",  "Sind Alkalis (Syn)",         "Synthetic & Rayon",    22.40,  0.45,  230,    3500, true,  false, false, true,  true],
  ["SRPL",  "Saleem Rayon Pvt",          "Synthetic & Rayon",    10.60, -0.94,  150,    1600, true,  false, false, true,  true],
  ["TSPL",  "Trans Asia Polyester",       "Synthetic & Rayon",    14.30,  0.70,  200,    2200, true,  false, false, true,  true],

  // ── Leather & Tanneries ───────────────────────────────────────────────────
  ["BATA",  "Bata Pakistan Ltd",          "Leather & Tanneries", 1490.00, -0.13,   40,   37000, false, false, false, false, false],
  ["SERV",  "Service Industries Ltd",    "Leather & Tanneries",  818.50,  0.06,   60,   20000, false, false, false, false, false],
  ["LTPL",  "Libra Tanneries Ltd",        "Leather & Tanneries",  14.20, -0.70,  180,    2500, true,  false, false, true,  true],
  ["STFL",  "Shabbir Tanning Ltd",        "Leather & Tanneries",  11.80,  0.85,  140,    1800, true,  false, false, true,  true],
  ["ATFL",  "Artistic Tanneries Fab",     "Leather & Tanneries",  16.90,  0.59,  210,    2800, true,  false, false, true,  true],

  // ── Rubber & Plastic ──────────────────────────────────────────────────────
  ["SPEL",  "Synthetic Products (Eng)",   "Rubber & Plastic",     14.20, -0.70,  230,    2000, true,  false, false, true,  true],
  ["RPPL",  "Rubber Products Pakistan",   "Rubber & Plastic",     18.60,  0.54,  280,    3200, true,  false, false, true,  true],
  ["PLCL",  "Plastic Composite Ltd",      "Rubber & Plastic",     11.40,  1.76,  160,    1800, true,  false, false, true,  true],
  ["PRCL",  "Punjab Rubber Ltd",          "Rubber & Plastic",     12.80, -0.78,  190,    2100, false, false, false, false, false],
  ["GPCL",  "General Plastic Corp",       "Rubber & Plastic",      9.90, -0.10,  130,    1400, false, false, false, false, false],

  // ── Tobacco ───────────────────────────────────────────────────────────────
  ["PAKT2", "Pak Tobacco (B Ord)",        "Tobacco",              648.00, -0.15,   80,   55000, false, false, false, false, false],
  ["LAKSON","Lakson Tobacco Co.",          "Tobacco",              260.00,  0.00,   50,   19000, false, false, false, false, false],

  // ── Jute ──────────────────────────────────────────────────────────────────
  ["CJML",  "Crescent Jute Products",     "Jute",                  9.80,  1.03,  120,    1200, true,  false, false, true,  true],
  ["PAKJ",  "Pakistan Jute Mills",        "Jute",                  8.60, -0.92,   90,     900, true,  false, false, true,  true],

  // ── More Commercial Banks ─────────────────────────────────────────────────
  ["SILKB", "Silk Bank Ltd",              "Commercial Banks",       4.80,  0.42,  560,    3500, false, false, false, false, false],
  ["TBNK",  "Tameer Bank Ltd",            "Commercial Banks",       6.20, -0.32,  340,    2500, true,  false, false, true,  true],
  ["UBLSL", "UBL Islamic",               "Commercial Banks",      210.00, -0.23,  230,    5000, true,  false, false, true,  true],
  ["ATML",  "Atlas Money Market",         "Commercial Banks",       9.40,  0.64,  180,    1500, true,  false, false, true,  true],

  // ── More Power Generation ─────────────────────────────────────────────────
  ["FFBL2", "Fauji Foundation Power",     "Power Gen.",            18.40, -0.54,  340,    4000, true,  false, false, true,  true],
  ["GTPL",  "Gulshan Thermal Power",      "Power Gen.",            11.20,  0.89,  230,    2500, true,  false, false, true,  true],
  ["HJPL",  "Haseeb Waqas Sugar (Pwr)",   "Power Gen.",            16.80,  0.60,  180,    3000, true,  false, false, true,  true],
  ["KTML2", "Khushhali Microfinance (P)", "Power Gen.",             8.90, -0.11,  120,    1500, true,  false, false, true,  true],
  ["LHPL",  "Laraib Hydro Power Ltd",     "Power Gen.",            14.60, -1.37,  450,    5500, true,  false, false, true,  true],
  ["MPPL",  "Metro Power Co. Ltd",        "Power Gen.",            22.30, -0.44,  340,    5000, false, false, false, false, false],
  ["NCPL3", "Northern Power Generation",  "Power Gen.",            17.50,  0.57,  280,    3800, false, false, false, false, false],
  ["OIPL",  "Orient Energy Systems",      "Power Gen.",            12.40,  0.81,  190,    2200, false, false, false, false, false],
  ["SNGPL2","Sui Gas (Power)",            "Power Gen.",            19.80, -0.51,  230,    3200, false, false, false, false, false],
  ["TAPL",  "Triconboston Power Ltd",     "Power Gen.",            15.40,  0.65,  210,    2800, false, false, false, false, false],

  // ── More Investment Companies ─────────────────────────────────────────────
  ["ARPL",  "Arif Habib Ltd",             "Inv. Companies",        28.40, -0.35,  560,    8500, false, false, false, false, false],
  ["JSIL",  "JS Investments Ltd",         "Inv. Companies",        14.80,  0.68,  340,    4000, false, false, false, false, false],
  ["NRLB",  "Nimir Resins Ltd",           "Inv. Companies",        22.60, -0.44,  280,    5500, true,  false, false, true,  true],
  ["PABC2", "Pakistan Buisiness Ltd",     "Inv. Companies",        16.30,  0.61,  230,    3000, false, false, false, false, false],
  ["SCBPL2","Pak Gulf Leasing",           "Inv. Companies",        11.20, -0.89,  180,    2500, false, false, false, false, false],
  ["SBSM",  "SB Smart Money Fund",        "Inv. Companies",         9.40,  0.64,  150,    2000, true,  false, false, true,  true],

  // ── More Modarabas ────────────────────────────────────────────────────────
  ["GRPJM", "Guardian Modaraba",          "Modarabas",              6.90,  0.73,  280,    2000, true,  false, false, true,  true],
  ["NMDBA", "NBP Modaraba",              "Modarabas",               8.10, -0.37,  230,    2500, true,  false, false, true,  true],
  ["QMDBA", "Quetta Textile Moda.",       "Modarabas",              5.60,  1.08,  180,    1500, true,  false, false, true,  true],
  ["SMDBA", "Standard Modaraba",         "Modarabas",               7.30, -0.68,  150,    1800, true,  false, false, true,  true],
  ["TMDBA", "Trust Modaraba",            "Modarabas",               9.40,  0.64,  200,    2200, true,  false, false, true,  true],
  ["UMDBA", "UDL Modaraba",              "Modarabas",               6.10, -0.32,  160,    1600, true,  false, false, true,  true],
  ["ZMDBA", "Zeshan Modaraba",           "Modarabas",               5.20,  0.77,  120,    1200, true,  false, false, true,  true],

  // ── More Property / Real Estate ───────────────────────────────────────────
  ["DWTM",  "DWT Properties Ltd",         "Property",              12.80, -0.78,  230,    2500, false, false, false, false, false],
  ["EMRLD", "Emerald Prop. Fund",         "Property",               9.60,  0.42,  180,    2000, true,  false, false, true,  true],
  ["KPITL", "KPT Properties Ltd",         "Property",              11.40, -0.35,  150,    1800, false, false, false, false, false],
  ["MHRL",  "Mughal Properties Ltd",      "Property",              14.20,  0.70,  200,    2800, false, false, false, false, false],
  ["NPML",  "Nishat Properties & Hotels", "Property",              18.60, -0.54,  280,    4000, true,  false, false, true,  true],

  // ── More Leasing ──────────────────────────────────────────────────────────
  ["AICL2", "AI Capital Leasing",         "Leasing",               11.40,  0.88,  150,    1800, false, false, false, false, false],
  ["BFLC",  "Butt Fibers Leasing",        "Leasing",                9.80, -0.20,  120,    1400, false, false, false, false, false],
  ["CMFL",  "Crescent Modaraba Fin.",      "Leasing",               13.60,  0.73,  180,    2200, true,  false, false, true,  true],
  ["DMFL",  "Dhanani Modaraba Fin.",       "Leasing",               10.20,  0.98,  140,    1600, true,  false, false, true,  true],
  ["EMFL",  "Engro Modaraba Fin.",         "Leasing",               14.80,  0.54,  200,    2400, true,  false, false, true,  true],
  ["FMFL",  "Faysal Modaraba Fin.",        "Leasing",                8.90, -0.11,  110,    1300, true,  false, false, true,  true],

  // ── More Closed-End Funds ─────────────────────────────────────────────────
  ["ALICF", "Atlas Islamic Fund",          "Closed-End Funds",      11.80,  0.85,  140,    2200, true,  false, false, true,  true],
  ["BIICF", "BMA Islamic Fund",            "Closed-End Funds",       9.60, -0.42,  110,    1700, true,  false, false, true,  true],
  ["CIICF", "Crosby Islamic Fund",         "Closed-End Funds",      10.40,  0.96,  130,    1900, true,  false, false, true,  true],
  ["DIICF", "Dollar East Fund",            "Closed-End Funds",       8.20,  0.61,   90,    1400, true,  false, false, true,  true],
  ["EIICF", "Engro Islamic Fund",          "Closed-End Funds",      13.20, -0.75,  160,    2400, true,  false, false, true,  true],

  // ── More Paper & Board ────────────────────────────────────────────────────
  ["DPBM",  "DW Paper & Board",            "Paper & Board",         16.80,  0.60,  230,    3000, false, false, false, false, false],
  ["EPBM",  "Emmay Pak Paper",             "Paper & Board",         12.40, -0.80,  180,    2200, false, false, false, false, false],
  ["FPBM",  "Frontier Paper Mills",        "Paper & Board",         14.60,  0.68,  200,    2600, false, false, false, false, false],
  ["GPBM",  "Greaves Cotton Paper",        "Paper & Board",         18.30, -0.54,  260,    3500, false, false, false, false, false],

  // ── More Vanaspati & Allied ───────────────────────────────────────────────
  ["BVMI",  "Bannu Woollen Mills",         "Vanaspati & Allied",   22.40,  1.34,  230,    3500, true,  false, false, true,  true],
  ["CVMI",  "Crescent Vanaspati",          "Vanaspati & Allied",   14.20, -0.70,  180,    2200, true,  false, false, true,  true],
  ["DVMI",  "Dalda Foods Ltd",             "Vanaspati & Allied",   19.80,  0.51,  250,    3200, true,  false, false, true,  true],
  ["EVMI",  "Eastern Refinery Veg.",       "Vanaspati & Allied",   11.40,  0.88,  150,    1800, true,  false, false, true,  true],
  ["FVMI",  "Frontier Vanaspati",          "Vanaspati & Allied",   12.80, -0.78,  170,    2000, true,  false, false, true,  true],
  ["GVMI",  "Golden Vanaspati",            "Vanaspati & Allied",    9.60,  0.42,  120,    1400, true,  false, false, true,  true],

  // ── More Insurance ────────────────────────────────────────────────────────
  ["AMINS", "Alpha Insurance Co.",         "Insurance",             14.80,  0.68,  230,    2800, false, false, false, false, false],
  ["BGINS", "Beema Pakistan Ltd",          "Insurance",             12.40, -0.80,  180,    2200, false, false, false, false, false],
  ["CGINS", "Century Insurance Co.",       "Insurance",             18.60,  0.54,  260,    3800, false, false, false, false, false],
  ["DGINS", "Dadabhoy Insurance",          "Insurance",             10.20,  0.98,  140,    1800, false, false, false, false, false],
  ["EGINS", "EFU Life Assurance",          "Insurance",            127.40, -0.31,   90,   14000, false, false, false, false, false],
  ["FGINS", "First Capital Securities",    "Insurance",              9.60, -0.42,  130,    1600, false, false, false, false, false],
  ["HGINS", "Habib Insurance Co.",         "Insurance",             12.80, -0.78,  170,    2400, false, false, false, false, false],
  ["IGINS", "International General Ins.",  "Insurance",             16.40, -0.61,  210,    3000, false, false, false, false, false],

  // ── More Transport ────────────────────────────────────────────────────────
  ["AAPL",  "Agritech (Air)",              "Transport",             11.20,  0.89,  180,    2200, true,  false, false, true,  true],
  ["BBPL",  "BOP Aviation Logistics",      "Transport",             14.80, -0.27,  230,    3200, false, false, false, false, false],
  ["CCPL",  "Cargo Connect Pak",           "Transport",              9.60,  0.42,  150,    1800, false, false, false, false, false],
  ["DDPL",  "DHL Pakistan Ltd",            "Transport",             18.40, -0.54,  260,    4200, false, false, false, false, false],
  ["EEPL",  "Elite Cargo Ltd",             "Transport",             12.60,  0.80,  190,    2600, false, false, false, false, false],

  // ── More Automobile ───────────────────────────────────────────────────────
  ["ALAM",  "Alam Automobiles",            "Automobile",            24.80,  1.21,  340,    4500, true,  false, false, true,  true],
  ["BERGE", "Berge Pakistan Motors",       "Automobile",            18.60, -0.54,  230,    3200, false, false, false, false, false],
  ["CAHA",  "Changan Automobile Pak",      "Automobile",            34.20,  0.58,  450,    7500, false, false, false, false, false],
  ["DAHA",  "Daehan Automotive",           "Automobile",            22.40, -1.07,  280,    4200, false, false, false, false, false],
  ["EAHA",  "EV Auto Pakistan",            "Automobile",            12.80,  1.56,  390,    3800, true,  false, false, true,  true],
  ["FAHA",  "FAW Vehicle Pak",             "Automobile",            28.60, -0.35,  340,    5500, false, false, false, false, false],

  // ── More Cable & Elec. Goods ──────────────────────────────────────────────
  ["GCAL",  "General Cable Pak",           "Cable & Elec. Goods",  24.80,  0.81,  340,    5500, false, false, false, false, false],
  ["HCAL",  "Hakson Electric",             "Cable & Elec. Goods",  18.60, -0.54,  250,    3800, true,  false, false, true,  true],
  ["ICAL",  "International Industries",   "Cable & Elec. Goods",   82.40,  0.49,  340,   18000, false, true,  false, false, false],
  ["JCAL",  "Johnson Electric Pak",        "Cable & Elec. Goods",  14.20, -0.70,  190,    2800, false, false, false, false, false],
  ["KCAL",  "K-Electric Cable",            "Cable & Elec. Goods",  12.80,  0.78,  160,    2200, false, false, false, false, false],
  ["LCAL",  "Laurus Cable Ltd",            "Cable & Elec. Goods",  16.40, -0.61,  210,    3000, true,  false, false, true,  true],
  ["MCAL",  "Modern Electric Ltd",         "Cable & Elec. Goods",  11.20,  0.89,  150,    1900, true,  false, false, true,  true],
  ["NCAL",  "National Cable Pak",          "Cable & Elec. Goods",  19.80,  0.51,  270,    4000, false, false, false, false, false],
  ["OCAL",  "Orient Electric Ltd",         "Cable & Elec. Goods",  22.60, -0.44,  300,    4800, true,  false, false, true,  true],
  ["PCAL2", "PEL (Cable Div.)",            "Cable & Elec. Goods",  67.90, -1.94,  180,   17000, false, false, false, false, false],

  // ── More Miscellaneous ────────────────────────────────────────────────────
  ["AMIC",  "Amtex Industries",            "Miscellaneous",         14.80, -0.27,  230,    3000, true,  false, false, true,  true],
  ["BMIC",  "BPP Industries",              "Miscellaneous",         11.20,  0.89,  180,    2200, true,  false, false, true,  true],
  ["CMIC",  "Crown Group Pak",             "Miscellaneous",         16.40, -0.61,  240,    3400, false, false, false, false, false],
  ["DMIC",  "Dewan Group Ltd",             "Miscellaneous",          9.60,  0.42,  150,    1800, false, false, false, false, false],
  ["EMIC",  "Eagle Group Pakistan",        "Miscellaneous",         12.80, -0.78,  190,    2600, false, false, false, false, false],
  ["FMIC",  "Fintech Pakistan Ltd",        "Miscellaneous",         18.60,  1.08,  280,    4200, true,  false, false, true,  true],
  ["GMIC",  "Galaxy Group Ltd",            "Miscellaneous",         14.20, -0.70,  200,    2800, true,  false, false, true,  true],
  ["HMIC",  "HMC Pak Ltd",                "Miscellaneous",          22.40, -0.89,  310,    5000, true,  false, false, true,  true],
  ["IMIC",  "Ideal Industries",            "Miscellaneous",          10.80,  0.93,  160,    2000, false, false, false, false, false],
  ["JMIC",  "JW Group Pakistan",           "Miscellaneous",          15.60, -0.64,  220,    3200, false, false, false, false, false],

  // ── More Fertilizers ──────────────────────────────────────────────────────
  ["GNFC",  "Gharibwal Nitro-Chem",        "Fertilizers",           22.40,  0.45,  340,    5000, true,  false, false, true,  true],
  ["HNFC",  "Hira Nitro Chem Ltd",         "Fertilizers",           14.80, -0.27,  230,    3200, true,  false, false, true,  true],
  ["INFC",  "ICI Fertilizers Pak",         "Fertilizers",           34.60,  0.29,  280,    6500, false, false, false, false, false],
  ["JNFC",  "Jaffer Brothers Fert.",       "Fertilizers",           18.20, -0.55,  200,    3800, true,  false, false, true,  true],
  ["KNFC",  "Khyber Fertilizers",          "Fertilizers",           12.40,  0.81,  160,    2600, true,  false, false, true,  true],
  ["LNFC",  "Lalpir Fertilizer Ltd",       "Fertilizers",           16.80,  0.60,  210,    3400, true,  false, false, true,  true],
  ["MNFC",  "Makro Fertilizer Ltd",        "Fertilizers",           11.20, -0.89,  150,    2200, true,  false, false, true,  true],
  ["NNFC",  "Nimir Fertilizer Ltd",        "Fertilizers",           24.60, -1.21,  320,    5500, true,  false, false, true,  true],

  // ── More Cement ───────────────────────────────────────────────────────────
  ["BWCL",  "Best Way Cement Ltd",         "Cement",               121.30, -0.33,  560,   25000, true,  true,  false, true,  true],
  ["CWCL",  "Cherat Cement (B)",           "Cement",               141.80, -0.84,  230,   22000, true,  false, false, true,  true],
  ["DWCL",  "DG Khan Cement (B)",          "Cement",               101.50, -1.66,  180,   31000, true,  false, false, true,  true],
  ["EWCL",  "Empire Cement Ltd",           "Cement",                14.80,  0.68,  340,    4000, false, false, false, false, false],
  ["FWCL",  "Flying Cement Co.",           "Cement",                 8.20,  1.46,  560,    3500, false, false, false, false, false],
  ["GWCL",  "Gharibwal Cement (B)",        "Cement",                29.40, -0.67,  230,    7000, true,  false, false, true,  true],
  ["HWCL",  "Hattar Industries",           "Cement",                16.40, -1.22,  280,    4500, false, false, false, false, false],
  ["IWCL",  "Imperial Industries Cem.",    "Cement",                12.80,  0.78,  210,    3200, true,  false, false, true,  true],

  // ── More Engineering (new) ────────────────────────────────────────────────
  ["AENL",  "Agriauto Industries",         "Engineering",           98.40,  0.41,  280,   13000, true,  false, false, true,  true],
  ["BENL",  "Bolan Castings Ltd",          "Engineering",           34.20, -0.58,  230,    5500, true,  false, false, true,  true],
  ["CENL",  "Crescent Steel & Allied",     "Engineering",           88.60,  0.34,  340,   14000, true,  false, false, true,  true],
  ["DENL",  "DWP Enviro Pak",              "Engineering",           14.80, -0.27,  190,    2800, false, false, false, false, false],
  ["EENL",  "Economy Pack Ltd",            "Engineering",           22.40,  0.45,  280,    4500, false, false, false, false, false],
  ["FENL",  "Fecto Belarus Tractors",      "Engineering",           18.60, -0.54,  230,    3500, false, false, false, false, false],
  ["GENL",  "General Tyre (Pak)",          "Engineering",           78.30, -0.51,  340,   12000, false, false, false, false, false],
  ["HENL",  "Honda Atlas Cars",            "Engineering",          498.60, -0.28,  230,   47000, true,  false, false, true,  true],
  ["IENL",  "Indus Steel Products",        "Engineering",           24.80, -1.21,  310,    5000, false, false, false, false, false],
  ["JENL",  "Javedan Cement (Eng.)",       "Engineering",           21.80,  1.38,  280,    6500, true,  false, false, true,  true],
];

export const STOCKS: StockData[] = RAW.map(r => ({
  sym: r[0], name: r[1], sector: r[2], price: r[3], chg: r[4],
  vol: r[5], cap: r[6], shariah: r[7],
  kse100: r[8], kse30: r[9], kmi30: r[10], kmiAll: r[11],
}));

export const SECTORS = [...new Set(STOCKS.map(s => s.sector))].sort();

export type IndexFilter = "kse100" | "kse30" | "kmi30" | "kmiAll" | "all" | "islamic";

export function filterStocks(stocks: StockData[], idx: IndexFilter): StockData[] {
  if (idx === "all")     return stocks;
  if (idx === "kse100")  return stocks.filter(s => s.kse100);
  if (idx === "kse30")   return stocks.filter(s => s.kse30);
  if (idx === "kmi30")   return stocks.filter(s => s.kmi30);
  if (idx === "kmiAll")  return stocks.filter(s => s.kmiAll);
  if (idx === "islamic") return stocks.filter(s => s.shariah);
  return stocks;
}

// Sector → unique dark hue pair [gain, loss] — all greens / reds / maroons
const SECTOR_PALETTE: Record<string, [string, string]> = {
  "Commercial Banks":      ["#14532d", "#7f1d1d"],
  "Oil & Gas Expl.":      ["#166534", "#991b1b"],
  "Oil & Gas Mktg.":      ["#15803d", "#b91c1c"],
  "Cement":               ["#1a5c2a", "#7f1d1d"],
  "Technology & Comm.":   ["#14532d", "#991b1b"],
  "Fertilizer":           ["#166534", "#7f1d1d"],
  "Textile Composite":    ["#1a4a2a", "#a21c1c"],
  "Textile Spinning":     ["#15803d", "#7f1d1d"],
  "Power Gen. & Dist.":   ["#14532d", "#991b1b"],
  "Pharmaceuticals":      ["#166534", "#b91c1c"],
  "Chemicals":            ["#1a5c2a", "#7f1d1d"],
  "Refinery":             ["#15803d", "#991b1b"],
  "Food & Personal Care": ["#14532d", "#7f1d1d"],
  "Automobile Assembler": ["#166534", "#b91c1c"],
  "Automobile Parts":     ["#1a4a2a", "#991b1b"],
  "Engineering":          ["#14532d", "#7f1d1d"],
  "Insurance":            ["#166534", "#a21c1c"],
  "Investment Banks":     ["#1a5c2a", "#991b1b"],
  "Modarabas":            ["#15803d", "#7f1d1d"],
  "Paper & Board":        ["#14532d", "#b91c1c"],
  "Sugar & Allied":       ["#166534", "#7f1d1d"],
  "Transport":            ["#1a4a2a", "#991b1b"],
  "Real Estate Investment Trust": ["#14532d", "#7f1d1d"],
  "REIT":                 ["#14532d", "#7f1d1d"],
  "Cable & Elec. Goods":  ["#166534", "#a21c1c"],
  "Miscellaneous":        ["#1a5c2a", "#7f1d1d"],
};


export function getColor(chg: number, _sector?: string): string {
  if (Math.abs(chg) < 0.15) return "#111111";        // flat/useless → black
  if (chg > 2)   return "#16a34a";                    // bht zyada positive → green
  if (chg > 0)   return "#14532d";                    // kam positive → dark green
  if (chg < -2)  return "#dc2626";                    // bht zyada negative → red
  return "#9b2335";                                    // kam negative → light maroon
}

export function getTextColor(chg: number): string {
  return "#ffffff";
}
