/**
 * Warehouse Robot Path Optimizer - Frontend JavaScript
 * Handles user interactions, visualization, and communication with Flask backend
 */

class WarehouseRobotApp {
    constructor() {
        this.points = [];
        this.currentPath = [];
        this.robotPosition = { x: 50, y: 50 }; // Base station position
        this.animationSpeed = 1000; // milliseconds per move
        
        this.initializeElements();
        this.attachEventListeners();
        this.loadSampleData(); // Load sample data on startup
    }
    
    initializeElements() {
        // Get DOM elements
        this.map = document.getElementById('warehouse-map');
        this.algorithmSelect = document.getElementById('algorithm-select');
        this.computeBtn = document.getElementById('compute-btn');
        this.clearBtn = document.getElementById('clear-btn');
        this.sampleBtn = document.getElementById('sample-btn');
        this.addPointBtn = document.getElementById('add-point-btn');
        this.xCoordInput = document.getElementById('x-coord');
        this.yCoordInput = document.getElementById('y-coord');
        this.animateCheckbox = document.getElementById('animate-checkbox');
        
        // Result display elements
        this.totalDistanceEl = document.getElementById('total-distance');
        this.executionTimeEl = document.getElementById('execution-time');
        this.algorithmUsedEl = document.getElementById('algorithm-used');
        this.pointsCountEl = document.getElementById('points-count');
        this.pointsDisplayEl = document.getElementById('points-display');
        this.loadingEl = document.getElementById('loading');
        
        // SVG groups
        this.itemLocationsGroup = document.getElementById('item-locations');
        this.robotPathGroup = document.getElementById('robot-path');
        this.robotEl = document.getElementById('robot');
    }
    
