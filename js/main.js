'use strict'

var gBoard = []
var gLevel = { name: 'Medium' } //possible options: ['Beginner','Medium','Expert']
var gGame = { isOn: false, shownCount: 0, markedCount: 0, secsPassed: 0, lives: 3, safeClickAvb: 3}
var steppedOnMineSound = new Audio('audio/pop.wav')
var usedHintSound = new Audio('audio/breaking.wav')
var gStartTime = null
var gIsVictory = false
var gTimerIntervalId
var gIsHintOn = false
var gLastHintPos

const OFF_HINT = "<img src='img/bulb/off.png' alt='off Bulb' class='off' height='80px' width='80px'>"
const ON_HINT = "<img src='img/bulb/on.png' alt='on Bulb' height='80px' width='80px'>"
const BROKEN_HINT = "<img src='img/bulb/broken.png' alt='broken Bulb' height='80px' width='80px' style='cursor:not-allowed'>"


const FLAG = '<img src="img/flag.png" width="30" height="30">'
const MINE = '<img src="img/mine.png" width="30" height="30">'

function onChooseLvl(elCell) {
    switch (elCell.innerText) {
        case 'Beginner':
            gLevel.name = 'Beginner'
            document.querySelector(".medium").classList.remove("selectedLvlBtn")
            document.querySelector(".expert").classList.remove("selectedLvlBtn")
            elCell.classList.add("selectedLvlBtn")
            onInit()
            break
        case 'Medium':
            gLevel.name = 'Medium'
            document.querySelector(".beginner").classList.remove("selectedLvlBtn")
            document.querySelector(".expert").classList.remove("selectedLvlBtn")
            elCell.classList.add("selectedLvlBtn")
            onInit()
            break
        case 'Expert':
            gLevel.name = 'Expert'
            document.querySelector(".beginner").classList.remove("selectedLvlBtn")
            document.querySelector(".medium").classList.remove("selectedLvlBtn")
            elCell.classList.add("selectedLvlBtn")
            onInit()
    }
}
function onInit() {
    console.log("lets begin")
    if (gLevel.name === 'Medium') document.querySelector(".medium").classList.add("selectedLvlBtn")
    switch (gLevel.name) {
        case 'Beginner':
            console.log(`chose ${gLevel.name} level`)
            gLevel.size = 4
            gLevel.mines = 2
            break
        case 'Medium':
            console.log(`chose ${gLevel.name} level`)
            gLevel.size = 8
            gLevel.mines = 14
            break
        case 'Expert':
            console.log(`chose ${gLevel.name} level`)
            gLevel.size = 12
            gLevel.mines = 32
    }
    gBoard = buildBoard()
    renderBoard()
    gGame.isOn = true
    gStartTime = null
    document.querySelector(".timer").innerText = '00:00'
    clearInterval(gTimerIntervalId)
    gGame.secsPassed = 0
    //resetting safe clicks
    gGame.safeClickAvb = 3
    document.querySelector(".safeClickAvb").innerHTML = gGame.safeClickAvb
    document.querySelector(".resetBtn").innerText = '🙂'
    // start of setting the hints
    document.querySelector(".hintSpace1").innerHTML = OFF_HINT
    document.querySelector(".hintSpace1").id = "off"
    document.querySelector(".hintSpace2").innerHTML = OFF_HINT
    document.querySelector(".hintSpace2").id = "off"
    document.querySelector(".hintSpace3").innerHTML = OFF_HINT
    document.querySelector(".hintSpace3").id = "off"
    // end of setting the hints
    //start of retrieving global records
    document.querySelector(".beginnerRecord").innerHTML = localStorage.getItem("Beginner")
    document.querySelector(".mediumRecord").innerHTML = localStorage.getItem("Medium")
    document.querySelector(".expertRecord").innerHTML = localStorage.getItem("Expert")
    //end of retrieving global records
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
    document.querySelector(".minesTable").innerHTML = strHTML
}

function resetGame() {
    gGame.markedCount = 0
    gGame.shownCount = 0
    document.querySelector(".lives").innerText = '❤️❤️❤️'
    gGame.lives = 3
    gIsVictory = false
    onInit()
}

function liveLose() {
    steppedOnMineSound.play()
    gGame.lives--
    switch (gGame.lives) {
        case 2:
            document.querySelector(".lives").innerText = '☠️❤️❤️'
            break
        case 1:
            document.querySelector(".lives").innerText = '☠️☠️❤️'
            break
        case 0:
            document.querySelector(".lives").innerText = '☠️☠️☠️'
            gameOver()
    }
}

function cellClicked(elCell, i, j) {
    if (!gGame.isOn) return
    var currCell = gBoard[i][j]
    if (currCell.isMarked) return
    if (currCell.isRevealed) return
    if (gIsHintOn) { useHint(i, j); return }
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
        liveLose()
        return
    }
    if (currCell.mineNegs === 0) {
        elCell.classList.add(`empty`)
        currCell.isRevealed = true
        gGame.shownCount++
        expandShown(elCell, i, j)
    }
    else {
        console.log("this cell has " + currCell.mineNegs + " mines around it")
        renderCell(i, j, currCell.mineNegs)
        elCell.classList.add(`selectedBtn${currCell.mineNegs}`)
        currCell.isRevealed = true
        gGame.shownCount++

    }
    gIsVictory = checkGameOver() ? true : false
    if (gIsVictory) gameOver()
}

