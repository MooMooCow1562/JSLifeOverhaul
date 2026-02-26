//instantiating variables.
const alive = 2;
const ghost = 1;
const dead = 0;
const cellSize = 5;
let livingColor = "#666666"; // Color of living cells
let ghostColor = "#333333"; // Color of ghost cells
let deadColor = "#222222"; // Color of dead cells

document.getElementById("liveColor").setAttribute("value", livingColor)
document.getElementById("ghostColor").setAttribute("value", ghostColor)
document.getElementById("deathColor").setAttribute("value", deadColor)

document.getElementById("liveColor").addEventListener('change',function(){livingColor = document.getElementById("liveColor").value;drawBoard();})
document.getElementById("ghostColor").addEventListener('change',function(){ghostColor = document.getElementById("ghostColor").value;drawBoard();})
document.getElementById("deathColor").addEventListener('change',function(){deadColor = document.getElementById("deathColor").value;drawBoard();})

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
let speed = 10;

const gridHeight = Math.floor(canvas.height / cellSize);
const gridWidth = Math.floor(canvas.width / cellSize);

let currentGrid = create2dArray(gridWidth, gridHeight);
let nextGrid = create2dArray(gridWidth, gridHeight);
//hohohoh, le intervale.
let interval;
let brushGrid;
let kernelGrid;
let live = [];
let birth = [];
let randomNum = 0;
context.fillStyle = deadColor; // Background color
context.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the background color

canvas.addEventListener("click", cellToggle);
canvas.addEventListener("pointerover", cellHighlight);
canvas.addEventListener("pointermove", cellHighlight);
canvas.addEventListener("pointerleave", cellHighlight);

document.getElementById("startButton").addEventListener("click", start)
document.getElementById("stopButton").addEventListener("click", stop)
document.getElementById("stopButton").disabled = true;
document.getElementById("stepButton").addEventListener("click", step)
document.getElementById("clearButton").addEventListener("click", clearBoard)
document.getElementById("kernelKernel").addEventListener("click", updateKernel)

for (const child of document.getElementById("numPadBirth").getElementsByTagName("input")) {
    child.addEventListener("click", modifyRules)
}
for (const child of document.getElementById("numPadLive").getElementsByTagName("input")) {
    child.addEventListener("click", modifyRules)
}

for (const child of document.getElementById("moveViewport").getElementsByTagName("input")) {
    child.addEventListener("click", shiftViewport)
}

updateKernel();
document.getElementById("randRes").addEventListener("click", setRan)

let secretNum = 3;

function setRan() {
    randomNum = document.getElementById("randSeed").value
    secretNum = 3;
}

setRan()

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

let ruleLocation = document.getElementById("numPadBirth")
modifyRule()
ruleLocation = document.getElementById("numPadLive")
modifyRule()

function modifyRules(event) {
    ruleLocation = document.getElementById(event.target.id).parentElement
    modifyRule()
}

function modifyRule() {
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

//draws a cell, given two coordinates, starting from the flattened coordinates and ending at the flattened coordinate + cell size.
//written to expect x and y values of a mouse clicking on the canvas, in other contexts like loops, I will need to multiply the coords by 10.
function drawCell(x, y) {
    let normX = flattenCoordinate(x);
    let normY = flattenCoordinate(y);
    if (Number(currentGrid[normY][normX]) === alive) {
        context.fillStyle = livingColor;
    } else if (Number(currentGrid[normY][normX]) === ghost) {
        context.fillStyle = ghostColor;
    } else {
        context.fillStyle = deadColor;
    }
    normX *= cellSize;
    normY *= cellSize;
    context.fillRect(normX, normY, cellSize, cellSize);
}

//Takes a coordinate and rounds it to the 10ths place.
function flattenCoordinate(v) {
    return (Math.floor(v));
}

function randomizeBoard() {
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
            progressRandom()
            currentGrid[i][j] = randomNum % 3;
        }
    }
    //draw the board after randomizing the boards.
    drawBoard();
}

let lastMousePosition;
//draws board separately from the computations for the board.
function drawBoard() {
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            drawCell(x, y);
        }
    }
    if(lastMousePosition && lastMousePosition.length === 2){
        drawHighlight(lastMousePosition[0],lastMousePosition[1])
    }
    document.getElementById("exportCanvas").href = canvas.toDataURL("image/png")
}

//simply resets the board, for the user.
function clearBoard() {
    //fuck clearing grids, create new ones.
    currentGrid = create2dArray(gridWidth, gridHeight);
    nextGrid = create2dArray(gridWidth, gridHeight);
    drawBoard();
}

//clone returns shallow copies of arrays in JavaScript, I will work around this with the following function:
function cloneInto(into, cloneMe) {
    //for every entry in into, clone the value in the corresponding array in cloneMe.
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            into[y][x] = cloneMe[y][x] + "";
        }
    }
}


