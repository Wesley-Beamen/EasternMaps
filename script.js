// ================================
// LOAD JSON
// ================================

async function loadHallways() {
    const response = await fetch("Cords.json");
    return await response.json();
}


// ================================
// DISTANCE FUNCTIONS
// ================================

function degreesToRadians(deg) {
    return deg * (Math.PI / 180);
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const dLat = degreesToRadians(lat2 - lat1);
    const dLon = degreesToRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(degreesToRadians(lat1)) *
        Math.cos(degreesToRadians(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


// ================================
// POINT → LINE SEGMENT DISTANCE
// ================================
// Returns distance from point P to segment AB

function distancePointToSegment(px, py, ax, ay, bx, by) {
    const A = { x: ax, y: ay };
    const B = { x: bx, y: by };
    const P = { x: px, y: py };

    const AB = { x: B.x - A.x, y: B.y - A.y };
    const AP = { x: P.x - A.x, y: P.y - A.y };

    const ab2 = AB.x * AB.x + AB.y * AB.y;
    const ap_ab = AP.x * AB.x + AP.y * AB.y;

    let t = ap_ab / ab2;
    t = Math.max(0, Math.min(1, t));

    const closest = {
        x: A.x + AB.x * t,
        y: A.y + AB.y * t
    };

    const dx = P.x - closest.x;
    const dy = P.y - closest.y;

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

    // Hallway pairs (start → end)
    const hallwayPairs = [
        ["100_start", "100_end"],
        ["200_start", "200_end"]
    ];

    // SNAP ROOM TO ANY POINT ALONG HALLWAY (within 5 meters)
    hallwayPairs.forEach(([startNode, endNode]) => {
        const A = nodes[startNode];
        const B = nodes[endNode];

        const dist = distancePointToSegment(
            room.lat, room.lon,
            A.lat, A.lon,
            B.lat, B.lon
        );

        if (dist <= 5) {
            edges.push({ from: "room_205", to: startNode });
        }
    });

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
