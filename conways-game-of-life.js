//instantiating variables.
const ALIVE = 2;
const GHOST = 1;
const DEAD = 0;
const CELL_SIZE = 5;
let livingColor = "#666666"; // Color of living cells
let ghostColor = "#333333"; // Color of ghost cells
let deadColor = "#222222"; // Color of dead cells

document.getElementById("liveColor").setAttribute("value", livingColor)
document.getElementById("ghostColor").setAttribute("value", ghostColor)
document.getElementById("deathColor").setAttribute("value", deadColor)

document.getElementById("liveColor").addEventListener('change', function () {
    livingColor = document.getElementById("liveColor").value;
    drawBoard();
})
document.getElementById("ghostColor").addEventListener('change', function () {
    ghostColor = document.getElementById("ghostColor").value;
    drawBoard();
})
document.getElementById("deathColor").addEventListener('change', function () {
    deadColor = document.getElementById("deathColor").value;
    drawBoard();
})

const CANVAS = document.getElementById("gameCanvas");
const CONTEXT = CANVAS.getContext("2d");
let speed = 10;

const GRID_HEIGHT = Math.floor(CANVAS.height / CELL_SIZE);
const GRID_WIDTH = Math.floor(CANVAS.width / CELL_SIZE);

let currentGrid = create2dArray(GRID_WIDTH, GRID_HEIGHT);
let nextGrid = create2dArray(GRID_WIDTH, GRID_HEIGHT);
//hohohoh, le intervale.
let interval;
let brushGrid;
let kernelGrid;
let live = [];
let birth = [];
let randomNum = 0;
let secretNum = 3;
let optimizePlay = false
let lastMousePosition;

//canvas listeners, for drawing our highlights
CANVAS.addEventListener("click", cellToggle);
CANVAS.addEventListener("pointerover", updateCellLocation);
CANVAS.addEventListener("pointermove", updateCellLocation);
CANVAS.addEventListener("pointerleave", updateCellLocation);

//attach our listeners to everything that isn't our canvas
document.getElementById("startButton").addEventListener("click", start)
document.getElementById("stopButton").addEventListener("click", stop)
document.getElementById("stepButton").addEventListener("click", step)
document.getElementById("clearButton").addEventListener("click", clearBoard)
document.getElementById("kernelKernel").addEventListener("click", updateKernel)
document.getElementById("brushKernel").addEventListener("click", updateBrush)
document.getElementById("randRes").addEventListener("click", setRan)
document.getElementById("optimizePlay").addEventListener("change", optimize)

//set stop to disabled, to properly set up our start stop buttons.
document.getElementById("stopButton").disabled = true;

for (const child of document.getElementById("numPadBirth").getElementsByTagName("input")) {
    child.addEventListener("click", modifyRules)
}
for (const child of document.getElementById("numPadLive").getElementsByTagName("input")) {
    child.addEventListener("click", modifyRules)
}
for (const child of document.getElementById("moveViewport").getElementsByTagName("input")) {
    child.addEventListener("click", shiftViewport)
}

//set the initial kernels
updateKernel();
updateBrush();
//set the initial random
setRan()
//construct our live/birth rules
modifyRule(document.getElementById("numPadBirth"))
modifyRule(document.getElementById("numPadLive"))
//prep the first board.
drawBoard()
document.getElementById("exportCanvas").href = CANVAS.toDataURL("image/png")

function setRan() {
    randomNum = document.getElementById("randSeed").value
    secretNum = 3;
}

function progressRandom() {
    if (randomNum % 2 === 0 && randomNum !== 0) {
        randomNum /= 2
    } else {
        secretNum += 7
        secretNum %= 100
        randomNum *= 2
        if (secretNum % 2 === 0) {
            randomNum += 1
        } else {
            randomNum += secretNum
        }
    }
    if (randomNum > 1000000000) {
        randomNum %= 1000000000
    }

}

