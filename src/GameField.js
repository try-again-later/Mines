import Cell from './Cell';

export const MOUSE_BUTTON_LEFT = 'MOUSE_BUTTON_LEFT';
export const MOUSE_BUTTON_BOTH = 'MOUSE_BUTTON_BOTH';
export const MOUSE_BUTTON_RIGHT = 'MOUSE_BUTTON_RIGHT';

const CELL_NEIGHBORS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

export default class GameField {
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

        for (const cell of this.cells) {
            cell.addSprite();
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
