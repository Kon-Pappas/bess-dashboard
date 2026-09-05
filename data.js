const API_URL = "https://script.google.com/macros/s/AKfycbyZESmS6vPrmjQsa6ZfAsHFLhcL562KhyfS_39cEUcZJp3fA6li9iGZcnqOV-_346KS/exec";

// Προστέθηκε το pump!
let rawData = { isp: [], scada: [], surplus: [], pump: [] };
let currentLang = 'el';

const i18n = {
    el: {
        title: "Greek BESS Market Analytics",
        source: "Πηγή δεδομένων: Επίσημα αρχεία ISP & SCADA - ΑΔΜΗΕ (IPTO)",
        scopeTooltip: "Αφορά αποκλειστικά τις μονάδες BESS στο Σύστημα Μεταφοράς (ΑΔΜΗΕ). Δεν περιλαμβάνονται τα συστήματα στο Δίκτυο Διανομής (ΔΕΔΔΗΕ).",
        lastUpdate: "Τελευταία Ενημέρωση:",
        nextUpdate: "Επόμενη Ενημέρωση:",
        dateLabel: "Ημερομηνία:",
        monthLabel: "Μήνας:",
        tabDaily: "Ημερήσια Ανάλυση",
        tabMonthly: "Μηνιαίος Αντίκτυπος",
        tabSurplus: "Πλεόνασμα & Ευελιξία",
        // Daily
        dischargeTitle: "Αποφόρτιση (Discharge) Ανά Μονάδα BESS (MWh)",
        totalDischarge: "Συνολική Αποφόρτιση",
        chargeTitle: "Φόρτιση (Charge) Ανά Μονάδα BESS (MWh)",
        totalCharge: "Συνολική Φόρτιση",
        rte: "Round Trip Efficiency (RTE - Total BESS)",
        schedIsp: "ΠΡΟΓΡΑΜΜΑΤΙΣΜΟΣ (ISP)",
        actScada: "ΠΡΑΓΜΑΤΙΚΗ (SCADA)",
        // Monthly
        monthlyDischargeTitle: "Πιθανή Υποκατάσταση Θερμικών Μονάδων (Λιγνήτης ή/και Φ. Αέριο) - (Αθροιστική Αποφόρτιση)",
        monthlyDischargeSub: "SCADA Data - Εξοικονόμηση θερμικής παραγωγής",
        monthlyChargeTitle: "Πιθανή Αποφυγή Περικοπών ΑΠΕ (Αθροιστική Φόρτιση)",
        monthlyChargeSub: "SCADA Data - Ενέργεια που αλλιώς θα περικόπτονταν (Curtailment)",
        kpiLabelAvoided: "Μηνιαια Αποφυγη",
        kpiLabelDisplaced: "Μηνιαια Υποκατασταση",
        // Surplus Tab
        surplusStackedTitle: "Ημερήσιο Πλεόνασμα & Απορρόφηση Ευελιξίας (GWh)",
        surplusStackedSub: "Απόλυτες τιμές. Τις μέρες χωρίς κόκκινη μπάρα (Surplus = 0) η φόρτιση αφορά καθαρά λειτουργία αγοράς (arbitrage).",
        surplusBadgeTip: "Το % απορρόφησης υπολογίζεται επί του Θεωρητικού Αρχικού Πλεονάσματος (Surplus + BESS Charge + PUMP Charge)",
        surplusCumulativeTitle: "Αθροιστική Εξέλιξη Ευελιξίας (Cumulative BESS & PUMP vs Surplus)",
        surplusCumulativeSub: "Σύγκριση της αθροιστικής φόρτισης SCADA (Μπαταρίες + Αντλησιοταμίευση) με το αθροιστικό υπολειπόμενο ISP Surplus"
    },
    en: {
        title: "Greek BESS Market Analytics",
        source: "Data source: IPTO (ADMIE) official ISP & SCADA files",
        scopeTooltip: "Refers exclusively to BESS units connected to the Transmission System (IPTO/ADMIE). Excludes distributed systems on the Distribution Network (HEDNO).",
        lastUpdate: "Last Update:",
        nextUpdate: "Next Update:",
        dateLabel: "Date:",
        monthLabel: "Month:",
        tabDaily: "Daily Analytics",
        tabMonthly: "Monthly Impact",
        tabSurplus: "Surplus & Flexibility",
        // Daily
        dischargeTitle: "Discharge Per BESS Unit (MWh)",
        totalDischarge: "Total Discharge",
        chargeTitle: "Charge Per BESS Unit (MWh)",
        totalCharge: "Total Charge",
        rte: "Round Trip Efficiency (RTE - Total BESS)",
        schedIsp: "SCHEDULED (ISP)",
        actScada: "ACTUAL (SCADA)",
        // Monthly
        monthlyDischargeTitle: "Potential Displaced Thermal Generation (Lignite/Gas) - (Cumulative Discharge)",
        monthlyDischargeSub: "SCADA Data - Avoided Thermal Generation",
        monthlyChargeTitle: "Potential Avoided RES Curtailment (Cumulative Charge)",
        monthlyChargeSub: "SCADA Data - Energy saved from curtailment",
        kpiLabelAvoided: "Monthly Avoided",
        kpiLabelDisplaced: "Monthly Displaced",
        // Surplus Tab
        surplusStackedTitle: "Daily Energy Surplus & Flexibility Absorption (GWh)",
        surplusStackedSub: "Absolute values. Days with no red bar (Surplus = 0) indicate purely market-driven arbitrage charging.",
        surplusBadgeTip: "Absorption % is calculated on the Theoretical Initial Surplus (ISP Surplus + BESS + PUMP)",
        surplusCumulativeTitle: "Cumulative Flexibility Evolution (BESS & PUMP vs Surplus)",
        surplusCumulativeSub: "Comparison of cumulative SCADA charging (Batteries + Pumped Hydro) vs cumulative residual ISP Surplus"
    }
};

