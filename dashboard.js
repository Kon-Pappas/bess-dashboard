// DAILY CHARTS
let dischargeChartInst = null;
let chargeChartInst = null;
// MONTHLY CHARTS
let monthlyDischargeChartInst = null;
let monthlyChargeChartInst = null;
// SURPLUS CHARTS
let surplusStackedChartInst = null;
let surplusCumulativeChartInst = null;

function formatGWh(mwh) {
    let gwh = mwh / 1000;
    return gwh < 1 ? gwh.toFixed(3) : gwh.toFixed(2);
}

// ==========================================
// 1. DAILY DASHBOARD
// ==========================================
function updateDashboard() {
    const selectedDate = document.getElementById('dateSelect').value;
    if (!selectedDate || rawData.isp.length === 0) return;

    const ispDay = rawData.isp.filter(d => d.date === selectedDate);
    const scadaDay = rawData.scada.filter(d => d.date === selectedDate);

    const ispTotal = ispDay.find(d => d.unit === "TOTAL BESS") || { charge: 0, discharge: 0, rte: "0.00%" };
    const scadaTotal = scadaDay.find(d => d.unit === "TOTAL BESS") || { charge: 0, discharge: 0, rte: "0.00%" };

    document.getElementById('kpiChargeIsp').innerText = formatGWh(ispTotal.charge);
    document.getElementById('kpiChargeScada').innerText = formatGWh(scadaTotal.charge);
    document.getElementById('kpiDischargeIsp').innerText = formatGWh(ispTotal.discharge);
    document.getElementById('kpiDischargeScada').innerText = formatGWh(scadaTotal.discharge);
    document.getElementById('kpiRteIsp').innerText = ispTotal.rte;
    document.getElementById('kpiRteScada').innerText = scadaTotal.rte;

    const unitMap = {};
    function getBaseUnitId(name) { return name.toUpperCase().replace(/BZ\d+/g, '').replace(/_/g, ''); }

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
    renderDailyCharts(labels, units.map(u => unitMap[u].ispDischarge), units.map(u => unitMap[u].scadaDischarge), units.map(u => unitMap[u].ispCharge), units.map(u => unitMap[u].scadaCharge));
}

