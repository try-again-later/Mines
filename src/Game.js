import Timer from './Timer';
import GameField, {
    MOUSE_BUTTON_LEFT,
    MOUSE_BUTTON_RIGHT,
    MOUSE_BUTTON_BOTH,
} from './GameField';
import {
    CELL_FLAG_MARK,
    CELL_QUESTION_MARK,
    createSpriteElement,
    SPRITE_MINE_EXPLOSION,
} from './Cell';

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
