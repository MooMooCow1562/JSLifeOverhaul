//Will replace the commenting with more robust descriptions later, like, block comments.

//hardcoding cell values
const alive = 2;
const ghost = 1;
const dead = 0;

//hardcoding rules, I just need this to be conway's game of life, I can implement customizable rules another time.
const live = [2, 3];
const birth = [3];
//conway's kernel, might allow people to implement custom kernels after this honors project is finished.
const kernel = [[1, 1, 1], [1, 0, 1], [1, 1, 1]];

//hardcoding the color values for now.
var livingColor = "#ffffff"; // Color of living cells
var ghostColor = "#aaaaaa"; // Color of ghost cells
var deadColor = "#000000"; // Color of dead cells

//before coding this version, I did not realize there were canvas like functions in UI systems, so I was using the equivelant of an
//ass load of div elements, like, too many.
//canvas-elements will be much better for this in future iterations.
//get the canvas, create a context.
var canvas = document.getElementById("gameCanvas");
var context = canvas.getContext("2d");

//may may cell size adjustable later, will need to be changed via a form input so we have to reload the entire application to change it.
//cell size is in pixels
var cellSize = 10;

//fill the canvas with black, to represent the initial dead state of the game
context.fillStyle = deadColor; // Background color
context.fillRect(0, 0, canvas.width, canvas.height); // Fill the canvas with the background color

//our grids, Conway's game of life needs at least 2 grids and I beleive the names explan them.
var currentGrid = create2dArray(canvas.width / cellSize, canvas.height / cellSize);
var nextGrid = create2dArray(canvas.width / cellSize, canvas.height / cellSize);

//hardcoding speed for the moment.
var speed = 10;

//Need a 2D array, Javascript unfortunately does not have an easy way to make these so I'll just make a function to do it :D
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
    normX = flattenCoordinate(x);
    normY = flattenCoordinate(y);
    if (currentGrid[normX / 10][normY / 10] == alive) {
        context.fillStyle = livingColor;
    } else if (currentGrid[normX / 10][normY / 10] == ghost) {
        context.fillStyle = ghostColor;
    } else {
        context.fillStyle = deadColor;
    }
    context.fillRect(normY, normX, normY + cellSize, normX + cellSize);
}

//Takes a coordinate and rounds it to the 10ths place.
function flattenCoordinate(v) {
    return (Math.floor(v / cellSize)) * cellSize;
}

function randomizeBoard() {
    for (let i = 0; i < (canvas.height / cellSize); i++) {
        for (let j = 0; j < (canvas.width / cellSize); j++) {
            var newVal = Math.floor(Math.random() * 3);//a random value between 0 and 2, hopefully.
            currentGrid[i][j] = newVal;
        }
    }
    //draw the board after randomizing the boards.
    drawBoard();
}

//draws board separately from the computations for the board.
function drawBoard() {
    for (let i = 0; i < (canvas.height / cellSize); i++) {
        for (let j = 0; j < (canvas.width / cellSize); j++) {
            drawCell(i * 10, j * 10);
        }
    }
}

//simply resets the board, for the user.
function clearBoard() {
    currentGrid = create2dArray(canvas.width / cellSize, canvas.height / cellSize);
    nextGrid = create2dArray(canvas.width / cellSize, canvas.height / cellSize);
    drawBoard();
}

//clone returns shallow copies of arrays in javascript, I will work around this with the following function:
function cloneInto(into, cloneMe) {
    //for every entry in into, clone the value in the corresponding array in cloneMe.
    for (let i = 0; i < (canvas.height / cellSize); i++) {
        for (let j = 0; j < (canvas.width / cellSize); j++) {
            into[i][j] = cloneMe[i][j] + "";
        }
    }
}

