export default class Timer {
    constructor(element) {
        this.element = element;
        this.stopped = Promise.resolve();
    }

    start() {
        this.startTime = null;
        this.lastFrameTime = null;
        this.currentTime = null;
        this.shouldStop = false;

        this.stopped = new Promise((resolve) => {
            const callback = (currentTime) => {
                if (this.startTime === null) {
                    this.startTime = currentTime;
                    this.lastFrameTime = currentTime;
                }
                this.currentTime = currentTime;

                // Update the timer display 30 times per second
                if (currentTime - this.lastFrameTime > 1000 / 30) {
                    const millisElapsed = Math.floor(this.currentTime - this.startTime);

                    const secondsFormatted = Math.floor(millisElapsed / 1000);
                    const millisFormatted = new String(millisElapsed % 1000).padStart(3, '0');
                    this.element.textContent = `${secondsFormatted}:${millisFormatted}`;

                    this.lastFrameTime = currentTime;
                }

                if (!this.shouldStop) {
                    requestAnimationFrame(callback);
                } else {
                    resolve();
                }
            };

            requestAnimationFrame(callback);
        })
    }

    stop() {
        this.shouldStop = true;
    }

    reset() {
        this.stop();
        this.stopped.then(() => {
            this.startTime = null;
            this.lastFrameTime = null;
            this.currentTime = null;
            this.element.textContent = '0:000';
        })
    }
}