function step() {
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            let shouldLive = false;
            let shouldBirth = false;
            //if the current cell is alive
            if (Number(currentGrid[y][x]) === alive) {
                //check to see if it should live into the next generation by cross-referencing each of the rules for live.
                let check = checkNeighbors(x, y);
                live.forEach(element => {
                    if (check === element) {
                        shouldLive = true;
                    }
                });
                //if current cell is dead or a ghost
            } else if (Number(currentGrid[y][x]) !== alive) {
                //check to see if it should be born into the next generation by cross-referencing each of the rules for birth.
                let check = checkNeighbors(x, y);
                birth.forEach(element => {
                    if (check === element) {
                        shouldBirth = true;
                    }
                });
            }
            //if neither of the if conditions are met, then don't process the rules for them.

            //if either should live or should birth are existent and true
            if (shouldLive || shouldBirth) {
                //next generation's grid cell comes to life.
                nextGrid[y][x] = alive;
            } else if (currentGrid[y][x] > dead) {
                //otherwise if I'm alive or a ghost, become a ghost, or dead respectively.
                nextGrid[y][x] = currentGrid[y][x] - 1;
            } else {
                //otherwise, the dead stay dead.
                nextGrid[y][x] = dead;
            }
        }
    }
    //set the current board as a copy of the next
    cloneInto(currentGrid, nextGrid);
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
        if (cell.checked === true) {
            grid[y][x] = 1;
        } else {
            grid[y][x] = 0;
        }
    }
    kernelGrid = grid;
}

//this function checks nearby cells for living cells.
function checkNeighbors(x, y) {
    let livingNeighbors = 0;
    let start;
    let end;

    //for odd kernels, do not weight the kernel direction.
    if (Number(kernelGrid.length % 2) === 1) {
        start = Math.floor(kernelGrid.length / 2);
    } else {//for even kernels, weight the kernel towards the bottom right.
        start = Math.floor(kernelGrid.length / 2) - 1;
    }
    end = Math.floor(kernelGrid.length / 2);

    for (let y1 = -start; y1 <= end; y1++) {
        for (let x1 = -start; x1 <= end; x1++) {
            //if the kernel has a value other than 0 and the current cell being looked at is alive
            if ((Number(kernelGrid[y1 + start][x1 + start]) !== 0) && (Number(currentGrid[wrap(y1 + y, gridHeight)][wrap(x1 + x, gridWidth)]) === alive)) {
                livingNeighbors++;//increment living neighbors.
            }
        }
    }
    return Number(livingNeighbors);
}

function wrap(value, dimension) {
    return (Number(value + dimension) % dimension);
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

//allows you to actually toggle cells.
function cellToggle(e) {
    let bound = canvas.getBoundingClientRect();
    let y1 = flattenCoordinate((e.clientY - bound.top) / cellSize);
    let x1 = flattenCoordinate((e.clientX - bound.left) / cellSize);
    //console.log(y1+" "+x1);
    brushGrid = document.getElementById("brushKernel").getElementsByTagName("input");
    //create the grid on the fly-
    let grid = create2dArray(Math.sqrt(brushGrid.length), Math.sqrt(brushGrid.length));
    for (const cell of brushGrid) {
        //grab the x coordinate of the item.
        let x = Number(cell.id.split("x").at(1).split("y").at(0))
        //grab the y coordinate of the item.
        let y = Number(cell.id.split("y").at(1));
        if (cell.checked === true) {
            grid[y][x] = 1;
        } else {
            grid[y][x] = 0;
        }
    }
    //and check to see where I must write to it.
    for (let y = 0; y < Math.sqrt(brushGrid.length); y++) {
        for (let x = 0; x < Math.sqrt(brushGrid.length); x++) {
            if (Number(grid[y][x]) === 1) {

                currentGrid[wrap(y1 + (y - 1), gridHeight)][wrap(x1 + (x - 1), gridWidth)]--;
                if (currentGrid[wrap(y1 + (y - 1), gridHeight)][wrap(x1 + (x - 1), gridWidth)] < 0) {
                    currentGrid[wrap(y1 + (y - 1), gridHeight)][wrap(x1 + (x - 1), gridWidth)] = 2;
                }
            }
        }
    }

    drawBoard();
    cellHighlight(e);
}

function drawHighlight(y1, x1) {
    context.strokeStyle = "#f00";
    context.strokeRect(0, y1, canvas.width, cellSize);
    context.strokeRect(x1, 0, cellSize, canvas.height);
    context.strokeRect(0, y1, canvas.width, cellSize);
    context.strokeRect(x1, 0, cellSize, canvas.height);

    context.strokeStyle = "#00f";
    context.strokeRect(x1, y1, cellSize, cellSize);
    context.strokeRect(x1, y1, cellSize, cellSize);

    //create an overlay on the board to indicate "I'm being edited!"
    context.strokeStyle = "#0f0";
    context.strokeRect(0, 0, canvas.width - 1, canvas.height - 1);
    context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    context.strokeRect(0, 0, canvas.width - 1, canvas.height - 1);
    context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
}

//highlights the board and what cell you're editing on the board.
function cellHighlight(e) {
    drawBoard();
    let bound = canvas.getBoundingClientRect();
    if ((e.clientY - bound.top < canvas.height && e.clientX - bound.left < canvas.width) && (e.clientY - bound.top > 0 && e.clientX - bound.left > 0)) {
        let x1 = flattenCoordinate((e.clientX - bound.left) / cellSize) * cellSize;
        let y1 = flattenCoordinate((e.clientY - bound.top) / cellSize) * cellSize;
        lastMousePosition = [y1, x1]
        drawHighlight(y1, x1);
    }
    else{
        lastMousePosition = null;
        drawBoard();
    }
}

function shift(into, cloneMe, xOffset, yOffset) {
    //for every entry in into, clone the value in the corresponding array in cloneMe.
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            into[y][x] = cloneMe[wrap(y + yOffset, gridHeight)][wrap(x + xOffset, gridWidth)] + "";
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

document.getElementById("exportCanvas").href = canvas.toDataURL("image/png")