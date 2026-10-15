const PSI_ENDPOINT = "/api/psi";
const PM25_ENDPOINT = "/api/pm25";
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const regionsGrid = document.querySelector("#regions-grid");
const pm25Grid = document.querySelector("#pm25-grid");
const updatedAt = document.querySelector("#updated-at");
const refreshButton = document.querySelector("#refresh-button");
const retryButton = document.querySelector("#retry-button");
const errorBanner = document.querySelector("#error-banner");
const errorMessage = document.querySelector("#error-message");
const regionDialog = document.querySelector("#region-dialog");
const navigationLinks = document.querySelectorAll(".nav-item");
const hazeLevelSelect = document.querySelector("#haze-level-select");
const hazeAdviceCard = document.querySelector("#haze-advice-card");
const updatesRefreshButton = document.querySelector("#updates-refresh");
const updatesLastChecked = document.querySelector("#updates-last-checked");
const updatesError = document.querySelector("#updates-error");
const officialUpdates = document.querySelector("#official-updates");
const languageSelect = document.querySelector("#language-select");
const themeToggle = document.querySelector("#theme-toggle");
let refreshTimer;
let updatesRefreshTimer;
let currentHazeLevel = null;
let hasLoadedOfficialUpdates = false;
let selectedRegionDetails = null;
let latestOfficialPayload = null;

const english = {
  navAbout: "About",
  aboutEyebrow: "About this website",
  aboutTitle: "Air quality, made easier to understand.",
  aboutIntro: "Airwatch brings together live haze and air-quality readings for five areas of Singapore, with current official updates in one place.",
  aboutPeriods: "PM₂.₅ shows the past hour. The haze guide uses the 24-hour PSI. These are different readings, so check the time period shown.",
  aboutContact: "Questions or feedback?",
  themeDark: "Enable dark mode", themeLight: "Switch to light mode",
  mainNav: "Main navigation", navGroup: "Your air", navAir: "Air readings", navPm25: "PM₂.₅ · 1 hour",
  navGuide: "Haze guide", navUpdates: "Latest updates", updateFrequency: "Readings update every five minutes.",
  singapore: "Singapore", todayAir: "Today's air", liveUpdates: "Live updates", languageLabel: "Language",
  liveQuality: "Live air quality", introDescription: "Check the haze score and tiny-particle readings in your area.",
  refreshLabel: "Refresh air quality readings", refresh: "Refresh", loadError: "We couldn't load the latest air readings.", retry: "Try again",
  snapshotLabel: "Island air quality summary", highestPsi: "Highest haze score · past 24 hours", loading: "Loading…",
  overallScore: "Overall air score", waiting: "Waiting for live readings…", acrossSingapore: "Across Singapore",
  asideTitle: "Air quality, area by area.", asideDescription: "Five local readings, in one place.", localReadings: "Local air readings",
  chooseArea: "Choose your area", psiCaption: "Haze score · past 24 hours",
  regionFootnote: "PM₂.₅ shows tiny particles in the past hour. PM₁₀ covers the past 24 hours. Choose an area for details.",
  pmEyebrow: "Live particle readings", pmTitle: "PM₂.₅ over the past hour", pmCaption: "µg/m³ · all five regions",
  pmFootnote: "Indicative one-hour bands: Normal 0–55 · Elevated 56–150 · High 151–250 · Very high 251–350 · Severe above 350 µg/m³. These descriptors are not official health advice; follow NEA guidance, especially if haze affects you.",
  hazeEyebrow: "24-hour PSI haze guide", hazeTitle: "What should I do about the haze?",
  hazeIntro: "This guide uses 24-hour PSI readings, not the 1-hour PM₂.₅ reading.", choosePsi: "Choose a 24-hour PSI score",
  psiWaiting: "Waiting for live readings…", psiGood: "Good · 0–50", psiModerate: "Moderate · 51–100",
  psiUnhealthy: "Unhealthy · 101–200", psiVeryUnhealthy: "Very unhealthy · 201–300", psiHazardous: "Hazardous · above 300",
  good: "Good", moderate: "Moderate", unhealthy: "Unhealthy", veryUnhealthy: "Very unhealthy", hazardous: "Hazardous",
  currentHaze: "Your current haze level", adviceWaiting: "Your area's latest haze advice will appear here.",
  followAdvice: "Follow the", neaAdvice: "National Environment Agency's latest health advice",
  officialSources: "From official sources", updatesTitle: "Latest haze updates",
  updatesIntro: "Current notices and health advice from haze.gov.sg and NEA.", checkUpdates: "Check for updates",
  updatesWillLoad: "Latest notices will load when you open this tab.", moreOfficial: "More official information:", neaNews: "NEA news and advisories",
  liveFrom: "Live readings from", singaporeTime: ". Times shown are Singapore time.", areaReadings: "Area readings",
  closeDialog: "Close regional readings", yourArea: "Your area", detailLoading: "Loading this area's latest readings…",
  dialogPsiLabel: "Overall haze score · past 24 hours", dialogPm25: "PM₂.₅ · past hour", dialogPm10: "PM₁₀ · past 24 hours",
  dialogNote: "The haze score measures overall air quality. PM₂.₅ and PM₁₀ show the amount of tiny particles in the air. Readings are in micrograms per cubic metre (µg/m³).",
  title: "Airwatch · Singapore air and haze", description: "Live haze and air readings for five areas of Singapore, from data.gov.sg.",
  bandNormal: "Normal", bandElevated: "Elevated", bandHigh: "High", bandVeryHigh: "Very high", bandSevere: "Severe",
  currentLevel: "Current level in Singapore", selectedLevel: "Selected haze level", adviceGood: "Enjoy your usual outdoor activities.",
  adviceModerate: "Most people can continue as usual. If haze bothers you, take a break indoors.",
  adviceUnhealthy: "Limit time outdoors and hard exercise. Take extra care if haze affects you.",
  adviceVeryUnhealthy: "Avoid hard exercise outside. Stay indoors if haze affects you.",
  adviceHazardous: "Stay indoors if possible and follow official health advice.",
  unavailable: "Unavailable", updatedDetail: "PM₂.₅ updated {pm25} · haze score updated {psi}",
  regionAria: "See {region} readings. Haze score {psi}, {level}. PM2.5 past hour {pm25} micrograms per cubic metre. PM10 past 24 hours {pm10} micrograms per cubic metre.",
  meterAria: "{region} haze score, {level}", pollutantAria: "PM2.5 particle reading for the past hour and PM10 particle reading for the past 24 hours, in micrograms per cubic metre",
  pmAria: "{region}: PM2.5 {value} micrograms per cubic metre, {level}{range}", pmRangeAria: ", band {range}",
  pastHour: "PM₂.₅ · past hour", pastDay: "PM₁₀ · past 24 hours", details: "See details",
  highestRegion: "Highest haze score · {region}", areaCount: "{count} areas", updatedAt: "Updated {time}", latestReading: "Latest reading",
  pmUnavailable: "PM₂.₅ readings for the past hour are unavailable. The haze score and 24-hour PM₁₀ reading are still shown.",
  readingError: "The latest area readings aren't available. Please try again shortly.", areaError: "Area readings aren't available right now. Please try again shortly.",
  mostHealthy: "Most healthy adults", vulnerable: "Older adults, pregnant women and children", chronic: "People with heart or lung conditions", healthAdvice: "Official health advice",
  outlook: "Outlook", measuresHeading: "What people should do", readUpdate: "Read the full official update",
  noUpdates: "There are no current haze notices. Check the official sites below for the latest information.",
  noMeasures: "The current haze advisory does not mention mask distribution or emergency plans.",
  checkingUpdates: "Checking for newer official notices…", checkingSources: "Checking haze.gov.sg and NEA…",
  lastChecked: "Last checked {time} Singapore time", updatesChecked: "Official updates checked",
  updatesFailed: "The official update sites could not be reached.", updatesError: "We couldn't get the official updates. Please try again.",
  showingLast: "Showing the last successful update", updatesUnavailable: "Official updates are temporarily unavailable",
  timeout: "The connection is taking longer than usual.", networkError: "We couldn't connect. Check your internet connection.",
  lastShown: "Your last readings are still shown.", retrySoon: "Please try again shortly.",
  north: "North", south: "South", east: "East", west: "West", central: "Central",
};

