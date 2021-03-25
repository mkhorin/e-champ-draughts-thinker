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

    resolveMove (done) {
        this.done = done;
        if (this.play.ways.count() === 1) {
            return this.complete(0);
        }
        this.values = this.getBaseValues();
        this.maxDepth = this.getMaxDepth();
        this.board = new Club.DraughtsThinkerSolverBoard(this);
        this.kings = this.board.kings;
        this.ways = new Club.DraughtsThinkerSolverWays(this);
        let ways = null, best = null;
        for (const source of this.play.ways) {
            const way = this.createWayFromSource(source);
            const value = this.resolveWayValue(way, 1);
            if (best === null || value > best) {
                best = value;
                ways = [way];
            } else if (value === best) {
                ways.push(way);
            }
        }
        const index = Jam.Helper.getRandom(0, ways.length - 1);
        this.complete(ways[index].index);
    }

    resolveWayValue (way, depth, callback) {
        this.makeMove(way);
        let ways = this.ways.resolve(way.piece.color === Club.Draughts.LIGHT
            ? Club.Draughts.DARK
            : Club.Draughts.LIGHT);
        let best = null;
        for (const way of ways) {
            const value = depth < this.maxDepth
                ? this.resolveWayValue(way, depth + 1)
                : way.value;
            if (best === null || value > best) {
                best = value;
            }
        }
        this.cancelMove(way);
        if (best === null) {
            return this.values.win + this.values.depth * depth;
        }
        return way.value - best;
    }

    createWayFromSource (source) {
        let value = 0;
        let capturedKings = 0;
        let capturedKing = null;
        let piece = this.board.getPieceByPos(source.piece.cell.pos);
        let points = [];
        let index = source.index;
        for (let {cell, crowned, capture} of source.points) {
            points.push({
                cell: this.board.getCell(cell.pos.x, cell.pos.y),
                crowned: crowned,
                capture: capture && this.board.getPieceByPos(capture.cell.pos)
            });
            if (!capture) {
                continue;
            }
            if (capture.crowned) {
                capturedKing = capture;
                capturedKings++;
            } else {
                value += this.values.man;
            }
        }
        if (capturedKing) {
            value += this.values.king * capturedKings;
            if (capturedKings === this.kings[capturedKing.color]) {
                value += this.values.firstKing;
            }
        }
        if (points[points.length - 1].crowned !== piece.crowned) {
            value += this.values.coronation;
            if (this.kings[piece.color] === 0) {
                value += this.values.firstKing;
            }
        }
        return {value, piece, points, index};
    }

    makeMove ({piece, points}) {
        for (const {capture} of points) {
            if (capture) {
                capture.removed = true;
                capture.cell.piece = null;
                if (capture.crowned) {
                    this.kings[capture.color]--;
                }
            }
        }
        const target = points[points.length - 1];
        piece.cell.piece = null;
        piece.cell = target.cell;
        if (piece.crowned !== target.crowned) {
            this.kings[piece.color]++;
        }
        piece.crowned = target.crowned;
        target.cell.piece = piece;
    }

    cancelMove ({piece, points}) {
        for (const {capture} of points) {
            if (capture) {
                capture.removed = false;
                capture.cell.piece = capture;
                if (capture.crowned) {
                    this.kings[capture.color]++;
                }
            }
        }
        const target = points[0];
        piece.cell.piece = null;
        piece.cell = target.cell;
        if (piece.crowned !== target.crowned) {
            this.kings[piece.color]--;
        }
        piece.crowned = target.crowned;
        piece.cell.piece = piece;
    }

    resolveDraw (done) {
        this.done = done;
        this.values = this.getBaseValues();
        this.maxDepth = this.getMaxDepth();
        this.board = new Club.DraughtsThinkerSolverBoard(this);
        this.kings = this.board.kings;
        this.ways = new Club.DraughtsThinkerSolverWays(this);
        let best = null;
        for (const source of this.play.ways) {
            const way = this.createWayFromSource(source);
            const value = this.resolveWayValue(way, 1);
            if (best === null || value > best) {
                best = value;
            }
        }
        const kings = this.kings[this.player.getOppositeColor()];
        this.complete(best > 0 || (best === 0 && kings > 0));
    }

    complete (result) {
        const delay = this.constructor.FINAL_DELAY - (Date.now() - this.startTime);
        return setTimeout(() => this.done?.(result), delay);
    }
};