    attachEventListeners() {
        // Map click to add points
        this.map.addEventListener('click', (e) => this.handleMapClick(e));
        
        // Button event listeners
        this.computeBtn.addEventListener('click', () => this.computeOptimalPath());
        this.clearBtn.addEventListener('click', () => this.clearAll());
        this.sampleBtn.addEventListener('click', () => this.loadSampleData());
        this.addPointBtn.addEventListener('click', () => this.addPointManually());
        
        // Enter key for manual input
        this.xCoordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPointManually();
        });
        this.yCoordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addPointManually();
        });
    }
    
    handleMapClick(event) {
        const rect = this.map.getBoundingClientRect();
        const scaleX = this.map.viewBox.baseVal.width / rect.width;
        const scaleY = this.map.viewBox.baseVal.height / rect.height;
        
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;
        
        // Don't add points too close to base station
        const distanceFromBase = Math.sqrt((x - 50) ** 2 + (y - 50) ** 2);
        if (distanceFromBase < 40) {
            this.showNotification('⚠️ Cannot place items too close to base station', 'warning');
            return;
        }
        
        this.addPoint(x, y);
    }
    
    addPoint(x, y) {
        // Validate coordinates
        if (x < 10 || x > 790 || y < 10 || y > 490) {
            this.showNotification('⚠️ Point must be within map boundaries', 'warning');
            return;
        }
        
        const point = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
        
        // Check for duplicate points
        const isDuplicate = this.points.some(p => 
            Math.abs(p.x - point.x) < 5 && Math.abs(p.y - point.y) < 5
        );
        
        if (isDuplicate) {
            this.showNotification('⚠️ Point already exists at this location', 'warning');
            return;
        }
        
        this.points.push(point);
        this.updatePointsDisplay();
        this.drawPoints();
        this.clearPath(); // Clear previous path when new point is added
        
        this.showNotification(`✅ Added point at (${point.x}, ${point.y})`, 'success');
    }
    
    addPointManually() {
        const x = parseFloat(this.xCoordInput.value);
        const y = parseFloat(this.yCoordInput.value);
        
        if (isNaN(x) || isNaN(y)) {
            this.showNotification('⚠️ Please enter valid coordinates', 'warning');
            return;
        }
        
        this.addPoint(x, y);
        
        // Clear input fields
        this.xCoordInput.value = '';
        this.yCoordInput.value = '';
    }
    
    removePoint(index) {
        this.points.splice(index, 1);
        this.updatePointsDisplay();
        this.drawPoints();
        this.clearPath();
    }
    
    clearAll() {
        this.points = [];
        this.currentPath = [];
        this.updatePointsDisplay();
        this.clearVisualization();
        this.resetResults();
        this.showNotification('🗑️ All points cleared', 'info');
    }
    
    loadSampleData() {
        this.points = [
            { x: 150, y: 100 },
            { x: 300, y: 150 },
            { x: 500, y: 120 },
            { x: 650, y: 200 },
            { x: 400, y: 300 },
            { x: 200, y: 350 },
            { x: 600, y: 400 },
            { x: 350, y: 450 }
        ];
        
        this.updatePointsDisplay();
        this.drawPoints();
        this.clearPath();
        this.showNotification('📍 Sample warehouse layout loaded', 'info');
    }
    
    async computeOptimalPath() {
        if (this.points.length < 2) {
            this.showNotification('⚠️ Please add at least 2 item locations', 'warning');
            return;
        }
        
        const algorithm = this.algorithmSelect.value;
        
        // Show loading indicator
        
        this.computeBtn.disabled = true;
        
        try {
            // Prepare data for backend
            const requestData = {
                points: this.points.map(p => [p.x, p.y]),
                algorithm: algorithm
            };
            
            // Send request to Flask backend
            const response = await fetch('/solve_tsp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Process successful response
                this.currentPath = result.path.map(p => ({ x: p[0], y: p[1] }));
                this.displayResults(result);
                this.drawPath();
                
                // Animate robot if enabled
                if (this.animateCheckbox.checked) {
                    await this.animateRobot();
                }
                
                this.showNotification(`🎯 Optimal path computed using ${result.algorithm_used}`, 'success');
            } else {
                throw new Error(result.error || 'Failed to compute path');
            }
            
        } catch (error) {
            console.error('Error computing path:', error);
            this.showNotification(`❌ Error: ${error.message}`, 'error');
        } finally {
            
            this.computeBtn.disabled = false;
        }
    }
    
    displayResults(result) {
        this.totalDistanceEl.textContent = `${result.total_distance} units`;
        this.executionTimeEl.textContent = `${result.execution_time} seconds`;
        this.algorithmUsedEl.textContent = this.formatAlgorithmName(result.algorithm_used);
        this.pointsCountEl.textContent = this.points.length;
    }
    
    formatAlgorithmName(algorithm) {
        const names = {
            'nearest_neighbor': 'Nearest Neighbor',
            'greedy': 'Greedy Algorithm',
            'genetic': 'Genetic Algorithm',
            'aco': 'Ant Colony Optimization',
        };
        return names[algorithm] || algorithm;
    }
    
    drawPoints() {
        // Clear existing points
        this.itemLocationsGroup.innerHTML = '';
        
        // Draw each point
        this.points.forEach((point, index) => {
            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            group.classList.add('item-point');
            
            // Point circle
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', '12');
            circle.setAttribute('fill', '#e74c3c');
            circle.setAttribute('stroke', '#c0392b');
            circle.setAttribute('stroke-width', '2');
            
            // Point label
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', point.x);
            text.setAttribute('y', point.y + 5);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', 'white');
            text.setAttribute('font-size', '12');
            text.setAttribute('font-weight', 'bold');
            text.textContent = index + 1;
            
            // Add click event to remove point
            group.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removePoint(index);
            });
            
            group.appendChild(circle);
            group.appendChild(text);
            this.itemLocationsGroup.appendChild(group);
        });
    }
    
    drawPath() {
        // Clear existing path
        this.robotPathGroup.innerHTML = '';
        
        if (this.currentPath.length < 2) return;
        
        // Draw path lines
        for (let i = 0; i < this.currentPath.length - 1; i++) {
            const start = this.currentPath[i];
            const end = this.currentPath[i + 1];
            
            // Path line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', start.x);
            line.setAttribute('y1', start.y);
            line.setAttribute('x2', end.x);
            line.setAttribute('y2', end.y);
            line.classList.add('path-line');
            
            // Arrow marker
            const arrow = this.createArrowMarker(start, end);
            
            this.robotPathGroup.appendChild(line);
            this.robotPathGroup.appendChild(arrow);
        }
    }
    
    createArrowMarker(start, end) {
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        
        const arrowSize = 8;
        const x1 = midX - arrowSize * Math.cos(angle - Math.PI / 6);
        const y1 = midY - arrowSize * Math.sin(angle - Math.PI / 6);
        const x2 = midX - arrowSize * Math.cos(angle + Math.PI / 6);
        const y2 = midY - arrowSize * Math.sin(angle + Math.PI / 6);
        
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        arrow.setAttribute('points', `${midX},${midY} ${x1},${y1} ${x2},${y2}`);
        arrow.classList.add('path-arrow');
        
        return arrow;
    }
    
    async animateRobot() {
        if (this.currentPath.length < 2) return;
        
        this.robotEl.style.display = 'block';
        
        for (let i = 0; i < this.currentPath.length; i++) {
            const point = this.currentPath[i];
            
            // Move robot to point
            this.robotEl.setAttribute('transform', `translate(${point.x}, ${point.y})`);
            
            // Wait for animation
            await this.sleep(this.animationSpeed);
        }
        
        // Hide robot after animation
        setTimeout(() => {
            this.robotEl.style.display = 'none';
        }, 1000);
    }
    
    clearPath() {
        this.currentPath = [];
        this.robotPathGroup.innerHTML = '';
        this.robotEl.style.display = 'none';
    }
    
    clearVisualization() {
        this.itemLocationsGroup.innerHTML = '';
        this.robotPathGroup.innerHTML = '';
        this.robotEl.style.display = 'none';
    }
    
    updatePointsDisplay() {
        if (this.points.length === 0) {
            this.pointsDisplayEl.innerHTML = '<p class="no-points">No item locations added yet. Click on the map or use manual input.</p>';
        } else {
            const pointsHtml = this.points.map((point, index) => `
                <div class="point-item">
                    <span class="point-coords">Point ${index + 1}: (${point.x}, ${point.y})</span>
                    <button class="remove-point" onclick="app.removePoint(${index})">Remove</button>
                </div>
            `).join('');
            
            this.pointsDisplayEl.innerHTML = pointsHtml;
        }
        
        this.pointsCountEl.textContent = this.points.length;
    }
    
    resetResults() {
        this.totalDistanceEl.textContent = '--';
        this.executionTimeEl.textContent = '--';
        this.algorithmUsedEl.textContent = '--';
        this.pointsCountEl.textContent = '0';
    }
    
    showLoading(show) {
        this.loadingEl.style.display = show ? 'flex' : 'none';
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: 'bold',
            zIndex: '1001',
            maxWidth: '300px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });
        
        // Set background color based on type
        const colors = {
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c',
            info: '#3498db'
        };
        notification.style.background = colors[type] || colors.info;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Slide in animation
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WarehouseRobotApp();
});

// Utility functions for debugging
window.debugApp = {
    getPoints: () => window.app.points,
    getCurrentPath: () => window.app.currentPath,
    addRandomPoints: (count = 5) => {
        for (let i = 0; i < count; i++) {
            const x = 100 + Math.random() * 600;
            const y = 100 + Math.random() * 300;
            window.app.addPoint(x, y);
        }
    }
};