function setLang(lang) {
    currentLang = lang;
    const t = i18n[lang];
    
    document.getElementById('mainTitle').innerText = t.title;
    document.getElementById('dataSourceText').innerText = t.source;
    document.getElementById('scopeBadge').title = t.scopeTooltip;
    document.getElementById('lastUpdateLabel').innerText = t.lastUpdate;
    document.getElementById('nextUpdateLabel').innerText = t.nextUpdate;
    document.getElementById('dateLabel').innerText = t.dateLabel;
    document.getElementById('monthLabel').innerText = t.monthLabel;
    document.getElementById('monthLabelSurp').innerText = t.monthLabel;
    
    // Tabs
    document.getElementById('tabBtnDaily').innerText = t.tabDaily;
    document.getElementById('tabBtnMonthly').innerText = t.tabMonthly;
    document.getElementById('tabBtnSurplus').innerText = t.tabSurplus;
    
    // Daily View
    document.getElementById('dischargeTitle').innerText = t.dischargeTitle;
    document.getElementById('totalDischargeLabel').innerText = t.totalDischarge;
    document.getElementById('chargeTitle').innerText = t.chargeTitle;
    document.getElementById('totalChargeLabel').innerText = t.totalCharge;
    document.getElementById('rteLabel').innerText = t.rte;
    document.getElementById('lblDispIsp').innerText = t.schedIsp;
    document.getElementById('lblDispScada').innerText = t.actScada;
    document.getElementById('lblChgIsp').innerText = t.schedIsp;
    document.getElementById('lblChgScada').innerText = t.actScada;

    // Monthly View
    document.getElementById('monthlyDischargeTitle').innerText = t.monthlyDischargeTitle;
    document.getElementById('monthlyDischargeSub').innerText = t.monthlyDischargeSub;
    document.getElementById('monthlyChargeTitle').innerText = t.monthlyChargeTitle;
    document.getElementById('monthlyChargeSub').innerText = t.monthlyChargeSub;
    document.getElementById('kpiLabelAvoided').innerText = t.kpiLabelAvoided;
    document.getElementById('kpiLabelDisplaced').innerText = t.kpiLabelDisplaced;

    // Surplus View
    document.getElementById('surplusStackedTitle').innerText = t.surplusStackedTitle;
    document.getElementById('surplusStackedSub').innerText = t.surplusStackedSub;
    document.getElementById('surplusBadge').title = t.surplusBadgeTip;
    document.getElementById('surplusCumulativeTitle').innerText = t.surplusCumulativeTitle;
    document.getElementById('surplusCumulativeSub').innerText = t.surplusCumulativeSub;

    if(lang === 'el') {
        document.getElementById('btnGr').className = "px-2 py-1 rounded bg-emerald-600 text-white transition";
        document.getElementById('btnEn').className = "px-2 py-1 rounded text-slate-400 hover:text-white transition";
    } else {
        document.getElementById('btnEn').className = "px-2 py-1 rounded bg-emerald-600 text-white transition";
        document.getElementById('btnGr').className = "px-2 py-1 rounded text-slate-400 hover:text-white transition";
    }

    if (typeof updateDashboard === "function") updateDashboard();
    if (typeof updateMonthlyDashboard === "function") updateMonthlyDashboard();
    if (typeof updateSurplusDashboard === "function") updateSurplusDashboard();
}

