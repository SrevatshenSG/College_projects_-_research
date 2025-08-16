import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
from pathfinding import a_star, bellman_ford
from ensemble import ensemble_pathfinding
from hazard_simulation import generate_hazards

# Initialize metric lists to store values across runs
path_lengths = []
nodes_expanded_list = []
response_times = []
path = []
nodes_expanded = 0
response_time = 0

# Plot Path
def plot_path(path, least_risky_node=None):
    fig, ax = plt.subplots()
    ax.imshow(grid + hazards, cmap="coolwarm", origin="upper")
    
    if path:
        for (y, x) in path:
            ax.plot(x, y, "ws")  # White squares for path
    
    ax.plot(start[1], start[0], "go", markersize=12, label="Start")  # Green start point
    ax.plot(goal[1], goal[0], "ro", markersize=12, label="Goal")  # Red goal point
    
    # Highlight the least risky node
    if least_risky_node:
        ax.plot(least_risky_node[1], least_risky_node[0], "bo", markersize=12, label="Least Risky Node")  # Blue circle
    
    ax.legend(loc="upper left", bbox_to_anchor=(1.05, 1), title="Legend")
    st.pyplot(fig)


# Display metrics
def display_metrics(path, nodes_expanded, response_time):
    # Update metrics
    path_length = len(path) if path else 0
    path_lengths.append(path_length)
    nodes_expanded_list.append(nodes_expanded)
    response_times.append(response_time)
    # Print metrics
    st.subheader("Performance Metrics:")
    st.write(f"Pathfinding Efficiency (Path Length): {path_length}")
    st.write(f"Computational Efficiency (Nodes Expanded): {nodes_expanded}")
    st.write(f"Response Time: {response_time:.4f} seconds")

# Block nodes surrounding the goal
def block_goal_surroundings(grid, goal):
    rows, cols = grid.shape
    y, x = goal
    hazards = np.zeros_like(grid)
    for dy in [-1, 0, 1]:
        for dx in [-1, 0, 1]:
            ny, nx = y + dy, x + dx
            if 0 <= ny < rows and 0 <= nx < cols and (ny, nx) != goal:  # Ensure it's within bounds and not the goal
                hazards[ny, nx] = 100  # High hazard cost for surrounding nodes
    return hazards

# UI Config
st.title("Drone Navigation Simulator")
st.sidebar.title("Settings")

# Grid Setup
rows, cols = 20, 20
grid = np.ones((rows, cols)) * 10  # Base cost grid

# User Selections
start = st.sidebar.slider("Start Point", 0, rows - 1, (0, 0))
goal = st.sidebar.slider("Goal Point", 0, cols - 1, (rows - 1, cols - 1))

# Hazard Setup
hazards, hazard_map = generate_hazards(grid, start, goal)

# Block Goal Surroundings Button
if st.sidebar.button("Block Goal Surroundings"):
    blocked_hazards = block_goal_surroundings(grid, goal)
    hazards = np.maximum(hazards, blocked_hazards)  # Combine the blocked hazards with existing ones

if st.sidebar.button("Reset"):
    hazards, hazard_map = generate_hazards(grid, start, goal)

# Tabs for Algorithms
astar, bellman, ensemble = st.tabs(["A* Algorithm", "Bellman-Ford", "Ensemble Methods"])

with astar:
    st.header("A* Simulation")
    path1, nodes_expanded1, response_time1 = a_star(grid + hazards, start, goal)
    plot_path(path1)
    display_metrics(path1, nodes_expanded1, response_time1)

with bellman:
    st.header("Bellman-Ford Simulation")
    path2, nodes_expanded2, response_time2 = bellman_ford(grid + hazards, start, goal)
    plot_path(path2)
    display_metrics(path2, nodes_expanded2, response_time2)

with ensemble:
    st.header("Ensemble Simulation")
    path3, nodes_expanded3, response_time3, least_risky_node = ensemble_pathfinding(grid, start, goal, hazards, hazard_map)
    plot_path(path3, least_risky_node)
    display_metrics(path3, nodes_expanded3, response_time3)
