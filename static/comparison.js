// ✅ FULLY FIXED comparison.js
// Includes: working efficiency score, performance rating, and scaled-down graphs

class AlgorithmComparisonApp {
    constructor() {
        this.currentPoints = [];
        this.comparisonResults = {};
        this.algorithms = [
            { id: 'nearest_neighbor', name: 'Nearest Neighbor' },
            { id: 'greedy', name: 'Greedy Algorithm' },
            { id: 'genetic', name: 'Genetic Algorithm' },
            { id: 'dynamic', name: 'Dynamic Programming' },
            { id: 'aco', name: 'Ant Colony Optimization' }
        ];
        this.charts = { distance: null, time: null };

        this.initializeElements();
        this.attachEventListeners();

        try {
            const storedData = localStorage.getItem('tsp_comparison_results');
            if (storedData) {
                const data = JSON.parse(storedData);
                if (data.points && Array.isArray(data.points)) {
                    this.currentPoints = data.points;
                    this.updateCurrentPointsDisplay();
                }
                if (data.results) {
                    this.comparisonResults = data.results;
                    this.calculatePerformanceMetrics();
                    for (const [id, result] of Object.entries(this.comparisonResults)) {
                        this.updateComparisonTableRow(id, result.status, result);
                    }
                    this.updateChartsAndTable();
                }
            }
        } catch (e) {
            console.warn('Failed to load stored data:', e);
        }

        this.loadPointsFromMainPage();
    }
       
    

    initializeElements() {
        this.runComparisonBtn = document.getElementById('run-comparison-btn');
        this.clearResultsBtn = document.getElementById('clear-results-btn');
        this.exportResultsBtn = document.getElementById('export-results-btn');
        this.loadSampleBtn = document.getElementById('load-sample-btn');
        this.generateRandomBtn = document.getElementById('generate-random-btn');
        this.randomCountInput = document.getElementById('random-count');

        this.pointsCountEl = document.getElementById('points-count');
        this.lastUpdatedEl = document.getElementById('last-updated');
        this.currentPointsDisplay = document.getElementById('current-points-display');
        this.comparisonTbody = document.getElementById('comparison-tbody');
        this.loadingEl = document.getElementById('loading');
        this.progressFill = document.getElementById('progress-fill');
        this.progressText = document.getElementById('progress-text');

        this.distanceChart = document.getElementById('distance-chart');
        this.timeChart = document.getElementById('time-chart');
    }

    attachEventListeners() {
        this.runComparisonBtn.addEventListener('click', () => this.runComparison());
        this.clearResultsBtn.addEventListener('click', () => this.clearResults());
        this.exportResultsBtn.addEventListener('click', () => this.exportResults());
        this.loadSampleBtn.addEventListener('click', () => this.loadSampleData());
        this.generateRandomBtn.addEventListener('click', () => this.generateRandomPoints());
    }

    async runComparison() {
        if (this.currentPoints.length < 2) {
            this.showNotification('⚠️ Please load at least 2 points to compare algorithms', 'warning');
            return;
        }

        this.runComparisonBtn.disabled = true;
        this.showLoading(true);
        this.updateProgress(0, 0);

        const results = {};
        const points = this.currentPoints.map(p => [p.x, p.y]);

        for (let i = 0; i < this.algorithms.length; i++) {
            const algorithm = this.algorithms[i];
            this.updateProgress(i, this.algorithms.length);
            this.updateComparisonTableRow(algorithm.id, 'running');

            try {
                const result = await this.runSingleAlgorithm(points, algorithm.id);
                results[algorithm.id] = {
                    ...result,
                    name: algorithm.name,
                    status: 'completed'
                };
            } catch (error) {
                console.error(`Error running ${algorithm.name}:`, error);
                results[algorithm.id] = {
                    name: algorithm.name,
                    status: 'failed',
                    error: error.message
                };
            }
            await this.sleep(200);
        }

        this.comparisonResults = results;
        this.calculatePerformanceMetrics();

        for (const [id, result] of Object.entries(this.comparisonResults)) {
            this.updateComparisonTableRow(id, result.status, result);
        }

        this.updateChartsAndTable();
        this.showNotification('🎯 Algorithm comparison completed!', 'success');
        this.showLoading(false);
        this.runComparisonBtn.disabled = false;
    }

    calculatePerformanceMetrics() {
        const completed = Object.values(this.comparisonResults).filter(r => r.status === 'completed');
        if (completed.length === 0) return;

        const distances = completed.map(r => r.total_distance);
        const times = completed.map(r => r.execution_time);
        const minD = Math.min(...distances), maxD = Math.max(...distances);
        const minT = Math.min(...times), maxT = Math.max(...times);

        for (const result of completed) {
            const dScore = ((maxD - result.total_distance) / (maxD - minD || 1)) * 70;
            const tScore = ((maxT - result.execution_time) / (maxT - minT || 1)) * 30;
            result.efficiency_score = Math.round(dScore + tScore);

            if (result.efficiency_score >= 80) result.performance_rating = 'Excellent';
            else if (result.efficiency_score >= 60) result.performance_rating = 'Good';
            else if (result.efficiency_score >= 40) result.performance_rating = 'Fair';
            else result.performance_rating = 'Poor';

            result.is_best_distance = result.total_distance === minD;
            result.is_worst_distance = result.total_distance === maxD;
            result.is_best_time = result.execution_time === minT;
            result.is_worst_time = result.execution_time === maxT;
        }
    }

