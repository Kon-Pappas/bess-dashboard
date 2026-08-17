let dischargeChartInst = null;
let chargeChartInst = null;

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

    renderCharts(labels, ispDischarge, scadaDischarge, ispCharge, scadaCharge);
}

function renderCharts(labels, ispDischarge, scadaDischarge, ispCharge, scadaCharge) {
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#334155' } }
            }
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
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'top' } },
            scales: {
                x: { grid: { display: false } },
                y: { grid: { color: '#334155' } }
            }
        }
    });
}