function step() {
    for (let i = 0; i < (canvas.height / cellSize); i++) {
        for (let j = 0; j < (canvas.width / cellSize); j++) {
            var shouldLive = false;
            var shouldBirth = false;
            //if the current cell is alive
            if (currentGrid[i][j] == alive) {
                //check to see if it should live into the next generation by cross referencing each of the rules for live.
                var check = checkNeighbors(i, j);
                live.forEach(element => {
                    if (check == element) {
                        shouldLive = true;
                    }
                });
                //if current cell is dead or a ghost
            } else if (currentGrid[i][j] != alive) {
                //check to see if it should be born into the next generation by cross referencing each of the rules for birth.
                var check = checkNeighbors(i, j);
                birth.forEach(element => {
                    if (check == element) {
                        shouldBirth = true;
                    }
                });
            }
            //if neither of the if conditions are met, then don't process the rules for them.

            //if either should live or should birth are existent and true
            if (shouldLive || shouldBirth) {
                //next generation's grid cell comes to life.
                nextGrid[i][j] = alive;
            } else if (currentGrid[i][j] > dead) {
                //otherwise if I'm alive or a ghost, become a ghost, or dead repsectively.
                nextGrid[i][j] = currentGrid[i][j] - 1;
            } else {
                //otherwise, the dead stay dead.
                nextGrid[i][j] = dead;
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
    var livingNeighbors = 0;
    var start;
    var end;
    //for odd kernels, do not weight the kernel direction.
    if (kernel.length % 2 == 1) {
        start = Math.floor(kernel.length / 2);
    } else {//for even kernels, weight the kernel towards the bottom right.
        //yes this is my answer for odd kernels and because I'm hardcoding this for the honors project, it will never be used. It's future proofing.
        start = Math.floor(kernel.length / 2) - 1;
    }
    end = Math.floor(kernel.length / 2);

    for (let i = -start; i <= end; i++) {
        for (let j = -start; j <= end; j++) {
            //if the kernel has a value other then 0 and the current cell being looked at is alive
            if ((kernel[i + start][j + start] != 0) && (currentGrid[wrap(x + j, canvas.height / cellSize)][wrap(y + i, canvas.width / cellSize)] == alive)) {
                livingNeighbors++;//increment living neighbors.
            }
        }
    }
    return livingNeighbors;
}

function wrap(value, dimension) {
    //if the value is too small,
    if (value < 0) {//wrap to the right.
        return value + dimension;
    }
    //if value is too big
    if (value >= dimension) {//wrap to the left.
        return value - dimension;
    }
    //otherwise, return the value.
    return value;
}

//the interval.
var interval;
//starts the game
function start() {
    console.log("Game Started");
    interval = setInterval(step, 1000 / speed);
    document.getElementById("startButton").disabled = true;
    document.getElementById("stopButton").disabled = false;
}
//ends it
function stop() {
    console.log("Game Stopped");
    clearInterval(interval);
    document.getElementById("startButton").disabled = false;
    document.getElementById("stopButton").disabled = true;
}
function changeSpeed(value) {
    speed = value;
}

canvas.addEventListener("click", cellToggle);
canvas.addEventListener("mousemove", cellHighlight);
canvas.addEventListener("mouseleave", cellHighlight);

//allows you to actually toggle cells.
function cellToggle(e) {
    var bound = canvas.getBoundingClientRect();
    var c1 = flattenCoordinate(e.clientY - bound.top) / 10;
    var c2 = flattenCoordinate(e.clientX - bound.left) / 10;
    //console.log(c1+" "+c2);
    currentGrid[c1][c2]--;
    if (currentGrid[c1][c2] < 0) {
        currentGrid[c1][c2] = 2;
    }
    drawBoard();
    cellHighlight(e);
}

//allows you to actually highlight cells.
function cellHighlight(e) {
    //clears prior movments instead of letting them sit in place.
    drawBoard();
    var bound = canvas.getBoundingClientRect();
    if ((e.clientY - bound.top < canvas.height && e.clientX - bound.left < canvas.width) && (e.clientY - bound.top > 0 && e.clientX - bound.left > 0)) {
        var c1 = flattenCoordinate(e.clientX - bound.left);
        var c2 = flattenCoordinate(e.clientY - bound.top);
        //also gonna make an overlay to show what column and row you're on.
        context.strokeStyle = "#ff0000";
        context.strokeRect(0, c2, canvas.width, cellSize);
        context.strokeRect(c1, 0, cellSize, canvas.height);

        //draws the initial highlight, twice, because once isn't enough.
        context.strokeStyle = "#0000ff";
        context.strokeRect(c1, c2, cellSize, cellSize);
        context.strokeRect(c1, c2, cellSize, cellSize);

        //create an overlay on the board to indicate "I'm being edited!"
        context.strokeStyle = "#00ff00";
        context.strokeRect(0,0, canvas.width-1, canvas.height-1);
        context.strokeRect(1,1, canvas.width-2, canvas.height-2);
    }
}