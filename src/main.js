const CELL_FLAG_MARK = 'CELL_FLAG_MARK';
const CELL_QUESTION_MARK = 'CELL_QUESTION_MARK';

class Cell {
    constructor(x, y, game) {
        this.x = x;
        this.y = y;
        this.game = game;

        this.isOpened = false;
        this.neighborMineCount = 0;
        this.hasMine = false;
        this.mark = null;

        this.element = document.createElement('td');
        this.element.classList.add('cell');
        this.element.dataset.x = x;
        this.element.dataset.y = y;
    }

    addMark(mark) {
        this.mark = mark;
        switch (mark) {
        case CELL_FLAG_MARK:
            this.game.setMinesLeft(this.game.minesLeft - 1);
            this.element.textContent = '🚩';
            break;
        case CELL_QUESTION_MARK:
            this.game.setMinesLeft(this.game.minesLeft + 1);
            this.element.textContent = '?';
            break;
        }
    }

    hasMark() {
        return this.mark !== null;
    }

    removeMark() {
        if (this.mark === CELL_FLAG_MARK) {
            this.game.setMinesLeft(this.game.minesLeft + 1);
        }

        this.mark = null;
        this.element.textContent = '';
    }

    reveal() {
        if (this.hasMine) {
            if (this.mark !== CELL_FLAG_MARK) {
                this.game.setMinesLeft(this.game.minesLeft - 1);
            }
        } else {
            this.removeMark();
        }

        this.isOpened = true;

        if (this.hasMine) {
            this.element.textContent = '💣';
        } else if (this.neighborMineCount > 0) {
            this.element.textContent = this.neighborMineCount;
        } else {
            this.element.textContent = '';
        }

        this.element.classList.add('opened');
    }

    reset() {
        this.element.classList.remove('opened');
        this.element.classList.remove(`neighbor-mines-${this.neighborMineCount}`);
        this.element.textContent = '';
        this.isOpened = false;
        this.hasMine = false;
        this.mark = null;
        this.neighborMineCount = 0;
    }
}

const MOUSE_BUTTON_LEFT = 'MOUSE_BUTTON_LEFT';
const MOUSE_BUTTON_BOTH = 'MOUSE_BUTTON_BOTH';
const MOUSE_BUTTON_RIGHT = 'MOUSE_BUTTON_RIGHT';

const CELL_NEIGHBORS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