const translations = {
  zh: {
    navAbout: "关于",
    aboutEyebrow: "关于本网站",
    aboutTitle: "让空气质量更容易了解。",
    aboutIntro: "Airwatch 汇集新加坡五个地区的实时烟霾与空气质量读数，以及最新官方消息。",
    aboutPeriods: "PM₂.₅显示过去一小时的读数。烟霾指南使用24小时 PSI。两者的统计时段不同，请留意标注。",
    aboutContact: "有问题或意见？",
    themeDark: "开启深色模式", themeLight: "切换至浅色模式",
    mainNav: "主导航", navGroup: "空气状况", navAir: "空气读数", navPm25: "PM₂.₅ · 1小时", navGuide: "烟霾指南", navUpdates: "最新消息", updateFrequency: "读数每五分钟更新一次。",
    singapore: "新加坡", todayAir: "今日空气", liveUpdates: "实时更新", languageLabel: "语言", liveQuality: "实时空气质量", introDescription: "查看您所在地区的烟霾指数和细颗粒物读数。", refreshLabel: "刷新空气质量读数", refresh: "刷新", loadError: "无法载入最新空气读数。", retry: "重试",
    snapshotLabel: "全岛空气质量概览", highestPsi: "过去24小时最高烟霾指数", loading: "载入中…", overallScore: "整体空气指数", waiting: "等待实时读数…", acrossSingapore: "新加坡各区", asideTitle: "逐区查看空气质量。", asideDescription: "五个地区的读数，一目了然。", localReadings: "本地空气读数", chooseArea: "选择您的地区", psiCaption: "烟霾指数 · 过去24小时",
    regionFootnote: "PM₂.₅显示过去一小时的细颗粒物。PM₁₀为过去24小时读数。选择地区查看详情。", pmEyebrow: "实时颗粒物读数", pmTitle: "过去一小时 PM₂.₅", pmCaption: "µg/m³ · 全部五个地区", pmFootnote: "一小时参考等级：正常 0–55 · 偏高 56–150 · 高 151–250 · 很高 251–350 · 严重高于350 µg/m³。此等级仅供参考，并非官方健康建议；若烟霾影响您，请遵循NEA指引。",
    hazeEyebrow: "24小时 PSI 烟霾指南", hazeTitle: "烟霾来袭时该怎么办？", hazeIntro: "本指南依据24小时 PSI 读数，而非1小时 PM₂.₅读数。", choosePsi: "选择24小时 PSI 指数", psiWaiting: "等待实时读数…", psiGood: "良好 · 0–50", psiModerate: "中等 · 51–100", psiUnhealthy: "不健康 · 101–200", psiVeryUnhealthy: "非常不健康 · 201–300", psiHazardous: "危险 · 高于300",
    good: "良好", moderate: "中等", unhealthy: "不健康", veryUnhealthy: "非常不健康", hazardous: "危险", currentHaze: "新加坡当前烟霾等级", adviceWaiting: "您所在地区的最新烟霾建议将在此显示。", followAdvice: "请遵循", neaAdvice: "国家环境局的最新健康建议",
    officialSources: "官方来源", updatesTitle: "最新烟霾消息", updatesIntro: "来自 haze.gov.sg 和 NEA 的最新通知与健康建议。", checkUpdates: "检查更新", updatesWillLoad: "打开此标签页时将载入最新通知。", moreOfficial: "更多官方信息：", neaNews: "NEA 新闻与公告", liveFrom: "实时读数来自", singaporeTime: "。时间均为新加坡时间。", areaReadings: "地区读数", closeDialog: "关闭地区读数", yourArea: "您的地区", detailLoading: "正在载入该地区的最新读数…", dialogPsiLabel: "整体烟霾指数 · 过去24小时", dialogPm25: "PM₂.₅ · 过去一小时", dialogPm10: "PM₁₀ · 过去24小时", dialogNote: "烟霾指数衡量整体空气质量。PM₂.₅和PM₁₀表示空气中的细颗粒物浓度。单位为微克/立方米（µg/m³）。",
    title: "Airwatch · 新加坡空气与烟霾", description: "来自 data.gov.sg 的新加坡五个地区实时烟霾和空气读数。", bandNormal: "正常", bandElevated: "偏高", bandHigh: "高", bandVeryHigh: "很高", bandSevere: "严重", currentLevel: "新加坡当前等级", selectedLevel: "所选烟霾等级", adviceGood: "可照常进行户外活动。", adviceModerate: "大多数人可照常活动。若烟霾令您不适，请到室内休息。", adviceUnhealthy: "减少户外时间和剧烈运动。若烟霾影响您，请格外注意。", adviceVeryUnhealthy: "避免在户外剧烈运动。若烟霾影响您，请留在室内。", adviceHazardous: "尽可能留在室内，并遵循官方健康建议。", unavailable: "无法读取", updatedDetail: "PM₂.₅更新时间：{pm25} · 烟霾指数更新时间：{psi}",
    regionAria: "查看{region}读数。烟霾指数{psi}，{level}。过去一小时 PM2.5 为每立方米{pm25}微克。过去24小时 PM10 为每立方米{pm10}微克。", meterAria: "{region}烟霾指数，{level}", pollutantAria: "过去一小时 PM2.5 和过去24小时 PM10 颗粒物读数，单位为微克/立方米", pmAria: "{region}：PM2.5 每立方米{value}微克，{level}{range}", pmRangeAria: "，等级{range}", pastHour: "PM₂.₅ · 过去一小时", pastDay: "PM₁₀ · 过去24小时", details: "查看详情", highestRegion: "最高烟霾指数 · {region}", areaCount: "{count}个地区", updatedAt: "更新于{time}", latestReading: "最新读数", pmUnavailable: "暂时无法取得过去一小时的 PM₂.₅读数；仍会显示烟霾指数和过去24小时 PM₁₀读数。", readingError: "暂时无法取得最新地区读数，请稍后重试。", areaError: "目前无法取得地区读数，请稍后重试。",
    mostHealthy: "大多数健康成年人", vulnerable: "长者、孕妇和儿童", chronic: "患有心脏或肺部疾病的人士", healthAdvice: "官方健康建议", outlook: "展望", measuresHeading: "建议采取的措施", readUpdate: "阅读完整官方消息", noUpdates: "目前没有烟霾通知。请查看下方官方网页获取最新信息。", noMeasures: "当前烟霾公告未提及口罩派发或应急计划。", checkingUpdates: "正在检查是否有较新的官方通知…", checkingSources: "正在检查 haze.gov.sg 和 NEA…", lastChecked: "上次检查：新加坡时间 {time}", updatesChecked: "已检查官方消息", updatesFailed: "无法连接官方消息网站。", updatesError: "无法取得官方消息，请重试。", showingLast: "显示上次成功取得的消息", updatesUnavailable: "官方消息暂时无法取得。", timeout: "连接时间比平时长。", networkError: "无法连接，请检查网络。", lastShown: "仍显示上次取得的读数。", retrySoon: "请稍后重试。", north: "北部", south: "南部", east: "东部", west: "西部", central: "中部",
  },
  ms: {
    navAbout: "Tentang",
    aboutEyebrow: "Tentang laman web ini",
    aboutTitle: "Maklumat kualiti udara yang mudah difahami.",
    aboutIntro: "Airwatch menghimpunkan bacaan jerebu dan kualiti udara langsung untuk lima kawasan di Singapura, bersama kemas kini rasmi terkini.",
    aboutPeriods: "PM₂.₅ menunjukkan bacaan sejam lalu. Panduan jerebu menggunakan PSI 24 jam. Kedua-duanya berbeza; semak tempoh bacaan yang dipaparkan.",
    aboutContact: "Ada soalan atau maklum balas?",
    themeDark: "Aktifkan mod gelap", themeLight: "Tukar ke mod cerah",
    mainNav: "Navigasi utama", navGroup: "Udara anda", navAir: "Bacaan udara", navPm25: "PM₂.₅ · 1 jam", navGuide: "Panduan jerebu", navUpdates: "Kemas kini terkini", updateFrequency: "Bacaan dikemas kini setiap lima minit.",
    singapore: "Singapura", todayAir: "Udara hari ini", liveUpdates: "Kemas kini langsung", languageLabel: "Bahasa", liveQuality: "Kualiti udara langsung", introDescription: "Semak tahap jerebu dan bacaan zarah halus di kawasan anda.", refreshLabel: "Muat semula bacaan kualiti udara", refresh: "Muat semula", loadError: "Bacaan udara terkini tidak dapat dimuatkan.", retry: "Cuba lagi",
    snapshotLabel: "Ringkasan kualiti udara seluruh pulau", highestPsi: "Tahap jerebu tertinggi · 24 jam lalu", loading: "Memuatkan…", overallScore: "Skor udara keseluruhan", waiting: "Menunggu bacaan langsung…", acrossSingapore: "Seluruh Singapura", asideTitle: "Kualiti udara, mengikut kawasan.", asideDescription: "Bacaan lima kawasan, di satu tempat.", localReadings: "Bacaan udara setempat", chooseArea: "Pilih kawasan anda", psiCaption: "Tahap jerebu · 24 jam lalu",
    regionFootnote: "PM₂.₅ menunjukkan zarah halus dalam tempoh sejam lalu. PM₁₀ meliputi 24 jam lalu. Pilih kawasan untuk butiran.", pmEyebrow: "Bacaan zarah langsung", pmTitle: "PM₂.₅ sepanjang sejam lalu", pmCaption: "µg/m³ · kesemua lima kawasan", pmFootnote: "Tahap panduan satu jam: Normal 0–55 · Meningkat 56–150 · Tinggi 151–250 · Sangat tinggi 251–350 · Teruk melebihi 350 µg/m³. Ini panduan indikatif, bukan nasihat kesihatan rasmi; ikuti panduan NEA, khususnya jika jerebu menjejaskan anda.",
    hazeEyebrow: "Panduan jerebu PSI 24 jam", hazeTitle: "Apakah yang patut saya lakukan tentang jerebu?", hazeIntro: "Panduan ini menggunakan bacaan PSI 24 jam, bukan bacaan PM₂.₅ 1 jam.", choosePsi: "Pilih skor PSI 24 jam", psiWaiting: "Menunggu bacaan langsung…", psiGood: "Baik · 0–50", psiModerate: "Sederhana · 51–100", psiUnhealthy: "Tidak sihat · 101–200", psiVeryUnhealthy: "Sangat tidak sihat · 201–300", psiHazardous: "Berbahaya · melebihi 300",
    good: "Baik", moderate: "Sederhana", unhealthy: "Tidak sihat", veryUnhealthy: "Sangat tidak sihat", hazardous: "Berbahaya", currentHaze: "Tahap jerebu semasa di Singapura", adviceWaiting: "Nasihat jerebu terkini untuk kawasan anda akan dipaparkan di sini.", followAdvice: "Ikuti", neaAdvice: "nasihat kesihatan terkini Agensi Sekitaran Kebangsaan",
    officialSources: "Daripada sumber rasmi", updatesTitle: "Kemas kini jerebu terkini", updatesIntro: "Notis semasa dan nasihat kesihatan daripada haze.gov.sg dan NEA.", checkUpdates: "Semak kemas kini", updatesWillLoad: "Notis terkini akan dimuatkan apabila anda membuka tab ini.", moreOfficial: "Maklumat rasmi lanjut:", neaNews: "Berita dan nasihat NEA", liveFrom: "Bacaan langsung daripada", singaporeTime: ". Waktu yang dipaparkan ialah waktu Singapura.", areaReadings: "Bacaan kawasan", closeDialog: "Tutup bacaan kawasan", yourArea: "Kawasan anda", detailLoading: "Memuatkan bacaan terkini kawasan ini…", dialogPsiLabel: "Skor jerebu keseluruhan · 24 jam lalu", dialogPm25: "PM₂.₅ · sejam lalu", dialogPm10: "PM₁₀ · 24 jam lalu", dialogNote: "Skor jerebu mengukur kualiti udara keseluruhan. PM₂.₅ dan PM₁₀ menunjukkan jumlah zarah halus di udara. Bacaan dalam mikrogram per meter padu (µg/m³).",
    title: "Airwatch · Udara dan jerebu Singapura", description: "Bacaan jerebu dan udara langsung untuk lima kawasan di Singapura daripada data.gov.sg.", bandNormal: "Normal", bandElevated: "Meningkat", bandHigh: "Tinggi", bandVeryHigh: "Sangat tinggi", bandSevere: "Teruk", currentLevel: "Tahap semasa di Singapura", selectedLevel: "Tahap jerebu dipilih", adviceGood: "Teruskan aktiviti luar seperti biasa.", adviceModerate: "Kebanyakan orang boleh meneruskan aktiviti seperti biasa. Jika jerebu mengganggu anda, berehat di dalam bangunan.", adviceUnhealthy: "Hadkan masa di luar dan senaman berat. Berjaga-jaga jika jerebu menjejaskan anda.", adviceVeryUnhealthy: "Elakkan senaman berat di luar. Duduk di dalam bangunan jika jerebu menjejaskan anda.", adviceHazardous: "Duduk di dalam bangunan jika boleh dan ikuti nasihat kesihatan rasmi.", unavailable: "Tidak tersedia", updatedDetail: "PM₂.₅ dikemas kini {pm25} · skor jerebu dikemas kini {psi}",
    regionAria: "Lihat bacaan {region}. Skor jerebu {psi}, {level}. PM2.5 sejam lalu {pm25} mikrogram per meter padu. PM10 24 jam lalu {pm10} mikrogram per meter padu.", meterAria: "Skor jerebu {region}, {level}", pollutantAria: "Bacaan zarah PM2.5 sejam lalu dan PM10 24 jam lalu, dalam mikrogram per meter padu", pmAria: "{region}: PM2.5 {value} mikrogram per meter padu, {level}{range}", pmRangeAria: ", tahap {range}", pastHour: "PM₂.₅ · sejam lalu", pastDay: "PM₁₀ · 24 jam lalu", details: "Lihat butiran", highestRegion: "Tahap jerebu tertinggi · {region}", areaCount: "{count} kawasan", updatedAt: "Dikemas kini {time}", latestReading: "Bacaan terkini", pmUnavailable: "Bacaan PM₂.₅ sejam lalu tidak tersedia. Skor jerebu dan bacaan PM₁₀ 24 jam masih dipaparkan.", readingError: "Bacaan kawasan terkini tidak tersedia. Sila cuba lagi sebentar lagi.", areaError: "Bacaan kawasan tidak tersedia buat masa ini. Sila cuba lagi sebentar lagi.",
    mostHealthy: "Kebanyakan orang dewasa yang sihat", vulnerable: "Warga emas, wanita hamil dan kanak-kanak", chronic: "Individu dengan penyakit jantung atau paru-paru", healthAdvice: "Nasihat kesihatan rasmi", outlook: "Jangkaan", measuresHeading: "Perkara yang boleh dilakukan", readUpdate: "Baca kemas kini rasmi penuh", noUpdates: "Tiada notis jerebu semasa. Semak laman rasmi di bawah untuk maklumat terkini.", noMeasures: "Nasihat jerebu semasa tidak menyebut pengagihan pelitup atau pelan kecemasan.", checkingUpdates: "Menyemak notis rasmi yang lebih baharu…", checkingSources: "Menyemak haze.gov.sg dan NEA…", lastChecked: "Kali terakhir disemak pada {time} waktu Singapura", updatesChecked: "Kemas kini rasmi disemak", updatesFailed: "Laman kemas kini rasmi tidak dapat dicapai.", updatesError: "Kemas kini rasmi tidak dapat diperoleh. Sila cuba lagi.", showingLast: "Memaparkan kemas kini terakhir yang berjaya diperoleh", updatesUnavailable: "Kemas kini rasmi tidak tersedia buat sementara waktu.", timeout: "Sambungan mengambil masa lebih lama daripada biasa.", networkError: "Tidak dapat disambungkan. Semak sambungan internet anda.", lastShown: "Bacaan terakhir masih dipaparkan.", retrySoon: "Sila cuba lagi sebentar lagi.", north: "Utara", south: "Selatan", east: "Timur", west: "Barat", central: "Tengah",
  },
  ta: {
    navAbout: "பற்றி",
    aboutEyebrow: "இந்த இணையதளத்தைப் பற்றி",
    aboutTitle: "காற்றுத் தரத்தை எளிதாகப் புரிந்துகொள்ளுங்கள்.",
    aboutIntro: "Airwatch சிங்கப்பூரின் ஐந்து பகுதிகளுக்கான நேரடி புகைமூட்டம் மற்றும் காற்றுத் தர அளவீடுகளையும் சமீபத்திய அதிகாரப்பூர்வ அறிவிப்புகளையும் ஒரே இடத்தில் வழங்குகிறது.",
    aboutPeriods: "PM₂.₅ கடந்த ஒரு மணி நேர அளவீட்டைக் காட்டுகிறது. புகைமூட்ட வழிகாட்டி 24 மணி நேர PSI-ஐப் பயன்படுத்துகிறது. இவை வெவ்வேறு அளவீடுகள்; காட்டப்படும் காலத்தைச் சரிபார்க்கவும்.",
    aboutContact: "கேள்விகள் அல்லது கருத்துகள் உள்ளனவா?",
    themeDark: "இருண்ட பயன்முறையை இயக்கு", themeLight: "ஒளி பயன்முறைக்கு மாறு",
    mainNav: "முதன்மை வழிசெலுத்தல்", navGroup: "உங்கள் காற்று", navAir: "காற்று அளவீடுகள்", navPm25: "PM₂.₅ · 1 மணி", navGuide: "புகைமூட்ட வழிகாட்டி", navUpdates: "சமீபத்திய அறிவிப்புகள்", updateFrequency: "அளவீடுகள் ஐந்து நிமிடங்களுக்கு ஒருமுறை புதுப்பிக்கப்படும்.",
    singapore: "சிங்கப்பூர்", todayAir: "இன்றைய காற்று", liveUpdates: "நேரடி புதுப்பிப்புகள்", languageLabel: "மொழி", liveQuality: "நேரடி காற்றுத் தரம்", introDescription: "உங்கள் பகுதியில் புகைமூட்ட அளவையும் நுண்துகள் அளவீடுகளையும் பார்க்கவும்.", refreshLabel: "காற்றுத் தர அளவீடுகளைப் புதுப்பி", refresh: "புதுப்பி", loadError: "சமீபத்திய காற்று அளவீடுகளை ஏற்ற முடியவில்லை.", retry: "மீண்டும் முயற்சி",
    snapshotLabel: "தீவு முழுவதுமான காற்றுத் தரச் சுருக்கம்", highestPsi: "அதிகபட்ச புகைமூட்ட அளவு · கடந்த 24 மணி நேரம்", loading: "ஏற்றப்படுகிறது…", overallScore: "ஒட்டுமொத்த காற்று மதிப்பெண்", waiting: "நேரடி அளவீடுகளுக்காகக் காத்திருக்கிறது…", acrossSingapore: "சிங்கப்பூர் முழுவதும்", asideTitle: "ஒவ்வொரு பகுதியின் காற்றுத் தரம்.", asideDescription: "ஐந்து பகுதிகளின் அளவீடுகள் ஒரே இடத்தில்.", localReadings: "உள்ளூர் காற்று அளவீடுகள்", chooseArea: "உங்கள் பகுதியைத் தேர்ந்தெடுக்கவும்", psiCaption: "புகைமூட்ட அளவு · கடந்த 24 மணி நேரம்",
    regionFootnote: "PM₂.₅ கடந்த ஒரு மணி நேர நுண்துகள்களைக் காட்டுகிறது. PM₁₀ கடந்த 24 மணி நேரத்தைக் குறிக்கிறது. விவரங்களுக்கு ஒரு பகுதியைத் தேர்ந்தெடுக்கவும்.", pmEyebrow: "நேரடி துகள் அளவீடுகள்", pmTitle: "கடந்த ஒரு மணி நேர PM₂.₅", pmCaption: "µg/m³ · ஐந்து பகுதிகளும்", pmFootnote: "ஒரு மணி நேரத்திற்கான குறிப்பு நிலைகள்: இயல்பு 0–55 · உயர்வு 56–150 · அதிகம் 151–250 · மிக அதிகம் 251–350 · கடுமை 350-க்கு மேல் µg/m³. இவை வழிகாட்டும் குறிப்புகள் மட்டுமே; அதிகாரப்பூர்வ சுகாதார ஆலோசனை அல்ல. புகைமூட்டம் பாதித்தால் NEA வழிகாட்டுதலைப் பின்பற்றவும்.",
    hazeEyebrow: "24 மணி நேர PSI புகைமூட்ட வழிகாட்டி", hazeTitle: "புகைமூட்டம் இருக்கும்போது என்ன செய்ய வேண்டும்?", hazeIntro: "இந்த வழிகாட்டி 24 மணி நேர PSI அளவீடுகளைப் பயன்படுத்துகிறது; 1 மணி நேர PM₂.₅ அளவீட்டை அல்ல.", choosePsi: "24 மணி நேர PSI மதிப்பைத் தேர்ந்தெடுக்கவும்", psiWaiting: "நேரடி அளவீடுகளுக்காகக் காத்திருக்கிறது…", psiGood: "நல்லது · 0–50", psiModerate: "மிதமானது · 51–100", psiUnhealthy: "ஆரோக்கியமற்றது · 101–200", psiVeryUnhealthy: "மிகவும் ஆரோக்கியமற்றது · 201–300", psiHazardous: "ஆபத்தானது · 300-க்கு மேல்",
    good: "நல்லது", moderate: "மிதமானது", unhealthy: "ஆரோக்கியமற்றது", veryUnhealthy: "மிகவும் ஆரோக்கியமற்றது", hazardous: "ஆபத்தானது", currentHaze: "சிங்கப்பூரின் தற்போதைய புகைமூட்ட நிலை", adviceWaiting: "உங்கள் பகுதியின் சமீபத்திய புகைமூட்ட ஆலோசனை இங்கே காட்டப்படும்.", followAdvice: "பின்பற்றவும்:", neaAdvice: "தேசிய சுற்றுச்சூழல் அமைப்பின் சமீபத்திய சுகாதார ஆலோசனை",
    officialSources: "அதிகாரப்பூர்வ ஆதாரங்கள்", updatesTitle: "சமீபத்திய புகைமூட்ட அறிவிப்புகள்", updatesIntro: "haze.gov.sg மற்றும் NEA வழங்கும் தற்போதைய அறிவிப்புகளும் சுகாதார ஆலோசனைகளும்.", checkUpdates: "அறிவிப்புகளைச் சரிபார்க்கவும்", updatesWillLoad: "இந்தத் தாவலைத் திறக்கும்போது சமீபத்திய அறிவிப்புகள் ஏற்றப்படும்.", moreOfficial: "மேலும் அதிகாரப்பூர்வ தகவல்:", neaNews: "NEA செய்திகள் மற்றும் அறிவுறுத்தல்கள்", liveFrom: "நேரடி அளவீடுகள்:", singaporeTime: ". காட்டப்படும் நேரம் சிங்கப்பூர் நேரம்.", areaReadings: "பகுதி அளவீடுகள்", closeDialog: "பகுதி அளவீடுகளை மூடு", yourArea: "உங்கள் பகுதி", detailLoading: "இந்தப் பகுதியின் சமீபத்திய அளவீடுகள் ஏற்றப்படுகின்றன…", dialogPsiLabel: "ஒட்டுமொத்த புகைமூட்ட அளவு · கடந்த 24 மணி நேரம்", dialogPm25: "PM₂.₅ · கடந்த ஒரு மணி நேரம்", dialogPm10: "PM₁₀ · கடந்த 24 மணி நேரம்", dialogNote: "புகைமூட்ட மதிப்பெண் ஒட்டுமொத்த காற்றுத் தரத்தை அளவிடுகிறது. PM₂.₅ மற்றும் PM₁₀ காற்றிலுள்ள நுண்துகள்களின் அளவைக் காட்டுகின்றன. அளவீடுகள் ஒரு கன மீட்டருக்கு மைக்ரோகிராம் (µg/m³).",
    title: "Airwatch · சிங்கப்பூர் காற்றும் புகைமூட்டமும்", description: "data.gov.sg வழங்கும் சிங்கப்பூரின் ஐந்து பகுதிகளுக்கான நேரடி காற்று மற்றும் புகைமூட்ட அளவீடுகள்.", bandNormal: "இயல்பு", bandElevated: "உயர்வு", bandHigh: "அதிகம்", bandVeryHigh: "மிக அதிகம்", bandSevere: "கடுமை", currentLevel: "சிங்கப்பூரின் தற்போதைய நிலை", selectedLevel: "தேர்ந்தெடுத்த புகைமூட்ட நிலை", adviceGood: "வழக்கமான வெளிப்புறச் செயல்பாடுகளைத் தொடரலாம்.", adviceModerate: "பெரும்பாலானோர் வழக்கம்போல் செயல்படலாம். புகைமூட்டம் தொந்தரவு செய்தால் உள்ளே ஓய்வெடுக்கவும்.", adviceUnhealthy: "வெளியில் இருக்கும் நேரத்தையும் கடின உடற்பயிற்சியையும் குறைக்கவும். புகைமூட்டம் பாதித்தால் கூடுதல் கவனம் செலுத்தவும்.", adviceVeryUnhealthy: "வெளியில் கடின உடற்பயிற்சியைத் தவிர்க்கவும். புகைமூட்டம் பாதித்தால் வீட்டுக்குள் இருங்கள்.", adviceHazardous: "முடிந்தால் வீட்டுக்குள் இருங்கள்; அதிகாரப்பூர்வ சுகாதார ஆலோசனையைப் பின்பற்றவும்.", unavailable: "கிடைக்கவில்லை", updatedDetail: "PM₂.₅ புதுப்பிப்பு {pm25} · புகைமூட்ட அளவு புதுப்பிப்பு {psi}",
    regionAria: "{region} அளவீடுகளைக் காண்க. புகைமூட்ட அளவு {psi}, {level}. கடந்த ஒரு மணி நேர PM2.5 ஒரு கன மீட்டருக்கு {pm25} மைக்ரோகிராம். கடந்த 24 மணி நேர PM10 ஒரு கன மீட்டருக்கு {pm10} மைக்ரோகிராம்.", meterAria: "{region} புகைமூட்ட அளவு, {level}", pollutantAria: "கடந்த ஒரு மணி நேர PM2.5 மற்றும் கடந்த 24 மணி நேர PM10 துகள் அளவீடுகள், ஒரு கன மீட்டருக்கு மைக்ரோகிராமில்", pmAria: "{region}: PM2.5 ஒரு கன மீட்டருக்கு {value} மைக்ரோகிராம், {level}{range}", pmRangeAria: ", நிலை {range}", pastHour: "PM₂.₅ · கடந்த ஒரு மணி நேரம்", pastDay: "PM₁₀ · கடந்த 24 மணி நேரம்", details: "விவரங்களைக் காண்க", highestRegion: "அதிகபட்ச புகைமூட்ட அளவு · {region}", areaCount: "{count} பகுதிகள்", updatedAt: "புதுப்பிப்பு {time}", latestReading: "சமீபத்திய அளவீடு", pmUnavailable: "கடந்த ஒரு மணி நேர PM₂.₅ அளவீடுகள் கிடைக்கவில்லை. புகைமூட்ட அளவும் கடந்த 24 மணி நேர PM₁₀ அளவும் காட்டப்படுகின்றன.", readingError: "சமீபத்திய பகுதி அளவீடுகள் கிடைக்கவில்லை. சிறிது நேரம் கழித்து முயற்சிக்கவும்.", areaError: "தற்போது பகுதி அளவீடுகள் கிடைக்கவில்லை. சிறிது நேரம் கழித்து முயற்சிக்கவும்.",
    mostHealthy: "பெரும்பாலான ஆரோக்கியமான பெரியவர்கள்", vulnerable: "முதியவர்கள், கர்ப்பிணிகள் மற்றும் குழந்தைகள்", chronic: "இதயம் அல்லது நுரையீரல் நோயுள்ளவர்கள்", healthAdvice: "அதிகாரப்பூர்வ சுகாதார ஆலோசனை", outlook: "முன்னறிவிப்பு", measuresHeading: "பொதுமக்கள் செய்ய வேண்டியது", readUpdate: "முழு அதிகாரப்பூர்வ அறிவிப்பைப் படிக்கவும்", noUpdates: "தற்போது புகைமூட்ட அறிவிப்புகள் இல்லை. சமீபத்திய தகவலுக்கு கீழே உள்ள அதிகாரப்பூர்வ தளங்களைப் பார்க்கவும்.", noMeasures: "தற்போதைய புகைமூட்ட ஆலோசனையில் முகக்கவச விநியோகம் அல்லது அவசரத் திட்டங்கள் குறிப்பிடப்படவில்லை.", checkingUpdates: "புதிய அதிகாரப்பூர்வ அறிவிப்புகளைச் சரிபார்க்கிறது…", checkingSources: "haze.gov.sg மற்றும் NEA-ஐச் சரிபார்க்கிறது…", lastChecked: "கடைசியாகச் சரிபார்த்த நேரம்: சிங்கப்பூர் நேரம் {time}", updatesChecked: "அதிகாரப்பூர்வ அறிவிப்புகள் சரிபார்க்கப்பட்டன", updatesFailed: "அதிகாரப்பூர்வ அறிவிப்பு தளங்களை அணுக முடியவில்லை.", updatesError: "அதிகாரப்பூர்வ அறிவிப்புகளைப் பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.", showingLast: "கடைசியாக வெற்றிகரமாகப் பெறப்பட்ட அறிவிப்பு காட்டப்படுகிறது", updatesUnavailable: "அதிகாரப்பூர்வ அறிவிப்புகள் தற்காலிகமாகக் கிடைக்கவில்லை.", timeout: "இணைப்பு வழக்கத்தைவிட அதிக நேரம் எடுக்கிறது.", networkError: "இணைக்க முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.", lastShown: "கடைசியாகப் பெற்ற அளவீடுகள் தொடர்ந்து காட்டப்படுகின்றன.", retrySoon: "சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.", north: "வடக்கு", south: "தெற்கு", east: "கிழக்கு", west: "மேற்கு", central: "மத்திய",
  },
};

