var c = document.getElementById("gameCanvas");
var ctx = c.getContext("2d");

var img = new Image();
img.src = 'assets/Scene Overview.png';

let cameraX= 0;
let cameraY = 0; 

ctx.drawImage(
    map,            //
    cameraX,        // crop start x in image
    cameraY,        // crop start y in image
    canvas.width,   // crop width
    canvas.height,  // crop height
    0, 0,           // draw position on canvas
    canvas.width,
    canvas.height
  );
  

img.onload = () => {
    ctx.drawImage(img, 0, 0, c.width, c.height);
}
