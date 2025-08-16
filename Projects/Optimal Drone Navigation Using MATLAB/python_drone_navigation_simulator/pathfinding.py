import heapq
import numpy as np
import time

# A* Algorithm Implementation
def a_star(grid, start, goal):
    rows, cols = grid.shape
    open_set = []
    heapq.heappush(open_set, (0, start))
    came_from = {start: None}
    g_score = {start: 0}
    f_score = {start: heuristic(start, goal)}

    blocked_flag = False
    grid_neighbors = get_neighbors(goal, rows, cols)
    if all(grid[neighbor] >= 0 for neighbor in grid_neighbors):
        blocked_flag = True
    
    nodes_expanded = 0
    start_time = time.time()

    while open_set:
        current = heapq.heappop(open_set)[1]
        nodes_expanded += 1
        if current == goal:
            end_time = time.time()
            path = reconstruct_path(came_from, current)
            return path, nodes_expanded, end_time - start_time
        neighbors = get_neighbors(current, rows, cols)
        if blocked_flag and (neighbors == grid_neighbors):
            print(f"All neighbors of node are blocked by hazards.")
            break
        else:
            for neighbor in neighbors:
                tentative_g_score = g_score[current] + grid[neighbor]
                if neighbor not in g_score or tentative_g_score < g_score[neighbor]:
                    came_from[neighbor] = current
                    g_score[neighbor] = tentative_g_score
                    f_score[neighbor] = tentative_g_score + heuristic(neighbor, goal)
                    heapq.heappush(open_set, (f_score[neighbor], neighbor))
    
    end_time = time.time()
    return [], nodes_expanded, end_time - start_time

# Bellman-Ford Algorithm Implementation
def bellman_ford(grid, start, goal):
    rows, cols = grid.shape
    distance = {start: 0}
    came_from = {start: None}
    
    nodes_expanded = 0
    start_time = time.time()

    blocked_flag = False
    grid_neighbors = get_neighbors(goal, rows, cols)
    if all(grid[neighbor] >= 0 for neighbor in grid_neighbors):
        blocked_flag = True

    for _ in range(rows * cols - 1):
        for y in range(rows):
            for x in range(cols):
                nodes_expanded += 1
                neighbors = get_neighbors((y, x), rows, cols)
                if blocked_flag and (neighbors == grid_neighbors):
                    print(f"All neighbors of node are blocked by hazards.")
                    break
                else:
                    for neighbor in neighbors:
                        if distance.get((y, x), float('inf')) + grid[neighbor] < distance.get(neighbor, float('inf')):
                            distance[neighbor] = distance[(y, x)] + grid[neighbor]
                            came_from[neighbor] = (y, x)
    
    if goal not in distance:
        return [], nodes_expanded, time.time() - start_time
    return reconstruct_path(came_from, goal), nodes_expanded, time.time() - start_time

# Utility Functions
def heuristic(a, b):
    return ((a[0] - b[0])**2 + abs(a[1] - b[1])**2)**0.5
    
def get_neighbors(node, rows, cols):
    y, x = node
    neighbors = [(y + dy, x + dx) for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]]
    return [(ny, nx) for ny, nx in neighbors if 0 <= ny < rows and 0 <= nx < cols]

def reconstruct_path(came_from, current):
    path = []
    while current:
        path.append(current)
        current = came_from[current]
    path.reverse()
    return path
