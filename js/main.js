'use strict'

var gBoard = []
var gLevel = { name: 'Medium',size: 6, mines: 8 }
var gGame = { isOn: false, shownCont: 0, markedCount: 0, secsPassed: 0 }
var audio = new Audio('audio/pop.wav')
var gStartTime = null
var gTimerIntervalId


const FLAG = '<img src="img/flag.png" width="30" height="30">'
const MINE = '<img src="img/mine.png" width="30" height="30">'

function onChooseLvl(elCell) {
    switch (elCell.innerText) {
        case 'Beginner':
            gLevel.name = 'Beginner'
            console.log(`chose ${gLevel.name} level`)
            document.querySelector(".medium").classList.remove("selectedLvlBtn")
            document.querySelector(".expert").classList.remove("selectedLvlBtn")
            elCell.classList.add("selectedLvlBtn")
            break
        case 'Medium':
            gLevel.name = 'Medium'
            console.log(`chose ${gLevel.name} level`)
            document.querySelector(".beginner").classList.remove("selectedLvlBtn")
            document.querySelector(".expert").classList.remove("selectedLvlBtn")
            elCell.classList.add("selectedLvlBtn")
            break
        case 'Expert':
            gLevel.name = 'Expert'
            console.log(`chose ${gLevel.name} level`)
            document.querySelector(".beginner").classList.remove("selectedLvlBtn")
            document.querySelector(".medium").classList.remove("selectedLvlBtn")
            elCell.classList.add("selectedLvlBtn")
    }
}
function onInit() {
    console.log("lets begin")
    gBoard = buildBoard()
    renderBoard()
    gGame.isOn = true
    gStartTime = null
    document.querySelector(".timer").innerText = '00:00'
    clearInterval(gTimerIntervalId)
    document.querySelector(".resetBtn").innerText = '🙂'
}

function resetGame() {
    onInit()
}

function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return
    var currCell = gBoard[i][j]
    if (currCell.isMarked) return
    if (currCell.revealedEmpty) return
    if (!gStartTime) { //checks if this is the first click
        gStartTime = Date.now()
        timeStart()
        installMines(i, j)
        setMinesNegsCount()
    }
    console.log(`you clicked on i:${i},j:${j}`)
    if (currCell.isMine) {
        renderCell(i, j, MINE)
        elCell.classList.add("lost")
        audio.play()
        gameOver()
        return
    }
    if (currCell.mineNegs === 0) {
        elCell.classList.add(`empty`)
        currCell.revealedEmpty = true
        expandShown(elCell, i, j)
    }
    else {
        console.log("this cell has " + currCell.mineNegs + " mines around it")
        renderCell(i, j, currCell.mineNegs)
        elCell.classList.add(`selectedBtn${currCell.mineNegs}`)
        currCell.revealedEmpty = true

    }
}

function cellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    console.log(`you clicked the right click! on i: ${i}, j: ${j}. marked? ${gBoard[i][j].isMarked}`)
    if (!gBoard[i][j].isMarked) { //its unmarked. mark!
        //update model
        gBoard[i][j].isMarked = true
        //update DOM
        renderCell(i, j, FLAG)
    }
    else { //its marked. unmark!
        //update model
        gBoard[i][j].isMarked = false
        //update DOM
        renderCell(i, j, '')
    }
}

function checkGameOver() { }

function expandShown(elCell, i, j) {
    console.log("you hitted cell zero!")
    //checking each row and column 
    var isLastRow = (i === gLevel.size - 1) ? 0 : 1
    var isLastColumn = (j === gLevel.size - 1) ? 0 : 1
    for (var row = (i === 0) ? i : i - 1; row <= i + isLastRow; row++) {
        for (var column = (j === 0) ? j : j - 1; column <= j + isLastColumn; column++) {
            if (row === i && column === j) continue
            if (gBoard[row][column].revealedEmpty) continue
            var elCheckedCell = document.querySelector(`.cell-${row}-${column}`)
            cellClicked(elCheckedCell, row, column)
        }
    }
    console.log("marked all zeros ")
}

