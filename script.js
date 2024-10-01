document.addEventListener('DOMContentLoaded', () => {
    setupThemeButtons();
    renderGame();
});

const themes = ['galaxy', 'ocean', 'forest'];
let theme = 'galaxy';
let mode = null;
let isXNext = true;
let history = [Array(9).fill(null)];
let stepNumber = 0;
let playerSymbol = null;
let aiSymbol = null;
let isGameOver = false;
let tie = false;

function setupThemeButtons() {
    document.querySelectorAll('.theme-toggle').forEach(button => {
        button.addEventListener('click', () => {
            theme = button.getAttribute('data-theme');
            document.getElementById('app').className = `app ${theme}`;
            renderGame();
        });
    });
}

function renderGame() {
    const gameContainer = document.getElementById('game-container');
    
    if (!mode) {
        gameContainer.innerHTML = `
            <div class="overlay">
                <h2>Select Game Mode</h2>
                <button onclick="handleModeSelect('PvP')">Player vs. Player</button>
                <button onclick="handleModeSelect('PvAI')">Player vs. AI</button>
            </div>
        `;
        return;
    }

    if (mode === 'PvAI' && !playerSymbol) {
        gameContainer.innerHTML = `
            <div class="overlay">
                <h2>Choose Your Symbol</h2>
                <button onclick="handleSymbolSelect('X')">X</button>
                <button onclick="handleSymbolSelect('O')">O</button>
            </div>
        `;
        return;
    }

    if (isGameOver) {
        const winner = tie ? "It's a Tie!" : `${calculateWinner(history[stepNumber])} Wins!`;
        gameContainer.innerHTML = `
            <div class="overlay winner-announcement">
                <h2>${winner}</h2>
                <button onclick="handleRestart()">Play Again</button>
                <button onclick="setMode(null)">Change Mode</button>
            </div>
        `;
        return;
    }

    // Update only the necessary parts of the game container
    if (gameContainer.querySelector('.game')) {
        document.querySelector('.board').innerHTML = renderBoard();
        document.querySelector('.status').textContent = getStatus();
    } else {
        gameContainer.innerHTML = `
            <div class="game">
                <div class="board ${theme}">${renderBoard()}</div>
                <div class="game-info">
                    <div class="status">${getStatus()}</div>
                </div>
            </div>
        `;
    }
}

function renderBoard() {
    return history[stepNumber].map((square, i) => `
        <button class="square ${theme}" onclick="handleClick(${i})">${getCharacter(square)}</button>
    `).join('');
}

function getCharacter(value) {
    return value || '';
}

function handleModeSelect(selectedMode) {
    mode = selectedMode;
    resetGame();
}

function handleSymbolSelect(symbol) {
    playerSymbol = symbol;
    aiSymbol = symbol === 'X' ? 'O' : 'X';
    isXNext = symbol === 'X';

    if (mode === 'PvAI' && !isXNext) {
        setTimeout(() => makeAIMove([...history[stepNumber]]), 500);
    } else {
        renderGame();
    }
}

function handleClick(i) {
    if (isGameOver || history[stepNumber][i] || (mode === 'PvAI' && !isXNext)) return;

    const squares = [...history[stepNumber]];
    squares[i] = isXNext ? (mode === 'PvP' ? 'X' : playerSymbol) : (mode === 'PvP' ? 'O' : aiSymbol);
    history = [...history.slice(0, stepNumber + 1), squares];
    stepNumber += 1;
    isXNext = !isXNext;

    const winner = calculateWinner(squares);
    isGameOver = !!winner || squares.every((square) => square !== null);
    tie = !winner && squares.every((square) => square !== null);

    if (mode === 'PvAI' && !isXNext) {
        setTimeout(() => makeAIMove(squares), 500);
    }

    renderGame();
}

function makeAIMove(squares) {
    if (calculateWinner(squares) || squares.every((square) => square !== null)) return;

    const bestMove = findBestMove(squares, aiSymbol);
    if (bestMove === -1) return;

    squares[bestMove] = aiSymbol;
    history = [...history.slice(0, stepNumber + 1), squares];
    stepNumber += 1;
    isXNext = true;
    isGameOver = calculateWinner(squares) || squares.every((square) => square !== null);
    tie = isGameOver && !calculateWinner(squares);

    renderGame();
}

function findBestMove(squares, currentAiSymbol) {
    let bestScore = -Infinity;
    let move = -1;

    for (let i = 0; i < squares.length; i++) {
        if (!squares[i]) {
            squares[i] = currentAiSymbol;
            let score = minimax(squares, 0, false, currentAiSymbol, currentAiSymbol === 'X' ? 'O' : 'X');
            squares[i] = null;

            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(squares, depth, isMaximizing, aiSymbol, opponentSymbol) {
    const winner = calculateWinner(squares);
    if (winner === aiSymbol) return 10 - depth;
    if (winner === opponentSymbol) return depth - 10;
    if (squares.every((square) => square !== null)) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < squares.length; i++) {
            if (!squares[i]) {
                squares[i] = aiSymbol;
                let score = minimax(squares, depth + 1, false, aiSymbol, opponentSymbol);
                squares[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < squares.length; i++) {
            if (!squares[i]) {
                squares[i] = opponentSymbol;
                let score = minimax(squares, depth + 1, true, aiSymbol, opponentSymbol);
                squares[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function handleRestart() {
    resetGame();
}

function resetGame() {
    history = [Array(9).fill(null)];
    stepNumber = 0;
    isGameOver = false;
    tie = false;
    playerSymbol = null;
    aiSymbol = null;
    isXNext = true;
    renderGame();
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];
    for (const [a, b, c] of lines) {
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
}

function getStatus() {
    if (isGameOver) {
        return tie ? "It's a Tie!" : `${calculateWinner(history[stepNumber])} Wins!`;
    }
    return isXNext ? `${playerSymbol || 'X'}'s Turn` : `${aiSymbol || 'O'}'s Turn`;
}

function setMode(newMode) {
    mode = newMode;
    resetGame();
}
