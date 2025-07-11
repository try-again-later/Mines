import Timer from './Timer';
import type { OnCellClickCallback } from './GameField';
import GameField from './GameField';
import MouseButton from './MouseButton';
import { Cell, CellMark } from './Cell';

const enum GameState {
    Start,
    InProgress,
    Win,
    Lose,
}

export default class Game {
    private state: GameState;

    private width: number;
    private height: number;
    private mineCount: number;
    private minesLeft: number;

    private minesLeftElement: HTMLElement;

    private timer: Timer;
    private gameField: GameField;

    constructor() {
        this.state = GameState.Start;
        this.width = 16;
        this.height = 16;
        this.mineCount = 30;
        this.minesLeft = this.mineCount;

        const difficultySelectionElement = document.getElementById('difficulty-selection')!;
        let difficultySelectionVisisble = false;
        document.getElementById('difficulty-selection-button')!.addEventListener('click', () => {
            if (difficultySelectionVisisble) {
                difficultySelectionElement.style.display = 'none';
                difficultySelectionVisisble = false;
            } else {
                difficultySelectionElement.style.display = 'block';
                difficultySelectionVisisble = true;
            }
        });

        this.minesLeftElement = document.getElementById('mines-left')!;
        this.setMinesLeft(this.mineCount);

        this.timer = new Timer(document.getElementById('game-timer')!);

        this.gameField = new GameField(this.width, this.height);
        this.gameField.fillWithMines(this.mineCount);

        this.gameField.onCellMarkChange = (cell, newMark) => {
            if (cell.mark === CellMark.Flag) {
                this.setMinesLeft(this.minesLeft + 1);
            }
            if (newMark === CellMark.Flag) {
                this.setMinesLeft(this.minesLeft - 1);
            }
        };

        this.gameField.onCellReveal = (cell) => {
            if (cell.mark === CellMark.Flag && !cell.hasMine) {
                this.setMinesLeft(this.minesLeft + 1);
            }
            if (cell.mark === null && cell.hasMine) {
                this.setMinesLeft(this.minesLeft - 1);
            }
        };

        this.gameField.onCellClick = (cell, mouseButton) => {
            switch (mouseButton) {
                case MouseButton.Left: {
                    this.leftMouseButtonClick(cell);
                } break;

                case MouseButton.Right: {
                    this.rightMouseButtonClick(cell);
                } break;

                case MouseButton.Both: {
                    this.bothMouseButtonsClick(cell);
                } break;
            }
        };
    }

    setMinesLeft(minesLeft: number) {
        this.minesLeft = minesLeft;
        this.minesLeftElement.textContent = minesLeft.toString();
    }

    reveal(cell: Cell) {
        if (this.state === GameState.Start) {
            this.timer.start();
            this.state = GameState.InProgress;
        }

        if (!cell.hasMine) {
            this.gameField.reveal(cell.x, cell.y);

            const totalCellCount = this.gameField.width * this.gameField.height;
            if (this.gameField.revealedCellCount + this.mineCount === totalCellCount) {
                this.state = GameState.Win;
                this.timer.stop();
                this.gameField.revealAll();
            }
        } else {
            this.state = GameState.Lose;
            this.timer.stop();
            this.gameField.revealAll();
            for (const cell of this.gameField.cells) {
                cell.explode();
            }
        }
    }

    leftMouseButtonClick(cell: Cell) {
        if (!cell.revealed) {
            if (cell.hasMark()) {
                return;
            }
            this.reveal(cell);
        }
    }

    rightMouseButtonClick(cell: Cell) {
        if (!cell.revealed) {
            if (!cell.hasMark()) {
                cell.addMark(CellMark.Flag);
            } else if (cell.mark === CellMark.Flag) {
                cell.addMark(CellMark.QuestionMark);
            } else {
                cell.removeMark();
            }
        }
    }

    bothMouseButtonsClick(cell: Cell) {
        if (!cell.revealed) {
            this.leftMouseButtonClick(cell);
        } else {
            let flaggedNeighbors = 0;
            for (const neighborCell of this.gameField.getNeighbors(cell)) {
                if (neighborCell.mark === CellMark.Flag) {
                    flaggedNeighbors += 1;
                }
            }

            if (flaggedNeighbors === cell.neighborMineCount) {
                for (const neighborCell of this.gameField.getNeighbors(cell)) {
                    if (!neighborCell.revealed && neighborCell.mark !== CellMark.Flag) {
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

        this.state = GameState.Start;
        this.setMinesLeft(this.mineCount);
    }
}
