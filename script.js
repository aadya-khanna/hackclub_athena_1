const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let mapData;
let tilesetImages = [];

let player = {
    x: 160,
    y: 120,
    width: 16,  // Slightly smaller than tile size for better visual
    height: 16, // Slightly smaller than tile size for better visual
    speed: 2
}

const keys = {}; 

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

async function initGame() {
    try {
        // Fetch the map data
        const mapResponse = await fetch('map.tmj');
        mapData = await mapResponse.json();

        // Load all tileset images
        for (const tsj of mapData.tilesets) {
            const tileset = await fetch(tsj.source).then(res => res.json());
            const img = await loadImage(tileset.image);
            
            // Create a new object that combines the data from both files
            // and ensures we have the correct firstgid from the main map.
            tilesetImages.push({
                ...tileset, // spread operator to include all properties from the .tsj file
                img,
                firstgid: tsj.firstgid,
            });
        }

        // Sort the array to ensure proper search order
        tilesetImages.sort((a, b) => a.firstgid - b.firstgid);
        
        // Set canvas size based on map dimensions and tile size
        canvas.width = mapData.width * mapData.tilewidth;
        canvas.height = mapData.height * mapData.tileheight;

        // Start the game loop
        gameLoop();
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}

function collisionCheck(layer, playerX, playerY) {
    if (!layer) return false; 

    // Use the actual tile size from tileset for collision detection
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

                
            const mapTileWidth = mapData.tilewidth;
            const mapTileHeight = mapData.tileheight;

            ctx.drawImage(
                ts.img,
                sx, sy, ts.tilewidth, ts.tileheight, // cut from tileset
                x * mapTileWidth, y * mapTileHeight, mapTileWidth, mapTileHeight // draw at map position
            );

        }
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw layers in order
    const layerOrder = [
        'Grass_0','Wall_0'
    ];

    layerOrder.forEach(name => {
        const layer = mapData.layers.find(l => l.name === name);
        drawLayer(layer);
    });

    // Draw player without zoom
    ctx.fillStyle = 'blue';
    ctx.fillRect(
        player.x, 
        player.y, 
        player.width, 
        player.height
    );

    // Draw player outline
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        player.x, 
        player.y, 
        player.width, 
        player.height
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

    drawGame();
    requestAnimationFrame(gameLoop);
}

// Initialize the game
initGame();