function renderDailyCharts(labels, ispDischarge, scadaDischarge, ispCharge, scadaCharge) {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    const ctxDischarge = document.getElementById('dischargeChart').getContext('2d');
    if (dischargeChartInst) dischargeChartInst.destroy();
    dischargeChartInst = new Chart(ctxDischarge, { type: 'bar', data: { labels: labels, datasets: [{ label: 'ISP (MWh)', data: ispDischarge, backgroundColor: '#60a5fa', borderRadius: 4 }, { label: 'SCADA (MWh)', data: scadaDischarge, backgroundColor: '#34d399', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' } } } } });

    const ctxCharge = document.getElementById('chargeChart').getContext('2d');
    if (chargeChartInst) chargeChartInst.destroy();
    chargeChartInst = new Chart(ctxCharge, { type: 'bar', data: { labels: labels, datasets: [{ label: 'ISP (MWh)', data: ispCharge, backgroundColor: '#c084fc', borderRadius: 4 }, { label: 'SCADA (MWh)', data: scadaCharge, backgroundColor: '#fb923c', borderRadius: 4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' } } } } });
}

// ==========================================
// 2. MONTHLY DASHBOARD
// ==========================================
function updateMonthlyDashboard() {
    const selectedMonth = document.getElementById('monthSelect').value;
    if (!selectedMonth || rawData.scada.length === 0) return;

    const monthData = rawData.scada.filter(d => d.date.startsWith(selectedMonth));
    const dailyTotals = {};
    monthData.forEach(d => {
        if (d.unit === "TOTAL BESS") return;
        if (!dailyTotals[d.date]) dailyTotals[d.date] = { charge: 0, discharge: 0 };
        dailyTotals[d.date].charge += d.charge;
        dailyTotals[d.date].discharge += d.discharge;
    });

    const sortedDates = Object.keys(dailyTotals).sort();
    let cumCharge = 0, cumDischarge = 0;
    const labels = [], chargeData = [], dischargeData = [];

    sortedDates.forEach(date => {
        let parts = date.split('-');
        labels.push(`${parts[2]}/${parts[1]}`);
        cumCharge += dailyTotals[date].charge;
        cumDischarge += dailyTotals[date].discharge;
        chargeData.push(cumCharge / 1000); 
        dischargeData.push(cumDischarge / 1000); 
    });

    document.getElementById('kpiMonthlyCharge').innerText = formatGWh(cumCharge);
    document.getElementById('kpiMonthlyDischarge').innerText = formatGWh(cumDischarge);

    renderMonthlyCharts(labels, chargeData, dischargeData);
}

function renderMonthlyCharts(labels, chargeData, dischargeData) {
    const ctxDischarge = document.getElementById('monthlyDischargeChart').getContext('2d');
    if (monthlyDischargeChartInst) monthlyDischargeChartInst.destroy();
    monthlyDischargeChartInst = new Chart(ctxDischarge, { type: 'line', data: { labels: labels, datasets: [{ label: 'GWh', data: dischargeData, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.2)', fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#34d399' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' }, title: { display: true, text: 'GWh' } } } } });

    const ctxCharge = document.getElementById('monthlyChargeChart').getContext('2d');
    if (monthlyChargeChartInst) monthlyChargeChartInst.destroy();
    monthlyChargeChartInst = new Chart(ctxCharge, { type: 'line', data: { labels: labels, datasets: [{ label: 'GWh', data: chargeData, borderColor: '#fb923c', backgroundColor: 'rgba(251, 146, 60, 0.2)', fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: '#fb923c' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' }, title: { display: true, text: 'GWh' } } } } });
}

// ==========================================
// 3. SURPLUS DASHBOARD
// ==========================================
function updateSurplusDashboard() {
    const selectedMonth = document.getElementById('monthSelectSurplus').value;
    if (!selectedMonth || !rawData.surplus) return;

    // SCADA (BESS)
    const monthScada = rawData.scada.filter(d => d.date.startsWith(selectedMonth));
    const scadaTotals = {};
    monthScada.forEach(d => {
        if (d.unit === "TOTAL BESS") return;
        if (!scadaTotals[d.date]) scadaTotals[d.date] = 0;
        scadaTotals[d.date] += d.charge;
    });

    // SCADA (PUMP)
    const monthPump = rawData.pump ? rawData.pump.filter(d => d.date.startsWith(selectedMonth)) : [];
    const pumpTotals = {};
    monthPump.forEach(d => { pumpTotals[d.date] = d.val; });

    // SURPLUS (ISP)
    const monthSurplus = rawData.surplus.filter(d => d.date.startsWith(selectedMonth));
    const surpTotals = {};
    monthSurplus.forEach(d => { surpTotals[d.date] = d.val; });

    const allDates = [...new Set([...Object.keys(scadaTotals), ...Object.keys(pumpTotals), ...Object.keys(surpTotals)])].sort();
    
    const labels = [];
    const dailyBessGWh = [];
    const dailyPumpGWh = [];
    const dailySurpGWh = [];
    
    const cumBessGWh = [];
    const cumPumpGWh = [];
    const cumSurpGWh = [];
    
    let runBess = 0;
    let runPump = 0;
    let runSurp = 0;

    allDates.forEach(date => {
        let parts = date.split('-');
        labels.push(`${parts[2]}/${parts[1]}`);

        let bessDay = (scadaTotals[date] || 0) / 1000;
        let pumpDay = (pumpTotals[date] || 0) / 1000;
        let surpDay = Math.abs(surpTotals[date] || 0) / 1000;
        
        dailyBessGWh.push(bessDay);
        dailyPumpGWh.push(pumpDay);
        dailySurpGWh.push(surpDay);

        runBess += bessDay;
        runPump += pumpDay;
        runSurp += surpDay;
        
        cumBessGWh.push(runBess);
        cumPumpGWh.push(runPump);
        cumSurpGWh.push(runSurp);
    });

    renderSurplusCharts(labels, dailyBessGWh, dailyPumpGWh, dailySurpGWh, cumBessGWh, cumPumpGWh, cumSurpGWh);
}

function renderSurplusCharts(labels, dailyBess, dailyPump, dailySurplus, cumBess, cumPump, cumSurplus) {
    const ctxStacked = document.getElementById('surplusStackedChart').getContext('2d');
    if (surplusStackedChartInst) surplusStackedChartInst.destroy();
    
    surplusStackedChartInst = new Chart(ctxStacked, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                { label: 'BESS Charge (SCADA)', data: dailyBess, backgroundColor: '#34d399', stack: 'Stack 0' },
                { label: 'PUMP Charge (SCADA)', data: dailyPump, backgroundColor: '#3b82f6', stack: 'Stack 0' },
                { label: 'Residual Surplus (ISP)', data: dailySurplus, backgroundColor: '#ef4444', stack: 'Stack 0' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    callbacks: {
                        footer: function(tooltipItems) {
                            let idx = tooltipItems[0].dataIndex;
                            let bess = dailyBess[idx];
                            let pump = dailyPump[idx];
                            let surp = dailySurplus[idx];
                            
                            // Προσθήκη ελέγχου γλώσσας και βελτίωσης λεκτικού για Surplus = 0
                            if (surp === 0) {
                                return (currentLang === 'el') 
                                    ? "Zero ISP Surplus\nΠιθανή καθαρή λειτουργία Market Arbitrage." 
                                    : "Zero ISP Surplus\nPotential pure Market Arbitrage operation.";
                            }
                            
                            let total = bess + pump + surp;
                            let pctBess = ((bess / total) * 100).toFixed(1);
                            let pctPump = ((pump / total) * 100).toFixed(1);
                            let pctSurp = ((surp / total) * 100).toFixed(1);
                            
                            let langText = (currentLang === 'el') ? 
                                `\n💡 Επίλυση Θεωρητικού Πλεονάσματος:\n- Αντλησιοταμίευση (PUMP): ${pctPump}%\n- Μπαταρίες (BESS): ${pctBess}%\n- Τελικό Πλεόνασμα (Surplus): ${pctSurp}%` :
                                `\n💡 Theoretical Surplus Resolution:\n- Pumped Hydro (PUMP): ${pctPump}%\n- Batteries (BESS): ${pctBess}%\n- Residual Surplus: ${pctSurp}%`;
                            
                            return langText;
                        }
                    }
                }
            },
            scales: { 
                x: { stacked: true, grid: { display: false } }, 
                y: { stacked: true, grid: { color: '#334155' }, title: { display: true, text: 'GWh' } } 
            }
        }
    });

    const ctxCum = document.getElementById('surplusCumulativeChart').getContext('2d');
    if (surplusCumulativeChartInst) surplusCumulativeChartInst.destroy();
    
    surplusCumulativeChartInst = new Chart(ctxCum, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Cum. BESS Charge', data: cumBess, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.1)', fill: true, tension: 0.3 },
                { label: 'Cum. PUMP Charge', data: cumPump, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.3 },
                { label: 'Cum. Residual Surplus', data: cumSurplus, borderColor: '#ef4444', backgroundColor: 'transparent', fill: false, tension: 0.3 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: '#334155' }, title: { display: true, text: 'GWh' } } }
        }
    });
}
