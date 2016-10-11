"use strict";




function getMouseClickLocation(event) {
    let clickX = event.clientX - canvasOffsetLeft,
        clickY = event.clientY - CANVAS_OFFSET_TOP;

    console.log('Getting mouse click');
    update(clickX, clickY);
    // dropPeace();
}

function selectingPiece(x, y) {
    for (let position of board) {
        for (let piece of position.piecesOn) {
            if (x > piece.x.start && x < piece.x.end() &&
                y > piece.y.start && y < piece.y.end() &&
                position.occupiedBy === _ACTIVE_PLAYER) {
                let selectedPiece = position.piecesOn.pop();
                selectedPiece.selected = true;
                selectedPiece.x.start = cursorX;
                selectedPiece.y.start = cursorY;
                selectedPiece.side = 60;

                return selectedPiece;
            }
        }
    }

    return false;
}
function startTurn() {
    rollDiceForPlay(_ACTIVE_PLAYER);
}
function endTurn() {
    (_ACTIVE_PLAYER === 'white')? _ACTIVE_PLAYER = 'black' : _ACTIVE_PLAYER = 'white';
    startTurn();
}

function calculatePossibleMoves(selectedPiece) { // returns list of areas for input collision. TODO: remember to clear list on 'piece.isSelected' listener, when piece is put down.
    // _dev - assignment of dices for tests.
    [die1, die2] = [2, 4];

    let selectedPiecePosition = selectedPiece.position;
    possiblePositionsToDropPiece = [selectedPiecePosition]; // List of available positions, containing the current position, in case player wants to drop the piece on the same spot.

    let opponent = (selectedPiece.color === 'white')? 'black': 'white';

    // List of available availableMoves, according to dice and selectedPiece position. '+' for white player, '-' for black player.
    let moves = [
        (_ACTIVE_PLAYER === 'white')? Math.min(selectedPiecePosition + die1, 23) : Math.max(0, selectedPiecePosition - die1),
        (_ACTIVE_PLAYER === 'white')? Math.min(selectedPiecePosition + die2, 23) : Math.max(0, selectedPiecePosition - die2),
        (_ACTIVE_PLAYER === 'white')? Math.min(selectedPiecePosition + die1 + die2, 23) : Math.max(0, selectedPiecePosition - die1 - die2)
    ];

    // Array of booleans, checking if the target position is free, occupied by same team pieces, occupied by 1 opponent team piece or occupied by more opponent pieces.
    let possibleMoves = [
        board[moves[0]].occupiedBy === 'none' ||
        board[moves[0]].occupiedBy === selectedPiece.color ||
        board[moves[0]].occupiedBy === opponent && board[moves[0]].piecesOn.length === 1,

        board[moves[1]].occupiedBy === 'none' ||
        board[moves[1]].occupiedBy === selectedPiece.color ||
        board[moves[1]].occupiedBy === opponent && board[moves[1]].piecesOn.length === 1,
    ];
    possibleMoves.push(
        (possibleMoves[0] || possibleMoves[1]) &&
        (board[moves[2]].occupiedBy === 'none' ||
        board[moves[2]].occupiedBy === selectedPiece.color ||
        board[moves[2]].occupiedBy === opponent && board[moves[2]].piecesOn.length === 1)
    );

    // Adding [0-3] possible positions to the list.
    for (let i = 0; i < 3; i++) {
        if (possibleMoves[i]) {
            possiblePositionsToDropPiece.push(moves[i]);
        }
    }
}

function setupGame() {

    initPiece('white', 0);
    initPiece('white', 0);

    initPiece('white', 11);
    initPiece('white', 11);
    initPiece('white', 11);
    initPiece('white', 11);
    initPiece('white', 11);

    initPiece('white', 16);
    initPiece('white', 16);
    initPiece('white', 16);

    initPiece('white', 18);
    initPiece('white', 18);
    initPiece('white', 18);
    initPiece('white', 18);
    initPiece('white', 18);

    initPiece('black', 23);
    initPiece('black', 23);

    initPiece('black', 12);
    initPiece('black', 12);
    initPiece('black', 12);
    initPiece('black', 12);
    initPiece('black', 12);

    initPiece('black', 7);
    initPiece('black', 7);
    initPiece('black', 7);

    initPiece('black', 5);
    initPiece('black', 5);
    initPiece('black', 5);
    initPiece('black', 5);
    initPiece('black', 5);

    renderStaticPieces();
}

function initPiece(color, position) {
    let piece = pieceBuilder(color, position);
    board[position].piecesOn.push(piece);
    if (board[position].occupiedBy === 'none') board[position].occupiedBy = piece.color;
}

