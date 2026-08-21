// ================================
// LOAD JSON
// ================================

async function loadHallways() {
    const response = await fetch("Cords.json");
    return await response.json();
}


// ================================
// LAT/LON → METERS
// ================================

function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

function latLonToMeters(lat, lon) {
    const R = 6371000;
    const x = R * degreesToRadians(lon) * Math.cos(degreesToRadians(lat));
    const y = R * degreesToRadians(lat);
    return { x, y };
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const p1 = latLonToMeters(lat1, lon1);
    const p2 = latLonToMeters(lat2, lon2);

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    return Math.sqrt(dx * dx + dy * dy);
}


// ================================
// BUILD GRAPH
// ================================

function buildGraph(nodes, edges) {
    const graph = {};

    function addEdge(a, b, dist) {
        if (!graph[a]) graph[a] = [];
        graph[a].push({ node: b, distance: dist });
    }

    edges.forEach(e => {
        const a = e.from;
        const b = e.to;

        const dist = calculateDistance(
            nodes[a].lat, nodes[a].lon,
            nodes[b].lat, nodes[b].lon
        );

        addEdge(a, b, dist);
        addEdge(b, a, dist);
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

    Object.keys(graph).forEach(n => distances[n] = Infinity);
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
// MAIN PATHFINDING LOGIC
// ================================

async function computePath() {
    const data = await loadHallways();

    const nodes = data.nodes;
    const edges = [...data.edges];

    const room = nodes["room_205"];

    const candidateNodes = [
        "100_start", "100_mid", "100_end",
        "200_start", "200_mid", "200_end"
    ];

    let closestNode = null;
    let closestDist = Infinity;

    candidateNodes.forEach(name => {
        const n = nodes[name];
        const dist = calculateDistance(room.lat, room.lon, n.lat, n.lon);

        if (dist < closestDist) {
            closestDist = dist;
            closestNode = name;
        }
    });

    const SNAP_DISTANCE = 25; // meters

    if (closestNode && closestDist <= SNAP_DISTANCE) {
        edges.push({ from: "room_205", to: closestNode });
    } else {
        edges.push({ from: "room_205", to: "200_mid" });
    }

    const graph = buildGraph(nodes, edges);

    const path = findShortestPath(graph, "media_center", "room_205");

    const output = document.getElementById("pathOutput");
    output.style.display = "block";

    if (!path || path.length === 0) {
        output.textContent = "No valid path found.";
        return;
    }

    output.innerHTML = `
        <strong>Shortest Path:</strong><br><br>
        ${path.join(" ➝ ")}
    `;
}


// ================================
// BUTTON
// ================================

document.getElementById("pathButton").addEventListener("click", computePath);
