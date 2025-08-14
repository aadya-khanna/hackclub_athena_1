const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const tileSize = 32;
let mapData;

let player = {
    x: 0,
    y: 0,
    width: 28,
    height: 28,
    speed: 2
}

const keys = {}; 

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

let tilesetImages = [];

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

fetch('map.tmj')
  .then(res => res.json())
  .then(async map => {
    mapData = map;

    tilesetImages = await Promise.all(
      map.tilesets.map(async tsj => {
        const tileset = await fetch(tsj.source).then(res => res.json());
        const img = await loadImage(tileset.image);
        return { tileset, img, firstgid: tsj.firstgid };
      })
    );

    canvas.width = mapData.width * mapData.tilewidth;
    canvas.height = mapData.height * mapData.tileheight;

    console.log('All tilesets loaded:', tilesetImages);

    // Start game loop
    gameLoop();
});


function collisionCheck(layer, playerX, playerY) {
    if (!layer) return false; 

    // calc the tile position based on player coordinates
    const tileX = Math.floor(playerX / tileSize);
    const tileY = Math.floor(playerY / tileSize);

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
            if (tileId === 0) continue; // empty

            // Find correct tileset
            let ts = null;
            for (let i = tilesetImages.length - 1; i >= 0; i--) {
                if (tileId >= tilesetImages[i].firstgid) {
                    ts = tilesetImages[i];
                    break;
                }
            }
            if (!ts) continue;

            const tileNum = tileId - ts.firstgid;
            const tilesPerRow = ts.tileset.columns;

            const sx = (tileNum % tilesPerRow) * ts.tileset.tilewidth;
            const sy = Math.floor(tileNum / tilesPerRow) * ts.tileset.tileheight;

            const dx = x * mapData.tilewidth;
            const dy = y * mapData.tileheight;

            ctx.drawImage(
                ts.img,
                sx, sy, ts.tileset.tilewidth, ts.tileset.tileheight,
                dx, dy, mapData.tilewidth, mapData.tileheight
            );
        }
    }
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw layers in order (floor first, then props, then walls)
    const layerOrder = [
         'Wall_0'
    ];

    layerOrder.forEach(name => {
        const layer = mapData.layers.find(l => l.name === name);
        drawLayer(layer);
    });

    // Draw player
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
}
