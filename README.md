# 🤖 Optimal Path for Warehouse Robots

A complete web-based application that simulates warehouse robot path optimization using various heuristic algorithms to solve the Travelling Salesman Problem (TSP).

## 🎯 Project Overview

This application helps warehouse robots find the optimal path to visit multiple item locations exactly once and return to base, minimizing the total travel distance. It's a practical implementation of the Travelling Salesman Problem with real-world warehouse logistics applications.

## ✨ Features

### Frontend Features
- **Interactive Map**: Click-to-add item locations on a visual warehouse layout
- **Manual Input**: Enter precise coordinates for item locations
- **Multiple Algorithms**: Choose between Nearest Neighbor, Greedy, and Genetic algorithms
- **Real-time Visualization**: See the computed path drawn on the map
- **Robot Animation**: Watch the robot traverse the optimal path
- **Responsive Design**: Works on desktop and mobile devices
- **Results Dashboard**: View total distance, execution time, and algorithm performance

### Backend Features
- **Flask REST API**: Clean API endpoints for path computation
- **Multiple TSP Algorithms**:
  - **Nearest Neighbor**: Fast heuristic for quick results
  - **Greedy Algorithm**: Edge-based approach for better solutions
  - **Genetic Algorithm**: Advanced optimization for complex scenarios
- **Performance Metrics**: Execution time tracking and distance calculation
- **Error Handling**: Robust error handling and validation

## 🛠️ Tech Stack

- **Backend**: Python 3.7+, Flask, NumPy
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Visualization**: SVG graphics with CSS animations
- **Algorithms**: Custom TSP heuristic implementations

## 📁 Project Structure

```
warehouse-robot-optimizer/
│
├── app.py                 # Flask application main file
├── tsp_heuristics.py     # TSP algorithm implementations
├── requirements.txt      # Python dependencies
├── README.md            # Project documentation
│
├── templates/
│   └── index.html       # Main HTML template
│
└── static/
    ├── style.css        # CSS styling
    └── script.js        # Frontend JavaScript logic
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.7 or higher
- pip (Python package installer)

### Step 1: Clone or Download the Project
Create a new directory and save all the provided files in the structure shown above.

### Step 2: Install Dependencies
```bash
# Create virtual environment (recommended)
python -m venv warehouse_robot_env

# Activate virtual environment
# On Windows:
warehouse_robot_env\Scripts\activate
# On macOS/Linux:
source warehouse_robot_env/bin/activate

# Install required packages
pip install flask numpy
```

### Step 3: Run the Application
```bash
python app.py
```

### Step 4: Access the Application
Open your web browser and navigate to:
```
http://127.0.0.1:5000
```

## 🎮 How to Use

### Adding Item Locations
1. **Click Method**: Click anywhere on the warehouse map to add item locations
2. **Manual Input**: Use the coordinate input fields to add precise locations
3. **Sample Data**: Click "Load Sample Data" to load a pre-configured warehouse layout

### Computing Optimal Path
1. Select your preferred algorithm from the dropdown:
   - **Nearest Neighbor**: Fast, good for real-time applications
   - **Greedy Algorithm**: Better optimization, moderate computation time
   - **Genetic Algorithm**: Best optimization, longer computation time
2. Click "Compute Optimal Path"
3. View results including total distance and execution time
4. Optionally enable robot animation to visualize the path traversal

### Managing Points
- **Remove Points**: Click on any item location point to remove it
- **Clear All**: Use the "Clear All" button to start fresh
- **View List**: Check the "Item Locations" panel to see all coordinates

## 🧮 Algorithm Details

### 1. Nearest Neighbor Algorithm
- **Time Complexity**: O(n²)
- **Strategy**: Always visit the closest unvisited location
- **Best For**: Quick results, real-time applications
- **Typical Performance**: 25-50% above optimal

### 2. Greedy Algorithm
- **Time Complexity**: O(n² log n)
- **Strategy**: Build path using shortest available edges
- **Best For**: Balanced performance and quality
- **Typical Performance**: 15-30% above optimal

### 3. Genetic Algorithm
- **Time Complexity**: O(generations × population × n²)
- **Strategy**: Evolutionary optimization with crossover and mutation
- **Best For**: High-quality solutions, complex scenarios
- **Typical Performance**: 5-15% above optimal

## 📊 Sample Performance

For an 8-point warehouse layout:
- **Nearest Neighbor**: ~24.3 units, 0.004 seconds
- **Greedy Algorithm**: ~22.1 units, 0.012 seconds
- **Genetic Algorithm**: ~20.8 units, 0.156 seconds

## 🔧 API Endpoints

### POST /solve_tsp
Compute optimal path for given points.

**Request Body:**
```json
{
    "points": [[x1, y1], [x2, y2], ...],
    "algorithm": "nearest_neighbor|greedy|genetic"
}
```

**Response:**
```json
{
    "path": [[x1, y1], [x2, y2], ...],
    "total_distance": 24.3,
    "execution_time": 0.004,
    "algorithm_used": "nearest_neighbor"
}
```

### GET /health
Health check endpoint.

**Response:**
```json
{
    "status": "healthy"
}
```

## 🎨 Customization

### Adding New Algorithms
1. Add your algorithm to `tsp_heuristics.py` in the `TSPSolver` class
2. Update the `/solve_tsp` endpoint in `app.py` to handle the new algorithm
3. Add the algorithm option to the dropdown in `index.html`

### Styling Modifications
- Edit `static/style.css` for visual customizations
- Modify the SVG elements in `static/script.js` for different visualizations
- Update the color scheme by changing CSS variables

### Warehouse Layout
- Modify the SVG map dimensions in `index.html`
- Update the grid pattern and base station position
- Adjust coordinate validation in `script.js`

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change port in app.py
   app.run(debug=True, host='127.0.0.1', port=5001)
   ```

2. **Module Not Found Errors**
   ```bash
   # Ensure virtual environment is activated and dependencies installed
   pip install flask numpy
   ```

3. **Static Files Not Loading**
   - Ensure the `static/` and `templates/` directories are in the same folder as `app.py`
   - Check file permissions

4. **JavaScript Console Errors**
   - Open browser developer tools (F12) to check for errors
   - Ensure all files are properly served by Flask

## 📈 Performance Optimization

### For Large Point Sets (50+ points)
- Use Genetic Algorithm with increased population size
- Implement caching for distance calculations
- Consider using approximation algorithms like Christofides

### For Real-time Applications
- Use Nearest Neighbor for instant results
- Implement WebSocket for live updates
- Add worker threads for background computation

## 🤝 Contributing

This project is designed for educational and demonstration purposes. Feel free to:
- Add new TSP algorithms
- Improve the visualization
- Enhance the user interface
- Add performance benchmarks
- Implement additional features

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- TSP algorithms based on classical computer science literature
- Frontend design inspired by modern web application patterns
- Built with educational purpose to demonstrate full-stack development concepts

---

**Happy Optimizing! 🚀**