english.lastUpdatedEarlier = "Last updated earlier";
english.readingsUnavailable = "Readings unavailable";
translations.zh.lastUpdatedEarlier = "上次更新较早";
translations.zh.readingsUnavailable = "读数暂不可用";
translations.ms = { ...translations.ms, lastUpdatedEarlier: "Kemas kini terdahulu", readingsUnavailable: "Bacaan tidak tersedia" };
translations.ta.lastUpdatedEarlier = "முன்பு புதுப்பிக்கப்பட்டது";
translations.ta.readingsUnavailable = "அளவீடுகள் கிடைக்கவில்லை";

let currentLanguage = "en";
try {
  const savedLanguage = localStorage.getItem("airwatch-language");
  if (savedLanguage && ["en", "zh", "ms", "ta"].includes(savedLanguage)) currentLanguage = savedLanguage;
} catch {}

let currentTheme = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
try {
  const savedTheme = localStorage.getItem("airwatch-theme");
  if (savedTheme === "dark" || savedTheme === "light") currentTheme = savedTheme;
} catch {}

const languageLocales = { en: "en-SG", zh: "zh-SG", ms: "ms-SG", ta: "ta-SG" };
let numberFormat = new Intl.NumberFormat(languageLocales[currentLanguage]);
let readingTimeFormat = new Intl.DateTimeFormat(languageLocales[currentLanguage], {
  timeZone: "Asia/Singapore", hour: "numeric", minute: "2-digit",
});
let officialDateFormat = new Intl.DateTimeFormat(languageLocales[currentLanguage], {
  timeZone: "Asia/Singapore", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit",
});
let latestPsiPayload = null;
let latestPm25Payload = null;

