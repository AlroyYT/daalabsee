import numpy as np
import random
import math
from typing import List, Tuple, Dict

class TSPSolver:
    """
    Travelling Salesman Problem solver for warehouse robot path optimization.
    Implements multiple heuristic algorithms to find optimal or near-optimal paths.
    """
    
    def __init__(self, points: List[List[float]]):
        """
        Initialize TSP solver with list of points.
        
        Args:
            points: List of [x, y] coordinates representing item locations
        """
        self.points = np.array(points)
        self.n = len(points)
        self.distance_matrix = self._calculate_distance_matrix()
    
    def _calculate_distance_matrix(self) -> np.ndarray:
        """
        Calculate distance matrix between all pairs of points using Euclidean distance.
        
        Returns:
            2D numpy array where matrix[i][j] = distance between point i and point j
        """
        matrix = np.zeros((self.n, self.n))
        
        for i in range(self.n):
            for j in range(self.n):
                if i != j:
                    # Euclidean distance formula: sqrt((x2-x1)^2 + (y2-y1)^2)
                    dx = self.points[i][0] - self.points[j][0]
                    dy = self.points[i][1] - self.points[j][1]
                    matrix[i][j] = math.sqrt(dx*dx + dy*dy)
        
        return matrix
    
    def nearest_neighbor(self, start_index: int = 0) -> Tuple[List[List[float]], float]:
        """
        Nearest Neighbor heuristic: Always visit the closest unvisited point.
        
        Args:
            start_index: Starting point index (default: 0)
            
        Returns:
            Tuple of (path as list of coordinates, total distance)
        """
        visited = [False] * self.n
        path_indices = [start_index]
        visited[start_index] = True
        current = start_index
        total_distance = 0.0
        
        # Visit all remaining points
        for _ in range(self.n - 1):
            nearest_distance = float('inf')
            nearest_index = -1
            
            # Find nearest unvisited point
            for i in range(self.n):
                if not visited[i] and self.distance_matrix[current][i] < nearest_distance:
                    nearest_distance = self.distance_matrix[current][i]
                    nearest_index = i
            
            # Move to nearest point
            path_indices.append(nearest_index)
            visited[nearest_index] = True
            total_distance += nearest_distance
            current = nearest_index
        
        # Return to start
        path_indices.append(start_index)
        total_distance += self.distance_matrix[current][start_index]
        
        # Convert indices to coordinates
        path = [self.points[i].tolist() for i in path_indices]
        
        return path, total_distance
    
    def greedy_algorithm(self) -> Tuple[List[List[float]], float]:
        """
        Greedy algorithm: Build path by always choosing the shortest available edge.
        
        Returns:
            Tuple of (path as list of coordinates, total distance)
        """
        # Create list of all edges with their distances
        edges = []
        for i in range(self.n):
            for j in range(i + 1, self.n):
                edges.append((self.distance_matrix[i][j], i, j))
        
        # Sort edges by distance
        edges.sort()
        
        # Build path using greedy approach
        used_edges = []
        degree = [0] * self.n
        
        for distance, i, j in edges:
            # Check if adding this edge would create a cycle (except for the last edge)
            if degree[i] < 2 and degree[j] < 2:
                if len(used_edges) < self.n - 1 or (degree[i] == 1 and degree[j] == 1):
                    used_edges.append((i, j))
                    degree[i] += 1
                    degree[j] += 1
                    
                    if len(used_edges) == self.n:
                        break
        
        # Build path from edges
        path_indices = self._build_path_from_edges(used_edges)
        
        # Calculate total distance
        total_distance = 0.0
        for i in range(len(path_indices) - 1):
            total_distance += self.distance_matrix[path_indices[i]][path_indices[i + 1]]
        
        # Convert indices to coordinates
        path = [self.points[i].tolist() for i in path_indices]
        
        return path, total_distance
    
    def genetic_algorithm(self, population_size: int = 100, generations: int = 500) -> Tuple[List[List[float]], float]:
        """
        Genetic Algorithm for TSP optimization.
        
        Args:
            population_size: Number of individuals in each generation
            generations: Number of generations to evolve
            
        Returns:
            Tuple of (path as list of coordinates, total distance)
        """
        # Initialize population with random tours
        population = []
        for _ in range(population_size):
            tour = list(range(self.n))
            random.shuffle(tour)
            population.append(tour)
        
        for generation in range(generations):
            # Evaluate fitness (inverse of distance)
            fitness_scores = []
            for tour in population:
                distance = self._calculate_tour_distance(tour)
                fitness_scores.append(1.0 / (1.0 + distance))
            
            # Selection: Choose parents based on fitness
            new_population = []
            for _ in range(population_size):
                parent1 = self._tournament_selection(population, fitness_scores)
                parent2 = self._tournament_selection(population, fitness_scores)
                
                # Crossover
                child = self._order_crossover(parent1, parent2)
                
                # Mutation
                if random.random() < 0.02:  # 2% mutation rate
                    child = self._swap_mutation(child)
                
                new_population.append(child)
            
            population = new_population
        
        # Find best tour in final population
        best_tour = min(population, key=lambda tour: self._calculate_tour_distance(tour))
        best_distance = self._calculate_tour_distance(best_tour)
        
        # Ensure tour starts and ends at same point
        best_tour.append(best_tour[0])
        
        # Convert indices to coordinates
        path = [self.points[i].tolist() for i in best_tour]
        
        return path, best_distance
    
    def _build_path_from_edges(self, edges: List[Tuple[int, int]]) -> List[int]:
        """Build a path from list of edges."""
        if not edges:
            return [0, 0]
        
        # Create adjacency list
        adj = {i: [] for i in range(self.n)}
        for i, j in edges:
            adj[i].append(j)
            adj[j].append(i)
        
        # Find a starting point (any point with degree 1, or point 0)
        start = 0
        for i in range(self.n):
            if len(adj[i]) == 1:
                start = i
                break
        
        # Build path
        path = [start]
        current = start
        prev = -1
        
        while len(path) <= self.n:
            next_nodes = [node for node in adj[current] if node != prev]
            if not next_nodes:
                break
            
            next_node = next_nodes[0]
            path.append(next_node)
            prev = current
            current = next_node
        
        return path
    
    def _calculate_tour_distance(self, tour: List[int]) -> float:
        """Calculate total distance for a given tour."""
        distance = 0.0
        for i in range(len(tour)):
            j = (i + 1) % len(tour)
            distance += self.distance_matrix[tour[i]][tour[j]]
        return distance
    
    def _tournament_selection(self, population: List[List[int]], fitness_scores: List[float]) -> List[int]:
        """Tournament selection for genetic algorithm."""
        tournament_size = 5
        tournament_indices = random.sample(range(len(population)), min(tournament_size, len(population)))
        best_index = max(tournament_indices, key=lambda i: fitness_scores[i])
        return population[best_index][:]
    
    def _order_crossover(self, parent1: List[int], parent2: List[int]) -> List[int]:
        """Order crossover (OX) for genetic algorithm."""
        size = len(parent1)
        start, end = sorted(random.sample(range(size), 2))
        
        child = [-1] * size
        child[start:end] = parent1[start:end]
        
        pointer = end
        for city in parent2[end:] + parent2[:end]:
            if city not in child:
                child[pointer % size] = city
                pointer += 1
        
        return child
    
    def _swap_mutation(self, tour: List[int]) -> List[int]:
        """Swap mutation for genetic algorithm."""
        mutated = tour[:]
        i, j = random.sample(range(len(tour)), 2)
        mutated[i], mutated[j] = mutated[j], mutated[i]
        return mutated
    
    def dynamic_programming(self, start_index: int = 0) -> Tuple[List[List[float]], float]:
        """
        Dynamic Programming solution using Held-Karp algorithm.
        Provides optimal solution but with exponential time complexity O(n²2^n).
        Recommended for problems with <= 15 points.
        
        Args:
            start_index: Starting point index (default: 0)
            
        Returns:
            Tuple of (path as list of coordinates, total distance)
        """
        if self.n > 20:
            raise ValueError("Dynamic programming is not recommended for more than 20 points due to exponential complexity")
        
        if self.n <= 1:
            path = [self.points[0].tolist(), self.points[0].tolist()]
            return path, 0.0
        
        # DP table: dp[mask][i] = minimum cost to visit all cities in mask ending at city i
        # mask is a bitmask representing which cities have been visited
        dp = {}
        parent = {}  # To reconstruct the path
        
        # Initialize: starting from start_index, visit only start_index
        start_mask = 1 << start_index
        dp[(start_mask, start_index)] = 0.0
        
        # Fill DP table for all possible subsets
        for mask in range(1, 1 << self.n):
            for u in range(self.n):
                if not (mask & (1 << u)):  # u is not in the current subset
                    continue
                
                if mask == (1 << u):  # Only u is in the subset
                    if u == start_index:
                        dp[(mask, u)] = 0.0
                    else:
                        dp[(mask, u)] = float('inf')
                    continue
                
                # Try all possible previous cities
                dp[(mask, u)] = float('inf')
                prev_mask = mask ^ (1 << u)  # Remove u from mask
                
                for v in range(self.n):
                    if not (prev_mask & (1 << v)):  # v is not in previous subset
                        continue
                    
                    if (prev_mask, v) in dp:
                        cost = dp[(prev_mask, v)] + self.distance_matrix[v][u]
                        if cost < dp[(mask, u)]:
                            dp[(mask, u)] = cost
                            parent[(mask, u)] = v
        
        # Find the minimum cost to visit all cities and return to start
        final_mask = (1 << self.n) - 1  # All cities visited
        min_cost = float('inf')
        last_city = -1
        
        for i in range(self.n):
            if i != start_index and (final_mask, i) in dp:
                cost = dp[(final_mask, i)] + self.distance_matrix[i][start_index]
                if cost < min_cost:
                    min_cost = cost
                    last_city = i
        
        # Reconstruct path
        path_indices = self._reconstruct_dp_path(parent, final_mask, last_city, start_index)
        path_indices.append(start_index)  # Return to start
        
        # Convert indices to coordinates
        path = [self.points[i].tolist() for i in path_indices]
        
        return path, min_cost

    def _reconstruct_dp_path(self, parent: Dict, mask: int, last_city: int, start_index: int) -> List[int]:
        """Reconstruct the optimal path from DP parent table."""
        path = []
        current_city = last_city
        current_mask = mask
        
        while current_city != start_index:
            path.append(current_city)
            next_city = parent.get((current_mask, current_city), -1)
            if next_city == -1:
                break
            current_mask ^= (1 << current_city)  # Remove current city from mask
            current_city = next_city
        
        path.append(start_index)
        path.reverse()
        return path
      
      
    def ant_colony_optimization(self, num_ants: int = 10, num_iterations: int = 100, 
                           alpha: float = 1.0, beta: float = 2.0, 
                           evaporation_rate: float = 0.5, q: float = 100.0) -> Tuple[List[List[float]], float]:
        """
        Ant Colony Optimization algorithm for TSP.
        
        Args:
            num_ants: Number of ants in the colony
            num_iterations: Number of iterations to run
            alpha: Pheromone importance factor
            beta: Heuristic importance factor (1/distance)
            evaporation_rate: Pheromone evaporation rate (0-1)
            q: Pheromone deposit factor
            
        Returns:
            Tuple of (path as list of coordinates, total distance)
        """
        # Initialize pheromone matrix
        pheromone = np.ones((self.n, self.n)) * 0.1
        
        # Heuristic information (1/distance)
        heuristic = np.zeros((self.n, self.n))
        for i in range(self.n):
            for j in range(self.n):
                if i != j:
                    heuristic[i][j] = 1.0 / self.distance_matrix[i][j]
        
        best_path = None
        best_distance = float('inf')
        
        for iteration in range(num_iterations):
            # Store paths and distances for all ants
            ant_paths = []
            ant_distances = []
            
            # Each ant constructs a solution
            for ant in range(num_ants):
                # Start from random city
                current_city = random.randint(0, self.n - 1)
                visited = [False] * self.n
                path = [current_city]
                visited[current_city] = True
                total_distance = 0.0
                
                # Construct path
                for _ in range(self.n - 1):
                    # Calculate probabilities for unvisited cities
                    probabilities = []
                    unvisited_cities = []
                    
                    for next_city in range(self.n):
                        if not visited[next_city]:
                            # Probability = (pheromone^alpha) * (heuristic^beta)
                            prob = (pheromone[current_city][next_city] ** alpha) * \
                                (heuristic[current_city][next_city] ** beta)
                            probabilities.append(prob)
                            unvisited_cities.append(next_city)
                    
                    # Select next city based on probabilities
                    if probabilities:
                        # Normalize probabilities
                        total_prob = sum(probabilities)
                        if total_prob > 0:
                            probabilities = [p / total_prob for p in probabilities]
                            
                            # Roulette wheel selection
                            rand = random.random()
                            cumulative_prob = 0.0
                            selected_city = unvisited_cities[0]  # fallback
                            
                            for i, prob in enumerate(probabilities):
                                cumulative_prob += prob
                                if rand <= cumulative_prob:
                                    selected_city = unvisited_cities[i]
                                    break
                        else:
                            selected_city = unvisited_cities[0]
                        
                        # Move to selected city
                        path.append(selected_city)
                        visited[selected_city] = True
                        total_distance += self.distance_matrix[current_city][selected_city]
                        current_city = selected_city
                
                # Return to start
                path.append(path[0])
                total_distance += self.distance_matrix[current_city][path[0]]
                
                ant_paths.append(path)
                ant_distances.append(total_distance)
                
                # Update best solution
                if total_distance < best_distance:
                    best_distance = total_distance
                    best_path = path[:]
            
            # Evaporate pheromones
            pheromone *= (1.0 - evaporation_rate)
            
            # Deposit pheromones
            for ant_idx in range(num_ants):
                path = ant_paths[ant_idx]
                distance = ant_distances[ant_idx]
                pheromone_deposit = q / distance
                
                # Deposit pheromone on edges used by this ant
                for i in range(len(path) - 1):
                    city1, city2 = path[i], path[i + 1]
                    pheromone[city1][city2] += pheromone_deposit
                    pheromone[city2][city1] += pheromone_deposit
        
        # Convert indices to coordinates
        path_coords = [self.points[i].tolist() for i in best_path]
        
        return path_coords, best_distance  