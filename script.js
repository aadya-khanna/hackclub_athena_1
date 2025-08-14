const c = document.getElementById("gameCanvas");
const ctx = c.getContext("2d");

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

const tilesetImages = [];

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

    // Load all tilesets
    tilesetImages = await Promise.all(
      map.tilesets.map(async tsj => {
        const tileset = await fetch(tsj.source).then(res => res.json());
        const img = await loadImage(tileset.image);
        return { tileset, img, firstgid: tsj.firstgid };
      })
    );

    console.log('Map and tilesets loaded!', tilesetImages);
    //  call drawMap() or start your game loop
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
    if (!layer) return;
    const tiles = layer.data;

    for(let y = 0; y < layer.height; y++) {
        for(let x = 0; x < layer.width; x++) {
            const tile = tiles[y * layer.width + x];
            if(tile !== 0) {
                ctx.fillStyle = '#888'
                ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            }
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

    const wallLayer = mapData.layers.find(layer => layer.name === 'Wall_1');
    const propLayer = mapData.layers.find(layer => layer.name === 'propsCollision');

    if(!collisionCheck(wallLayer, newX, newY) && !collisionCheck(propLayer, newX, newY)) {
        player.x = newX;
        player.y = newY;
    }

    ctx.clearRect(0, 0, c.width, c.height);

    drawLayer(mapData.layers.find(layer => layer.name === 'Grass_0'));
    drawLayer(mapData.layers.find(layer => layer.name === 'Grass_1'));
    drawLayer(mapData.layers.find(layer => layer.name === 'Grass_2'));
    drawLayer(mapData.layers.find(layer => layer.name === 'Stair_1'));
    drawLayer(mapData.layers.find(layer => layer.name === 'Stair_2'));
    drawLayer(mapData.layers.find(layer => layer.name === 'propsCollision'));
    drawLayer(mapData.layers.find(layer => layer.name === 'Wall_0'));
    drawLayer(mapData.layers.find(layer => layer.name === 'Wall_1'));
    drawLayer(mapData.layers.find(layer => layer.name === 'Wall_2'));

    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);

    requestAnimationFrame(gameLoop);
}