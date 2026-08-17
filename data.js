const API_URL = "https://script.google.com/macros/s/AKfycbyZESmS6vPrmjQsa6ZfAsHFLhcL562KhyfS_39cEUcZJp3fA6li9iGZcnqOV-_346KS/exec";

let rawData = { isp: [], scada: [] };
let currentLang = 'el';

const i18n = {
    el: {
        title: "Daily Greek BESS Market Analytics",
        source: "Πηγή δεδομένων: Επίσημα αρχεία ISP & SCADA - ΑΔΜΗΕ (IPTO)",
        lastUpdate: "Τελευταία Ενημέρωση:",
        nextUpdate: "Επόμενη Ενημέρωση:",
        dateLabel: "Ημερομηνία:",
        dischargeTitle: "Αποφόρτιση (Discharge) Ανά Μονάδα BESS (MWh)",
        totalDischarge: "Συνολική Αποφόρτιση",
        chargeTitle: "Φόρτιση (Charge) Ανά Μονάδα BESS (MWh)",
        totalCharge: "Συνολική Φόρτιση",
        rte: "Round Trip Efficiency (RTE - Total BESS)",
        ispDisp: "ISP Αποφόρτιση (MWh)",
        scadaDisp: "SCADA Αποφόρτιση (MWh)",
        ispChg: "ISP Φόρτιση (MWh)",
        scadaChg: "SCADA Φόρτιση (MWh)"
    },
    en: {
        title: "Daily Greek BESS Market Analytics",
        source: "Data source: IPTO (ADMIE) official ISP & SCADA files",
        lastUpdate: "Last Update:",
        nextUpdate: "Next Update:",
        dateLabel: "Date:",
        dischargeTitle: "Discharge Per BESS Unit (MWh)",
        totalDischarge: "Total Discharge",
        chargeTitle: "Charge Per BESS Unit (MWh)",
        totalCharge: "Total Charge",
        rte: "Round Trip Efficiency (RTE - Total BESS)",
        ispDisp: "ISP Discharge (MWh)",
        scadaDisp: "SCADA Discharge (MWh)",
        ispChg: "ISP Charge (MWh)",
        scadaChg: "SCADA Charge (MWh)"
    }
};

function setLang(lang) {
    currentLang = lang;
    document.getElementById('mainTitle').innerText = i18n[lang].title;
    document.getElementById('dataSourceText').innerText = i18n[lang].source;
    document.getElementById('lastUpdateLabel').innerText = i18n[lang].lastUpdate;
    document.getElementById('nextUpdateLabel').innerText = i18n[lang].nextUpdate;
    document.getElementById('dateLabel').innerText = i18n[lang].dateLabel;
    document.getElementById('dischargeTitle').innerText = i18n[lang].dischargeTitle;
    document.getElementById('totalDischargeLabel').innerText = i18n[lang].totalDischarge;
    document.getElementById('chargeTitle').innerText = i18n[lang].chargeTitle;
    document.getElementById('totalChargeLabel').innerText = i18n[lang].totalCharge;
    document.getElementById('rteLabel').innerText = i18n[lang].rte;

    if(lang === 'el') {
        document.getElementById('btnGr').className = "px-2 py-1 rounded bg-emerald-600 text-white transition";
        document.getElementById('btnEn').className = "px-2 py-1 rounded text-slate-400 hover:text-white transition";
    } else {
        document.getElementById('btnEn').className = "px-2 py-1 rounded bg-emerald-600 text-white transition";
        document.getElementById('btnGr').className = "px-2 py-1 rounded text-slate-400 hover:text-white transition";
    }

    if (typeof updateDashboard === "function") updateDashboard();
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
        
        const dates = [...new Set([
            ...rawData.isp.map(d => d.date),
            ...rawData.scada.map(d => d.date)
        ])].filter(d => d).sort().reverse();

        const select = document.getElementById('dateSelect');
        select.innerHTML = dates.map(d => `<option value="${d}">${d}</option>`).join('');

        updateFreshness(dates);
        if (typeof updateDashboard === "function") updateDashboard();
    } catch (err) {
        alert("Σφάλμα κατά τη φόρτωση των δεδομένων: " + err.message);
        console.error(err);
    }
}

// Έναρξη μόλις φορτώσει το αρχείο
init();
