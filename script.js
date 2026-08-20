// ================================
// LOAD HALLWAY COORDINATES
// ================================

async function loadHallways() {
    const response = await fetch("Cords.json");
    const data = await response.json();
    return data;
}


// ================================
// BUILD GRAPH FROM JSON
// ================================

function buildGraph(nodes, edges) {
    const graph = {};

    function addEdge(a, b, distance) {
        if (!graph[a]) graph[a] = [];
        graph[a].push({ node: b, distance });
    }

    edges.forEach(e => {
        const a = e.from;
        const b = e.to;

        const dist = calculateDistance(
            nodes[a].lat, nodes[a].lon,
            nodes[b].lat, nodes[b].lon
        );

        addEdge(a, b, dist);
        addEdge(b, a, dist); // bidirectional
    });

    return graph;
}


// ================================
// DIJKSTRA SHORTEST PATH
// ================================

function findShortestPath(graph, startNode, endNode) {
    const distances = {};
    const visited = new Set();
    const previous = {};

    Object.keys(graph).forEach(node => distances[node] = Infinity);
    distances[startNode] = 0;

    while (true) {
        let current = null;

        for (const node in distances) {
            if (!visited.has(node)) {
                if (current === null || distances[node] < distances[current]) {
                    current = node;
                }
            }
        }

        if (current === null) break;
        if (current === endNode) break;

        visited.add(current);

        graph[current].forEach(edge => {
            const newDist = distances[current] + edge.distance;
            if (newDist < distances[edge.node]) {
                distances[edge.node] = newDist;
                previous[edge.node] = current;
            }
        });
    }

    const path = [];
    let node = endNode;

    while (node) {
        path.unshift(node);
        node = previous[node];
    }

    return path;
}


// ================================
// MAIN PATHFINDING FUNCTION
// ================================

async function computePath() {
    const hallwayData = await loadHallways();

    const graph = buildGraph(hallwayData.nodes, hallwayData.edges);

    const start = "media_center";
    const end = "room_205";

    const path = findShortestPath(graph, start, end);

    console.log("Shortest path:", path);
}


// ================================
// RUN PATHFINDING
// ================================

computePath();
