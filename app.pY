from flask import Flask, render_template, request, jsonify
import time
from tsp_heuristics import TSPSolver

app = Flask(__name__)

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/solve_tsp', methods=['POST'])
def solve_tsp():
    """
    Solve TSP problem for warehouse robot path optimization
    
    Expected JSON input:
    {
        "points": [[x1, y1], [x2, y2], ...],
        "algorithm": "nearest_neighbor" | "greedy" | "genetic"
    }
    
    Returns:
    {
        "path": [[x1, y1], [x2, y2], ...],  # Ordered path including return to start
        "total_distance": float,
        "execution_time": float,
        "algorithm_used": string
    }
    """
    try:
        data = request.get_json()
        points = data.get('points', [])
        algorithm = data.get('algorithm', 'nearest_neighbor')
        
        if len(points) < 2:
            return jsonify({
                'error': 'At least 2 points are required'
            }), 400
        
        # Initialize TSP solver
        solver = TSPSolver(points)
        
        # Start timing
        start_time = time.time()
        
        # Solve based on selected algorithm
        if algorithm == 'nearest_neighbor':
            path, total_distance = solver.nearest_neighbor()
        elif algorithm == 'greedy':
            path, total_distance = solver.greedy_algorithm()
        elif algorithm == 'genetic':
            path, total_distance = solver.genetic_algorithm()
        elif algorithm == 'aco':
            path, total_distance = solver.ant_colony_optimization()
        else:
            return jsonify({
                'error': f'Unknown algorithm: {algorithm}'
            }), 400
        
        # Calculate execution time
        execution_time = time.time() - start_time
        
        return jsonify({
            'path': path,
            'total_distance': round(total_distance, 3),
            'execution_time': round(execution_time, 6),
            'algorithm_used': algorithm
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Server error: {str(e)}'
        }), 500

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy'})

if __name__ == '__main__':
    print("🤖 Starting Warehouse Robot Path Optimizer...")
    print("📍 Access the application at: http://127.0.0.1:5000")
    app.run(debug=True, host='127.0.0.1', port=5000)