const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {
            "gsi-blank": {
                type: "raster",
                tiles: ["https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "地図データ &copy; <a href='https://maps.gsi.go.jp/development/ichiran.html'>国土地理院</a>"
            }
        },
        layers: [{
            id: "gsi-blank-layer",
            type: "raster",
            source: "gsi-blank"
        }]
    },
    center: [139.6917, 35.6895],
    zoom: 5
});

const lineCoordinates = [];
const polygonCoordinates = [];
const distanceDisplay = document.getElementById('distance');
const areaDisplay = document.getElementById('area');
const perimeterDisplay = document.getElementById('perimeter');
let activeMode = 'distance';
let measuring = false;
let areaMeasuring = false;

document.getElementById('tab-distance').onclick = () => setActiveTab('distance');
document.getElementById('tab-area').onclick = () => setActiveTab('area');
document.getElementById('toggle-panel').onclick = togglePanel;

document.getElementById('start-distance').onclick = () => {
    measuring = !measuring;
    const btn = document.getElementById('start-distance');
    btn.textContent = measuring ? '距離計測終了' : '距離計測開始';
    btn.classList.toggle('active', measuring);
};

document.getElementById('start-area').onclick = () => {
    areaMeasuring = !areaMeasuring;
    const btn = document.getElementById('start-area');
    btn.textContent = areaMeasuring ? '面積計測終了' : '面積計測開始';
    btn.classList.toggle('active', areaMeasuring);
};

function setActiveTab(mode) {
    activeMode = mode;
    document.querySelectorAll('.content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('#tabs button').forEach(b => b.classList.remove('active'));
    document.getElementById(mode + '-content').classList.add('active');
    document.getElementById('tab-' + mode).classList.add('active');
}

function togglePanel() {
    const panelContent = document.getElementById('panel-content');
    panelContent.style.display = panelContent.style.display === 'block' ? 'none' : 'block';
}

map.on('load', function () {
    map.addSource('line-source', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
    });
    map.addLayer({
        id: 'line-layer',
        type: 'line',
        source: 'line-source',
        paint: { 'line-color': '#FF0000', 'line-width': 3 }
    });

    map.addSource('polygon-source', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Polygon', coordinates: [[]] } }
    });
    map.addLayer({
        id: 'polygon-layer',
        type: 'fill',
        source: 'polygon-source',
        paint: { 'fill-color': '#FF0000', 'fill-opacity': 0.3 }
    });
});

map.on('click', function (e) {
    const coords = [e.lngLat.lng, e.lngLat.lat];

    if (activeMode === 'distance') {
        if (!measuring) return;
        lineCoordinates.push(coords);
        updateLine();
    } else if (activeMode === 'area') {
        if (!areaMeasuring) return;
        polygonCoordinates.push(coords);
        updatePolygon();
    }
});

function updateLine() {
    if (lineCoordinates.length > 1) {
        map.getSource('line-source').setData({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: lineCoordinates }
        });
        const line = turf.lineString(lineCoordinates);
        const distance = turf.length(line, { units: 'meters' });
        distanceDisplay.innerText = `${distance.toFixed(2)} m`;
    }
}

function updatePolygon() {
    if (polygonCoordinates.length > 2) {
        const polygon = turf.polygon([[...polygonCoordinates, polygonCoordinates[0]]]);
        const area = turf.area(polygon);
        const perimeter = turf.length(turf.lineString([...polygonCoordinates, polygonCoordinates[0]]), { units: 'meters' });
        map.getSource('polygon-source').setData({
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [[...polygonCoordinates, polygonCoordinates[0]]] }
        });
        areaDisplay.innerText = `${area.toFixed(2)} m²`;
        perimeterDisplay.innerText = `${perimeter.toFixed(2)} m`;
    }
}

document.getElementById('clear-distance').onclick = () => {
    lineCoordinates.length = 0;
    map.getSource('line-source').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
    distanceDisplay.innerText = '0 m';
};

document.getElementById('clear-area').onclick = () => {
    polygonCoordinates.length = 0;
    map.getSource('polygon-source').setData({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[]] } });
    areaDisplay.innerText = '0 m²';
    perimeterDisplay.innerText = '0 m';
};
