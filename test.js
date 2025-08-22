const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const mapInfo = document.getElementById("mapInfo");
const tileInfo = document.getElementById("tileInfo");
const playerPos = document.getElementById("playerPos");

let mapData;
let tilesetImages = [];
let zoomLevel = 1.0;

let player = {
    x: 160,
    y: 120,
    width: 24,
    height: 24,
    speed: 4
};

const keys = {}; 

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// Set up button event listeners
document.getElementById('zoomIn').addEventListener('click', () => {
    zoomLevel += 0.25;
    drawGame();
});

document.getElementById('zoomOut').addEventListener('click', () => {
    if (zoomLevel > 0.5) zoomLevel -= 0.25;
    drawGame();
});

document.getElementById('resetView').addEventListener('click', () => {
    zoomLevel = 1.0;
    drawGame();
});

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

// Mock data to simulate your TMJ file and tilesets
// In a real scenario, you would fetch these from actual files
const mockMapData = {
    width: 20,
    height: 15,
    tilewidth: 16,  // This is the logical tile size in the map data
    tileheight: 16, // But our tiles are actually 32x32 pixels
    layers: [
        {
            name: 'Grass_0',
            type: 'tilelayer',
            width: 20,
            height: 15,
            data: Array(300).fill().map(() => Math.random() > 0.7 ? 2 : 1)
        },
        {
            name: 'Wall_1',
            type: 'tilelayer',
            width: 20,
            height: 15,
            data: Array(300).fill().map(() => Math.random() > 0.9 ? 4 : 0)
        },
        {
            name: 'propsCollision',
            type: 'tilelayer',
            width: 20,
            height: 15,
            data: Array(300).fill().map(() => Math.random() > 0.95 ? 3 : 0)
        }
    ],
    tilesets: [
        {
            firstgid: 1,
            source: 'tileset.tsj'
        }
    ]
};

// Mock tileset data
const mockTileset = {
    name: 'tileset',
    image: 'https://placehold.co/160x96/354f1c/FFFFFF/png?text=Tileset',
    imagewidth: 160,
    imageheight: 96,
    tilewidth: 32,  // Actual tile size is 32x32
    tileheight: 32,
    columns: 5,
    tilecount: 15
};

// Initialize the game with mock data
async function initGame() {
    // Simulate loading the tileset image
    const img = await loadImage(mockTileset.image);
    
    // Create a tileset object combining the mock data and the loaded image
    tilesetImages.push({
        ...mockTileset,
        img,
        firstgid: mockMapData.tilesets[0].firstgid,
    });

    mapData = mockMapData;

    // Update info panel
    mapInfo.textContent = `Map Size: ${mapData.width} x ${mapData.height} tiles`;
    tileInfo.textContent = `Tileset: ${mockTileset.tilewidth}x${mockTileset.tileheight} pixels, Rendered at: ${Math.round(mockTileset.tilewidth * zoomLevel)}x${Math.round(mockTileset.tileheight * zoomLevel)} pixels`;

    // Set canvas size based on actual tile dimensions (32x32) and zoom level
    const tileWidth = tilesetImages[0].tilewidth;
    const tileHeight = tilesetImages[0].tileheight;
    canvas.width = mapData.width * tileWidth * zoomLevel;
    canvas.height = mapData.height * tileHeight * zoomLevel;

    // Start the game loop
    gameLoop();
}

function collisionCheck(layer, playerX, playerY) {
    if (!layer) return false; 

    // Use the actual tile size from tileset (32x32) for collision detection
    const tileWidth = tilesetImages[0].tilewidth;
    const tileHeight = tilesetImages[0].tileheight;

    // calc the tile position based on player coordinates
    const tileX = Math.floor(playerX / tileWidth);
    const tileY = Math.floor(playerY / tileHeight);

    // checks the value of the tile and returns true if its solid 
    const tiles = layer.data;
    const width = layer.width;
    const index = tileY * width + tileX; 
    const tile = tiles[index];
    return tile !== 0; 
}

function drawLayer(layer) {
    if (!layer || layer.type !== "tilelayer") return;

    for (let y = 0; y < layer.height; y++) {
        for (let x = 0; x < layer.width; x++) {
            const tileId = layer.data[y * layer.width + x];
            if (tileId === 0) continue; 

            let ts = null;
            for (let i = tilesetImages.length - 1; i >= 0; i--) {
                if (tileId >= tilesetImages[i].firstgid) {
                    ts = tilesetImages[i];
                    break;
                }
            }
            if (!ts) continue;

            const tileNum = tileId - ts.firstgid;

            const tilesPerRow = ts.columns;
            const sx = (tileNum % tilesPerRow) * ts.tilewidth;
            const sy = Math.floor(tileNum / tilesPerRow) * ts.tileheight;

            // Calculate the position and size with zoom applied
            const dx = x * ts.tilewidth * zoomLevel;
            const dy = y * ts.tileheight * zoomLevel;
            const renderWidth = ts.tilewidth * zoomLevel;
            const renderHeight = ts.tileheight * zoomLevel;

            ctx.drawImage(
                ts.img,
                sx, sy, ts.tilewidth, ts.tileheight,
                dx, dy, renderWidth, renderHeight
            );
        }
    }
}

function drawGame() {
    // Update canvas size based on zoom level
    const tileWidth = tilesetImages[0].tilewidth;
    const tileHeight = tilesetImages[0].tileheight;
    canvas.width = mapData.width * tileWidth * zoomLevel;
    canvas.height = mapData.height * tileHeight * zoomLevel;
    
    // Update tile info
    tileInfo.textContent = `Tileset: ${tileWidth}x${tileHeight} pixels, Rendered at: ${Math.round(tileWidth * zoomLevel)}x${Math.round(tileHeight * zoomLevel)} pixels`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw layers in order
    const layerOrder = [
        'Grass_0', 'Wall_1', 'propsCollision'
    ];

    layerOrder.forEach(name => {
        const layer = mapData.layers.find(l => l.name === name);
        drawLayer(layer);
    });

    // Draw player with zoom applied
    ctx.fillStyle = 'blue';
    ctx.fillRect(
        player.x * zoomLevel, 
        player.y * zoomLevel, 
        player.width * zoomLevel, 
        player.height * zoomLevel
    );

    // Draw player outline
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        player.x * zoomLevel, 
        player.y * zoomLevel, 
        player.width * zoomLevel, 
        player.height * zoomLevel
    );
}

function gameLoop() {
    let newX = player.x;
    let newY = player.y;

    if(keys['ArrowUp']) newY -= player.speed;
    if(keys['ArrowDown']) newY += player.speed;
    if(keys['ArrowLeft']) newX -= player.speed;
    if(keys['ArrowRight']) newX += player.speed;

    const wallLayer = mapData.layers.find(l => l.name === 'Wall_1');
    const propLayer = mapData.layers.find(l => l.name === 'propsCollision');

    if(!collisionCheck(wallLayer, newX, newY) && !collisionCheck(propLayer, newX, newY)) {
        player.x = newX;
        player.y = newY;
    }

    // Update player position display
    playerPos.textContent = `X: ${Math.round(player.x)}, Y: ${Math.round(player.y)}`;

    drawGame();
    requestAnimationFrame(gameLoop);
}

// Start the game
initGame();