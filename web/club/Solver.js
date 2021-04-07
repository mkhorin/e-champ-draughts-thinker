/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

Club.DraughtsThinkerSolver = class DraughtsThinkerSolver {

    static FINAL_DELAY = 500;
    static DEPTH_VALUE = -1000;
    static WIN_VALUE = 100000;

    constructor (player) {
        this.player = player;
        this.play = player.play;
        this.params = player.data.params;
        this.startTime = Date.now();
    }

    clear () {
        this.done = null;
        this.workers?.forEach(worker => worker.clear());
    }

    resolveMove (done) {
        this.done = done;
        if (this.play.ways.count() === 1) {
            return this.complete(0);
        }
        this.maxDepth = this.getMaxDepth();
        this.values = this.getBaseValues();
        this.board = this.getBoardData();
        this.createWorkers(this.onMoveDone.bind(this));
    }

    resolveDraw (done) {
        this.done = done;
        this.maxDepth = this.getMaxDepth();
        this.values = this.getBaseValues();
        this.board = this.getBoardData();
        this.createWorkers(this.onDrawDone.bind(this));
    }

    getBaseValues () {
        const values = {
            depth: this.constructor.DEPTH_VALUE,
            win: this.constructor.WIN_VALUE,
            ...this.params.values
        };
        if (!this.play.options.losing) {
            return values;
        }
        return Object.assign(values, {
            depth: -values.depth,
            win: -values.win
        }, this.params.losingValues);
    }

    getMaxDepth () {
        return Array.isArray(this.params.depth)
            ? Jam.ArrayHelper.getRandom(this.params.depth)
            : this.params.depth;
    }

    getBoardData () {
        const data = this.play.board.serialize();
        const cells = data.cells;
        const pieces = {
            [Club.Draughts.DARK]: [],
            [Club.Draughts.LIGHT]: []
        };
        const kings = {
            [Club.Draughts.DARK]: 0,
            [Club.Draughts.LIGHT]: 0
        };
        for (const piece of data.pieces) {
            if (piece.crowned) {
                piece.value = this.values.king;
                ++kings[piece.color];
            } else {
                piece.value = this.values.man;
            }
            pieces[piece.color].push(piece);
        }
        return {cells, pieces, kings};
    }

    createWorkers (done) {
        this.workers = [];
        for (const way of this.play.ways) {
            const worker = new Club.DraughtsThinkerSolverWorker(this);
            worker.start(this.serializeWay(way), done);
            this.workers.push(worker);
        }
    }

    isActiveWorker () {
        for (const worker of this.workers) {
            if (!worker.finished) {
                return true;
            }
        }
    }

    onDrawDone (worker) {
        if (!this.isActiveWorker()) {
            const value = this.getBestWorkerValue();
            const kings = this.board.kings[this.player.getOppositeColor()];
            this.complete(value > 0 || (value === 0 && kings > 0));
        }
    }

    getBestWorkerValue () {
        let best = null;
        for (const worker of this.workers) {
            if (best === null || worker.value > best) {
                best = worker.value;
            }
        }
        return best;
    }

    onMoveDone (worker) {
        if (!this.isActiveWorker()) {
            this.complete(this.getBestWorkerIndex());
        }
    }

    getBestWorkerIndex () {
        let indexes = [], best = null;
        for (let i = 0; i < this.workers.length; ++i) {
            let {value} = this.workers[i];
            if (best === null || value > best) {
                best = value;
                indexes = [i];
            } else if (value === best) {
                indexes.push(i);
            }
        }
        return Jam.ArrayHelper.getRandom(indexes);
    }

    serializeWay (way) {
        let value = 0;
        let capturedKings = 0;
        let capturedKing = null;
        let pos = way.piece.cell.pos;
        let piece = this.board.cells[pos.x]?.[pos.y]?.piece;
        let points = [];
        for (let {cell, crowned, capture} of way.points) {
            points.push({
                cell: this.board.cells[cell.pos.x]?.[cell.pos.y],
                crowned: crowned,
                capture: capture && this.board.cells[capture.cell.pos.x]?.[capture.cell.pos.y]?.piece
            });
            if (!capture) {
                continue;
            }
            if (capture.crowned) {
                capturedKing = capture;
                ++capturedKings;
            } else {
                value += this.values.man;
            }
        }
        if (capturedKing) {
            value += this.values.king * capturedKings;
            if (capturedKings === this.board.kings[capturedKing.color]) {
                value += this.values.firstKing;
            }
        }
        if (points[points.length - 1].crowned !== piece.crowned) {
            value += this.values.coronation;
            if (this.board.kings[piece.color] === 0) {
                value += this.values.firstKing;
            }
        }
        return {value, piece, points};
    }

    complete (index) {
        const delay = this.constructor.FINAL_DELAY - (Date.now() - this.startTime);
        return setTimeout(() => this.done?.(index), delay);
    }
};