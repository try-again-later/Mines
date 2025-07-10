const enum CellSprite {
    Mine,
    Explosion,
    QuestionMark,
    Flag,
    NeighborMineCount,
}

function cellSpriteId(
    kind: Exclude<CellSprite, CellSprite.NeighborMineCount>
): string;

function cellSpriteId(
    kind: CellSprite.NeighborMineCount,
    params: { neighborMineCount: number },
): string;

function cellSpriteId(
    kind: CellSprite,
    params?: { neighborMineCount?: number }
): string {
    if (kind == CellSprite.NeighborMineCount) {
        return `mine-neighbors-${params!.neighborMineCount!}`
    } else {
        switch (kind) {
            case CellSprite.Mine:
                return 'mine';
            case CellSprite.Explosion:
                return 'mine-explosion';
            case CellSprite.QuestionMark:
                return 'question-mark';
            case CellSprite.Flag:
                return 'flag-mark';
            default:
                throw kind satisfies never;
        }
    }
}

function createSpriteElement(spriteId: string): SVGElement {
    const SVG = 'http://www.w3.org/2000/svg';

    const element = document.createElementNS(SVG, 'svg');
    element.classList.add('sprite');

    const useElement = document.createElementNS(SVG, 'use');
    useElement.setAttribute('href', `sprites.svg#${spriteId}`);
    element.appendChild(useElement);

    return element;
}

export const enum CellMark {
    Flag,
    QuestionMark,
}

export type OnCellRevealCallback = (cell: Cell) => void;
export type OnCellMarkChangeCallback = (cell: Cell, mark: CellMark | null) => void;

export class Cell {
    public neighborMineCount: number = 0;
    public hasMine: boolean = false;

    private _revealed: boolean = false;
    private _onReveal: OnCellRevealCallback = () => {};

    private _mark: CellMark | null = null;
    private _onMarkChange: OnCellMarkChangeCallback = () => {};

    private _element: HTMLElement;
    private contentElement: HTMLElement;
    private coverElement: HTMLElement;
    private spriteElement: SVGElement | null;

    constructor(
        private _x: number,
        private _y: number,
    ) {
        this._element = document.createElement('div');
        this._element.classList.add('cell');
        this._element.dataset.x = _x.toString();
        this._element.dataset.y = _y.toString();

        this.contentElement = document.createElement('div');
        this.contentElement.classList.add('cell-content');
        this._element.appendChild(this.contentElement);

        this.coverElement = document.createElement('div');
        this.coverElement.classList.add('cell-cover');
        this.contentElement.appendChild(this.coverElement);

        // flag / question mark / mine / explosion / number of neighboring cells with a mine
        this.spriteElement = null;
    }

    get x() {
        return this._x;
    }

    get y() {
        return this._y;
    }

    get element() {
        return this._element;
    }

    get revealed() {
        return this._revealed;
    }

    get mark() {
        return this._mark;
    }

    set onReveal(onReveal: OnCellRevealCallback) {
        this._onReveal = onReveal;
    }

    set onMarkChange(onMarkChange: OnCellMarkChangeCallback) {
        this._onMarkChange = onMarkChange;
    }

    addMark(mark: CellMark) {
        if (this._mark != mark) {
            this._onMarkChange(this, mark);
        }

        this._mark = mark;
        this.spriteElement?.remove();

        switch (mark) {
            case CellMark.Flag: {
                const spriteId = cellSpriteId(CellSprite.Flag);
                this.coverElement.appendChild(createSpriteElement(spriteId));
                this.spriteElement = this.coverElement.lastElementChild as SVGElement;
            } break;

            case CellMark.QuestionMark: {
                const spriteId = cellSpriteId(CellSprite.QuestionMark);
                this.coverElement.appendChild(createSpriteElement(spriteId));
                this.spriteElement = this.coverElement.lastElementChild as SVGElement;
            } break;
        }
    }

    hasMark() {
        return this._mark != null;
    }

    removeMark() {
        if (this._mark != null) {
            this._onMarkChange(this, null);
        }

        this._mark = null;
        this.spriteElement?.remove();
    }

    reveal() {
        this._onReveal(this);
        this._revealed = true;

        this._mark = null;
    }

    refreshSprite() {
        this.spriteElement?.remove();

        if (this.hasMine) {
            const spriteId = cellSpriteId(CellSprite.Mine);
            this.contentElement.appendChild(createSpriteElement(spriteId));
            this.spriteElement = this.contentElement.lastElementChild as SVGElement;
        } else if (this.neighborMineCount > 0) {
            const spriteId = cellSpriteId(
                CellSprite.NeighborMineCount,
                { neighborMineCount: this.neighborMineCount },
            );
            this.contentElement.appendChild(createSpriteElement(spriteId));
            this.spriteElement = this.contentElement.lastElementChild as SVGElement;
        }
    }

    explode() {
        if (this.hasMine) {
            this.spriteElement?.remove();
            const spriteId = cellSpriteId(CellSprite.Explosion);
            this.contentElement.appendChild(createSpriteElement(spriteId));
            this.spriteElement = this.contentElement.lastElementChild as SVGElement;
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

        if (this._revealed) {
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

        this._revealed = false;
        this._mark = null;

        this.hasMine = false;
        this.neighborMineCount = 0;
    }
}