function switchTab(tabId) {
    const tabs = ['daily', 'monthly', 'surplus'];
    tabs.forEach(t => {
        const btn = document.getElementById('tabBtn' + t.charAt(0).toUpperCase() + t.slice(1));
        const view = document.getElementById('view' + t.charAt(0).toUpperCase() + t.slice(1));
        if (t === tabId) {
            btn.className = "text-emerald-400 font-bold border-b-2 border-emerald-400 pb-2 px-2 transition whitespace-nowrap";
            view.classList.remove('hidden');
        } else {
            btn.className = "text-slate-500 hover:text-emerald-300 pb-2 px-2 transition whitespace-nowrap";
            view.classList.add('hidden');
        }
    });

    if (tabId === 'daily' && typeof updateDashboard === "function") updateDashboard();
    if (tabId === 'monthly' && typeof updateMonthlyDashboard === "function") updateMonthlyDashboard();
    if (tabId === 'surplus' && typeof updateSurplusDashboard === "function") updateSurplusDashboard();
}

function parseNum(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let str = String(val).trim().replace(',', '.').replace(/[^0-9.-]/g, '');
    let n = parseFloat(str);
    return isNaN(n) ? 0 : n;
}

function normalizeData(dataArray) {
    if (!dataArray || dataArray.length === 0) return [];
    const sample = dataArray[0];
    const keys = Object.keys(sample);
    
    const dateKey = keys.find(k => k.includes("Ημερομηνία") || k.includes("Date")) || "Ημερομηνία";
    const unitKey = keys.find(k => k.includes("Μονάδα") || k.includes("Unit")) || "Μονάδα BESS";
    const chargeKey = keys.find(k => k.includes("Φόρτιση") && !k.includes("Αποφόρτιση")) || "Φόρτιση (MWh)";
    const dischargeKey = keys.find(k => k.includes("Αποφόρτιση")) || "Αποφόρτιση (MWh)";
    const rteKey = keys.find(k => k.includes("RTE")) || "RTE (%)";

    return dataArray.map(d => ({
        date: d[dateKey],
        unit: String(d[unitKey] || "").trim(),
        charge: parseNum(d[chargeKey]),
        discharge: parseNum(d[dischargeKey]),
        rte: d[rteKey] || "0.00%"
    }));
}

function updateFreshness(dates) {
    if (!dates || dates.length === 0) return;
    const latestDate = dates[0];
    let parts = latestDate.split('-');
    let formattedLatest = latestDate;
    let formattedNext = "-";
    if (parts.length === 3) {
        formattedLatest = `${parts[2]}/${parts[1]}/${parts[0]} 08:00`;
        let d = new Date(parts[0], parts[1] - 1, parseInt(parts[2]) + 1);
        let day = String(d.getDate()).padStart(2, '0');
        let month = String(d.getMonth() + 1).padStart(2, '0');
        let year = d.getFullYear();
        formattedNext = `${day}/${month}/${year} 08:00`;
    }
    document.getElementById('lastUpdateVal').innerText = formattedLatest;
    document.getElementById('nextUpdateVal').innerText = formattedNext;
}

async function init() {
    try {
        const res = await fetch(API_URL);
        const json = await res.json();
        
        rawData.isp = normalizeData(json.isp);
        rawData.scada = normalizeData(json.scada);
        
        // Ομαλοποίηση Surplus
        if (json.surplus) {
            rawData.surplus = json.surplus.map(d => {
                const keys = Object.keys(d);
                return {
                    date: d[keys.find(k => k.includes("Ημερομηνία") || k.includes("Date"))],
                    val: parseNum(d[keys.find(k => k.includes("Surplus"))])
                };
            });
        }

        // Ομαλοποίηση Pump
        if (json.pump) {
            rawData.pump = json.pump.map(d => {
                const keys = Object.keys(d);
                return {
                    date: d[keys.find(k => k.includes("Ημερομηνία") || k.includes("Date"))],
                    val: parseNum(d[keys.find(k => k.includes("Pump"))])
                };
            });
        }
        
        document.getElementById('scopeBadge').title = i18n[currentLang].scopeTooltip;

        const dates = [...new Set([
            ...rawData.isp.map(d => d.date),
            ...rawData.scada.map(d => d.date)
        ])].filter(d => d).sort().reverse();
        
        document.getElementById('dateSelect').innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');

        const months = [...new Set(dates.map(d => d.substring(0, 7)))].sort().reverse();
        const monthOptions = months.map(m => {
            const parts = m.split('-');
            return `<option value="${m}">${parts[1]}/${parts[0]}</option>`;
        }).join('');
        
        document.getElementById('monthSelect').innerHTML = monthOptions;
        document.getElementById('monthSelectSurplus').innerHTML = monthOptions;

        updateFreshness(dates);
        if (typeof updateDashboard === "function") updateDashboard();
        if (typeof updateMonthlyDashboard === "function") updateMonthlyDashboard();
        if (typeof updateSurplusDashboard === "function") updateSurplusDashboard();
    } catch (err) {
        alert("Σφάλμα κατά τη φόρτωση των δεδομένων: " + err.message);
        console.error(err);
    }
}
init();
