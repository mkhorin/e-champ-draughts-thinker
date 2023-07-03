/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DraughtsThinkerSolverWorker = class DraughtsThinkerSolverWorker {

    static SCRIPT = document.currentScript.src.replace('thinker.min', 'thinker-worker.min');

    constructor (solver) {
        this.solver = solver;
        this.worker = new Worker(this.constructor.SCRIPT);
        this.worker.addEventListener('message', this.onMessage.bind(this), false);
    }

    start (way, done) {
        this.done = done;
        this.worker.postMessage({
            maxDepth: this.solver.maxDepth,
            values: this.solver.values,
            way: way,
            options: this.solver.play.options,
            ...this.solver.board
        });
    }

    onMessage ({data}) {
        this.finished = true;
        this.value = data;
        this.done?.(this);
    }

    clear () {
        this.done = null;
        this.finished = true;
        this.worker.terminate();
    }
};