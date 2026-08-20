// ================================
// LOAD HALLWAY COORDINATES
// ================================

async function loadHallways() {
    const response = await fetch("Cords.json");
    const data = await response.json();
    return data;
}


// ================================
// DISTANCE CALCULATION
// ================================

function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371000;

    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) *
        Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadius * c;
}


// ================================
// BUILD GRAPH
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

    const output = document.getElementById("pathOutput");

    if (!path || path.length === 0) {
        output.style.display = "block";
        output.textContent = "No valid path found.";
        return;
    }

    output.style.display = "block";
    output.innerHTML = `
        <strong>Shortest Path:</strong><br><br>
        ${path.join(" ➝ ")}
    `;
}


// ================================
// BUTTON CLICK
// ================================

document.getElementById("pathButton").addEventListener("click", computePath);