function create2dArray(length, height) {
    let arr = new Array(height);
    for (let i = 0; i < height; i++) {
        arr[i] = new Array(length).fill(0);
    }
    return arr;
}

function modifyRules(event) {
    modifyRule(document.getElementById(event.target.id).parentElement)
}

function modifyRule(ruleLocation) {
    if (ruleLocation === document.getElementById("numPadLive")) {
        live = []
    } else if (ruleLocation === document.getElementById("numPadBirth")) {
        birth = []
    }
    let theseElements = ruleLocation.getElementsByTagName("input")
    let iterator = 0
    for (const thisElement of theseElements) {
        if (thisElement.checked) {
            if (ruleLocation === document.getElementById("numPadLive")) {
                live.push(Number.parseInt(thisElement.id.at(1)))
            } else if (ruleLocation === document.getElementById("numPadBirth")) {
                birth.push(Number.parseInt(thisElement.id.at(1)))
            }
        }
        iterator++
    }
}

//draws a cell, given two coordinates
// written to expect x and y values of a mouse clicking on the canvas, in other contexts like loops, I will need to multiply the coords by 10.
function drawCell(x, y) {
    let normX = x;
    let normY = y;
    let swap = ((x + y) % 6 <= 2);
    if (currentGrid[normY][normX] === ALIVE) {
        CONTEXT.fillStyle = livingColor;
    } else if (currentGrid[normY][normX] === GHOST) {
        CONTEXT.fillStyle = ghostColor;
    } else if (currentGrid[normY][normX] === DEAD) {
        CONTEXT.fillStyle = deadColor;
    } else {
        //the "something's wrong and I can feel it" color.
        if (!swap)
            CONTEXT.fillStyle = "#ff00ff"
        else
            CONTEXT.fillStyle = "#00ff00"
    }
    normX *= CELL_SIZE;
    normY *= CELL_SIZE;
    CONTEXT.fillRect(normX, normY, CELL_SIZE, CELL_SIZE);
    if (!optimizePlay && swap) {
        CONTEXT.fillStyle = "rgb(240, 255, 255, 0.02)"
        CONTEXT.fillRect(normX, normY, CELL_SIZE, CELL_SIZE);
    }
}

function randomizeBoard() {
    for (let i = 0; i < GRID_HEIGHT; i++) {
        for (let j = 0; j < GRID_WIDTH; j++) {
            progressRandom()
            currentGrid[i][j] = randomNum % 3;
        }
    }
    //draw the board after randomizing the boards.
    drawBoard();
}

function optimize(e) {
    optimizePlay = e.target.checked;
    drawBoard()
}

//draws board separately from the computations for the board.
function drawBoard() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            drawCell(x, y);
        }
    }
    if (optimizePlay) {
        drawMinimalHighlight(lastMousePosition[0], lastMousePosition[1])
        return;
    }
    if (lastMousePosition && lastMousePosition.length === 2) {
        drawHighlight(lastMousePosition[0], lastMousePosition[1])
    }
    document.getElementById("exportCanvas").href = CANVAS.toDataURL("image/png")
}

//simply resets the board, for the user.
function clearBoard() {
    //fuck clearing grids, create new ones.
    currentGrid = create2dArray(GRID_WIDTH, GRID_HEIGHT);
    nextGrid = create2dArray(GRID_WIDTH, GRID_HEIGHT);
    drawBoard();
}

//clone returns shallow copies of arrays in JavaScript, I will work around this with the following function:
function cloneInto(into, cloneMe) {
    //for every entry in into, clone the value in the corresponding array in cloneMe.
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            into[y][x] = Number(cloneMe[y][x] + "");
        }
    }
}

