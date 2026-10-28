let docbgImg;
let mortalityTable;
let tutorialOn = true;
let patientImages = {};
let silhouetteImages = {};
let dialogue = [
  { text: "> Welcome to your first day at the doctor's office!\n> I'm Doctor Graves" },
  { text: "> Here's our first patient!\n> Now, record a bit about them, then press 'Done'" },
  { text: "> Now, let's get to business. Drag the X-Ray over the patient to view some special information about them. \n> This is their future possible causes of death.\n> Print the results out to finish." },
  { text: "" },
];

const patients = [
  { sex: "F", race_ethnicity: "White Non-Hispanic", src: "assets/wnhf.png" },
  { sex: "M", race_ethnicity: "White Non-Hispanic", src: "assets/wnhm.png" },
  { sex: "F", race_ethnicity: "Black Non-Hispanic", src: "assets/bnhf.png" },
  { sex: "M", race_ethnicity: "Black Non-Hispanic", src: "assets/bnhm.png" },
  { sex: "F", race_ethnicity: "Hispanic", src: "assets/hf.png" },
  { sex: "M", race_ethnicity: "Hispanic", src: "assets/hm.png" },
  { sex: "F", race_ethnicity: "Asian + Pacific Islander", src: "assets/apif.png" },
  { sex: "M", race_ethnicity: "Asian + Pacific Islander", src: "assets/apim.png" },
  { sex: "F", race_ethnicity: "Other Race/Ethnicity", src: "assets/of.png" },
  { sex: "M", race_ethnicity: "Other Race/Ethnicity", src: "assets/om.png" },
  { sex: "F", race_ethnicity: "Not Stated/Unknown", src: "assets/uf.png" },
  { sex: "M", race_ethnicity: "Not Stated/Unknown", src: "assets/um.png" },
];

let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;

const tableau10 = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", 
  "#59a14f", "#edc948", "#b07aa1", "#ff9da7", 
  "#9c755f", "#bab0ac"
];



let currentLine = 0;
let dialogueTextEl, characterSelectorEl, drSpriteBoxEl, dialogueUi, patientSex, patientRace;

let typingInterval = null;
let displayedText = "";

function setDialogueText(text) {
  if (!dialogueTextEl) return;
  if (typingInterval) clearInterval(typingInterval);
  displayedText = "";
  let i = 0;
  
  typingInterval = setInterval(() => {
    if (i < text.length) {
      displayedText += text.charAt(i);
      dialogueTextEl.innerText = displayedText;
      i++;
    } else {
      clearInterval(typingInterval);
    }
  }, 25);
}

