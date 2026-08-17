// DAILY CHARTS
let dischargeChartInst = null;
let chargeChartInst = null;
// MONTHLY CHARTS
let monthlyDischargeChartInst = null;
let monthlyChargeChartInst = null;

// ==========================================
// ΛΟΓΙΚΗ ΓΙΑ ΤΟ DAILY DASHBOARD (Αμετάβλητο)
// ==========================================
function updateDashboard() {
    const selectedDate = document.getElementById('dateSelect').value;
    if (!selectedDate || rawData.isp.length === 0) return;

    const ispDay = rawData.isp.filter(d => d.date === selectedDate);
    const scadaDay = rawData.scada.filter(d => d.date === selectedDate);

    const ispTotal = ispDay.find(d => d.unit === "TOTAL BESS") || { charge: 0, discharge: 0, rte: "0.00%" };
    const scadaTotal = scadaDay.find(d => d.unit === "TOTAL BESS") || { charge: 0, discharge: 0, rte: "0.00%" };

    document.getElementById('kpiChargeIsp').innerText = ispTotal.charge.toFixed(2);
    document.getElementById('kpiChargeScada').innerText = scadaTotal.charge.toFixed(2);
    document.getElementById('kpiDischargeIsp').innerText = ispTotal.discharge.toFixed(2);
    document.getElementById('kpiDischargeScada').innerText = scadaTotal.discharge.toFixed(2);
    document.getElementById('kpiRteIsp').innerText = ispTotal.rte;
    document.getElementById('kpiRteScada').innerText = scadaTotal.rte;

    const unitMap = {};
    function getBaseUnitId(name) {
        return name.toUpperCase().replace(/BZ\d+/g, '').replace(/_/g, '');
    }

    ispDay.forEach(d => {
        if (d.unit === "TOTAL BESS") return;
        const id = getBaseUnitId(d.unit);
        if (!unitMap[id]) unitMap[id] = { display: d.unit.replace(/_BZ\d+_/g, '_'), ispDischarge: 0, scadaDischarge: 0, ispCharge: 0, scadaCharge: 0 };
        unitMap[id].ispDischarge += d.discharge;
        unitMap[id].ispCharge += d.charge;
    });

    scadaDay.forEach(d => {
        if (d.unit === "TOTAL BESS") return;
        const id = getBaseUnitId(d.unit);
        if (!unitMap[id]) unitMap[id] = { display: d.unit, ispDischarge: 0, scadaDischarge: 0, ispCharge: 0, scadaCharge: 0 };
        unitMap[id].scadaDischarge += d.discharge;
        unitMap[id].scadaCharge += d.charge;
        unitMap[id].display = d.unit;
    });

    const units = Object.keys(unitMap).sort();
    const labels = units.map(u => unitMap[u].display);
    
    const ispDischarge = units.map(u => unitMap[u].ispDischarge);
    const scadaDischarge = units.map(u => unitMap[u].scadaDischarge);
    const ispCharge = units.map(u => unitMap[u].ispCharge);
    const scadaCharge = units.map(u => unitMap[u].scadaCharge);

    renderDailyCharts(labels, ispDischarge, scadaDischarge, ispCharge, scadaCharge);
}

function renderDailyCharts(labels, ispDischarge, scadaDischarge, ispCharge, scadaCharge) {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const t = i18n[currentLang];

    const ctxDischarge = document.getElementById('dischargeChart').getContext('2d');
    if (dischargeChartInst) dischargeChartInst.destroy();
    dischargeChartInst = new Chart(ctxDischarge, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: t.ispDisp, data: ispDischarge, backgroundColor: '#60a5fa', borderRadius: 4 },
                { label: t.scadaDisp, data: scadaDischarge, backgroundColor: '#34d399', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' } } }
        }
    });

    const ctxCharge = document.getElementById('chargeChart').getContext('2d');
    if (chargeChartInst) chargeChartInst.destroy();
    chargeChartInst = new Chart(ctxCharge, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: t.ispChg, data: ispCharge, backgroundColor: '#c084fc', borderRadius: 4 },
                { label: t.scadaChg, data: scadaCharge, backgroundColor: '#fb923c', borderRadius: 4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' } } }
        }
    });
}