function t(key, values = {}) {
  let text = translations[currentLanguage]?.[key] ?? english[key] ?? key;
  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

function applyLanguage() {
  const locale = languageLocales[currentLanguage];
  document.documentElement.lang = locale;
  document.title = t("title");
  document.querySelector('meta[name="description"]').content = t("description");
  numberFormat = new Intl.NumberFormat(locale);
  readingTimeFormat = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Singapore", hour: "numeric", minute: "2-digit",
  });
  officialDateFormat = new Intl.DateTimeFormat(locale, {
    timeZone: "Asia/Singapore", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit",
  });

  for (const element of document.querySelectorAll("[data-i18n]")) {
    element.textContent = t(element.dataset.i18n);
  }
  for (const element of document.querySelectorAll("[data-i18n-aria-label]")) {
    element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
  }
  languageSelect.value = currentLanguage;
  applyTheme();

  if (hazeLevelSelect.value) updateHazeAdvice();
  if (selectedRegionDetails && regionDialog.open) showRegionDetails(...selectedRegionDetails, false);
  if (latestOfficialPayload) {
    renderOfficialUpdates(latestOfficialPayload);
    const checkedAt = Date.parse(latestOfficialPayload.updatedAt);
    updatesLastChecked.textContent = Number.isFinite(checkedAt)
      ? t("lastChecked", { time: readingTimeFormat.format(checkedAt) })
      : t("updatesChecked");
  }
}

