from flask import Flask, render_template, request, jsonify
import time
import uuid
import random
from datetime import datetime
from tsp_heuristics import TSPSolver

app = Flask(__name__)

# In-memory storage for maze configurations and simulations
maze_configs = {}
simulations = {}

@app.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@app.route('/multi-agent')
def multiSimulation():
    return render_template('multi.html')

@app.route('/compare')
def compare():
    """Render the algorithm comparison page"""
    return render_template('comp.html')

@app.route('/robo')
def robot_maze():
    """Render the robot maze page"""
    return render_template('maze.html')

@app.route('/solve_tsp', methods=['POST'])
def solve_tsp():
    """
    Solve TSP problem for warehouse robot path optimization

    Expected JSON input:
    {
        "points": [[x1, y1], [x2, y2], ...],
        "algorithm": "nearest_neighbor" | "greedy" | "genetic" | "dynamic" | "aco"
    }

    Returns:
    {
        "path": [[x1, y1], [x2, y2], ...],
        "total_distance": float,
        "execution_time": float,
        "algorithm_used": string
    }
    """
    try:
        data = request.get_json()
        print("🔧 Received TSP request:", data)  # Debug log

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
        elif algorithm == 'dynamic':
            path, total_distance = solver.dynamic_programming()
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

@app.route('/api/save-maze', methods=['POST'])
def save_maze():
    """Save maze configuration"""
    try:
        maze_data = request.get_json()
        maze_id = str(uuid.uuid4())
        
        # Store maze configuration
        maze_configs[maze_id] = {
            'id': maze_id,
            'maze': maze_data.get('maze'),
            'robots': maze_data.get('robots'),
            'deliveries': maze_data.get('deliveries'),
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'status': 'success',
            'maze_id': maze_id,
            'message': 'Maze saved successfully'
        })
    except Exception as e:
        return jsonify({
            'error': f'Failed to save maze: {str(e)}'
        }), 500

@app.route('/api/load-maze/<maze_id>')
def load_maze(maze_id):
    """Load maze configuration by ID"""
    if maze_id in maze_configs:
        return jsonify(maze_configs[maze_id])
    return jsonify({'error': 'Maze not found'}), 404

@app.route('/api/simulate', methods=['POST'])
def run_simulation():
    """Run robot simulation"""
    try:
        sim_data = request.get_json()
        sim_id = str(uuid.uuid4())
        
        # Process simulation
        results = {
            'simulation_id': sim_id,
            'algorithm': sim_data.get('algorithm', 'astar'),
            'robot_count': sim_data.get('robot_count', 2),
            'total_distance': random.randint(100, 500),  # Replace with actual calculation
            'completion_time': random.randint(10, 60),   # Replace with actual calculation
            'collisions_avoided': random.randint(0, 20), # Replace with actual calculation
            'efficiency_score': round(random.uniform(0.7, 1.0), 2),
            'timestamp': datetime.now().isoformat()
        }
        
        simulations[sim_id] = results
        return jsonify(results)
    except Exception as e:
        return jsonify({
            'error': f'Simulation failed: {str(e)}'
        }), 500

@app.route('/api/results/<sim_id>')
def get_results(sim_id):
    """Get simulation results by ID"""
    if sim_id in simulations:
        return jsonify(simulations[sim_id])
    return jsonify({'error': 'Simulation not found'}), 404

@app.route('/api/algorithms')
def get_algorithms():
    """Get available pathfinding algorithms"""
    return jsonify({
        'algorithms': [
            {
                'id': 'astar', 
                'name': 'A* Algorithm', 
                'description': 'Optimal pathfinding with heuristics',
                'complexity': 'O(b^d)',
                'optimal': True
            },
            {
                'id': 'dijkstra', 
                'name': 'Dijkstra Algorithm', 
                'description': 'Guaranteed shortest path',
                'complexity': 'O(V²)',
                'optimal': True
            },
            {
                'id': 'greedy', 
                'name': 'Greedy Best-First', 
                'description': 'Fast but not always optimal',
                'complexity': 'O(b^m)',
                'optimal': False
            }
        ]
    })

@app.route('/api/maze-templates')
def get_maze_templates():
    """Get predefined maze templates"""
    templates = [
        {
            'id': 'warehouse_basic',
            'name': 'Basic Warehouse',
            'description': 'Simple warehouse layout with aisles',
            'size': '20x20'
        },
        {
            'id': 'warehouse_complex',
            'name': 'Complex Warehouse',
            'description': 'Multi-level warehouse with obstacles',
            'size': '30x30'
        },
        {
            'id': 'distribution_center',
            'name': 'Distribution Center',
            'description': 'Large distribution center layout',
            'size': '40x40'
        }
    ]
    return jsonify({'templates': templates})

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🤖 Starting Warehouse Robot Path Optimizer...")
    print("📍 Access the application at: http://127.0.0.1:5000")
    print("🔗 Available routes:")
    print("   • Main page: http://127.0.0.1:5000/")
    print("   • Multi-agent: http://127.0.0.1:5000/multi-agent")
    print("   • Compare algorithms: http://127.0.0.1:5000/compare")
    print("   • Robot maze: http://127.0.0.1:5000/robo")
    app.run(debug=True, host='127.0.0.1', port=5000)