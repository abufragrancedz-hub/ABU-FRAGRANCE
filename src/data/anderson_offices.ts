import { StopDesk } from '../types';

export const andersonOffices: StopDesk[] = [
    // 01 - Adrar
    { id: 101, name: "Station Adrar", address: "Adrar", wilaya_id: 1, commune_name: "Adrar", phone: "0660709353" },

    // 02 - Chlef
    { id: 201, name: "Station Chlef", address: "حي بن سونة لاسيتي بجانب مقهى بن يوسف مقابل الدوش", wilaya_id: 2, commune_name: "Chlef", phone: "0770511166 / 0670675881" },

    // 03 - Laghouat
    { id: 301, name: "Station Laghouat", address: "Laghouat", wilaya_id: 3, commune_name: "Laghouat", phone: "0770 78 07 18" },
    { id: 302, name: "Station Laghouat New", address: "Cite bouameur maamourah laghouat", wilaya_id: 3, commune_name: "Laghouat", phone: "0770953193" },

    // 04 - Oum El Bouaghi
    { id: 401, name: "Station Aïn M'lila", address: "Quartier El Hana, route Massas, à côté de l’agence Parcours Voyages", wilaya_id: 4, commune_name: "Ain M'lila", phone: "0770531702" },
    { id: 402, name: "Station Ain Fekroune", address: "Ain Fekroune", wilaya_id: 4, commune_name: "Ain Fekroune" },
    { id: 403, name: "Station Oum el bouaghi", address: "حي المستقبل بجانب الولاية ام البواقي", wilaya_id: 4, commune_name: "Oum El Bouaghi", phone: "0660877228 / 0660128008" },

    // 05 - Batna
    { id: 501, name: "Station Batna - Cité El Amrani", address: "cité les frères El Amrani , Batna", wilaya_id: 5, commune_name: "Oued Chaaba", phone: "0770531028" },
    { id: 502, name: "Station BATNA Centre", address: "حي برج الغولة طريق مصنع النسيج بجانب الثانوية الخاصة أجيال المستقبل", wilaya_id: 5, commune_name: "Batna", phone: "0770637788 / 0770518901" },

    // 06 - Béjaïa
    { id: 601, name: "Station BEJAIA", address: "Zone industrielle edimco section 2 bâtiment A", wilaya_id: 6, commune_name: "Bejaia", phone: "0560250529 / 0770753564" },
    { id: 602, name: "Station Akbou", address: "Trémie guendouza av. Mohamed boudiaf akbou 0601", wilaya_id: 6, commune_name: "Akbou", phone: "0770807317" },

    // 07 - Biskra
    { id: 701, name: "Station BISKRA", address: "التعاونية العقارية الإزدهار", wilaya_id: 7, commune_name: "Biskra", phone: "0770522149" },

    // 08 - Béchar
    { id: 801, name: "Station Béchar", address: "حي البدر 600 مسكن", wilaya_id: 8, commune_name: "Bechar", phone: "0671559677" },

    // 09 - Blida
    { id: 901, name: "Station BLIDA", address: "شارع رامول عبد العزيز رقم 17, البليدة", wilaya_id: 9, commune_name: "Blida", phone: "0784602779 / 0770967048" },
    { id: 902, name: "Station Blida (Boufarik)", address: "شارع سي بن يوسف حصة رقم 01 بوفاريك", wilaya_id: 9, commune_name: "Boufarik", phone: "0770808317" },

    // 10 - Bouira
    { id: 1001, name: "Station Bouira", address: "حي 24 مسكن تساهمي عمارة ب قطعة رقم (4) قسم 43 (فرشاتي)", wilaya_id: 10, commune_name: "Bouira", phone: "0770780702" },

    // 11 - Tamanrasset
    { id: 1101, name: "Station Tamenrasset", address: "qartier Mouflon derrière maison des finances (trésor)", wilaya_id: 11, commune_name: "Tamanrasset", phone: "0770780713" },

    // 12 - Tebessa
    { id: 1201, name: "Station Tebessa", address: "Lotissement El Arbi Tbessi (Skanska) face à Direction d'Algérie Poste", wilaya_id: 12, commune_name: "Tebessa", phone: "0770507961" },

    // 13 - Tlemcen
    { id: 1301, name: "Station Tlemcen", address: "Kiffane Lot Benchaib (derrière l'hôtel Ibis)", wilaya_id: 13, commune_name: "Tlemcen", phone: "0770451113" },
    { id: 1302, name: "Station Maghnia", address: "route de Oujda Hai Ouled Bensaber, Maghnia", wilaya_id: 13, commune_name: "Maghnia", phone: "0770845020" },

    // 14 - Tiaret
    { id: 1401, name: "Station Tiaret", address: "بجانب اذاعة تيارت وسط المدينة", wilaya_id: 14, commune_name: "Tiaret", phone: "0770750979" },

    // 15 - Tizi Ouzou
    { id: 1501, name: "Station Tizi Ouzou", address: "Local N2 RDC coop le printemps rue cité Mohamed arezki coté 5 juillet", wilaya_id: 15, commune_name: "Tizi Ouzou", phone: "0795006815" },
    { id: 1502, name: "Station Boghni", address: "RN30 à proximité de la pompe a essence NAFTAL", wilaya_id: 15, commune_name: "Boghni", phone: "0563009792" },
    { id: 1503, name: "Station Azazga", address: "Cité AADL 22 logement local n°1 Bt B2, Tizi bouchene", wilaya_id: 15, commune_name: "Tizi Ouzou", phone: "0770898601" }, // Updated commune to Tizi Ouzou per list?? No, list says Azazga (tizi ouzou), Tizi Ouzou, Tizi Ouzou? No, commune is Azazga generally. I'll use Azazga.
    { id: 1504, name: "Station Tizi ouzou nouvelle ville", address: "Zone sud Quartier « B » les 600. À coté direction régionale SAA", wilaya_id: 15, commune_name: "Tizi Ouzou", phone: "0563009791" },

    // 16 - Alger
    { id: 1601, name: "Station Alger Eucalyptus", address: "Les Eucalyptus", wilaya_id: 16, commune_name: "Les Eucalyptus", phone: "0770163989" },
    { id: 1602, name: "Station Alger Kouba", address: "Ferme pons garidi", wilaya_id: 16, commune_name: "Kouba", phone: "0770486105" },
    { id: 1603, name: "Station Alger Ain naadja", address: "حي 440 مسكن إجتماعي تساهمي عين المالحة عمارة 27 ب محل رقم 241", wilaya_id: 16, commune_name: "Djasr Kasentina", phone: "0770531704" },
    { id: 1604, name: "Station Alger Cheraga", address: "Cartier issat idir numero 03 cheraga", wilaya_id: 16, commune_name: "Cheraga", phone: "0563009787" },
    { id: 1605, name: "Station Alger Dely brahim", address: "Route de cheraga , dely Brahim", wilaya_id: 16, commune_name: "Dely Ibrahim", phone: "0770530923" },
    { id: 1606, name: "Station Alger Oued Smar", address: "Zone industrielle Oued Smar BP 02M Alger", wilaya_id: 16, commune_name: "Oued Smar", phone: "0770118225" },
    { id: 1607, name: "Station Alger Draria", address: "حي دريوش 145 عمارة 7 محل 150 درارية", wilaya_id: 16, commune_name: "Draria", phone: "0771110157 / 0770808759" },
    { id: 1608, name: "Station Alger Plage", address: "Alger plage", wilaya_id: 16, commune_name: "Bordj El Bahri", phone: "0770912158" },
    { id: 1609, name: "Station Alger Reghaia", address: "حي 822 مسكن عميروش رغاية", wilaya_id: 16, commune_name: "Reghaia", phone: "0770012586" },
    { id: 1610, name: "Station Alger Sacré Coeur", address: "Rue du Sacré-Cœur, Bâtiment 5/7, Entrée B, Rez-de-chaussée", wilaya_id: 16, commune_name: "Alger Centre", phone: "0770808228" },
    { id: 1611, name: "Station Alger Ain Benian", address: "Ain Benian", wilaya_id: 16, commune_name: "Ain Benian", phone: "0770164273" },

    // 17 - Djelfa
    { id: 1701, name: "Station Djelfa - Ain Oussera", address: "حي محمد بوضياف ، شارع دبي مقابل محل سيفو كوسميتيك", wilaya_id: 17, commune_name: "Ain Oussera", phone: "0770953266" },
    { id: 1702, name: "Station DJELFA", address: "Cite Mohamed chaabani 161 N 35 rue daira", wilaya_id: 17, commune_name: "Djelfa", phone: "0770753611" },

    // 18 - Jijel
    { id: 1801, name: "Station JIJEL", address: "رقم 02 شارع المجاهدين - باب الصور بجانب مخبر التحاليل بورويد", wilaya_id: 18, commune_name: "Jijel", phone: "0770976207" },

    // 19 - Sétif
    { id: 1901, name: "Station Setif - El eulma", address: "حي 100 مسكن تساهمي ع 10 رقم 102 العلمة", wilaya_id: 19, commune_name: "El Eulma", phone: "0770521261" },
    { id: 1902, name: "Station Setif El Hidab", address: "حي الهضاب وراء حديقة لعرائس", wilaya_id: 19, commune_name: "Setif", phone: "0770751080 / 0771823802" },
    { id: 1903, name: "Station Ain Azel", address: "عين ازال وسط المدينة بجانب بنك cnep", wilaya_id: 19, commune_name: "Ain Azel", phone: "0770899367" },
    { id: 1904, name: "Station Setif - Ain oulmene", address: "Rue 8 mai 1945 Ainoulmen -Setif", wilaya_id: 19, commune_name: "Ain Oulmane", phone: "0770751081" },
    { id: 1905, name: "Station Setif - cité Bouaroua", address: "Cité Bouaroua, Sétif ville", wilaya_id: 19, commune_name: "Setif", phone: "0770898787" },

    // 20 - Saïda
    { id: 2001, name: "Station SAIDA", address: "حي الدرب العريق فوق البلدية", wilaya_id: 20, commune_name: "Saida", phone: "0770751017" },

    // 21 - Skikda
    { id: 2101, name: "Station Skikda", address: "Rue Mohamed namous la monté de hammam darraji", wilaya_id: 21, commune_name: "Skikda", phone: "0770451085" },

    // 22 - Sidi Bel Abbès
    { id: 2201, name: "Station Telagh", address: "شارع كيفرو كيفران رقم 30 محل أ بلدية تلاغ", wilaya_id: 22, commune_name: "Telagh", phone: "0770164534" },
    { id: 2202, name: "Station Sidi Bel Abbes", address: "حي العربي بن مهيدي رقم 36 شارع خيرة نبية القطعة 94", wilaya_id: 22, commune_name: "Sidi Bel Abbes", phone: "0770486538" },

    // 23 - Annaba
    { id: 2301, name: "Station Annaba", address: "11 rue necib arifa l’olympia à côté du bureau de main d’œuvre", wilaya_id: 23, commune_name: "Annaba", phone: "0561869178 / 0770451061" },
    { id: 2302, name: "Station Annaba El bouni", address: "Cité belle vue 900 logts à côté d'Algérie Télécom", wilaya_id: 23, commune_name: "El Bouni", phone: "0770773406 / 0770336039" },

    // 24 - Guelma
    { id: 2401, name: "Station Guelma", address: "شارع حساني الصالح رقم ب90 قالمة", wilaya_id: 24, commune_name: "Guelma", phone: "0772421972 / 0770520817" },

    // 25 - Constantine
    { id: 2501, name: "Station Constantine-Sidi Mebrouk", address: "Sidi Mabrouk", wilaya_id: 25, commune_name: "Didouche Mourad", phone: "0770797329" },
    { id: 2502, name: "Station Constantine-Ali Mendjeli", address: "Cité 400Logts UV 05 Ali Mendjeli, El Khroub", wilaya_id: 25, commune_name: "El Khroub", phone: "0770911838" },

    // 26 - Médéa
    { id: 2601, name: "Station Médéa", address: "Pôle urbain Médéa", wilaya_id: 26, commune_name: "Medea", phone: "0770797168 / 0770091207" },

    // 27 - Mostaganem
    { id: 2701, name: "Station Mostaganem", address: "24 rue bouzzouar miloud city nigrel", wilaya_id: 27, commune_name: "Hadjadj", phone: "0770371420" },
    { id: 2702, name: "Station Mostaganem 2", address: "AV ouled Aissa Belkacem", wilaya_id: 27, commune_name: "Mostaganem", phone: "0770845070" },

    // 28 - M'Sila
    { id: 2801, name: "Station Boussaâda", address: "محل (أ) حي النصر 123/18 بلدية بوسعادة", wilaya_id: 28, commune_name: "Bou Saada", phone: "0778979623" },
    { id: 2802, name: "Station M'Sila", address: "M'Sila", wilaya_id: 28, commune_name: "M'Sila" },
    { id: 2803, name: "Station M'sila New", address: "حي تعاونية المقراني ،مقابل ملعب ورتال البشير", wilaya_id: 28, commune_name: "M'sila", phone: "0770164280" },

    // 29 - Mascara
    { id: 2901, name: "Station Mascara", address: "la zone 8 la route de la salle des fêtes bent el soltana", wilaya_id: 29, commune_name: "Mascara", phone: "0770775964" },
    { id: 2902, name: "Station Mascara - Sig", address: "حي طريق شادلي ، طلعة محطة مسافرين طريق معسكر", wilaya_id: 29, commune_name: "Sig", phone: "0770797163" },

    // 30 - Ouargla
    { id: 3001, name: "Station Ouargla", address: "المخادمة طريق المقبرة اونفاص سوبيرات ميم", wilaya_id: 30, commune_name: "Ouargla", phone: "0770559675" },
    { id: 3002, name: "Station Ouargla-Hassi Messaoud", address: "Derrière la CNAS À côté Yalidine", wilaya_id: 30, commune_name: "Hassi Messaoud", phone: "0674273120" },

    // 31 - Oran
    { id: 3101, name: "Station Oran Es Senia (Maraval)", address: "Cité Othemania (ex-Maraval), Résidence Rosa Lina", wilaya_id: 31, commune_name: "Es Senia", phone: "0770898647 / 0770898629" },
    { id: 3102, name: "Station Oran - Hai Sabah", address: "حي الصباح على الطريق الكبيرة تع الطرامواي", wilaya_id: 31, commune_name: "Bir El Djir", phone: "0770753696" },
    { id: 3103, name: "Station Oran - Gambetta", address: "Avenue d'Arcole, Gambetta, Oran", wilaya_id: 31, commune_name: "Oran", phone: "0770911476" },
    { id: 3104, name: "Station Oran Khemisti", address: "Oran Khemisti", wilaya_id: 31, commune_name: "Mers El Kebir", phone: "0770163993 / 0770164228" },

    // 32 - El Bayadh
    { id: 3201, name: "Station El Bayadh", address: "Auto route sid haj bahous en face pharmacie lahouel", wilaya_id: 32, commune_name: "El Bayadh", phone: "0675265384" },

    // 33 - Illizi
    { id: 3301, name: "Station Illizi", address: "حي الوقواق بجانب كانكايري معطالله شارع الاقواس", wilaya_id: 33, commune_name: "Illizi", phone: "0791917907" },
    { id: 3302, name: "Station In Amenas New", address: "In amenas بجانب مسجد السنة", wilaya_id: 33, commune_name: "In Amenas", phone: "0658305407" },

    // 34 - Bordj Bou Arreridj
    { id: 3401, name: "Station Bordj Bou Arreridj", address: " شارع ب 15 تعاونية وراء مستشفى الاطفال", wilaya_id: 34, commune_name: "Bordj Bou Arreridj", phone: "0675553122" },

    // 35 - Boumerdès
    { id: 3501, name: "Station Bordj Menaiel", address: "Les coopérative à côté des urgences", wilaya_id: 35, commune_name: "Bordj Menaiel", phone: "0770772556" },
    { id: 3502, name: "Station BOUMERDES", address: "Cite 11 décembre coopérative résidence zidane en face bella beauty", wilaya_id: 35, commune_name: "Boumerdes", phone: "0770912531 / 0770898605" },
    { id: 3503, name: "Station Dellys", address: "حي المجاهد المرحوم مزاري علي الطريق الوطني رقم 24", wilaya_id: 35, commune_name: "Dellys", phone: "0770912056" },

    // 36 - El Tarf
    { id: 3601, name: "Station El tarf", address: "El Tarf", wilaya_id: 36, commune_name: "El Tarf" },
    { id: 3602, name: "Station El Taref New", address: "المحل رقم 03 شارع تين خميس قسم 032 قطعة رقم 166", wilaya_id: 36, commune_name: "El Tarf", phone: "0652668097 / 0770936164" },

    // 38 - Tissemsilt
    { id: 3801, name: "Station Tissemsilt", address: "مقابل مقر الولاية بجانب المركز الطبي للشرطة", wilaya_id: 38, commune_name: "Tissemsilt", phone: "0672852152" },

    // 39 - El Oued
    { id: 3901, name: "Station El OUED", address: "حي الرمال طريق مجمع مصطفاوي بالقرب من مجمع السلام الطبي", wilaya_id: 39, commune_name: "El Oued", phone: "0654707097 / 0770771833" },

    // 40 - Khenchela
    { id: 4001, name: "Station Khenchela", address: "في النصر تحت سوق النساء خنشلة", wilaya_id: 40, commune_name: "Khenchela", phone: "0770521072" },

    // 41 - Souk Ahras
    { id: 4101, name: "Station souk ahras", address: "حي الشهيد 2 حصة رقم 98 سوق أهراس", wilaya_id: 41, commune_name: "Souk Ahras", phone: "0770776689" },

    // 42 - Tipaza
    { id: 4201, name: "Station TIPAZA KOLEA", address: "شارع بوناطيرو جلول مج 110 قسم 03 بلدية القليعة", wilaya_id: 42, commune_name: "Kolea", phone: "0770912305" },
    { id: 4202, name: "Station Hadjout", address: "Face au lycée rekaizi", wilaya_id: 42, commune_name: "Hadjout", phone: "0770807997" },
    { id: 4203, name: "Station Tipaza", address: "Cite 50+20 logts LSP TIPAZA", wilaya_id: 42, commune_name: "Tipaza", phone: "0770797338" },

    // 43 - Mila
    { id: 4301, name: "Station Chelghoum Laid", address: "نهج ماضي موسى شلغوم العيد", wilaya_id: 43, commune_name: "Chelghoum Laid", phone: "0770898639" },
    { id: 4302, name: "Station MILA", address: "تونسي ميلة بجانب محطة الحافلات الديانسي", wilaya_id: 43, commune_name: "Mila", phone: "0770738712" },

    // 44 - Aïn Defla
    { id: 4401, name: "Station Aïn Defla", address: "Ain Defla", wilaya_id: 44, commune_name: "Ain Defla", phone: "0770780589" },

    // 45 - Naâma
    { id: 4501, name: "Station Naama - Mechria", address: "Rue Taibi Ahmed a côté de CEM Madaoui", wilaya_id: 45, commune_name: "Mecheria", phone: "0668426646" },

    // 46 - Aïn Témouchent
    { id: 4601, name: "Station Ain temouchent - Beni Saf", address: "N°22 Rue de la révolution benisaf", wilaya_id: 46, commune_name: "Beni Saf", phone: "0770797349" },
    { id: 4602, name: "Station Ain temouchent", address: "4 Rue Mohamed boudiaf - Les Castors", wilaya_id: 46, commune_name: "Ain Temouchent", phone: "0770868817" },

    // 47 - Ghardaïa
    { id: 4701, name: "Station GHARDAIA", address: "شارع ديدوش مراد حي الحاج مسعود", wilaya_id: 47, commune_name: "Ghardaia", phone: "0770531062 / 0770531289" },

    // 48 - Relizane
    { id: 4801, name: "Station Relizane", address: "Bd de la Republique, Relizane", wilaya_id: 48, commune_name: "Relizane", phone: "0770783044" },
    { id: 4802, name: "Station Oued Rhiou", address: "شارع بوعبد الله العمارة A الطابق الارضي", wilaya_id: 48, commune_name: "Oued Rhiou", phone: "0770899295" },

    // 51 - Ouled Djellal
    { id: 5101, name: "Station Ouled Djellal", address: "قريب من مكتب يالدين و دائرة و مطعم الانس", wilaya_id: 51, commune_name: "Ouled Djellal", phone: "0550576439 / 0555132822" },

    // 53 - In Salah
    { id: 5301, name: "Station In Salah", address: "حي قصر العرب سنترفيل", wilaya_id: 53, commune_name: "In Salah", phone: "0670152552 / 0554006696" },

    // 55 - Touggourt
    { id: 5501, name: "Station Touggourt", address: "تقرت دراع البروض", wilaya_id: 55, commune_name: "Touggourt", phone: "0770999634 / 0697052872" },

    // 56 - Djanet
    { id: 5601, name: "Station Djanet", address: "Djanet حي تين خاتمة بجانب الصادق لبيع قطع الغيار", wilaya_id: 56, commune_name: "Djanet", phone: "0698502737" },

    // 57 - El M'Ghair
    { id: 5701, name: "Station El M'Ghair", address: "حي 19 مارس بالقرب من المحكمة", wilaya_id: 57, commune_name: "El M'ghair", phone: "0770898640" }
];
