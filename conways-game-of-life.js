//instantiating variables.
const alive = 2;
const ghost = 1;
const dead = 0;
const live = [2, 3];
const birth = [3];
const kernel = [[1, 1, 1,],
                      [1, 0, 1,],
                      [1, 1, 1]];
const cellSize = 5;
const livingColor = "#ffffff"; // Color of living cells
const ghostColor = "#aaaaaa"; // Color of ghost cells
const deadColor = "#000000"; // Color of dead cells

const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
let speed = 10;

const gridHeight = Math.floor(canvas.height / cellSize);
const gridWidth = Math.floor(canvas.width / cellSize);

let currentGrid = create2dArray(gridWidth, gridHeight);
let nextGrid = create2dArray(gridWidth, gridHeight);
//hohohoh, le intervale.
let interval;

context.fillStyle = deadColor; // Background color
context.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the background color

canvas.addEventListener("click", cellToggle);
canvas.addEventListener("mouseover", cellHighlight);
canvas.addEventListener("mousemove", cellHighlight);
canvas.addEventListener("mouseleave", cellHighlight);

document.getElementById("startButton").addEventListener("click", start)
document.getElementById("stopButton").addEventListener("click", stop)
document.getElementById("stopButton").disabled = true;
document.getElementById("stepButton").addEventListener("click", step)
document.getElementById("clearButton").addEventListener("click", clearBoard)

function create2dArray(length, height) {
    let arr = new Array(height);
    for (let i = 0; i < height; i++) {
        arr[i] = new Array(length).fill(0);
    }
    return arr;
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
            //a random value between 0 and 2, hopefully.
            currentGrid[i][j] = Math.floor(Math.random() * 3);
        }
    }
    //draw the board after randomizing the boards.
    drawBoard();
}

//draws board separately from the computations for the board.
function drawBoard() {
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            drawCell(x, y);
        }
    }
}

//simply resets the board, for the user.
function clearBoard() {
    //fuck clearing grids, create new ones.
    currentGrid = create2dArray(gridWidth, gridHeight);
    nextGrid = create2dArray(gridWidth, gridHeight);
    drawBoard();
}

//clone returns shallow copies of arrays in javascript, I will work around this with the following function:
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

//this function checks nearby cells for living cells.
function checkNeighbors(x, y) {
    let livingNeighbors = 0;
    let start;
    let end;
    //for odd kernels, do not weight the kernel direction.
    if (Number(kernel.length % 2) === 1) {
        start = Math.floor(kernel.length / 2);
    } else {//for even kernels, weight the kernel towards the bottom right.
        start = Math.floor(kernel.length / 2) - 1;
    }
    end = Math.floor(kernel.length / 2);

    for (let y1 = -start; y1 <= end; y1++) {
        for (let x1 = -start; x1 <= end; x1++) {
            //if the kernel has a value other than 0 and the current cell being looked at is alive
            if ((Number(kernel[y1 + start][x1 + start]) !== 0) && (Number(currentGrid[wrap(y1 + y, gridHeight)][wrap(x1 + x, gridWidth)]) === alive)) {
                livingNeighbors++;//increment living neighbors.
            }
        }
    }
    return Number(livingNeighbors);
}

function wrap(value, dimension) {
    return (Number(value+dimension)%dimension);
}

function start() {
    console.log("Game Started");
    interval = setInterval(step, 1000 / speed);
    document.getElementById("startButton").disabled = true;
    document.getElementById("stopButton").disabled = false;
}

function stop() {
    console.log("Game Stopped");
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
    let y1 = flattenCoordinate((e.clientY - bound.top)/cellSize);
    let x1 = flattenCoordinate((e.clientX - bound.left)/cellSize);
    //console.log(y1+" "+x1);
    currentGrid[y1][x1]--;
    if (currentGrid[y1][x1] < 0) {
        currentGrid[y1][x1] = 2;
    }
    drawBoard();
    cellHighlight(e);
}

//highlights the board and what cell you're editing on the board.
function cellHighlight(e) {
    drawBoard();
    let bound = canvas.getBoundingClientRect();
    if ((e.clientY - bound.top < canvas.height && e.clientX - bound.left < canvas.width) && (e.clientY - bound.top > 0 && e.clientX - bound.left > 0)) {
        let x1 = flattenCoordinate((e.clientX - bound.left)/cellSize)*cellSize;
        let y1 = flattenCoordinate((e.clientY - bound.top)/cellSize)*cellSize;

        context.strokeStyle = "#ff0000";
        context.strokeRect(0, y1, canvas.width, cellSize);
        context.strokeRect(x1, 0, cellSize, canvas.height);
        context.strokeRect(0, y1, canvas.width, cellSize);
        context.strokeRect(x1, 0, cellSize, canvas.height);

        context.strokeStyle = "#0000ff";
        context.strokeRect(x1, y1, cellSize, cellSize);
        context.strokeRect(x1, y1, cellSize, cellSize);

        //create an overlay on the board to indicate "I'm being edited!"
        context.strokeStyle = "#00ff00";
        context.strokeRect(0, 0, canvas.width - 1, canvas.height - 1);
        context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
        context.strokeRect(0, 0, canvas.width - 1, canvas.height - 1);
        context.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }
}