function cellMarked(elCell, i, j) {
    if (!gGame.isOn) return
    console.log(`you clicked the right click! on i: ${i}, j: ${j}. marked? ${gBoard[i][j].isMarked}`)
    if (!gBoard[i][j].isMarked) { //its unmarked. mark!
        gGame.markedCount++
        //update model
        gBoard[i][j].isMarked = true
        //update DOM
        renderCell(i, j, FLAG)
        //check for victory
        gIsVictory = checkGameOver() ? true : false
        if (gIsVictory) gameOver()

    }
    else { //its marked. unmark!
        gGame.markedCount--
        //update model
        gBoard[i][j].isMarked = false
        //update DOM
        renderCell(i, j, '')
    }
}

function checkGameOver() {
    if (gGame.markedCount === gLevel.mines && gGame.shownCount === Math.pow(gLevel.size, 2) - gLevel.mines) return true
    return false
}

function expandShown(elCell, i, j) {
    console.log("you hitted cell zero!")
    //checking each row and column 
    var isLastRow = (i === gLevel.size - 1) ? 0 : 1
    var isLastColumn = (j === gLevel.size - 1) ? 0 : 1
    for (var row = (i === 0) ? i : i - 1; row <= i + isLastRow; row++) {
        for (var column = (j === 0) ? j : j - 1; column <= j + isLastColumn; column++) {
            if (row === i && column === j) continue
            if (gBoard[row][column].isRevealed) continue
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
            // cell.isMine = ranNums.includes(count) ? true : false
            cell.isMine = false
            cell.isMarked = false
            cell.location = { i: row, j: column }
            cell.mineNegs = null
            cell.isRevealed = false
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
    // incrementing secsPassed
    gGame.secsPassed++
}

function timerStop() { }

function gameOver() {
    clearInterval(gTimerIntervalId)
    gGame.isOn = false
    document.querySelector(".resetBtn").innerText = gIsVictory ? '😍' : '🤕'
    //set local storage for best record
    if (gIsVictory) {
        console.log(`Congratz! you finished ${gLevel.name} game in ${gGame.secsPassed} seconds!`)
        var tempRecord = localStorage.getItem(`${gLevel.name}`)
        if (!tempRecord || gGame.secsPassed < tempRecord) {
            console.log(`assigning new record for level ${gLevel.name}`);
            localStorage.setItem(`${gLevel.name}`, gGame.secsPassed);
            return
        }
    }
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function renderCell(i, j, value = '') {
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
    var ranNums = shufflednums.splice(0, amount)
    if (amount===1) return ranNums[0]
    return ranNums

}

function hintClicked(elBulb) {
    if (!gStartTime) { alert("You have to start game first!"); return }
    console.log(elBulb)
    if (gIsHintOn || elBulb.id === "broken") return
    gIsHintOn = true
    elBulb.innerHTML = ON_HINT
    elBulb.id = "on"
    gLastHintPos = elBulb.classList[0]
}

function useHint(row, column) {
    document.querySelector(`.${gLastHintPos}`).innerHTML = BROKEN_HINT
    document.querySelector(`.${gLastHintPos}`).id = "broken"
    gIsHintOn = false
    usedHintSound.play()
    // executing actual hint
    var isLastRow = (row === gLevel.size - 1) ? 0 : 1
    var isLastColumn = (column === gLevel.size - 1) ? 0 : 1
    for (var i = (row === 0) ? row : row - 1; i <= row + isLastRow; i++) {
        for (var j = (column === 0) ? column : column - 1; j <= column + isLastColumn; j++) {
            var currCell = gBoard[i][j]
            if (currCell.isRevealed || currCell.isMarked) continue
            console.log(`rendering ${i}:${j} ...`)
            if (currCell.isMine) renderCell(i, j, MINE)
            else renderCell(i, j, currCell.mineNegs)
            delayHide(i, j, 1000)
        }
    }
}

function delayHide(i, j, timeout) { //solution from https://medium.com/@axionoso/watch-out-when-using-settimeout-in-for-loop-js-75a047e27a5f
    setTimeout(() => {
        document.querySelector(`.cell-${i}-${j}`).innerHTML = ''
    }, timeout);
}

function safeClick() {
    if (!gGame.safeClickAvb) return
    console.log("welcome to safe click worlds")
    //update model and DOM available safe clicks:
    gGame.safeClickAvb--
    document.querySelector(".safeClickAvb").innerHTML = gGame.safeClickAvb
    //execute the safe click
    var unRevealedCells = getUnrevealedCells()
    console.log('unRevealedCells:', unRevealedCells)
    var ranNum = getRanNums(unRevealedCells.length,1)
    console.log('ranNum:', ranNum)
    var safeClickCell = unRevealedCells[ranNum]
    console.log('safeClickCell:', safeClickCell)
    document.querySelector(`.cell-${safeClickCell.location.i}-${safeClickCell.location.j}`).classList.add('glowingBtn')
    setTimeout(() => {
        document.querySelector(`.cell-${safeClickCell.location.i}-${safeClickCell.location.j}`).classList.remove('glowingBtn')
    }, 7000);


}

function getUnrevealedCells (){
    var unRevealedCells = []
    for (var i=0;i<gLevel.size;i++){
        for (var j=0;j<gLevel.size;j++)
        var currCell = gBoard[i][j]
        if (!currCell.isRevealed) unRevealedCells.push(currCell)
    }
    return unRevealedCells
}

function undo(){
    console.log("coming soon")
}



