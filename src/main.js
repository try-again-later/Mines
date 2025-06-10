const SPRITE_MINE = 'mine';
const SPRITE_MINE_EXPLOSION = 'mine-explosion';
const SPRITE_QUESTION_MARK = 'question-mark';
const SPRITE_FLAG_MARK = 'flag-mark';
const SPRITE_NEIGHBOR_MINE_COUNT = {
    1: 'mine-neighbors-1',
    2: 'mine-neighbors-2',
    3: 'mine-neighbors-3',
    4: 'mine-neighbors-4',
    5: 'mine-neighbors-5',
    6: 'mine-neighbors-6',
    7: 'mine-neighbors-7',
    8: 'mine-neighbors-8',
};

function createSpriteElement(name) {
    const SVG = 'http://www.w3.org/2000/svg';

    const element = document.createElementNS(SVG, 'svg');
    element.classList.add('sprite');

    const useElement = document.createElementNS(SVG, 'use');
    useElement.setAttribute('href', `sprites.svg#${name}`);
    element.appendChild(useElement);

    return element;
}

const CELL_FLAG_MARK = 'CELL_FLAG_MARK';
const CELL_QUESTION_MARK = 'CELL_QUESTION_MARK';

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.revealed = false;
        this.onReveal = () => {};

        this.mark = null;
        this.onMarkChange = () => {};

        this.neighborMineCount = 0;
        this.hasMine = false;

        this.element = document.createElement('div');
        this.element.classList.add('cell');
        this.element.dataset.x = x;
        this.element.dataset.y = y;

        this.contentElement = document.createElement('div');
        this.contentElement.classList.add('cell-content');
        this.element.appendChild(this.contentElement);

        this.coverElement = document.createElement('div');
        this.coverElement.classList.add('cell-cover');
        this.contentElement.appendChild(this.coverElement);

        // flag / question mark / mine / explosion / number of neighboring cells with a mine
        this.spriteElement = null;
    }

    addMark(mark) {
        if (this.mark !== mark) {
            this.onMarkChange(this, mark);
        }

        this.mark = mark;
        this.spriteElement?.remove();

        switch (mark) {
            case CELL_FLAG_MARK: {
                this.coverElement.appendChild(createSpriteElement(SPRITE_FLAG_MARK));
                this.spriteElement = this.coverElement.lastElementChild;
            } break;

            case CELL_QUESTION_MARK: {
                this.coverElement.appendChild(createSpriteElement(SPRITE_QUESTION_MARK));
                this.spriteElement = this.coverElement.lastElementChild;
            } break;
        }
    }

    hasMark() {
        return this.mark !== null;
    }

    removeMark() {
        if (this.mark !== null) {
            this.onMarkChange(this, null);
        }

        this.mark = null;
        this.spriteElement?.remove();
    }

    reveal() {
        this.onReveal(this);
        this.revealed = true;

        this.mark = null;
        this.spriteElement?.remove();

        if (this.hasMine) {
            this.contentElement.appendChild(createSpriteElement(SPRITE_MINE));
            this.spriteElement = this.contentElement.lastElementChild;
        } else if (this.neighborMineCount > 0) {
            const sprite = createSpriteElement(SPRITE_NEIGHBOR_MINE_COUNT[this.neighborMineCount]);
            this.contentElement.appendChild(sprite);
            this.spriteElement = this.contentElement.lastElementChild;
        }
    }

    animateReveal(delay = 0) {
        const duration = 150;
        const totalDuration = delay + duration;
        const delayOffset = delay / totalDuration;

        this.element.classList.add('revealed');
        this.coverElement.animate([
            {
                offset: delayOffset,
                opacity: 1,
                transform: 'none',
            },
            {
                offset: delayOffset + (1 - delayOffset) * 0.35,
                opacity: 1,
                transform: 'translate(0, -10%)',
            },
            {
                offset: 1,
                opacity: 0.0,
                transform: 'translate(0, -20%)',
            },
        ], {
            fill: 'forwards',
            duration: totalDuration,
        });
    }

    reset() {
        this.element.classList.remove('revealed');

        for (const animation of this.coverElement.getAnimations()) {
            animation.cancel();
        }
        this.coverElement.style.opacity = 1;
        this.coverElement.style.transform = 'none';

        this.spriteElement?.remove();

        this.revealed = false;
        this.mark = null;

        this.hasMine = false;
        this.neighborMineCount = 0;
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

        this.element = document.getElementById('game-field');

        this.revealedCellCount = 0;
        this.cells = [];
        for (let y = 0; y < this.height; y += 1) {
            for (let x = 0; x < this.width; x += 1) {
                const cell = new Cell(x, y);
                this.cells.push(cell);
                this.element.appendChild(cell.element);
            }
        }

        this.onCellClick = () => {};

        const activeCells = [];

        let leftMouseButtonDown = false;
        let rightMouseButtonDown = false;

        const massRevealHold = (x, y) => {
            const cell = this.getCell(x, y);

            if (cell.hasMark()) {
                return;
            }

            if (!cell.revealed) {
                cell.element.classList.add('active');
                activeCells.push(cell);
            }

            for (const neighborCell of this.getNeighbors(cell)) {
                if (!neighborCell.revealed && neighborCell.mark == null) {
                    neighborCell.element.classList.add('active');
                    activeCells.push(neighborCell);
                }
            }
        };

        const massRevealRelease = () => {
            while (activeCells.length > 0) {
                const cell = activeCells.pop();
                cell.element.classList.remove('active');
            }
        };

        this.element.addEventListener('mousedown', (event) => {
            event.preventDefault();

            if (event.which === 1) {
                leftMouseButtonDown = true;
            } else if (event.which === 3) {
                rightMouseButtonDown = true;
            }

            if (
                leftMouseButtonDown && rightMouseButtonDown &&
                event.target.classList.contains('cell')
            ) {
                const x = Number.parseInt(event.target.dataset.x);
                const y = Number.parseInt(event.target.dataset.y);
                massRevealHold(x, y);
            }
        });

        this.element.addEventListener('mouseover', (event) => {
            if (
                leftMouseButtonDown && rightMouseButtonDown &&
                event.target.classList.contains('cell')
            ) {
                massRevealRelease();

                const x = Number.parseInt(event.target.dataset.x);
                const y = Number.parseInt(event.target.dataset.y);
                massRevealHold(x, y);
            }
        });

        this.element.addEventListener('mouseleave', (event) => {
            if (event.target === this.element) {
                massRevealRelease();

                leftMouseButtonDown = false;
                rightMouseButtonDown = false;
            }
        });

        this.element.addEventListener('mouseup', (event) => {
            if (event.which !== 1 && event.which !== 3) {
                return;
            }

            massRevealRelease();

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

    set onCellMarkChange(callback) {
        for (const cell of this.cells) {
            cell.onMarkChange = callback;
        }
    }

    set onCellReveal(callback) {
        for (const cell of this.cells) {
            cell.onReveal = callback;
        }
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
        const mineCandidates = [];
        for (let i = 0; i < this.width * this.height; i += 1) {
            mineCandidates.push(i);
        }

        for (let i = 0; i < mineCount; i += 1) {
            let candidateIndex = Math.floor(Math.random() * mineCandidates.length);

            const cell = this.cells[mineCandidates[candidateIndex]];
            cell.hasMine = true;

            for (const neighborCell of this.getNeighbors(cell)) {
                neighborCell.neighborMineCount += 1;
            }

            mineCandidates[candidateIndex] = mineCandidates[mineCandidates.length - 1];
            mineCandidates.pop();
        }
    }

    reveal(x, y) {
        const revealedCell = this.getCell(x, y);
        if (revealedCell.revealed) {
            return;
        }

        if (revealedCell.hasMine || revealedCell.neighborMineCount > 0) {
            revealedCell.reveal();
            revealedCell.animateReveal();
            this.revealedCellCount += 1;
        } else {
            for (const cell of this.cells) {
                delete cell.visited;
                delete cell.depth;
            }

            const cellsToVisit = [revealedCell];
            revealedCell.depth = 0;

            let currentDepth = 0;

            while (cellsToVisit.length > 0) {
                const depthLayerSize = cellsToVisit.length;

                for (let i = 0; i < depthLayerSize; i += 1) {
                    const nextCell = cellsToVisit.shift();
                    nextCell.reveal();
                    this.revealedCellCount += 1;

                    nextCell.animateReveal(Math.min(nextCell.depth, 100) * 15);

                    if (nextCell.neighborMineCount === 0) {
                        for (const neighborCell of this.getNeighbors(nextCell)) {
                            if (!neighborCell.visited && !neighborCell.revealed) {
                                neighborCell.visited = true;
                                neighborCell.depth = currentDepth + 1;
                                cellsToVisit.push(neighborCell);
                            }
                        }
                    }
                }

                currentDepth += 1;
            }
        }
    }

    revealAll() {
        for (const cell of this.cells) {
            if (!cell.revealed) {
                cell.animateReveal();
            }
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

                // Update the timer 60 times per second
                if (currentTime - this.lastFrameTime > 1000 / 60) {
                    const millisElapsed = Math.floor(this.currentTime - this.startTime);

                    const secondsFormatted = Math.floor(millisElapsed / 1000);
                    const millisFormatted = new String(millisElapsed % 1000).padStart(3, '0');
                    this.element.textContent = `${secondsFormatted}:${millisFormatted}`;

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
        this.width = 16;
        this.height = 16;
        this.mineCount = 30;

        this.minesLeftElement = document.getElementById('mines-left');
        this.setMinesLeft(this.mineCount);

        const timerElement = document.getElementById('game-timer');
        this.timer = new Timer(timerElement);

        this.gameField = new GameField(this.width, this.height);
        this.gameField.fillWithMines(this.mineCount);

        this.gameField.onCellMarkChange = (cell, newMark) => {
            if (cell.mark === CELL_FLAG_MARK) {
                this.setMinesLeft(this.minesLeft + 1);
            }
            if (newMark === CELL_FLAG_MARK) {
                this.setMinesLeft(this.minesLeft - 1);
            }
        };

        this.gameField.onCellReveal = (cell) => {
            if (cell.mark === CELL_FLAG_MARK && !cell.hasMine) {
                this.setMinesLeft(this.minesLeft + 1);
            }
            if (cell.mark === null && cell.hasMine) {
                this.setMinesLeft(this.minesLeft - 1);
            }
        };

        this.gameField.onCellClick = (cell, mouseButton) => {
            switch (mouseButton) {
                case MOUSE_BUTTON_LEFT: {
                    this.leftMouseButtonClick(cell);
                } break;

                case MOUSE_BUTTON_RIGHT: {
                    this.rightMouseButtonClick(cell);
                } break;

                case MOUSE_BUTTON_BOTH: {
                    this.bothMouseButtonsClick(cell);
                } break;
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
                    cell.spriteElement?.remove();
                    cell.contentElement.appendChild(createSpriteElement(SPRITE_MINE_EXPLOSION));
                    cell.spriteElement = cell.contentElement.lastElementChild;
                }
            }
        }
    }

    leftMouseButtonClick(cell) {
        if (!cell.revealed) {
            if (cell.hasMark()) {
                return;
            }
            this.reveal(cell);
        }
    }

    rightMouseButtonClick(cell) {
        if (!cell.revealed) {
            if (!cell.hasMark()) {
                cell.addMark(CELL_FLAG_MARK);
            } else if (cell.mark === CELL_FLAG_MARK) {
                cell.addMark(CELL_QUESTION_MARK);
            } else {
                cell.removeMark();
            }
        }
    }

    bothMouseButtonsClick(cell) {
        if (!cell.revealed) {
            this.leftMouseButtonClick(cell);
        } else {
            let flaggedNeighbors = 0;
            for (const neighborCell of this.gameField.getNeighbors(cell)) {
                if (neighborCell.mark === CELL_FLAG_MARK) {
                    flaggedNeighbors += 1;
                }
            }

            if (flaggedNeighbors === cell.neighborMineCount) {
                for (const neighborCell of this.gameField.getNeighbors(cell)) {
                    if (!neighborCell.revealed && neighborCell.mark !== CELL_FLAG_MARK) {
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

const buttonElement = document.getElementById('new-game-button');
buttonElement.addEventListener('click', () => { game.reset(); })