class SimpleTable {
  constructor(text) {
    let lines = text.split(/\r\n|\n/).filter((line) => line.trim() !== "");
    this.headers = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
    this.rows = [];
    for (let i = 1; i < lines.length; i++) {
      let values = lines[i].split(",").map((v) => v.trim().replace(/^["']|["']$/g, ""));
      let row = {};
      for (let c = 0; c < this.headers.length; c++) {
        row[this.headers[c]] = values[c];
      }
      this.rows.push(row);
    }
  }
  getRowCount() {
    return this.rows.length;
  }
  getString(r, colName) {
    return this.rows[r] ? this.rows[r][colName] || "" : "";
  }
  getNum(r, colName) {
    let val = this.getString(r, colName);
    return Number(val) || 0;
  }
}

async function setup() {
  let canvas = createCanvas(1000, 600);
  canvas.parent("game-container");
  let scannerCanvasEl = document.getElementById("scanner-canvas");
  let mCtx = scannerCanvasEl ? scannerCanvasEl.getContext("2d") : null;
  docbgImg = await loadImage("assets/doctors office.jpg");

  try {
    let response = await fetch("assets/nyc_leading_causes_of_death_cleaned.csv");
    let csvText = await response.text();
    mortalityTable = new SimpleTable(csvText);
  } catch (err) {
    console.error("Failed to load CSV via fetch:", err);
  }

  dialogueTextEl = document.getElementById("dialogue-text");
  characterSelectorEl = document.getElementById("character-selector");
  drSpriteBoxEl = document.getElementById("dr-sprite-box");
  dialogueUi = document.getElementById("dialogue-ui");
  patientSex = document.getElementById("sel-sex");
  patientRace = document.getElementById("sel-race-ethnicity");

  setupScannerDrag();
  setDialogueText(dialogue[currentLine].text);
}

function draw() {
  background(30);
  if (docbgImg) {
    let imgWidth = docbgImg.width;
    let imgHeight = docbgImg.height;

    let canvasAspect = width / height;
    let imageAspect = imgWidth / imgHeight;
    let drawWidth, drawHeight, drawX, drawY;
    if (imageAspect > canvasAspect) {
      drawHeight = height;
      drawWidth = height * imageAspect;
      drawX = (width - drawWidth) / 2;
      drawY = 0;
    } else {
      drawWidth = width;
      drawHeight = width / imageAspect;
      drawX = 0;
      drawY = (height - drawHeight) / 2;
    }

    image(docbgImg, drawX, drawY, drawWidth, drawHeight);
  }

  updateScannerData();
}

function advanceDialogue() {
  if (characterSelectorEl && characterSelectorEl.style.display === "flex") {
    return;
  }
  currentLine = (currentLine + 1) % dialogue.length;
  if (dialogue[currentLine]) {
    setDialogueText(dialogue[currentLine].text);
  }
  if (currentLine >= dialogue.length - 1) {
    if (dialogueUi) dialogueUi.style.display = "none";
    return;
  }
  if (currentLine === 1) {
    if (characterSelectorEl) characterSelectorEl.style.display = "flex";
    if (dialogueTextEl) dialogueTextEl.style.width = "55%";
  }
}

function updatePatientSprite() {
  let s = patientSex.value;
  let re = patientRace.value;
  let found = patients.find((p) => p.sex === s && p.race_ethnicity === re);

  let patientImg = document.getElementById("patient-sprite");
  if (found) {
    patientImg.style.opacity = 0;
    
    setTimeout(() => {
      patientImg.src = found.src;
      patientImg.style.display = "block";
      patientImg.style.opacity = 1;
    }, 700); 
  } else {
    patientImg.style.display = "none";
  }
}

function closeClipboard() {
  if (characterSelectorEl) characterSelectorEl.style.display = "none";
  currentLine++;
  if (dialogueTextEl) dialogueTextEl.style.width = "80%";
  document.getElementById("scanner-box").style.display = "flex";
  if (dialogue[currentLine]) {
    setDialogueText(dialogue[currentLine].text);
  }
}

function randomizePatient() {
  let randomIndex = Math.floor(Math.random() * patients.length);
  let randomPatient = patients[randomIndex];

  patientSex.value = randomPatient.sex;
  patientRace.value = randomPatient.race_ethnicity;

  updatePatientSprite();
}

let scannerZoom = 1.0;

function zoomScanner(amount) {
  scannerZoom = constrain(scannerZoom + amount, 0.6, 2.5);
}

let scannerImageCache = {};

function getCachedImage(src) {
  if (scannerImageCache[src]) return scannerImageCache[src];
  let img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  scannerImageCache[src] = img;
  return img;
}

let masterSilhouetteCanvas = null;
let lastScannedKey = "";
let currentCauseRanges = [];
let hoveredBandIndex = -1;
let isCurrentlyOverlapping = false;

function updateScannerData() {
  let scannerBox = document.getElementById("scanner-box");
  let scannerContent = document.getElementById("scanner-content");
  let scannerCanvas = document.getElementById("scanner-canvas");
  let patientSprite = document.getElementById("patient-sprite");

  if (!scannerBox || !scannerContent || !scannerCanvas || !patientSprite) return;

  let clipboard = document.getElementById("character-selector");
  if (!clipboard || clipboard.style.display === "flex" || currentLine < 2) {
    scannerBox.style.display = "none";
    isCurrentlyOverlapping = false;
    return;
  }

  let selSex = document.getElementById("sel-sex").value;
  let selRace = document.getElementById("sel-race-ethnicity").value;
  let foundPatient = patients.find(p => p.sex === selSex && p.race_ethnicity === selRace);

  if (!foundPatient || patientSprite.style.display === "none" || !mortalityTable) {
    return;
  }

  if (!scannerBox.style.left) {
    scannerBox.style.left = "100px";
    scannerBox.style.top = "50px";
  }

  let containerRect = document.getElementById("game-container").getBoundingClientRect();
  let patientRect = patientSprite.getBoundingClientRect();
  
  let cachedImg = getCachedImage(foundPatient.src);
  if (!cachedImg.complete || cachedImg.naturalWidth === 0) return;

  let elW = patientSprite.offsetWidth;
  let elH = patientSprite.offsetHeight;
  let natW = cachedImg.naturalWidth;
  let natH = cachedImg.naturalHeight;

  let elAspect = elW / elH;
  let imgAspect = natW / natH;

  let renderW, renderH, renderOffsetX, renderOffsetY;
  if (imgAspect > elAspect) {
    renderW = elW;
    renderH = elW / imgAspect;
    renderOffsetX = 0;
    renderOffsetY = (elH - renderH) / 2;
  } else {
    renderH = elH;
    renderW = elH * imgAspect;
    renderOffsetX = (elW - renderW) / 2;
    renderOffsetY = 0;
  }

  let pX = (patientRect.left - containerRect.left) + renderOffsetX;
  let pY = (patientRect.top - containerRect.top) + renderOffsetY;
  let pWidth = renderW;
  let pHeight = renderH;

  let sW = scannerBox.offsetWidth;
  let sH = scannerBox.offsetHeight;
  let sX = parseInt(scannerBox.style.left);
  let sY = parseInt(scannerBox.style.top);

  isCurrentlyOverlapping = 
    sX < pX + pWidth &&
    sX + sW > pX &&
    sY < pY + pHeight &&
    sY + sH > pY;

  let currentKey = selSex + "_" + selRace + "_" + pWidth + "_" + pHeight;
  let causes = {};
  let totalDeaths = 0;

  for (let r = 0; r < mortalityTable.getRowCount(); r++) {
    let rSex = mortalityTable.getString(r, 'sex').trim();
    let rRace = mortalityTable.getString(r, 'race_ethnicity').trim();
    
    let normalizedRRace = rRace.replace(" and ", " + ").replace("Race/ ", "Race/");
    let normalizedSelRace = selRace.replace(" and ", " + ").replace("Race/ ", "Race/");

    if (rSex === selSex && normalizedRRace === normalizedSelRace) {
      let cause = mortalityTable.getString(r, 'leading_cause').trim();
      let count = mortalityTable.getNum(r, 'deaths');
      causes[cause] = (causes[cause] || 0) + count;
      totalDeaths += count;
    }
  }

  if (totalDeaths === 0) {
    scannerContent.innerHTML = "<b>No data found.</b>";
    scannerCanvas.style.display = "none";
    return;
  }

  if (currentKey !== lastScannedKey) {
    lastScannedKey = currentKey;
    currentCauseRanges = [];

    masterSilhouetteCanvas = document.createElement('canvas');
    masterSilhouetteCanvas.width = pWidth;
    masterSilhouetteCanvas.height = pHeight;
    let mCtx = masterSilhouetteCanvas.getContext('2d');

    let currentY = 0;
    let colorIndex = 0;
    let causeKeys = Object.keys(causes);

    for (let i = 0; i < causeKeys.length; i++) {
      let cause = causeKeys[i];
      let count = causes[cause];
      let pct = count / totalDeaths;
      
      let bandHeight;
      if (i === causeKeys.length - 1) {
        bandHeight = pHeight - currentY;
      } else {
        bandHeight = Math.round(pHeight * pct);
      }

      let col = tableau10[colorIndex % tableau10.length];
      colorIndex++;

      currentCauseRanges.push({
        cause: cause,
        pct: (pct * 100).toFixed(1),
        col: col,
        startY: currentY,
        endY: currentY + bandHeight
      });

      mCtx.fillStyle = col;
      mCtx.fillRect(0, currentY, pWidth, bandHeight);
      currentY += bandHeight;
    }

    mCtx.globalCompositeOperation = 'destination-in';
    mCtx.drawImage(cachedImg, 0, 0, pWidth, pHeight);
  }

  scannerBox.style.display = "flex";
  let ctx = scannerCanvas.getContext("2d");
  ctx.clearRect(0, 0, scannerCanvas.width, scannerCanvas.height);

  if (masterSilhouetteCanvas && isCurrentlyOverlapping) {
    let canvasBox = scannerCanvas.getBoundingClientRect();
    let canvasContainerRect = document.getElementById("game-container").getBoundingClientRect();
    let canvasScreenX = canvasBox.left - canvasContainerRect.left;
    let canvasScreenY = canvasBox.top - canvasContainerRect.top;

    let srcW = scannerCanvas.width / scannerZoom;
    let srcH = scannerCanvas.height / scannerZoom;
    let srcX = (canvasScreenX - pX) + (scannerCanvas.width - srcW) / 2;
    let srcY = (canvasScreenY - pY) + (scannerCanvas.height - srcH) / 2;

    ctx.drawImage(
      masterSilhouetteCanvas, 
      srcX, srcY, srcW, srcH, 
      0, 0, scannerCanvas.width, scannerCanvas.height              
    );

    if (hoveredBandIndex >= 0 && hoveredBandIndex < currentCauseRanges.length) {
      let band = currentCauseRanges[hoveredBandIndex];
      let localStartY = (band.startY - srcY) * scannerZoom;
      let localEndY = (band.endY - srcY) * scannerZoom;

      ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
      ctx.fillRect(0, Math.max(0, localStartY), scannerCanvas.width, Math.min(scannerCanvas.height, localEndY) - Math.max(0, localStartY));
      
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (localStartY >= 0 && localStartY <= scannerCanvas.height) {
        ctx.moveTo(0, localStartY); ctx.lineTo(scannerCanvas.width, localStartY);
      }
      if (localEndY >= 0 && localEndY <= scannerCanvas.height) {
        ctx.moveTo(0, localEndY); ctx.lineTo(scannerCanvas.width, localEndY);
      }
      ctx.stroke();
    }
  } else {
    hoveredBandIndex = -1;
    scannerContent.style.border = "2px solid transparent";
    scannerContent.innerHTML = "<span style='color: white;'><i>Place scanner over patient to view data.</i></span>";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let scannerCanvas = document.getElementById("scanner-canvas");
  let scannerContent = document.getElementById("scanner-content");
  let lastActiveIndex = -1;

  if (scannerCanvas) {
    scannerCanvas.addEventListener("mousemove", (e) => {
      if (!isCurrentlyOverlapping || !masterSilhouetteCanvas || currentCauseRanges.length === 0) {
        hoveredBandIndex = -1;
        scannerContent.style.border = "2px solid transparent";
        scannerContent.innerHTML = "<span style='color: white;'><i>Place scanner over patient to view data.</i></span>";
        return;
      }

      let canvasRect = scannerCanvas.getBoundingClientRect();
      let canvasMouseX = e.clientX - canvasRect.left;
      let canvasMouseY = e.clientY - canvasRect.top;

      let patientSprite = document.getElementById("patient-sprite");
      let containerRect = document.getElementById("game-container").getBoundingClientRect();
      let patientRect = patientSprite.getBoundingClientRect();

      let cachedImg = getCachedImage(patients[0].src);
      let elW = patientSprite.offsetWidth;
      let elH = patientSprite.offsetHeight;
      let natW = cachedImg.naturalWidth || 500;
      let natH = cachedImg.naturalHeight || 500;
      let elAspect = elW / elH;
      let imgAspect = natW / natH;

      let renderOffsetY = imgAspect > elAspect ? 0 : (elH - (elW / imgAspect)) / 2;
      let pY = (patientRect.top - containerRect.top) + renderOffsetY;

      let canvasBox = scannerCanvas.getBoundingClientRect();
      let canvasScreenY = canvasBox.top - containerRect.top;

      let srcH = scannerCanvas.height / scannerZoom;
      let srcY = (canvasScreenY - pY) + (scannerCanvas.height - srcH) / 2;

      let masterY = srcY + (canvasMouseY / scannerZoom);

      let activeIndex = currentCauseRanges.findIndex(range => masterY >= range.startY && masterY < range.endY);

      if (activeIndex === -1 && lastActiveIndex !== -1) {
        let prevBand = currentCauseRanges[lastActiveIndex];
        if (masterY >= prevBand.startY - 3 && masterY <= prevBand.endY + 3) {
          activeIndex = lastActiveIndex;
        }
      }

      hoveredBandIndex = activeIndex;
      lastActiveIndex = activeIndex;

      if (activeIndex !== -1) {
        let activeBand = currentCauseRanges[activeIndex];
        let shortCause = activeBand.cause.split('(')[0];
        
        scannerContent.style.border = `2px solid ${activeBand.col}`;
        scannerContent.innerHTML = `<span style="color:${activeBand.col}; font-size:15px; ">&#9632;</span> <b style="color: white; font-size:11px;">${shortCause}</b><br><span style="font-size:12px; color:#ffdf00;">Percent Deaths: <b>${activeBand.pct}%</b></span>`;
      } else {
        scannerContent.style.border = "2px solid transparent";
        scannerContent.innerHTML = "<span style='color: white;'><i>Hover over colored body parts to inspect risk.</i></span>";
      }
    });

    scannerCanvas.addEventListener("mouseleave", () => {
      hoveredBandIndex = -1;
      lastActiveIndex = -1;
      if (scannerContent) {
        scannerContent.style.border = "2px solid transparent";
        scannerContent.innerHTML = "<span style='color: white;'><i>Hover over colored body parts to inspect risk.</i></span>";
      }
    });
  }
});

function setupScannerDrag() {
  let scanner = document.getElementById("scanner-box");
  if (!scanner) return;

  scanner.addEventListener("mousedown", (e) => {
    if (e.target.tagName === "BUTTON") return; // Don't drag when clicking buttons
    isDragging = true;
    dragOffsetX = e.clientX - scanner.offsetLeft;
    dragOffsetY = e.clientY - scanner.offsetTop;
    e.preventDefault();
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    let container = document.getElementById("game-container").getBoundingClientRect();

    let newX = e.clientX - dragOffsetX;
    let newY = e.clientY - dragOffsetY;

    newX = Math.max(0, Math.min(newX, container.width - scanner.offsetWidth));
    newY = Math.max(0, Math.min(newY, container.height - scanner.offsetHeight));

    scanner.style.left = newX + "px";
    scanner.style.top = newY + "px";
  });

  window.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function printSilhouetteToClipboard() {
  if (!masterSilhouetteCanvas) {
    alert("No active silhouette to print! Scan a patient first.");
    return;
  }

  let modalEl = document.getElementById("printed-clipboard-modal");
  let stampEl = document.getElementById("printed-stamp");
  let sexTextEl = document.getElementById("print-sex-text");
  let raceTextEl = document.getElementById("print-race-text");
  let printCanvas = document.getElementById("printed-canvas");

  if (modalEl && stampEl && sexTextEl && raceTextEl && printCanvas) {
    let dataUrl = masterSilhouetteCanvas.toDataURL("image/png");
    stampEl.src = dataUrl;
    printCanvas.width = masterSilhouetteCanvas.width;
    printCanvas.height = masterSilhouetteCanvas.height;
    let pCtx = printCanvas.getContext("2d");
    pCtx.drawImage(masterSilhouetteCanvas, 0, 0);

    // 3. Fetch selected demographics
    let selSex = document.getElementById("sel-sex").value;
    let selRace = document.getElementById("sel-race-ethnicity").value;
    let fullSexName = selSex === "M" ? "Male" : "Female";

    sexTextEl.innerHTML = `<b>Sex:</b> ${fullSexName}`;
    raceTextEl.innerHTML = `<b>Race/Ethnicity:</b> ${selRace}`;

    // Reset hover box
    document.getElementById("print-hover-cause").innerHTML = "<i>Hover over stamp to inspect causes.</i>";

    // 4. Show the centered modal overlay
    modalEl.style.display = "flex";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let printCanvas = document.getElementById("printed-canvas");
  let hoverCauseEl = document.getElementById("print-hover-cause");

  if (printCanvas && hoverCauseEl) {
    printCanvas.addEventListener("mousemove", (e) => {
      if (!currentCauseRanges || currentCauseRanges.length === 0) return;

      let printRect = printCanvas.getBoundingClientRect();
      let localMouseX = e.clientX - printRect.left; 
      let localMouseY = e.clientY - printRect.top; 
      let scaleX = printCanvas.width / printRect.width;
      let scaleY = printCanvas.height / printRect.height;
      let canvasY = localMouseY * scaleY;

      let activeBand = currentCauseRanges.find(range => canvasY >= range.startY && canvasY < range.endY);

      if (activeBand) {
        let shortCause = activeBand.cause.split('(')[0];
        hoverCauseEl.innerHTML = `<span style="color:${activeBand.col}; font-size:14px; text-shadow: 0 0 3px ${activeBand.col};">&#9632;</span> <b>${shortCause}</b> — <span style="color:#b22222;">Percent Deaths: <b>${activeBand.pct}%</b></span>`;
      } else {
        hoverCauseEl.innerHTML = "<i>Hover over stamp to inspect causes.</i>";
      }
    });

    printCanvas.addEventListener("mouseleave", () => {
      if (hoverCauseEl) {
        hoverCauseEl.innerHTML = "<i>Hover over stamp to inspect causes.</i>";
      }
    });
  }
});

function closePrintedClipboard() {
  let modalEl = document.getElementById("printed-clipboard-modal");
  let characterSelectorEl = document.getElementById("character-selector");
  
  if (modalEl) {
    modalEl.style.display = "none";
  }
  
  if (characterSelectorEl) {
    characterSelectorEl.style.display = "flex";
    if (dialogueTextEl) dialogueTextEl.style.width = "55%";
  }
}
