const defaultTimerConfig = {
    fps: 30,
} as const;

export default class Timer {
    private element: HTMLElement;
    private fps: number;

    private startTime: Date = new Date(0);
    private stopTime: Date = new Date(0);

    private shouldStop = true;
    private stopped = Promise.resolve();

    constructor(element: HTMLElement, config: { fps: number } = defaultTimerConfig) {
        this.element = element;
        this.element.textContent = '0:000';
        this.fps = config.fps;
    }

    private setElementValue(millisElapsed: number) {
        const secondsFormatted = Math.floor(millisElapsed / 1000);
        const millisFormatted = `${millisElapsed % 1000}`.padStart(3, '0');
        this.element.textContent = `${secondsFormatted}:${millisFormatted}`;
    }

    async start() {
        this.startTime = new Date();
        this.shouldStop = false;

        await this.stopped;

        this.stopped = new Promise((resolve) => {
            let lastFrameTimestamp = 0;

            const frameCallback: FrameRequestCallback = (timestamp) => {
                // Update the timer textContent 24 times per second
                if (timestamp - lastFrameTimestamp > 1000 / this.fps) {
                    lastFrameTimestamp = timestamp;

                    const millisElapsed = new Date().getTime() - this.startTime.getTime();
                    this.setElementValue(millisElapsed);
                }

                if (!this.shouldStop) {
                    requestAnimationFrame(frameCallback);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(frameCallback);
        });
    }

    async stop() {
        this.shouldStop = true;
        this.stopTime = new Date();
        await this.stopped;
        this.setElementValue(this.finalMillisElapsed());
    }

    async reset() {
        await this.stop();
        this.element.textContent = '0:000';
    }

    finalMillisElapsed(): number {
        return this.stopTime.getTime() - this.startTime.getTime();
    }
}