function step() {
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            let shouldLive = false;
            let shouldBirth = false;
            let check = checkNeighbors(x, y);
            //if the current cell is alive
            if (currentGrid[y][x] === ALIVE) {
                //check to see if it should live into the next generation.
                if (live.includes(check)) {
                    shouldLive = true;
                }
                //if current cell is dead or a ghost
            } else if (currentGrid[y][x] !== ALIVE) {
                //check to see if it should be born into the next generation.
                if (birth.includes(check)) {
                    shouldBirth = true;
                }
            }
            //if neither of the if conditions are met, then don't process the rules for them.

            //if either should live or should birth are existent and true
            if (shouldLive || shouldBirth) {
                //next generation's grid cell comes to life.
                nextGrid[y][x] = ALIVE;
                continue
            } else if (currentGrid[y][x] !== DEAD) {
                //otherwise if I'm alive or a ghost, become a ghost, or dead respectively.
                nextGrid[y][x] = currentGrid[y][x] - 1;
                continue
            }
            nextGrid[y][x] = DEAD;
        }
    }
    //set the current board as a copy of the next
    currentGrid = nextGrid
    nextGrid = create2dArray(GRID_WIDTH, GRID_HEIGHT)
    //draw the board
    drawBoard();
}

function updateKernel() {
    kernelGrid = document.getElementById("kernelKernel").getElementsByTagName("input");

    let grid = create2dArray(Math.sqrt(kernelGrid.length), Math.sqrt(kernelGrid.length));
    for (const cell of kernelGrid) {
        //grab the x coordinate of the item.
        let x = Number(cell.id.split("kx").at(1).split("y").at(0))
        //grab the y coordinate of the item.
        let y = Number(cell.id.split("y").at(1));
        grid[y][x] = cell.checked;
    }
    kernelGrid = grid;
}

//this function checks nearby cells for living cells.
function checkNeighbors(myX, myY) {
    let livingNeighbors = 0;
    let start = Math.floor(kernelGrid.length / 2);
    let end = Math.floor(kernelGrid.length / 2);

    for (let kernelY = -start; kernelY <= end; kernelY++) {
        for (let kernelX = -start; kernelX <= end; kernelX++) {

            if ((kernelGrid[kernelY + start][kernelX + start] === false)) {
                continue
            }
            let checkX = wrap(kernelX + myX, GRID_WIDTH);
            let checkY = wrap(kernelY + myY, GRID_HEIGHT);
            //if the kernel has a value other than 0 and the current cell being looked at is alive
            if ((currentGrid[checkY][checkX] === ALIVE)) {
                livingNeighbors++;//increment living neighbors.
            }
        }
    }
    return livingNeighbors;
}

function wrap(value, dimension) {
    return ((value + dimension) % dimension);
}

function start() {
    interval = setInterval(step, 1000 / speed);
    document.getElementById("startButton").disabled = true;
    document.getElementById("stopButton").disabled = false;
}

function stop() {
    clearInterval(interval);
    interval = null;
    document.getElementById("startButton").disabled = false;
    document.getElementById("stopButton").disabled = true;
}

function changeSpeed(value) {
    speed = value;
    if (interval) {
        stop();
        start();
    }
}

function updateBrush() {
    let tempElements =document.getElementById("brushKernel").getElementsByTagName("input");
    let grid = create2dArray(Math.sqrt(tempElements.length), Math.sqrt(tempElements.length));
    for (const cell of tempElements) {
        //grab the x coordinate of the item.
        let x = Number(cell.id.split("x").at(1).split("y").at(0))
        //grab the y coordinate of the item.
        let y = Number(cell.id.split("y").at(1));
        grid[y][x] = cell.checked;
    }
    brushGrid = grid
}

//allows you to actually toggle cells.
function cellToggle(e) {
    let bound = CANVAS.getBoundingClientRect();
    let y1 = Math.floor((e.clientY - bound.top) / CELL_SIZE);
    let x1 = Math.floor((e.clientX - bound.left) / CELL_SIZE);
    //and check to see where I must write to it.`
    for (let y = 0; y < brushGrid.length; y++) {
        for (let x = 0; x < brushGrid[0].length; x++) {
            if (brushGrid[y][x]) {
                currentGrid[wrap(y1 + (y - 1), GRID_HEIGHT)][wrap(x1 + (x - 1), GRID_WIDTH)]--;
                if (currentGrid[wrap(y1 + (y - 1), GRID_HEIGHT)][wrap(x1 + (x - 1), GRID_WIDTH)] < 0) {
                    currentGrid[wrap(y1 + (y - 1), GRID_HEIGHT)][wrap(x1 + (x - 1), GRID_WIDTH)] = 2;
                }
            }
        }
    }
    drawBoard();
    updateCellLocation(e);
}

