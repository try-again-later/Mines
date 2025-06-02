class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.isOpened = false;
        this.neighborMineCount = 0;
        this.hasMine = false;

        this.element = document.createElement('td');
        this.element.classList.add('cell');
        this.element.dataset.x = x;
        this.element.dataset.y = y;
    }

    reveal() {
        this.isOpened = true;

        if (this.hasMine) {
            this.element.textContent = '@';
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
    }
}

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
        this.element.addEventListener('click', (event) => {
            if (event.target.classList.contains('cell')) {
                const x = Number.parseInt(event.target.dataset.x);
                const y = Number.parseInt(event.target.dataset.y);
                this.onCellClick(this.getCell(x, y));
            }
        });
    }

    getCell(x, y) {
        return this.cells[y * this.width + x];
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
                for (const dy of [-1, 0, 1]) {
                    for (const dx of [-1, 0, 1]) {
                        if (dx === 0 && dy === 0) {
                            continue;
                        }
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
                    for (const dx of [-1, 0, 1]) {
                        for (const dy of [-1, 0, 1]) {
                            if (dx === 0 && dy === 0) {
                                continue;
                            }
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

        this.gameField.onCellClick = (cell) => {
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
                this.gameStateElement.textContent = this.state;
            }
        };
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