function applyTheme() {
  const isDark = currentTheme === "dark";
  document.documentElement.dataset.theme = currentTheme;
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#121916" : "#f5f6f2";
  const label = t(isDark ? "themeLight" : "themeDark");
  themeToggle.setAttribute("aria-label", label);
  themeToggle.setAttribute("title", label);
  themeToggle.setAttribute("aria-pressed", String(isDark));
  document.querySelector("#theme-toggle-label").textContent = label;
}

function toggleTheme() {
  currentTheme = currentTheme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("airwatch-theme", currentTheme);
  } catch {}
  applyTheme();
}

function changeLanguage() {
  currentLanguage = languageSelect.value;
  try {
    localStorage.setItem("airwatch-language", currentLanguage);
  } catch {}
  applyLanguage();
  if (latestPsiPayload) displayReadings(latestPsiPayload, latestPm25Payload);
  if (!updatesError.hidden) {
    updatesError.textContent = t("updatesError");
    updatesLastChecked.textContent = hasLoadedOfficialUpdates ? t("showingLast") : t("updatesUnavailable");
  }
}

function localizeRegion(name) {
  const key = name.toLowerCase();
  return ["north", "south", "east", "west", "central"].includes(key) ? t(key) : name;
}

const hazeGuidance = {
  good: { label: "good", range: "0–50", advice: "adviceGood" },
  moderate: { label: "moderate", range: "51–100", advice: "adviceModerate" },
  unhealthy: { label: "unhealthy", range: "101–200", advice: "adviceUnhealthy" },
  "very-unhealthy": { label: "veryUnhealthy", range: "201–300", advice: "adviceVeryUnhealthy" },
  hazardous: { label: "hazardous", range: "Above 300", advice: "adviceHazardous" },
};