//the blue square
function drawMinimalHighlight(y1,x1){
    CONTEXT.fillStyle = "rgb(0, 0, 255, 0.75)";
    for (let i = 0; i <brushGrid.length; i++) {
        for (let j = 0; j <brushGrid[0].length; j++) {
            if (brushGrid[j][i]===true)
                CONTEXT.fillRect(x1 - CELL_SIZE+(CELL_SIZE*i), y1 - CELL_SIZE+(CELL_SIZE*j), CELL_SIZE, CELL_SIZE);
        }
    }
}

function drawHighlight(y1, x1) {
    CONTEXT.strokeStyle = "rgb(255, 0, 0, 0.5)";
    for (let i = 0; i < 2; i++) {
        CONTEXT.strokeRect(0, y1, CANVAS.width, CELL_SIZE);
        CONTEXT.strokeRect(x1, 0, CELL_SIZE, CANVAS.height);
    }

    drawMinimalHighlight(y1,x1)

    //create an overlay on the board to indicate "I'm being edited!"
    CONTEXT.strokeStyle = "#0f0";
    for (let i = 0; i < 2; i++) {
        CONTEXT.strokeRect(0, 0, CANVAS.width - 1, CANVAS.height - 1);
        CONTEXT.strokeRect(1, 1, CANVAS.width - 2, CANVAS.height - 2);
    }
}

//highlights the board and what cell you're editing on the board.
function updateCellLocation(e) {
    let bound = CANVAS.getBoundingClientRect();
    if ((e.clientY - bound.top < CANVAS.height && e.clientX - bound.left < CANVAS.width) && (e.clientY - bound.top > 0 && e.clientX - bound.left > 0)) {
        let x1 = Math.floor((e.clientX - bound.left) / CELL_SIZE) * CELL_SIZE;
        let y1 = Math.floor((e.clientY - bound.top) / CELL_SIZE) * CELL_SIZE;
        lastMousePosition = [y1, x1]
    } else {
        lastMousePosition = null;
    }
    drawBoard();
}

function shift(into, cloneMe, xOffset, yOffset) {
    //for every entry in into, clone the value in the corresponding array in cloneMe.
    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            into[y][x] = Number(cloneMe[wrap(y + yOffset, GRID_HEIGHT)][wrap(x + xOffset, GRID_WIDTH)] + '');
        }
    }
    cloneInto(cloneMe, into)
}

function shiftViewport(event) {
    let id = event.target.id
    let stoppedByMe = false
    if (interval) {
        stop()
        stoppedByMe = true
    }
    switch (id) {
        case "vx0y0":
            shift(nextGrid, currentGrid, -1, -1)
            break;
        case "vx0y1":
            shift(nextGrid, currentGrid, -1, 0)
            break;
        case "vx0y2":
            shift(nextGrid, currentGrid, -1, 1)
            break;
        case "vx1y0":
            shift(nextGrid, currentGrid, 0, -1)
            break;
        case "vx1y1":
            console.error("unexpected event!")
            break;
        case "vx1y2":
            shift(nextGrid, currentGrid, 0, 1)
            break;
        case "vx2y0":
            shift(nextGrid, currentGrid, 1, -1)
            break;
        case "vx2y1":
            shift(nextGrid, currentGrid, 1, 0)
            break;
        case "vx2y2":
            shift(nextGrid, currentGrid, 1, 1)
            break;
    }
    drawBoard()
    if (!interval && stoppedByMe) {
        start()
    }
}