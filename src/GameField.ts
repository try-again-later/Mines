import { Cell } from './Cell';
import type { OnCellRevealCallback, OnCellMarkChangeCallback } from './Cell';
import MouseButton from './MouseButton';

const CELL_NEIGHBORS =
    [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] as const;

export type OnCellClickCallback = (cell: Cell, mouseButton: MouseButton) => void;

// The game field is more or else dumb: it delegates cell click events to someone else for them to
// explicitly call the reveal or revealAll methods.
export default class GameField {
    private element: HTMLElement;

    private _revealedCellCount: number;
    public readonly cells: Cell[];

    private _onCellClick: OnCellClickCallback = () => {};

    constructor(
        public readonly width: number,
        public readonly height: number,
    ) {
        this.element = document.getElementById('game-field') as HTMLElement;

        this._revealedCellCount = 0;
        this.cells = [];
        for (let y = 0; y < this.height; y += 1) {
            for (let x = 0; x < this.width; x += 1) {
                const cell = new Cell(x, y);
                this.cells.push(cell);
                this.element.appendChild(cell.element);
            }
        }

        // "Active" cells are the ones getting highlighted hold both LMB and RMB when doing
        // "mass reveal" (a purely visual effect).

        const activeCells: Cell[] = [];

        const massRevealHold = (x: number, y: number) => {
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
            for (const cell of activeCells) {
                cell.element.classList.remove('active');
            }
            activeCells.length = 0;
        };

        // Mouse events handlers

        let leftMouseButtonDown = false;
        let rightMouseButtonDown = false;

        this.element.addEventListener('mousedown', (event) => {
            event.preventDefault();

            if (event.button == 0) {
                leftMouseButtonDown = true;
            }
            if (event.button == 2) {
                rightMouseButtonDown = true;
            }

            if (
                leftMouseButtonDown &&
                rightMouseButtonDown &&
                event.target instanceof HTMLElement &&
                event.target.classList.contains('cell')
            ) {
                const x = Number.parseInt(event.target.dataset.x!);
                const y = Number.parseInt(event.target.dataset.y!);
                massRevealHold(x, y);
            }
        });

        this.element.addEventListener('mouseup', (event) => {
            if (event.button != 0 && event.button != 2) {
                return;
            }

            massRevealRelease();

            let mouseButton: MouseButton | null = null;
            if (leftMouseButtonDown && rightMouseButtonDown) {
                mouseButton = MouseButton.Both;
            } else if (leftMouseButtonDown) {
                mouseButton = MouseButton.Left;
            } else if (rightMouseButtonDown) {
                mouseButton = MouseButton.Right;
            }

            if (mouseButton != null) {
                if (
                    event.target instanceof HTMLElement &&
                    event.target.classList.contains('cell')
                ) {
                    const x = Number.parseInt(event.target.dataset.x!);
                    const y = Number.parseInt(event.target.dataset.y!);
                    const cell = this.getCell(x, y);
                    this._onCellClick(cell, mouseButton);
                }
            }

            leftMouseButtonDown = false;
            rightMouseButtonDown = false;
        });

        this.element.addEventListener('mouseover', (event) => {
            if (
                leftMouseButtonDown &&
                rightMouseButtonDown &&
                event.target instanceof HTMLElement &&
                event.target.classList.contains('cell')
            ) {
                massRevealRelease();

                const x = Number.parseInt(event.target.dataset.x!);
                const y = Number.parseInt(event.target.dataset.y!);
                massRevealHold(x, y);
            }
        });

        this.element.addEventListener('mouseleave', (event) => {
            if (event.target == this.element) {
                massRevealRelease();

                leftMouseButtonDown = false;
                rightMouseButtonDown = false;
            }
        });

        this.element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }

    get revealedCellCount() {
        return this._revealedCellCount;
    }

    set onCellMarkChange(callback: OnCellMarkChangeCallback) {
        for (const cell of this.cells) {
            cell.onMarkChange = callback;
        }
    }

    set onCellReveal(callback: OnCellRevealCallback) {
        for (const cell of this.cells) {
            cell.onReveal = callback;
        }
    }

    set onCellClick(callback: OnCellClickCallback) {
        this._onCellClick = callback;
    }

    getCell(x: number, y: number): Cell {
        const cell = this.cells[y * this.width + x];
        if (cell == undefined) {
            throw new Error('Cell coordinatesa are out of bounds.');
        }

        return cell;
    }

    cellIndex(cell: Cell): number {
        return cell.y * this.width + cell.x;
    }

    *getNeighbors(cell: Cell): Generator<Cell> {
        for (const [dx, dy] of CELL_NEIGHBORS) {
            if (
                cell.x + dx < 0 ||
                cell.x + dx >= this.width ||
                cell.y + dy < 0 ||
                cell.y + dy >= this.height
            ) {
                continue;
            }

            yield this.getCell(cell.x + dx, cell.y + dy);
        }
    }

    fillWithMines(mineCount: number) {
        if (mineCount > this.width * this.height) {
            throw new Error('Too many mines for the current game field size.');
        }

        // Cell indices where the mines could be placed.
        // Initially filled with every single cell index.
        const mineCandidates = [];
        for (let i = 0; i < this.width * this.height; i += 1) {
            mineCandidates.push(i);
        }

        for (let i = 0; i < mineCount; i += 1) {
            let candidateIndex = Math.floor(Math.random() * mineCandidates.length);

            const cell = this.cells[mineCandidates[candidateIndex]!]!;
            cell.hasMine = true;

            for (const neighborCell of this.getNeighbors(cell)) {
                neighborCell.neighborMineCount += 1;
            }

            mineCandidates[candidateIndex] = mineCandidates[mineCandidates.length - 1];
            mineCandidates.pop();
        }

        for (const cell of this.cells) {
            cell.refreshSprite();
        }
    }

    reveal(x: number, y: number) {
        const revealedCell = this.getCell(x, y);
        if (revealedCell.revealed) {
            return;
        }

        if (revealedCell.hasMine || revealedCell.neighborMineCount > 0) {
            revealedCell.reveal();
            revealedCell.animateReveal();
            this._revealedCellCount += 1;
        } else {
            type CellIndex = number;
            const cellsVisited = new Set<CellIndex>();
            const cellsDepth = new Map<CellIndex, number>();

            const cellsToVisit = [revealedCell];
            cellsDepth.set(this.cellIndex(revealedCell), 0);
            let currentDepth = 0;

            while (cellsToVisit.length > 0) {
                const depthLayerSize = cellsToVisit.length;

                for (let i = 0; i < depthLayerSize; i += 1) {
                    const nextCell = cellsToVisit.shift()!;
                    nextCell.reveal();
                    this._revealedCellCount += 1;

                    const nextCellDepth = cellsDepth.get(this.cellIndex(nextCell))!;
                    nextCell.animateReveal(Math.min(nextCellDepth, 100) * 15);

                    if (nextCell.neighborMineCount == 0) {
                        for (const neighborCell of this.getNeighbors(nextCell)) {
                            const neighborCellIndex = this.cellIndex(neighborCell);

                            if (!cellsVisited.has(neighborCellIndex) && !neighborCell.revealed) {
                                cellsVisited.add(neighborCellIndex);
                                cellsDepth.set(neighborCellIndex, currentDepth + 1);
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
        this._revealedCellCount = this.width * this.height;
    }

    reset() {
        for (const cell of this.cells) {
            cell.reset();
        }
        this._revealedCellCount = 0;
    }
}