function classifyPsi(value) {
  if (value <= 50) return { label: t("good"), level: "good" };
  if (value <= 100) return { label: t("moderate"), level: "moderate" };
  if (value <= 200) return { label: t("unhealthy"), level: "unhealthy" };
  if (value <= 300) return { label: t("veryUnhealthy"), level: "very-unhealthy" };
  return { label: t("hazardous"), level: "hazardous" };
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  return numberFormat.format(value);
}

function classifyPm25(value) {
  if (!Number.isFinite(value)) return { label: t("unavailable"), level: "unavailable", range: "" };
  if (value <= 55) return { label: t("bandNormal"), level: "normal", range: "0–55" };
  if (value <= 150) return { label: t("bandElevated"), level: "elevated", range: "56–150" };
  if (value <= 250) return { label: t("bandHigh"), level: "high", range: "151–250" };
  if (value <= 350) return { label: t("bandVeryHigh"), level: "very-high", range: "251–350" };
  return { label: t("bandSevere"), level: "severe", range: "Above 350" };
}

function updateHazeAdvice() {
  const guidance = hazeGuidance[hazeLevelSelect.value];
  if (!guidance) return;

  hazeAdviceCard.dataset.level = hazeLevelSelect.value;
  document.querySelector("#haze-advice-label").textContent =
    hazeLevelSelect.value === currentHazeLevel ? t("currentLevel") : t("selectedLevel");
  document.querySelector("#haze-advice-level").textContent = t(guidance.label);
  document.querySelector("#haze-advice-range").textContent = guidance.range;
  document.querySelector("#haze-advice-text").textContent = t(guidance.advice);
}

function createPollutantReading(label, value) {
  const reading = document.createElement("span");
  reading.className = "pollutant-reading";

  const name = document.createElement("span");
  name.className = "pollutant-label";
  name.textContent = label;

  const measurement = document.createElement("span");
  measurement.className = "pollutant-value";
  measurement.textContent = `${formatNumber(value)} `;

  const unit = document.createElement("span");
  unit.className = "pollutant-unit";
  unit.textContent = "µg/m³";
  measurement.append(unit);
  reading.append(name, measurement);

  return reading;
}

function showRegionDetails(region, psi, category, readings, open = true) {
  selectedRegionDetails = [region, psi, category, readings];
  category = classifyPsi(psi);
  document.querySelector("#detail-region-name").textContent = localizeRegion(region.name);
  document.querySelector("#detail-psi").textContent = formatNumber(psi);
  const categoryLabel = document.querySelector("#detail-category");
  categoryLabel.textContent = category.label;
  categoryLabel.className = `dialog-category is-${category.level}`;
  document.querySelector("#detail-pm25").textContent = formatNumber(readings.pm25);
  document.querySelector("#detail-pm10").textContent = formatNumber(readings.pm10);

  const psiTime = Date.parse(readings.psiUpdatedAt);
  const pm25Time = Date.parse(readings.pm25UpdatedAt);
  const formatTime = (timestamp) => Number.isFinite(timestamp)
    ? readingTimeFormat.format(timestamp)
    : t("unavailable");
  document.querySelector("#detail-updated").textContent =
    t("updatedDetail", { pm25: formatTime(pm25Time), psi: formatTime(psiTime) });

  if (open) regionDialog.showModal();
}