function pieceBuilder(color, position) {
    let PIECE_SIDE = 45;
    let PIECE_SELECTED_SIDE = 60;
    let OFFSET_LEFT = (POSITION_WIDTH - PIECE_SIDE) / 2;
    pieceCounter++;

    let xStart = board[position].x.start + OFFSET_LEFT,
        xEnd = function() {
            return this.start + PIECE_SIDE;
        };
    let yStart = (function () { // Positions up to 5 pieces on the position. TODO: implement indication in case of more then 5 pieces.
            let piecesOnPosition = board[position].piecesOn.length;
            if (piecesOnPosition >= 5) {
                return - 800;
            } else {
                if (position < 12) {
                    return board[0].y.start + piecesOnPosition * PIECE_SIDE;
                } else {
                    return board[12].y.start - piecesOnPosition * PIECE_SIDE;
                }
            }
        })(),
        yEnd = function() {
            return this.start + PIECE_SIDE;
        };

    let piece = {
        id: color + pieceCounter,
        color: color,
        x: {start: xStart, end: xEnd},
        y: {start: yStart, end: yEnd},
        position: position,
        side: PIECE_SIDE,
        selectedSide: PIECE_SELECTED_SIDE,
        img: document.getElementById(color + '-piece'),
        inPlay: true,
        active: false,
        selected: false,
        score: false
    };

    return piece;
}

function initCanvas() {
    console.log('Initiating canvas.');

    canvas = document.getElementById('myCanvas');
    ctx = canvas.getContext('2d');
}

function renderBoard() {
    ctx.drawImage(boardPicture, 0, 0);
}

function renderStaticPieces() {
    for (let position of board) {
        for (let piece of position.piecesOn) {
            let image = piece.img,
                x = piece.x.start,
                y = piece.y.start,
                side = piece.side;

            ctx.drawImage(image, x, y, side, side);
        }
    }
}

function renderSelectedPiece() {
    let image = selectedPiece.img,
        pieceOffset = selectedPiece.side / 2,
        x = cursorX - pieceOffset,
        y = cursorY - pieceOffset,
        side = selectedPiece.side;

    ctx.drawImage(image, x, y, side, side);
}

//******************************************************************************
// Raly - Rolling dice
//******************************************************************************
function rollDiceForTurn() {
    let[whiteDice, whiteDiceImage] = [0, ''];
    let[blackDice, blackDiceImage] = [0, ''];

    while (whiteDice == blackDice){
        [whiteDice, whiteDiceImage] = roll('white');
        [blackDice, blackDiceImage] = roll('black');
    }
    // window.addEventListener('click', function (event) {
    //     console.log(event.clientX);
    //     console.log(event.clientY);
    // });

    console.log('_DEV_FIRST_PLAYER whiteDice: ' + whiteDice + '; blackDice: ' + blackDice);
    (whiteDice > blackDice)? _ACTIVE_PLAYER = 'white' : _ACTIVE_PLAYER = 'black';
    startTurn();
    drawDice(whiteDiceImage, blackDiceImage, [185, 275], [555, 275]);
}

function rollDiceForPlay(color) {
    spentMoves = 0;
    let[die1, dieImage1] = roll(color);
    let[die2, dieImage2] = roll(color);

    console.log('_DEV_PLAYER_MOVES whiteDice:' + die1 + '; blackDice: ' + die2);
    (die1 === die2)? availableMoves = 4 : availableMoves = 2;

    drawDice(dieImage1, dieImage2, [5, 60], [5, 120]);
    // return [die1, die2];
}

function roll(color) {
    let dice = Math.floor((Math.random() * 6) + 1);

    let diceImage = new Image();
    diceImage.src = 'resources/' + color;

    switch (dice) {
        case 1:
            diceImage.src += 'Dice1.png';
            break;
        case 2:
            diceImage.src += 'Dice2.png';
            break;
        case 3:
            diceImage.src += 'Dice3.png';
            break;
        case 4:
            diceImage.src += 'Dice4.png';
            break;
        case 5:
            diceImage.src += 'Dice5.png';
            break;
        case 6:
            diceImage.src += 'Dice6.png';
            break;
    }
    return [dice, diceImage];
}

function drawDice(dieImage1, dieImage2, diePosition1, diePosition2) {
    ctx.drawImage(dieImage1, diePosition1[0], diePosition1[1], 70, 70);
    ctx.drawImage(dieImage2, diePosition2[0], diePosition2[1], 70, 70);
}



