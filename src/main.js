const CELL_FLAG_MARK = 'CELL_FLAG_MARK';
const CELL_QUESTION_MARK = 'CELL_QUESTION_MARK';

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;

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
            this.element.textContent = '🚩';
            break;
        case CELL_QUESTION_MARK:
            this.element.textContent = '?';
            break;
        }
    }

    hasMark() {
        return this.mark !== null;
    }

    removeMark() {
        this.mark = null;
        this.element.textContent = '';
    }

    reveal() {
        if (this.hasMark()) {
            this.removeMark();
        }

        this.isOpened = true;

        if (this.hasMine) {
            this.element.textContent = '💣';
        } else if (this.neighborMineCount > 0) {
            this.element.textContent = this.neighborMineCount;
        }

        this.element.classList.add('opened');
    }

    reset() {
        this.element.classList.remove('opened');
        this.element.textContent = '';
        this.isOpened = false;
        this.hasMine = false;
        this.mark = null;
    }
}

const MOUSE_BUTTON_LEFT = 'MOUSE_BUTTON_LEFT';
const MOUSE_BUTTON_BOTH = 'MOUSE_BUTTON_BOTH';
const MOUSE_BUTTON_RIGHT = 'MOUSE_BUTTON_RIGHT';

const CELL_NEIGHBORS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

class GameField {
    constructor(width, height) {
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
                const cell = new Cell(x, y);
                this.cells.push(cell);
                rowElement.appendChild(cell.element);
            }
        }

        this.onCellClick = () => {};

        let leftMouseButtonDown = false;
        let rightMouseButtonDown = false;
        this.element.addEventListener('mousedown', function(event) {
            if (event.which === 1) {
                leftMouseButtonDown = true;
            } else if (event.which === 3) {
                rightMouseButtonDown = true;
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

            if (mouseButton !== null) {
                if (event.target.classList.contains('cell')) {
                    const x = Number.parseInt(event.target.dataset.x);
                    const y = Number.parseInt(event.target.dataset.y);
                    this.onCellClick(this.getCell(x, y), mouseButton);
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

        for (let y = 0; y < this.height; y += 1) {
            for (let x = 0; x < this.width; x += 1) {
                let neighborMineCount = 0;
                for (const [dx, dy] of CELL_NEIGHBORS) {
                    if (
                        x + dx < 0 || x + dx >= this.width ||
                        y + dy < 0 || y + dy >= this.height
                    ) {
                        continue;
                    }

                    if (this.getCell(x + dx, y + dy).hasMine) {
                        neighborMineCount += 1;
                    }
                }

                this.cells[y * this.width + x].neighborMineCount = neighborMineCount;
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

        this.gameField = new GameField(this.width, this.height, this.mineCount);
        this.gameField.fillWithMines(this.mineCount);

        const gameFieldRootElement = document.getElementById('game-field-root');
        gameFieldRootElement.appendChild(this.gameField.element);

        this.gameStateElement = document.getElementById('game-state');
        this.gameStateElement.textContent = this.state;

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

    reveal(cell) {
        if (this.state === GAME_STATE_START) {
            this.state = GAME_STATE_IN_PROGRESS;
            this.gameStateElement.textContent = this.state;
        }

        if (!cell.hasMine) {
            this.gameField.reveal(cell.x, cell.y);

            const totalCellCount = this.gameField.width * this.gameField.height;
            if (this.gameField.revealedCellCount + this.mineCount === totalCellCount) {
                this.state = GAME_STATE_WIN;
                this.gameField.revealAll();
                this.gameStateElement.textContent = this.state;
            }
        } else {
            this.state = GAME_STATE_LOSE;
            this.gameField.revealAll();
            for (const cell of this.gameField.cells) {
                if (cell.hasMine) {
                    cell.element.textContent = '💥';
                }
            }
            this.gameStateElement.textContent = this.state;
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

        this.state = GAME_STATE_START;
        this.gameStateElement.textContent = this.state;
    }
}

const game = new Game();

const buttonElement = document.getElementById('reset-button');
buttonElement.addEventListener('click', () => { game.reset(); })