function createRegionCard(region, psi, scaleMax, readings) {
  const category = classifyPsi(psi);
  const regionLabel = localizeRegion(region.name);
  const card = document.createElement("button");
  card.type = "button";
  card.className = "region-card";
  card.dataset.level = category.level;
  card.setAttribute(
    "aria-label",
    t("regionAria", { region: regionLabel, psi: formatNumber(psi), level: category.label, pm25: formatNumber(readings.pm25), pm10: formatNumber(readings.pm10) }),
  );

  const content = document.createElement("span");
  content.className = "region-card-content";

  const header = document.createElement("span");
  header.className = "region-card-header";

  const name = document.createElement("span");
  name.className = "region-name";
  name.textContent = regionLabel;

  header.append(name);

  const value = document.createElement("span");
  value.className = "psi-value";

  const psiNumber = document.createElement("span");
  psiNumber.className = "psi-number";
  psiNumber.textContent = formatNumber(psi);

  const psiUnit = document.createElement("span");
  psiUnit.className = "psi-unit";
  psiUnit.textContent = "PSI";
  value.append(psiNumber, psiUnit);

  const status = document.createElement("span");
  status.className = "psi-status";
  status.textContent = category.label;

  const meter = document.createElement("span");
  meter.className = "psi-meter";
  meter.setAttribute("role", "meter");
  meter.setAttribute("aria-label", t("meterAria", { region: regionLabel, level: category.label }));
  meter.setAttribute("aria-valuemin", "0");
  meter.setAttribute("aria-valuemax", String(scaleMax));
  meter.setAttribute("aria-valuenow", String(psi));

  const meterFill = document.createElement("span");
  meterFill.className = "psi-meter-fill";
  meterFill.style.width = `${Math.max(4, (psi / scaleMax) * 100)}%`;
  meter.append(meterFill);

  const pollutants = document.createElement("span");
  pollutants.className = "card-pollutants";
  pollutants.setAttribute("role", "group");
  pollutants.setAttribute(
    "aria-label",
    t("pollutantAria"),
  );
  pollutants.append(
    createPollutantReading(t("pastHour"), readings.pm25),
    createPollutantReading(t("pastDay"), readings.pm10),
  );

  const action = document.createElement("span");
  action.className = "card-action";
  action.append(t("details"));

  const actionIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  actionIcon.setAttribute("viewBox", "0 0 24 24");
  actionIcon.setAttribute("fill", "none");
  actionIcon.setAttribute("aria-hidden", "true");
  const actionPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
  actionPath.setAttribute("d", "M5 12h14m-6-6 6 6-6 6");
  actionPath.setAttribute("stroke", "currentColor");
  actionPath.setAttribute("stroke-width", "1.8");
  actionPath.setAttribute("stroke-linecap", "round");
  actionPath.setAttribute("stroke-linejoin", "round");
  actionIcon.append(actionPath);
  action.append(actionIcon);

  content.append(header, value, status, meter, pollutants, action);
  card.append(content);
  card.addEventListener("click", () => showRegionDetails(region, psi, category, readings));
  return card;
}

function createPm25Card(region) {
  const band = classifyPm25(region.pm25);
  const regionLabel = localizeRegion(region.name);
  const card = document.createElement("article");
  card.className = "pm25-card";
  card.dataset.level = band.level;
  card.setAttribute(
    "aria-label",
    t("pmAria", { region: regionLabel, value: formatNumber(region.pm25), level: band.label, range: band.range ? t("pmRangeAria", { range: band.range }) : "" }),
  );

  const name = document.createElement("h3");
  name.className = "pm25-region-name";
  name.textContent = regionLabel;

  const reading = document.createElement("p");
  reading.className = "pm25-value";
  reading.textContent = formatNumber(region.pm25);

  const unit = document.createElement("span");
  unit.className = "pm25-unit";
  unit.textContent = "µg/m³";

  const caption = document.createElement("span");
  caption.className = "pm25-status";
  caption.textContent = band.range ? `${band.label} · ${band.range}` : band.label;

  reading.append(unit);
  card.append(name, reading, caption);
  return card;
}

function displayReadings(payload, pm25Payload) {
  const data = payload?.data ?? payload;
  const record = [...(data?.items ?? [])].sort(
    (first, second) =>
      Date.parse(second.updatedTimestamp ?? second.timestamp) -
      Date.parse(first.updatedTimestamp ?? first.timestamp),
  )[0];
  const readings = record?.readings;
  const regionalPsi = readings?.psi_twenty_four_hourly;
  const metadata = data?.regionMetadata;
  const pm25Data = pm25Payload?.data ?? pm25Payload;
  const pm25Record = [...(pm25Data?.items ?? [])].sort(
    (first, second) =>
      Date.parse(second.updatedTimestamp ?? second.timestamp) -
      Date.parse(first.updatedTimestamp ?? first.timestamp),
  )[0];
  const livePm25 = pm25Record?.readings?.pm25_one_hourly;

  if (!record || !regionalPsi || !Array.isArray(metadata) || metadata.length === 0) {
    throw new Error(t("readingError"));
  }

  const regions = metadata
    .filter((region) => Number.isFinite(regionalPsi[region.name]))
    .sort((first, second) => {
      const latitudeDifference =
        (second.labelLocation?.latitude ?? 0) -
        (first.labelLocation?.latitude ?? 0);
      return latitudeDifference ||
        (first.labelLocation?.longitude ?? 0) -
        (second.labelLocation?.longitude ?? 0);
    });

  if (regions.length === 0) {
    throw new Error(t("areaError"));
  }

  const orderedRegions = regions.map((region) => ({
    name: region.name.charAt(0).toUpperCase() + region.name.slice(1),
    psi: regionalPsi[region.name],
    pm25: livePm25?.[region.name],
    pm10: readings.pm10_twenty_four_hourly?.[region.name],
    psiUpdatedAt: record.updatedTimestamp ?? record.timestamp,
    pm25UpdatedAt: pm25Record?.updatedTimestamp ?? pm25Record?.timestamp,
  }));
  const scaleMax = Math.max(50, ...orderedRegions.map((region) => region.psi));
  const cards = orderedRegions.map((region) =>
    createRegionCard(region, region.psi, scaleMax, region),
  );

  regionsGrid.replaceChildren(...cards);
  regionsGrid.setAttribute("aria-busy", "false");
  pm25Grid.replaceChildren(...orderedRegions.map(createPm25Card));
  pm25Grid.setAttribute("aria-busy", "false");

  const highestRegion = orderedRegions.reduce((highest, region) =>
    region.psi > highest.psi ? region : highest,
  );
  const islandCategory = classifyPsi(highestRegion.psi);
  const categoryPill = document.querySelector("#snapshot-category");
  categoryPill.textContent = islandCategory.label;
  categoryPill.className = `category-pill is-${islandCategory.level}`;
  currentHazeLevel = islandCategory.level;
  if (!hazeLevelSelect.dataset.userSelected || !hazeLevelSelect.value) {
    hazeLevelSelect.value = currentHazeLevel;
  }
  updateHazeAdvice();
  document.querySelector("#island-psi").textContent = formatNumber(highestRegion.psi);
  document.querySelector("#highest-region").textContent =
    t("highestRegion", { region: localizeRegion(highestRegion.name) });
  document.querySelector("#region-count").textContent =
    t("areaCount", { count: numberFormat.format(orderedRegions.length) });

  const timestamps = [record, pm25Record]
    .map((item) => Date.parse(item?.updatedTimestamp ?? item?.timestamp))
    .filter(Number.isFinite);
  const latestTimestamp = Math.max(...timestamps);
  updatedAt.textContent = timestamps.length > 0
    ? t("updatedAt", { time: readingTimeFormat.format(latestTimestamp) })
    : t("latestReading");

  const hasLivePm25 = metadata.every((region) => Number.isFinite(livePm25?.[region.name]));
  errorBanner.hidden = hasLivePm25;
  if (!hasLivePm25) {
    errorMessage.textContent = t("pmUnavailable");
  }
}

function splitHealthMeasures(value) {
  const text = value.trim();
  const groups = [
    { marker: "Healthy persons:", title: t("mostHealthy") },
    { marker: "Elderly, pregnant women & children:", title: t("vulnerable") },
    { marker: "Persons with chronic lung/heart disease:", title: t("chronic") },
  ];
  const matches = groups
    .map((group) => ({ ...group, index: text.toLowerCase().indexOf(group.marker.toLowerCase()) }))
    .filter((group) => group.index >= 0)
    .sort((first, second) => first.index - second.index);

  if (matches.length === 0) {
    return text ? [{ title: t("healthAdvice"), text }] : [];
  }

  return matches.map((group, index) => {
    const start = group.index + group.marker.length;
    const end = matches[index + 1]?.index ?? text.length;
    return { title: group.title, text: text.slice(start, end).replace(/^[\s;&]+|[\s;&]+$/g, "") };
  }).filter((group) => group.text);
}

function displayOfficialDate(value) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? officialDateFormat.format(timestamp) : value;
}

