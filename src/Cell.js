const SPRITE_MINE = 'mine';
export const SPRITE_MINE_EXPLOSION = 'mine-explosion';
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

export function createSpriteElement(name) {
    const SVG = 'http://www.w3.org/2000/svg';

    const element = document.createElementNS(SVG, 'svg');
    element.classList.add('sprite');

    const useElement = document.createElementNS(SVG, 'use');
    useElement.setAttribute('href', `sprites.svg#${name}`);
    element.appendChild(useElement);

    return element;
}

export const CELL_FLAG_MARK = 'CELL_FLAG_MARK';
export const CELL_QUESTION_MARK = 'CELL_QUESTION_MARK';

export default class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;

        this.revealed = false;
        this.onReveal = (cell) => {};

        this.mark = null;
        this.onMarkChange = (cell, mark) => {};

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
    }

    addSprite() {
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

        this.element.classList.add('revealed');

        this.coverElement.animate([
            {
                opacity: 1,
                transform: 'none',
            },
            {
                offset: 0.35,
                opacity: 1,
                transform: 'translate(0, -10%)',
            },
            {
                opacity: 0,
                transform: 'translate(0, -20%)',
            },
        ], {
            fill: 'forwards',
            duration: 150,
            delay,
        });
    }

    reset() {
        for (const animation of this.coverElement.getAnimations()) {
            animation.finish();
        }

        if (this.revealed) {
            this.coverElement.animate([
                {
                    opacity: 0,
                    transform: 'none',
                },
                {
                    opacity: 1,
                    transform: 'none',
                },
            ], {
                fill: 'forwards',
                duration: 0,
            });
        }

        this.element.classList.remove('revealed');
        this.spriteElement?.remove();

        this.revealed = false;
        this.mark = null;

        this.hasMine = false;
        this.neighborMineCount = 0;
    }
}
