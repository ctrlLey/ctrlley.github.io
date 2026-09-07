// setup() is called once at page-load
function setup() {
  let canvas = createCanvas(800, 600); // make an HTML canvas element width x height pixels
  canvas.parent("hourglass-container");
  // Get the current second on startup
  let currentSec = second();
  let currentMin = minute();
  let currentHr = hour();
  lastSecond = currentSec;
  lastMin = currentMin;
  lastHr = currentHr;

  for (let i = 0; i < currentSec; i++) {
    let tY = 200 - map(i, 0, 59, 2, 65);
    sandSec.push({
      x: random(330, 475),
      y: tY,
      targetY: tY,
      speed: 0,
    });
  }
  for (let i = 0; i < currentMin; i++) {
    let tY = 335 - i;
    sandMin.push({
      x: random(330, 475),
      y: tY,
      targetY: tY,
      speed: 0,
    });
  }
  for (let i = 0; i < currentHr; i++) {
    let tY = 462 - i;
    sandHr.push({
      x: random(330, 475),
      y: tY,
      targetY: tY,
      speed: 0,
    });
  }
}

let lastMinLog = 0;
let sandHr = [];
let sandMin = [];
let sandSec = [];
let lastSecond = -1;
let lastMin = -1;
let lastHr = -1;
// draw() is called 60 times per second
function draw() {
  let hr = hour();
  let mins = minute();
  let sec = second();
  let ms = millis();
  if (ms - lastMinLog >= 60000) {
    lastMinLog = ms;
    console.log("minute: %d", mins);
  }
  background(239, 239, 245);

  fill(0);
  textSize(24);
  textAlign(CENTER, TOP);
  // text("Current Time", width/2, 10);

  textSize(36);
  text(hr, width / 2 - 45, 45);
  fill(90);
  text(mins, width / 2, 45);
  fill(160);
  text(sec, width / 2 + 45, 45);
  fill(0);
  textSize(12);
  // text(`x: ${mouseX}`, width/2 - 20,70)
  // text(`y: ${mouseY}`, width/2 + 20,70)
  textAlign(LEFT);
  strokeWeight(1);
  // line(width/2, 0, width/2, 600);

  drawHourglass();
  sandClock(hr, mins, sec);

  if (sec !== lastSecond) {
    lastSecond = sec;
    sandSec.push({
      x: 400 + random(-65, 65),
      y: 120,
      targetY: 210 - map(sec, 0, 59, 2, 65),
      speed: random(2, 5),
    });

    if (sec === 0) {
      sandSec = [];
    }
  }
  if (mins !== lastMin) {
    lastMin = mins;
    sandMin.push({
      x: 400 + random(-50, 50),
      y: 255,
      targetY: 330 - map(mins, 0, 59, 2, 35),
      speed: random(1, 3),
    });

    if (mins === 0) {
      sandMin = [];
    }
  }
  if (hr !== lastHr) {
    lastHr = hr;

    sandHr.push({
      x: 400 + random(-50, 50),
      y: 400,
      targetY: 465 - map(hr, 0, 59, 2, 35),
      speed: random(1, 2),
    });
    if (hr === 0) {
      sandHr = [];
    }
  }
}

function drawHourglass() {
  strokeWeight(3);
  stroke(121, 94, 73);
  strokeJoin(ROUND);
  noFill();

  const rectHeight = 400;
  const rectWidth = 300;
  const rectRad = 10;
  //whole hourglass is based around these dimensions, so most measurements will be relative -> helps me not have to adjust everything manually...
  // rect(250, 100, rectWidth, rectHeight, rectRad);

  //top and bottom sections of hourglass
  const hgBaseHeight = 20;
  fill(121, 94, 73);
  rect(250, 100, rectWidth, hgBaseHeight, rectRad, rectRad, 0, 0);
  rect(
    250,
    100 + rectHeight - hgBaseHeight,
    rectWidth,
    hgBaseHeight,
    0,
    0,
    rectRad,
    rectRad
  );

  //supports of hourglass
  strokeWeight(10);
  const hgSupportOffset = 25;
  line(
    250 + hgSupportOffset,
    100 + hgBaseHeight,
    250 + hgSupportOffset,
    100 + rectHeight - hgBaseHeight
  );
  line(
    250 + rectWidth - hgSupportOffset,
    100 + hgBaseHeight,
    250 + rectWidth - hgSupportOffset,
    100 + rectHeight - hgBaseHeight
  );

  strokeWeight(3);
  // line(250, rectHeight/3 + 100, 250+rectWidth, rectHeight/3 +100);
  // line(250, 2* rectHeight/3 + 100, 250+rectWidth, 2* rectHeight/3 +100);

  //non-exact drawings ahead lol
  noFill();
  stroke(171, 201, 198);
  spline(300, 122, 280, 150, 300, 190, 390, rectHeight / 3 + 100);
  spline(500, 122, 520, 150, 500, 190, 410, rectHeight / 3 + 100);
  spline(
    390,
    rectHeight / 3 + 100,
    295,
    275,
    290,
    320,
    390,
    (2 * rectHeight) / 3 + 100
  );
  spline(
    410,
    rectHeight / 3 + 100,
    505,
    275,
    510,
    320,
    410,
    (2 * rectHeight) / 3 + 100
  );
  spline(390, (2 * rectHeight) / 3 + 100, 300, 410, 280, 450, 300, 478);
  spline(410, (2 * rectHeight) / 3 + 100, 500, 410, 520, 450, 500, 478);
  noStroke();
}

function sandClock(hr, mins, sec) {
  for (let i = sandSec.length - 1; i >= 0; i--) {
    let p = sandSec[i];

    fill(174, 152, 71);
    ellipse(p.x, p.y, 3, 3);

    p.y += p.speed;

    if (p.y >= p.targetY) {
      p.y = p.targetY;
    }
  }
  for (let i = sandMin.length - 1; i >= 0; i--) {
    let p = sandMin[i];

    fill(174, 152, 71);
    ellipse(p.x, p.y, 8, 8);
    p.y += p.speed;
    if (p.y >= p.targetY) {
      p.y = p.targetY;
    }
  }
  for (let i = sandHr.length - 1; i >= 0; i--) {
    let p = sandHr[i];

    fill(174, 152, 71);

    ellipse(p.x, p.y, 30, 30);
    p.y += p.speed;
    if (p.y >= p.targetY) {
      p.y = p.targetY;
    }
  }
}