function createOfficialUpdateCard(update) {
  const article = document.createElement("article");
  article.className = "official-update-card";

  const header = document.createElement("div");
  header.className = "official-update-topline";

  const source = document.createElement("span");
  source.className = "official-update-source";
  source.textContent = update.source;
  header.append(source);

  if (update.publishedAt) {
    const date = document.createElement("time");
    date.className = "official-update-date";
    const timestamp = Date.parse(update.publishedAt);
    if (Number.isFinite(timestamp)) date.dateTime = new Date(timestamp).toISOString();
    date.textContent = displayOfficialDate(update.publishedAt);
    header.append(date);
  }

  const title = document.createElement("h3");
  title.className = "official-update-title";
  title.textContent = update.title;
  article.append(header, title);

  if (update.forecast) {
    const forecast = document.createElement("p");
    forecast.className = "official-forecast";

    const label = document.createElement("span");
    label.className = "official-forecast-label";
    label.textContent = t("outlook");

    const value = document.createElement("span");
    value.textContent = update.forecast;
    forecast.append(label, value);
    article.append(forecast);
  }

  if (update.measures?.length) {
    const measures = document.createElement("section");
    measures.className = "official-measures";

    const heading = document.createElement("h4");
    heading.className = "official-measure-heading";
    heading.textContent = t("measuresHeading");
    measures.append(heading);

    for (const measure of update.measures) {
      const group = document.createElement("div");
      group.className = "official-measure";

      const audience = document.createElement("h5");
      audience.className = "official-measure-title";
      audience.textContent = measure.title;

      const advice = document.createElement("p");
      advice.textContent = measure.text;
      group.append(audience, advice);
      measures.append(group);
    }

    article.append(measures);
  }

  if (update.summary) {
    const summary = document.createElement("p");
    summary.className = "official-update-summary";
    summary.textContent = update.summary.length > 850
      ? `${update.summary.slice(0, 846).replace(/\s+\S*$/, "")}…`
      : update.summary;
    article.append(summary);
  }

  const link = document.createElement("a");
  link.className = "official-update-link";
  link.href = update.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.textContent = t("readUpdate");
  article.append(link);

  return article;
}

function renderOfficialUpdates(payload) {
  const cards = [];
  if (payload.announcement) {
    cards.push({ ...payload.announcement, publishedTime: Date.parse(payload.announcement.publishedAt) });
  }

  if (payload.hazeAdvisory) {
    const advisory = payload.hazeAdvisory;
    cards.push({
      title: advisory.title,
      source: advisory.source,
      publishedAt: advisory.publishedAt,
      publishedTime: Date.parse(advisory.publishedAt),
      forecast: advisory.forecast,
      measures: splitHealthMeasures(advisory.measures),
      summary: advisory.summary,
      url: advisory.url,
    });
  }

  cards.sort((first, second) => (second.publishedTime || 0) - (first.publishedTime || 0));
  officialUpdates.replaceChildren(...cards.map(createOfficialUpdateCard));

  if (cards.length === 0) {
    const empty = document.createElement("p");
    empty.className = "updates-empty";
    empty.textContent = t("noUpdates");
    officialUpdates.append(empty);
  }

  const noticeText = cards.map((card) => `${card.title} ${card.summary || ""} ${card.forecast || ""} ${(card.measures || []).map((measure) => measure.text).join(" ")}`).join(" ");
  if (payload.hazeAdvisory && !/\b(?:mask distribution|distribut(?:e|ion|ing).{0,30}mask|contingency plan|emergency plan)\b/i.test(noticeText)) {
    const note = document.createElement("p");
    note.className = "updates-measures-note";
    note.textContent = t("noMeasures");
    officialUpdates.append(note);
  }
}

async function refreshOfficialUpdates() {
  clearTimeout(updatesRefreshTimer);
  updatesRefreshButton.disabled = true;
  updatesError.hidden = true;
  officialUpdates.setAttribute("aria-busy", "true");
  updatesLastChecked.textContent = hasLoadedOfficialUpdates
    ? t("checkingUpdates")
    : t("checkingSources");

  try {
    const response = await fetch("/api/updates", {
      cache: "no-store",
      headers: { accept: "application/json" },
    });
    if (!response.ok) throw new Error(t("updatesFailed"));

    const payload = await response.json();
    latestOfficialPayload = payload;
    renderOfficialUpdates(payload);
    hasLoadedOfficialUpdates = true;
    const checkedAt = Date.parse(payload.updatedAt);
    updatesLastChecked.textContent = Number.isFinite(checkedAt)
      ? t("lastChecked", { time: readingTimeFormat.format(checkedAt) })
      : t("updatesChecked");
    updatesRefreshTimer = setTimeout(refreshOfficialUpdates, 15 * 60 * 1000);
  } catch {
    updatesError.textContent = t("updatesError");
    updatesError.hidden = false;
    updatesLastChecked.textContent = hasLoadedOfficialUpdates
      ? t("showingLast")
      : t("updatesUnavailable");
    updatesRefreshTimer = setTimeout(refreshOfficialUpdates, 15 * 60 * 1000);
  } finally {
    officialUpdates.setAttribute("aria-busy", "false");
    updatesRefreshButton.disabled = false;
  }
}

function updateActiveNavigation() {
  const validSections = ["#pm25-readings", "#haze-levels", "#latest-updates", "#about"];
  const activeSection = validSections.includes(location.hash) ? location.hash : "#overview";
  for (const link of navigationLinks) {
    const isActive = link.getAttribute("href") === activeSection;
    link.classList.toggle("nav-item-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  }

  if (activeSection === "#latest-updates" && !hasLoadedOfficialUpdates) {
    refreshOfficialUpdates();
  }
}

async function refreshReadings() {
  clearTimeout(refreshTimer);
  refreshButton.disabled = true;
  refreshButton.classList.add("is-refreshing");
  errorBanner.hidden = true;

  const controller = new AbortController();
  const requestTimeout = setTimeout(() => controller.abort(), 15000);

  try {
    const requestOptions = {
      cache: "no-store",
      headers: { accept: "application/json" },
      signal: controller.signal,
    };
    const [psiResult, pm25Result] = await Promise.allSettled([
      fetch(PSI_ENDPOINT, requestOptions),
      fetch(PM25_ENDPOINT, requestOptions),
    ]);

    if (psiResult.status === "rejected") throw psiResult.reason;
    const response = psiResult.value;

    if (!response.ok) {
      throw new Error(t("readingError"));
    }

    let pm25Payload = null;
    if (pm25Result.status === "fulfilled" && pm25Result.value.ok) {
      pm25Payload = await pm25Result.value.json().catch(() => null);
    }

    latestPsiPayload = await response.json();
    latestPm25Payload = pm25Payload;
    displayReadings(latestPsiPayload, latestPm25Payload);
    refreshTimer = setTimeout(refreshReadings, REFRESH_INTERVAL_MS);
  } catch (error) {
    const hasReadings = regionsGrid.children.length > 0 &&
      !regionsGrid.querySelector(".region-loading");
    const message = error.name === "AbortError"
      ? t("timeout")
      : error instanceof TypeError
        ? t("networkError")
        : error.message || t("readingError");

    if (hasReadings) {
      updatedAt.textContent = t("lastUpdatedEarlier");
      errorMessage.textContent = `${message} ${t("lastShown")}`;
    } else {
      updatedAt.textContent = t("readingsUnavailable");
      errorMessage.textContent = `${message} ${t("retrySoon")}`;
      regionsGrid.setAttribute("aria-busy", "false");
    }

    errorBanner.hidden = false;
    refreshTimer = setTimeout(refreshReadings, REFRESH_INTERVAL_MS);
  } finally {
    clearTimeout(requestTimeout);
    refreshButton.disabled = false;
    refreshButton.classList.remove("is-refreshing");
  }
}

document.querySelector("#close-dialog").addEventListener("click", () => regionDialog.close());
regionDialog.addEventListener("click", (event) => {
  if (event.target === regionDialog) regionDialog.close();
});
hazeLevelSelect.addEventListener("change", () => {
  hazeLevelSelect.dataset.userSelected = "true";
  updateHazeAdvice();
});
updatesRefreshButton.addEventListener("click", refreshOfficialUpdates);
refreshButton.addEventListener("click", refreshReadings);
retryButton.addEventListener("click", refreshReadings);
languageSelect.addEventListener("change", changeLanguage);
themeToggle.addEventListener("click", toggleTheme);
window.addEventListener("hashchange", updateActiveNavigation);
applyLanguage();
updateActiveNavigation();
refreshReadings();