function buildBoard() {
    console.log("Building board")
    // var count = 0
    var board = []
    // var ranNums = getRanNums(Math.pow(gLevel.size, 2), gLevel.mines)
    for (var row = 0; row < gLevel.size; row++) {
        var boardRow = []
        for (var column = 0; column < gLevel.size; column++) {
            var cell = {}
            cell.isShown = false
            // cell.isMine = ranNums.includes(count) ? true : false
            cell.isMine = false
            cell.isMarked = false
            cell.location = { i: row, j: column }
            cell.mineNegs = null
            cell.revealedEmpty = false
            boardRow.push(cell)
            // count++
        }
        board.push(boardRow)
    }
    return board
}

function installMines(excludeI, excludeJ) {
    var count = 0
    var ranNums = getRanNums(Math.pow(gLevel.size, 2), gLevel.mines)
    for (var row = 0; row < gLevel.size; row++) {
        for (var column = 0; column < gLevel.size; column++) {
            if (row === excludeI && column === excludeJ) continue
            if (ranNums.includes(count)) gBoard[row][column].isMine = true
            count++
        }
    }
}

function renderBoard() {
    var strHTML = ''
    for (var row = 0; row < gLevel.size; row++) {
        strHTML += "<tr>\n"
        for (var column = 0; column < gLevel.size; column++) {
            strHTML += `<td><button class="gameBtn cell-${row}-${column}" onclick="cellClicked(this,${row},${column})" oncontextmenu="cellMarked(this,${row},${column}); return false"></button></td>\n`
        }
        strHTML += "</tr>"
    }
    document.querySelector("table").innerHTML = strHTML
}

function setMinesNegsCount() {
    console.log("setting the mines count around cells")
    for (var row = 0; row < gLevel.size; row++) {
        for (var column = 0; column < gLevel.size; column++) {
            //checking each row and column 
            var count = 0
            var isLastRow = (row === gLevel.size - 1) ? 0 : 1
            var isLastColumn = (column === gLevel.size - 1) ? 0 : 1
            for (var i = (row === 0) ? row : row - 1; i <= row + isLastRow; i++) {
                for (var j = (column === 0) ? column : column - 1; j <= column + isLastColumn; j++) {
                    if (i === row && j === column) continue
                    if (gBoard[i][j].isMine) count++
                }
            }
            gBoard[row][column].mineNegs = count

        }
    }
    return count
}

function timeStart() {
    gTimerIntervalId = setInterval(timerProcess, 1000);
}

function timerProcess() {
    var timeNow = Date.now()
    var totalSeconds = parseInt((timeNow - gStartTime) / 1000)
    var minutes = (parseInt(totalSeconds / 60)) > 9 ? parseInt(totalSeconds / 60) : `0${parseInt(totalSeconds / 60)}`
    var seconds = (totalSeconds % 60) > 9 ? parseInt(totalSeconds % 60) : `0${parseInt(totalSeconds % 60)}`
    var timeShow = `${minutes}:${seconds}`
    //render to DOM
    document.querySelector(".timer").innerText = timeShow
}

function timerStop() { }

function gameOver(isVictory = false) {
    clearInterval(gTimerIntervalId)
    gGame.isOn = false
    document.querySelector(".resetBtn").innerText = '🤕'

}

function onVictory() { }

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function renderCell(i, j, value) {
    const elCell = document.querySelector(`.cell-${i}-${j}`)
    elCell.innerHTML = value
}

function getRanNums(max, amount) {
    console.log("installing mines")
    var nums = []
    for (var i = 0; i < max; i++) {
        nums.push(i)
    }
    var shufflednums = nums.sort(() => (Math.random() > 0.5) ? 1 : -1)
    return shufflednums.splice(0, amount)

}