class GameField {
    constructor(width, height, game) {
        this.width = width;
        this.height = height;

        this.element = document.createElement('table');
        this.element.classList.add('game-field');

        this.revealedCellCount = 0;
        this.cells = [];
        for (let y = 0; y < this.height; y += 1) {
            const rowElement = document.createElement('tr');
            this.element.appendChild(rowElement);

            for (let x = 0; x < this.width; x += 1) {
                const cell = new Cell(x, y, game);
                this.cells.push(cell);
                rowElement.appendChild(cell.element);
            }
        }

        this.onCellClick = () => {};

        const activeCells = [];

        let leftMouseButtonDown = false;
        let rightMouseButtonDown = false;
        this.element.addEventListener('mousedown', (event) => {
            if (event.which === 1) {
                leftMouseButtonDown = true;
            } else if (event.which === 3) {
                rightMouseButtonDown = true;
            }

            if (event.target.classList.contains('cell')) {
                const x = Number.parseInt(event.target.dataset.x);
                const y = Number.parseInt(event.target.dataset.y);
                const cell = this.getCell(x, y);

                if (leftMouseButtonDown && rightMouseButtonDown) {
                    for (const neighborCell of this.getNeighbors(cell)) {
                        if (!neighborCell.isOpened && neighborCell.mark == null) {
                            neighborCell.element.classList.add('active');
                            activeCells.push(neighborCell);
                        }
                    }
                }
            }
        });
        this.element.addEventListener('mouseup', (event) => {
            if (event.which !== 1 && event.which !== 3) {
                return;
            }

            let mouseButton = null;
            if (leftMouseButtonDown && rightMouseButtonDown) {
                mouseButton = MOUSE_BUTTON_BOTH;
            } else if (leftMouseButtonDown) {
                mouseButton = MOUSE_BUTTON_LEFT;
            } else if (rightMouseButtonDown) {
                mouseButton = MOUSE_BUTTON_RIGHT;
            }

            while (activeCells.length > 0) {
                const cell = activeCells.pop();
                cell.element.classList.remove('active');
            }

            if (mouseButton !== null) {
                if (event.target.classList.contains('cell')) {
                    const x = Number.parseInt(event.target.dataset.x);
                    const y = Number.parseInt(event.target.dataset.y);
                    const cell = this.getCell(x, y);
                    this.onCellClick(cell, mouseButton);
                }
            }

            leftMouseButtonDown = false;
            rightMouseButtonDown = false;
        });

        this.element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    getCell(x, y) {
        return this.cells[y * this.width + x];
    }

    *getNeighbors(cell) {
        for (const [dx, dy] of CELL_NEIGHBORS) {
            if (
                cell.x + dx < 0 || cell.x + dx >= this.width ||
                cell.y + dy < 0 || cell.y + dy >= this.height
            ) {
                continue;
            }

            yield this.getCell(cell.x + dx, cell.y + dy);
        }
    }

    fillWithMines(mineCount) {
        if (this.width * this.height < mineCount) {
            throw new Error('Too many mines.');
        }

        const mineCandidates = [];
        const mineIndices = [];
        for (let i = 0; i < this.width * this.height; i += 1) {
            mineCandidates.push(i);
        }
        for (let i = 0; i < mineCount; i += 1) {
            let candidateIndex = Math.floor(Math.random() * mineCandidates.length);
            mineIndices.push(mineCandidates[candidateIndex]);

            mineCandidates[candidateIndex] = mineCandidates[mineCandidates.length - 1];
            mineCandidates.pop();
        }

        for (const mineIndex of mineIndices) {
            this.cells[mineIndex].hasMine = true;
        }

        for (const cell of this.cells) {
            let neighborMineCount = 0;
            for (const neighborCell of this.getNeighbors(cell)) {
                if (neighborCell.hasMine) {
                    neighborMineCount += 1;
                }
            }
            cell.neighborMineCount = neighborMineCount;
            if (neighborMineCount !== 0) {
                cell.element.classList.add(`neighbor-mines-${neighborMineCount}`);
            }
        }
    }

    reveal(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error('Cell coordinates out of bounds.');
        }

        const revealedCell = this.getCell(x, y);
        if (revealedCell.isOpened) {
            return;
        }

        if (revealedCell.hasMine || revealedCell.neighborMineCount > 0) {
            revealedCell.reveal();
            this.revealedCellCount += 1;
        } else {
            for (const cell of this.cells) {
                cell.visited = false;
            }

            const cellsToVisit = [revealedCell];
            while (cellsToVisit.length > 0) {
                const nextCell = cellsToVisit.shift();
                if (nextCell.visited) {
                    continue;
                }

                nextCell.visited = true;
                nextCell.reveal();
                this.revealedCellCount += 1;

                if (nextCell.neighborMineCount === 0) {
                    for (const [dx, dy] of CELL_NEIGHBORS) {
                        if (
                            nextCell.x + dx < 0 || nextCell.x + dx >= this.width ||
                            nextCell.y + dy < 0 || nextCell.y + dy >= this.height
                        ) {
                            continue;
                        }

                        const neighbor = this.getCell(nextCell.x + dx, nextCell.y + dy);
                        if (!neighbor.visited && !neighbor.isOpened) {
                            cellsToVisit.push(neighbor);
                        }
                    }
                }
            }
        }
    }

    revealAll() {
        for (const cell of this.cells) {
            cell.reveal();
        }
        this.revealedCellCount = this.width * this.height;
    }

    reset() {
        for (const cell of this.cells) {
            cell.reset();
        }
        this.revealedCellCount = 0;
    }
}

function renderTime(millis) {
}

class Timer {
    constructor(element) {
        this.element = element;
        this.stopped = Promise.resolve();
    }

