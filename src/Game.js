import Timer from './Timer';
import GameField from './GameField';
import MouseButton from './MouseButton';
import { CellMark } from './Cell';

const GAME_STATE_START = 'GAME_STATE_START';
const GAME_STATE_IN_PROGRESS = 'GAME_STATE_IN_PROGRESS'
const GAME_STATE_WIN = 'GAME_STATE_WIN'
const GAME_STATE_LOSE = 'GAME_STATE_LOSE';

export default class Game {
    constructor() {
        this.state = GAME_STATE_START;
        this.width = 16;
        this.height = 16;
        this.mineCount = 30;

        const difficultySelectionElement = document.getElementById('difficulty-selection');
        let difficultySelectionVisisble = false;
        document.getElementById('difficulty-selection-button').addEventListener('click', () => {
            if (difficultySelectionVisisble) {
                difficultySelectionElement.style.display = 'none';
                difficultySelectionVisisble = false;
            } else {
                difficultySelectionElement.style.display = 'block';
                difficultySelectionVisisble = true;
            }
        });

        this.minesLeftElement = document.getElementById('mines-left');
        this.setMinesLeft(this.mineCount);

        const timerElement = document.getElementById('game-timer');
        this.timer = new Timer(timerElement);

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
                cell.explode();
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
                cell.addMark(CellMark.Flag);
            } else if (cell.mark === CellMark.Flag) {
                cell.addMark(CellMark.QuestionMark);
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

        this.state = GAME_STATE_START;
        this.setMinesLeft(this.mineCount);
    }
}