    updateComparisonTableRow(algorithmId, status, data = {}) {
        const tbody = this.comparisonTbody;
        let row = document.getElementById(`row-${algorithmId}`);
        if (!row) {
            row = document.createElement('tr');
            row.id = `row-${algorithmId}`;
            tbody.appendChild(row);
        }

        const statusBadge = `<span class="status-badge status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;

        if (status === 'completed') {
            const rating = data.performance_rating || 'N/A';
            const ratingClass = rating.toLowerCase();
            const performanceBadge = `<span class="performance-rating rating-${ratingClass}">${rating}</span>`;

            row.innerHTML = `
                <td>${data.name}</td>
                <td>${data.total_distance.toFixed(2)}</td>
                <td>${data.execution_time.toFixed(4)}</td>
                <td>${data.efficiency_score}%</td>
                <td>${performanceBadge}</td>
                <td>${statusBadge}</td>
            `;
        } else if (status === 'failed') {
            row.innerHTML = `
                <td>${data.name}</td>
                <td colspan="4">❌ ${data.error || 'Failed to run algorithm'}</td>
                <td>${statusBadge}</td>
            `;
        } else {
            row.innerHTML = `
                <td>${data.name || algorithmId}</td>
                <td colspan="4">Running...</td>
                <td>${statusBadge}</td>
            `;
        }
    }

    updateChartsAndTable() {
        const results = Object.values(this.comparisonResults).filter(r => r.status === 'completed');
        if (!results.length) return;

        const distCtx = this.distanceChart.getContext('2d');
        if (this.charts.distance) this.charts.distance.destroy();
        this.charts.distance = new Chart(distCtx, {
            type: 'bar',
            data: {
                labels: results.map(r => r.name),
                datasets: [{
                    label: 'Total Distance ',
                    data: results.map(r => r.total_distance),
                    backgroundColor: results.map(r => r.is_best_distance ? '#4CAF50' : r.is_worst_distance ? '#F44336' : '#2196F3'),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 10 },
                plugins: { title: { display: true, text: 'Total Distance Comparison' }, legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Distance Units' }, ticks: { font: { size: 12 } } },
                    x: { ticks: { font: { size: 12 } } }
                }
            }
        });

        const timeCtx = this.timeChart.getContext('2d');
        if (this.charts.time) this.charts.time.destroy();
        this.charts.time = new Chart(timeCtx, {
            type: 'bar',
            data: {
                labels: results.map(r => r.name),
                datasets: [{
                    label: 'Execution Time ',
                    data: results.map(r => r.execution_time),
                    backgroundColor: results.map(r => r.is_best_time ? '#4CAF50' : r.is_worst_time ? '#F44336' : '#FF9800'),
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: 10 },
                plugins: { title: { display: true, text: 'Execution Time Comparison' }, legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Time (seconds)' }, ticks: { font: { size: 12 } } },
                    x: { ticks: { font: { size: 12 } } }
                }
            }
        });

        this.distanceChart.parentElement.style.maxWidth = '1000px';
        this.distanceChart.parentElement.style.height = '300px';
        this.timeChart.parentElement.style.maxWidth = '1000px';
        this.timeChart.parentElement.style.height = '300px';

        this.updateLastUpdated();
    }

    async runSingleAlgorithm(points, algorithm) {
        const response = await fetch('/solve_tsp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, algorithm })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Algorithm failed');
        return result;
    }

    showLoading(show) {
        this.loadingEl.style.display = show ? 'block' : 'none';
    }

    updateProgress(current, total) {
        const percent = Math.round((current / total) * 100);
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = current === total ? 'Completed!' : `Running ${current + 1} of ${total}...`;
    }

    loadSampleData() {
        this.currentPoints = [
            { x: 150, y: 100 }, { x: 300, y: 150 },
            { x: 500, y: 120 }, { x: 650, y: 200 },
            { x: 400, y: 300 }, { x: 200, y: 350 },
            { x: 600, y: 400 }, { x: 350, y: 450 }
        ];
        this.updateCurrentPointsDisplay();
        this.showNotification('📍 Sample points loaded.', 'info');
    }

    updateCurrentPointsDisplay() {
        this.pointsCountEl.textContent = this.currentPoints.length;
        this.currentPointsDisplay.innerHTML = this.currentPoints.map((p, i) => `
            <div class="point-card">Point ${i + 1}: (${p.x}, ${p.y})</div>
        `).join('');
    }

    generateRandomPoints() {
        const count = parseInt(this.randomCountInput.value) || 8;
        this.currentPoints = Array.from({ length: Math.min(20, Math.max(3, count)) }, () => ({
            x: Math.round((100 + Math.random() * 600) * 10) / 10,
            y: Math.round((100 + Math.random() * 300) * 10) / 10
        }));
        this.updateCurrentPointsDisplay();
        this.showNotification('🎲 Random points generated.', 'info');
    }

    showNotification(msg, type = 'info') {
        const note = document.createElement('div');
        note.className = `notification notification-${type}`;
        note.textContent = msg;
        document.body.appendChild(note);
        setTimeout(() => note.remove(), 3000);
    }

    sleep(ms) {
        return new Promise(res => setTimeout(res, ms));
    }

    updateLastUpdated() {
        this.lastUpdatedEl.textContent = new Date().toLocaleString();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.comparisonApp = new AlgorithmComparisonApp();
});
