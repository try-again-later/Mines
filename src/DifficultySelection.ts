function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

const enum DifficultyKind {
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard',
    Custom = 'custom',
}

type Difficulty = {
    kind: DifficultyKind;
    fieldWidth: number;
    fieldHeight: number;
    mineCount: number;
};

const difficultiesByKind: Record<
    Exclude<DifficultyKind, DifficultyKind.Custom>,
    Difficulty
> = {
    [DifficultyKind.Easy]: Object.freeze({
        kind: DifficultyKind.Easy,
        fieldWidth: 9,
        fieldHeight: 9,
        mineCount: 10,
    }),
    [DifficultyKind.Medium]: Object.freeze({
        kind: DifficultyKind.Medium,
        fieldWidth: 16,
        fieldHeight: 16,
        mineCount: 40,
    }),
    [DifficultyKind.Hard]: Object.freeze({
        kind: DifficultyKind.Hard,
        fieldWidth: 30,
        fieldHeight: 16,
        mineCount: 99,
    }),
};

const DEFAULT_CUSTOM_FIELD_WIDTH = 9;
const DEFAULT_CUSTOM_FIELD_HEIGHT = 9;
const DEFAULT_CUSTOM_MINE_COUNT = 10;

const MAX_FIELD_WIDTH = 100;
const MAX_FIELD_HEIGHT = 100;

export type OnDifficultyChangeCallback = (
    fieldWidth: number,
    fieldHeight: number,
    mineCount: number,
) => void;

export default class DifficultySelection {
    private element: HTMLElement;
    private visible: boolean = false;

    private currentDifficulty: Difficulty;
    private selectedDifficulty: Difficulty;
    private _onDifficultyChange: OnDifficultyChangeCallback = () => {};

    constructor() {
        this.element = document.getElementById('difficulty-selection')!;

        const toggleButtonElement = document.getElementById('difficulty-selection-button')!;
        toggleButtonElement.addEventListener('click', this.toggle.bind(this));

        document.addEventListener('click', (event) => {
            if (
                event.target != toggleButtonElement &&
                !this.element.contains(event.target as Node)
            ) {
                this.close();
            }
        });

        this.currentDifficulty = difficultiesByKind[DifficultyKind.Easy];
        this.selectedDifficulty = this.currentDifficulty;
        this.render();

        this.element.addEventListener('change', (event) => {
            if (!(event.target instanceof HTMLInputElement)) {
                return;
            }

            let newDifficulty: Difficulty | null = null;

            if ('difficultyInput' in event.target.dataset) {
                const difficultyKind = event.target.value as DifficultyKind;

                if (difficultyKind == DifficultyKind.Custom) {
                    newDifficulty = {
                        kind: DifficultyKind.Custom,
                        fieldWidth: Number.parseInt(this.widthInputElement.value),
                        fieldHeight: Number.parseInt(this.heightInputElement.value),
                        mineCount: Number.parseInt(this.minesInputElement.value),
                    };
                } else {
                    newDifficulty = difficultiesByKind[difficultyKind];
                }
            } else if ('customDifficultySettings' in event.target.dataset) {
                newDifficulty = {
                    kind: DifficultyKind.Custom,
                    fieldWidth: Number.parseInt(this.widthInputElement.value),
                    fieldHeight: Number.parseInt(this.heightInputElement.value),
                    mineCount: Number.parseInt(this.minesInputElement.value),
                };
            } else {
                newDifficulty = difficultiesByKind[DifficultyKind.Easy];
            }

            this.selectedDifficulty = newDifficulty;
            this.render();
        });

        this.element.querySelector('[data-cancel]')!.addEventListener('click', () => {
            this.close();
        });

        this.element.querySelector('[data-confirm]')!.addEventListener('click', () => {
            if (this.selectedDifficulty.kind == DifficultyKind.Custom) {
                this.selectedDifficulty.fieldWidth = clamp(
                    this.selectedDifficulty.fieldWidth,
                    1,
                    MAX_FIELD_WIDTH,
                );
                this.selectedDifficulty.fieldHeight = clamp(
                    this.selectedDifficulty.fieldHeight,
                    1,
                    MAX_FIELD_HEIGHT,
                );
                this.selectedDifficulty.mineCount = Math.min(
                    this.selectedDifficulty.mineCount,
                    this.selectedDifficulty.fieldWidth * this.selectedDifficulty.fieldHeight,
                );
            }

            if (
                this.currentDifficulty.fieldWidth != this.selectedDifficulty.fieldWidth ||
                this.currentDifficulty.fieldHeight != this.selectedDifficulty.fieldHeight ||
                this.currentDifficulty.mineCount != this.selectedDifficulty.mineCount
            ) {
                this._onDifficultyChange(
                    this.selectedDifficulty.fieldWidth,
                    this.selectedDifficulty.fieldHeight,
                    this.selectedDifficulty.mineCount
                );
            }

            this.currentDifficulty = this.selectedDifficulty;
            this.close();
        });
    }

    set onDifficultyChange(onDifficultyChange: OnDifficultyChangeCallback) {
        this._onDifficultyChange = onDifficultyChange;
    }

    get difficulty() {
        return this.currentDifficulty;
    }

    private render() {
        (
            this.element.querySelector(
                `[value=${this.selectedDifficulty.kind}]`,
            ) as HTMLInputElement
        ).checked = true;

        if (this.selectedDifficulty.kind == DifficultyKind.Custom) {
            this.widthInputElement.value = this.selectedDifficulty.fieldWidth.toString();
            this.heightInputElement.value = this.selectedDifficulty.fieldHeight.toString();
            this.minesInputElement.value = this.selectedDifficulty.mineCount.toString();
        } else {
            this.widthInputElement.value = DEFAULT_CUSTOM_FIELD_WIDTH.toString();
            this.heightInputElement.value = DEFAULT_CUSTOM_FIELD_HEIGHT.toString();
            this.minesInputElement.value = DEFAULT_CUSTOM_MINE_COUNT.toString();
        }

        this.widthInputElement.disabled = this.selectedDifficulty.kind != DifficultyKind.Custom;
        this.heightInputElement.disabled = this.selectedDifficulty.kind != DifficultyKind.Custom;
        this.minesInputElement.disabled = this.selectedDifficulty.kind != DifficultyKind.Custom;
    }

    private open() {
        this.selectedDifficulty = this.currentDifficulty;
        this.render();
        this.element.classList.remove('cloak');
        this.element.classList.add('difficulty-selection-popup--visible');
        this.visible = true;
    }

    private close() {
        this.element.classList.remove('difficulty-selection-popup--visible');
        this.visible = false;
    }

    private toggle() {
        if (this.visible) {
            this.close();
        } else {
            this.open();
        }
    }

    private get widthInputElement() {
        return this.element.querySelector('[name=width]') as HTMLInputElement;
    }

    private get heightInputElement() {
        return this.element.querySelector('[name=height]') as HTMLInputElement;
    }

    private get minesInputElement() {
        return this.element.querySelector('[name=mines]') as HTMLInputElement;
    }
}
