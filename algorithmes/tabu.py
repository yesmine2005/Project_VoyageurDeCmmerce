import random

# Calculate distance of a TSP cycle
def total_distance(solution, matrix):
    distance = 0
    for i in range(len(solution) - 1):
        distance += matrix[solution[i]][solution[i + 1]]
    distance += matrix[solution[-1]][solution[0]]
    return distance


# Tabu Search algorithm
def tabu_search(matrix, iterations=500, tabu_size=20):
    n = len(matrix)

    # Initial random solution
    current = list(range(n))
    random.shuffle(current)

    best = current[:]
    best_dist = total_distance(best, matrix)

    tabu_list = []

    for _ in range(iterations):
        best_neighbor = None
        best_neighbor_dist = float("inf")

        for i in range(n):
            for j in range(i + 1, n):
                neighbor = current[:]
                neighbor[i], neighbor[j] = neighbor[j], neighbor[i]

                if neighbor in tabu_list:
                    continue

                dist = total_distance(neighbor, matrix)

                if dist < best_neighbor_dist:
                    best_neighbor = neighbor
                    best_neighbor_dist = dist

        current = best_neighbor

        if best_neighbor_dist < best_dist:
            best = best_neighbor
            best_dist = best_neighbor_dist

        tabu_list.append(current)
        if len(tabu_list) > tabu_size:
            tabu_list.pop(0)

    return best, best_dist
