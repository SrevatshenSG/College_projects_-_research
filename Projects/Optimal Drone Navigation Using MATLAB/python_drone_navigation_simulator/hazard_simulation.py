import numpy as np

def generate_hazards(grid, start, goal):
    """
    Generate a hazard grid with numerical costs and a hazard map with hazard types.
    
    Args:
        grid (ndarray): The grid representing the area.
        start (tuple): The start position (row, col).
        goal (tuple): The goal position (row, col).

    Returns:
        tuple: A tuple containing the hazard cost grid and the hazard type map.
    """
    # Hazard cost grid
    hazards = np.zeros_like(grid)
    # Hazard type map (same size as the grid but stores strings)
    hazard_map = np.empty(grid.shape, dtype=object)
    hazard_map[:] = 'None'  # Initialize all positions with 'None'

    # Hazard types and their associated costs
    hazard_types = {
        'Physical Obstacle': 100,
        'Weather': 50,
        'Terrain': 30,
        'Signal Interference': 20
    }

    # Randomly add hazards to the grid
    for hazard, cost in hazard_types.items():
        for _ in range(10):  # Number of hazards per type
            y, x = np.random.randint(0, grid.shape[0]), np.random.randint(0, grid.shape[1])

            # Ensure hazards are not placed on start or goal nodes
            while (x, y) == start or (x, y) == goal:
                y, x = np.random.randint(0, grid.shape[0]), np.random.randint(0, grid.shape[1])
            
            hazards[y, x] = cost
            hazard_map[y, x] = hazard  # Assign the hazard type

    return hazards, hazard_map
