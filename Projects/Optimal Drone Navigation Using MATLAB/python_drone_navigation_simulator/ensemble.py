import time
from pathfinding import a_star, bellman_ford
import numpy as np

def calculate_risk(hazard_type, path_length, wind_factor):
    """
    Calculate the risk of a path based on hazard type, path length, and wind factor.
    """
    risk_weights = {
        'Physical Obstacle': 50,
        'Terrain': 30,
        'Weather': 20,
        'Signal Interference': 10
    }

    battery_risk = path_length * 2  # Longer paths consume more battery
    network_risk = {
        'Physical Obstacle': 10,
        'Terrain': 5,
        'Weather': 15,
        'Signal Interference': 20
    }[hazard_type]
    wear_tear_risk = risk_weights[hazard_type]
    total_risk = battery_risk + network_risk + wear_tear_risk + wind_factor

    return total_risk

def identify_hazard_type(hazard_map, position):
    """
    Identify the type of hazard at a given position based on the hazard map.
    """
    return hazard_map[position[0], position[1]]

def get_neighbors(node, rows, cols):
    """
    Returns list of neighbours of a node at a given position.
    """
    y, x = node
    neighbors = [(y + dy, x + dx) for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]]
    return [(ny, nx) for ny, nx in neighbors if 0 <= ny < rows and 0 <= nx < cols]

def ensemble_pathfinding(grid, start, goal, hazards, hazard_map):
    """
    Dynamic pathfinding algorithm enhanced with risk factor evaluation.

    Args:
        grid (ndarray): The grid representing the area.
        start (tuple): The starting position (row, col).
        goal (tuple): The goal position (row, col).
        hazards (ndarray): The grid representing hazard costs.
        hazard_map (ndarray): The grid representing hazard types.

    Returns:
        tuple: The path taken, total nodes expanded, total response time, and the least risky node (if applicable).
    """
    combined_grid = grid + hazards
    path = []
    nodes_expanded = 0
    response_time = 0
    current_position = start
    path.append(current_position)
    least_risky_node = None

    while current_position != goal:
        if hazards[current_position[0], current_position[1]] > 0:
            print("Hazard encountered, switching to Bellman-Ford.")
            temp_path, temp_nodes_expanded, temp_response_time = bellman_ford(combined_grid, current_position, goal)

            if temp_path:
                path.extend(temp_path[1:])
                nodes_expanded += temp_nodes_expanded
                response_time += temp_response_time
                current_position = temp_path[-1]
            else:
                print("No valid path found. Calculating least risky node.")
                neighbors = get_neighbors(current_position, grid.shape[0], grid.shape[1])
                risks = []
                for neighbor in neighbors:
                    wind_factor = np.random.randint(1, 10)  # Randomized wind impact
                    hazard_type = identify_hazard_type(hazard_map, neighbor)
                    path_length = np.linalg.norm(np.array(goal) - np.array(neighbor))
                    risk = calculate_risk(hazard_type, path_length, wind_factor)
                    risks.append((neighbor, risk))
                
                if risks:
                    least_risky_node, _ = min(risks, key=lambda x: x[1])
                    print(f"Least risky node determined: {least_risky_node}")
                    break
        else:
            temp_path, temp_nodes_expanded, temp_response_time = a_star(combined_grid, current_position, goal)

            if temp_path:
                path.extend(temp_path[1:])
                nodes_expanded += temp_nodes_expanded
                response_time += temp_response_time
                current_position = temp_path[-1]
            else:
                print("No path found using A*. Stuck at position:", current_position)
                break

    return path, nodes_expanded, response_time, least_risky_node