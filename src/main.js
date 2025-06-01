class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isOpened = false;
        this.neighborMineCount = 0;
        this.hasMine = false;

        this.element = document.createElement('td');
        this.element.classList.add('cell');
        this.element.dataset.x = this.x;
        this.element.dataset.y = this.y;
    }

    addMine() {
        this.hasMine = true;
        this.element.textContent = '@';
    }

    setNeighborMineCount(neighborMineCount) {
        this.neighborMineCount = neighborMineCount;
        if (neighborMineCount > 0) {
            this.element.textContent = neighborMineCount;
        }
    }

    reveal() {
        this.isOpened = true;
        this.element.classList.add('opened');
    }
}

class GameField {
    constructor(width, height, mineCount) {
        if (width * height < mineCount) {
            throw new Error('Too many mines.');
        }

        this.width = width;
        this.height = height;
        this.mineCount = mineCount;

        const mineCandidates = [];
        const mineIndices = [];
        for (let i = 0; i < width * height; i += 1) {
            mineCandidates.push(i);
        }
        for (let i = 0; i < mineCount; i += 1) {
            let candidateIndex = Math.floor(Math.random() * mineCandidates.length);
            mineIndices.push(mineCandidates[candidateIndex]);

            mineCandidates[candidateIndex] = mineCandidates[mineCandidates.length - 1];
            mineCandidates.pop();
        }

        this.cells = [];
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                this.cells.push(new Cell(x, y, 0, false));
            }
        }
        for (const mineIndex of mineIndices) {
            this.cells[mineIndex].addMine();
        }

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                let neighborMineCount = 0;
                for (const dy of [-1, 0, 1]) {
                    for (const dx of [-1, 0, 1]) {
                        if (dx === 0 && dy == 0) {
                            continue;
                        }
                        if (x + dx < 0 || x + dx >= width) {
                            continue;
                        }
                        if (y + dy < 0 || y + dy >= height) {
                            continue;
                        }

                        if (this.cells[(y + dy) * width + (x + dx)].hasMine) {
                            neighborMineCount += 1;
                        }
                    }
                }

                this.cells[y * width + x].setNeighborMineCount(neighborMineCount);
            }
        }

        this.element = document.createElement('table');
        this.element.classList.add('game-field');

        for (let y = 0; y < this.height; y += 1) {
            const rowElement = document.createElement('tr');
            this.element.appendChild(rowElement);

            for (let x = 0; x < this.width; x += 1) {
                const cell = this.cells[y * this.width + x];
                rowElement.appendChild(cell.element);
            }
        }

        this.element.addEventListener('click', (event) => {
            if (event.target.tagName.toLowerCase() !== 'td') {
                return;
            }

            const x = Number.parseInt(event.target.dataset.x);
            const y = Number.parseInt(event.target.dataset.y);
            this.reveal(x, y);
        });
    }

    reveal(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            throw new Error('Cell coordinates out of bounds.');
        }

        const revealedCell = this.cells[y * this.width + x];
        if (revealedCell.hasMine || revealedCell.neighborMineCount > 0) {
            revealedCell.reveal();
        } else {
            for (const cell of this.cells) {
                cell.visited = false;
            }

            const cellsToVisit = [revealedCell];
            while (cellsToVisit.length > 0) {
                const nextCell = cellsToVisit.shift();
                nextCell.visited = true;
                nextCell.reveal();

                if (nextCell.neighborMineCount === 0) {
                    for (const dx of [-1, 0, 1]) {
                        for (const dy of [-1, 0, 1]) {
                            if (dx === 0 && dy == 0) {
                                continue;
                            }
                            if (nextCell.x + dx < 0 || nextCell.x + dx >= this.width) {
                                continue;
                            }
                            if (nextCell.y + dy < 0 || nextCell.y + dy >= this.height) {
                                continue;
                            }
                            const neighbor = this.cells[
                                (nextCell.y + dy) * this.width + (nextCell.x + dx)
                            ];
                            if (!neighbor.visited) {
                                cellsToVisit.push(neighbor);
                            }
                        }
                    }
                }
            }
        }
    }
}

const gameField = new GameField(10, 10, 10);
document.body.appendChild(gameField.element);