    start() {
        this.startTime = null;
        this.lastFrameTime = null;
        this.currentTime = null;
        this.shouldStop = false;

        this.stopped = new Promise((resolve) => {
            const callback = (currentTime) => {
                if (this.startTime === null) {
                    this.startTime = currentTime;
                    this.lastFrameTime = currentTime;
                }
                this.currentTime = currentTime;

                const secondsElapsed = Math.floor((this.currentTime - this.startTime) / 1000);
                const millisElapsed = new String(Math.floor(this.currentTime - this.startTime) % 1000).padStart(3, '0');

                if (currentTime - this.lastFrameTime > 1000 / 60) {
                    this.element.textContent = `${secondsElapsed}:${millisElapsed}`;
                    this.lastFrameTime = currentTime;
                }

                if (!this.shouldStop) {
                    requestAnimationFrame(callback);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(callback);
        })
    }

    stop() {
        this.shouldStop = true;
    }

    reset() {
        this.stop();
        this.stopped.then(() => {
            this.startTime = null;
            this.lastFrameTime = null;
            this.currentTime = null;
            this.element.textContent = '0:000';
        })
    }
}

const GAME_STATE_START = 'GAME_STATE_START';
const GAME_STATE_IN_PROGRESS = 'GAME_STATE_IN_PROGRESS'
const GAME_STATE_WIN = 'GAME_STATE_WIN'
const GAME_STATE_LOSE = 'GAME_STATE_LOSE';

class Game {
    constructor() {
        this.state = GAME_STATE_START;
        this.width = 10;
        this.height = 10;
        this.mineCount = 10;

        this.minesLeftElement = document.getElementById('mines-left');
        this.setMinesLeft(this.mineCount);

        const timerElement = document.getElementById('game-timer');
        this.timer = new Timer(timerElement);

        this.gameField = new GameField(this.width, this.height, this);
        this.gameField.fillWithMines(this.mineCount);

        const gameFieldRootElement = document.getElementById('game-field-container');
        gameFieldRootElement.appendChild(this.gameField.element);

        this.gameField.onCellClick = (cell, mouseButton) => {
            switch (mouseButton) {
            case MOUSE_BUTTON_LEFT:
                this.handleLeftClick(cell);
                break;
            case MOUSE_BUTTON_RIGHT:
                this.handleRightClick(cell);
                break;
            case MOUSE_BUTTON_BOTH:
                this.handleBothClick(cell);
                break;
            }
        };
    }

    setMinesLeft(minesLeft) {
        this.minesLeft = minesLeft;
        this.minesLeftElement.textContent = minesLeft;
    }

    reveal(cell) {
        if (this.state === GAME_STATE_START) {
            this.timer.start();
            this.state = GAME_STATE_IN_PROGRESS;
        }

        if (!cell.hasMine) {
            this.gameField.reveal(cell.x, cell.y);

            const totalCellCount = this.gameField.width * this.gameField.height;
            if (this.gameField.revealedCellCount + this.mineCount === totalCellCount) {
                this.state = GAME_STATE_WIN;
                this.timer.stop();
                this.gameField.revealAll();
            }
        } else {
            this.state = GAME_STATE_LOSE;
            this.timer.stop();
            this.gameField.revealAll();
            for (const cell of this.gameField.cells) {
                if (cell.hasMine) {
                    cell.element.textContent = '💥';
                }
            }
        }
    }

    handleLeftClick(cell) {
        if (cell.hasMark()) {
            return;
        }
        this.reveal(cell);
    }

    handleRightClick(cell) {
        if (!cell.isOpened) {
            if (!cell.hasMark()) {
                cell.addMark(CELL_FLAG_MARK);
            } else if (cell.mark === CELL_FLAG_MARK) {
                cell.addMark(CELL_QUESTION_MARK);
            } else {
                cell.removeMark();
            }
        }
    }

    handleBothClick(cell) {
        if (!cell.isOpened) {
            this.handleLeftClick(cell);
        } else {
            let flaggedNeighbors = 0;
            for (const neighborCell of this.gameField.getNeighbors(cell)) {
                if (neighborCell.mark === CELL_FLAG_MARK) {
                    flaggedNeighbors += 1;
                }
            }

            if (flaggedNeighbors === cell.neighborMineCount) {
                for (const neighborCell of this.gameField.getNeighbors(cell)) {
                    if (!neighborCell.isOpened && neighborCell.mark !== CELL_FLAG_MARK) {
                        this.reveal(neighborCell);
                    }
                }
            }
        }
    }

    reset() {
        this.gameField.reset();
        this.gameField.fillWithMines(this.mineCount);

        this.timer.reset();

        this.state = GAME_STATE_START;
        this.setMinesLeft(this.mineCount);
    }
}

const game = new Game();

const buttonElement = document.getElementById('reset-button');
buttonElement.addEventListener('click', () => { game.reset(); })
