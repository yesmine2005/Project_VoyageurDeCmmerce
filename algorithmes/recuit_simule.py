import math
import random

# Compute total TSP distance
def total_distance(solution, matrix):
    distance = 0
    for i in range(len(solution) - 1):
        distance += matrix[solution[i]][solution[i + 1]]
    distance += matrix[solution[-1]][solution[0]]
    return distance


# Simulated Annealing algorithm
def simulated_annealing(matrix, temp=1000, cooling_rate=0.995, iterations=1000):
    n = len(matrix)

    # Initial random solution
    current = list(range(n))
    random.shuffle(current)
    current_dist = total_distance(current, matrix)

    best = current[:]
    best_dist = current_dist

    for _ in range(iterations):
        i, j = random.sample(range(n), 2)
        neighbor = current[:]
        neighbor[i], neighbor[j] = neighbor[j], neighbor[i]
        neighbor_dist = total_distance(neighbor, matrix)

        # Accept if better or by probability
        if neighbor_dist < current_dist or random.random() < math.exp((current_dist - neighbor_dist) / temp):
            current = neighbor
            current_dist = neighbor_dist

        if current_dist < best_dist:
            best = current[:]
            best_dist = current_dist

        temp *= cooling_rate

    return best, best_dist