// ==========================================
// ΝΕΑ ΛΟΓΙΚΗ: MONTHLY CUMULATIVE DASHBOARD
// ==========================================
function updateMonthlyDashboard() {
    const selectedMonth = document.getElementById('monthSelect').value;
    if (!selectedMonth || rawData.scada.length === 0) return;

    // Φιλτράρισμα SCADA μόνο για τον επιλεγμένο μήνα
    const monthData = rawData.scada.filter(d => d.date.startsWith(selectedMonth));
    
    // Ομαδοποίηση ανά ημέρα (Αγνοούμε το "TOTAL BESS" γιατί θα τα αθροίσουμε εμείς)
    const dailyTotals = {};
    monthData.forEach(d => {
        if (d.unit === "TOTAL BESS") return;
        if (!dailyTotals[d.date]) dailyTotals[d.date] = { charge: 0, discharge: 0 };
        dailyTotals[d.date].charge += d.charge;
        dailyTotals[d.date].discharge += d.discharge;
    });

    // Ταξινόμηση ημερομηνιών ΧΡΟΝΟΛΟΓΙΚΑ (Αύξουσα σειρά π.χ. 1 Αυγ έως 31 Αυγ)
    const sortedDates = Object.keys(dailyTotals).sort();
    
    let cumCharge = 0;
    let cumDischarge = 0;
    
    const labels = [];
    const chargeData = [];
    const dischargeData = [];

    sortedDates.forEach(date => {
        // Μετατροπή YYYY-MM-DD σε DD/MM για τον άξονα Χ
        let parts = date.split('-');
        labels.push(`${parts[2]}/${parts[1]}`);
        
        cumCharge += dailyTotals[date].charge;
        cumDischarge += dailyTotals[date].discharge;
        
        chargeData.push(cumCharge);
        dischargeData.push(cumDischarge);
    });

    // Ενημέρωση των Μηνιαίων KPIs
    document.getElementById('kpiMonthlyCharge').innerText = cumCharge.toFixed(2);
    document.getElementById('kpiMonthlyDischarge').innerText = cumDischarge.toFixed(2);

    renderMonthlyCharts(labels, chargeData, dischargeData);
}

function renderMonthlyCharts(labels, chargeData, dischargeData) {
    const t = i18n[currentLang];

    // -- Γράφημα Υποκατάστασης Αερίου (Discharge) --
    const ctxDischarge = document.getElementById('monthlyDischargeChart').getContext('2d');
    if (monthlyDischargeChartInst) monthlyDischargeChartInst.destroy();
    
    monthlyDischargeChartInst = new Chart(ctxDischarge, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative MWh',
                data: dischargeData,
                borderColor: '#34d399',      // SCADA Emerald
                backgroundColor: 'rgba(52, 211, 153, 0.2)', // Ημιδιαφανές γέμισμα
                fill: true,                  // Κάνει το γράφημα Area Chart
                tension: 0.3,                // Ελαφριά καμπύλη στις γραμμές
                pointRadius: 3,
                pointBackgroundColor: '#34d399'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } }, // Κρύβουμε το legend γιατί είναι προφανές από τον τίτλο
            scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' } } }
        }
    });

    // -- Γράφημα Αποφυγής Περικοπών (Charge) --
    const ctxCharge = document.getElementById('monthlyChargeChart').getContext('2d');
    if (monthlyChargeChartInst) monthlyChargeChartInst.destroy();
    
    monthlyChargeChartInst = new Chart(ctxCharge, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cumulative MWh',
                data: chargeData,
                borderColor: '#fb923c',      // SCADA Orange
                backgroundColor: 'rgba(251, 146, 60, 0.2)', 
                fill: true,
                tension: 0.3,
                pointRadius: 3,
                pointBackgroundColor: '#fb923c'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' } } }
        }
    });
}
