import random

# Calculate total TSP cycle distance
def total_distance(solution, matrix):
    return sum(matrix[solution[i]][solution[(i+1) % len(solution)]] for i in range(len(solution)))


# Roulette Wheel Selection
def roulette_selection(population, matrix):
    fitness = [1 / total_distance(ind, matrix) for ind in population]
    total_fit = sum(fitness)
    probs = [f / total_fit for f in fitness]

    r = random.random()
    s = 0
    for i, p in enumerate(probs):
        s += p
        if s >= r:
            return population[i]


# Rank Selection
def rank_selection(population, matrix):
    sorted_pop = sorted(population, key=lambda x: total_distance(x, matrix))
    ranks = list(range(1, len(population) + 1))
    total_rank = sum(ranks)
    probs = [r / total_rank for r in ranks]

    r = random.random()
    s = 0
    for i, p in enumerate(probs):
        s += p
        if s >= r:
            return sorted_pop[i]


# Ordered Crossover (OX)
def crossover_OX(p1, p2):
    a, b = sorted(random.sample(range(len(p1)), 2))
    child = [None] * len(p1)
    child[a:b] = p1[a:b]
    p2_rest = [x for x in p2 if x not in child]
    
    j = 0
    for i in range(len(child)):
        if child[i] is None:
            child[i] = p2_rest[j]
            j += 1
    return child


# Uniform Crossover
def crossover_uniform(p1, p2):
    child = [-1] * len(p1)
    used = set()

    for i in range(len(p1)):
        if random.random() < 0.5 and p1[i] not in used:
            child[i] = p1[i]
            used.add(p1[i])

    for i in range(len(p2)):
        if p2[i] not in used:
            for j in range(len(child)):
                if child[j] == -1:
                    child[j] = p2[i]
                    used.add(p2[i])
                    break
    return child


# 1-point crossover
def crossover_1_point(p1, p2):
    point = random.randint(1, len(p1) - 2)
    child = p1[:point] + [x for x in p2 if x not in p1[:point]]
    return child


# 2-point crossover
def crossover_2_point(p1, p2):
    a, b = sorted(random.sample(range(len(p1)), 2))
    segment = p1[a:b]
    child = [None] * len(p1)
    child[a:b] = segment
    
    remaining = [x for x in p2 if x not in segment]
    j = 0
    for i in range(len(child)):
        if child[i] is None:
            child[i] = remaining[j]
            j += 1
    return child


# Swap mutation
def mutation(solution):
    i, j = random.sample(range(len(solution)), 2)
    solution[i], solution[j] = solution[j], solution[i]
    return solution


# Genetic Algorithm with configurable operators
def genetic_algorithm(matrix, pop_size=100, generations=500, mutation_rate=0.2,
                      selection_type="tournament",
                      crossover_type="OX"):
    n = len(matrix)

    # Initial population
    population = [random.sample(range(n), n) for _ in range(pop_size)]

    # Selection choice
    def selection(pop):
        if selection_type == "roulette":
            return roulette_selection(pop, matrix)
        elif selection_type == "rank":
            return rank_selection(pop, matrix)
        else:  # tournament
            candidates = random.sample(pop, 3)
            return min(candidates, key=lambda x: total_distance(x, matrix))

    # Crossover choice
    def crossover(p1, p2):
        if crossover_type == "uniform":
            return crossover_uniform(p1, p2)
        elif crossover_type == "1point":
            return crossover_1_point(p1, p2)
        elif crossover_type == "2point":
            return crossover_2_point(p1, p2)
        else:  # OX
            return crossover_OX(p1, p2)

    best = min(population, key=lambda x: total_distance(x, matrix))
    best_dist = total_distance(best, matrix)

    # Evolution loop
    for _ in range(generations):
        new_pop = []

        for _ in range(pop_size):
            p1 = selection(population)
            p2 = selection(population)
            child = crossover(p1, p2)

            if random.random() < mutation_rate:
                child = mutation(child)

            new_pop.append(child)

        population = new_pop

        candidate = min(population, key=lambda x: total_distance(x, matrix))
        cand_dist = total_distance(candidate, matrix)

        if cand_dist < best_dist:
            best = candidate[:]
            best_dist = cand_dist

    return best, best_dist
