/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

addEventListener('message', ({data}) => {
    const solver = new DraughtsThinkerWorkerSolver(data);
    const value = solver.resolveWayValue(data.way, 1);
    postMessage(value);
    close();
}, false);

class DraughtsThinkerWorkerSolver {

    static DARK = 'dark';
    static LIGHT = 'light';

    constructor (data) {
        this.cells = data.cells;
        this.kings = data.kings;
        this.maxDepth = data.maxDepth;
        this.pieces = data.pieces;
        this.values = data.values;
        this.ways = new DraughtsThinkerWorkerWays(this);
        this.moveCounter = 0;
    }

    resolveWayValue (way, depth, adjacentBestValue, parentWayValue) {
        this.makeMove(way);
        let color = way.piece.color === this.constructor.LIGHT
            ? this.constructor.DARK
            : this.constructor.LIGHT;
        let ways = this.ways.resolve(color);
        let best;
        for (let i = 0; i < ways.length; ++i) {
            let value = depth < this.maxDepth
                ? this.resolveWayValue(ways[i], depth + 1, best, way.value)
                : ways[i].value;
            value = way.value - value;
            if (best === undefined || value < best) {
                best = value;
                if (adjacentBestValue !== undefined) {
                    if (parentWayValue - best >= adjacentBestValue) {
                        break; // alpha-beta pruning
                    }
                }
            }
        }
        this.cancelMove(way);
        return best === undefined
            ? this.values.win + this.values.depth * depth
            : best;
    }

    makeMove ({piece, points}) {
        for (const {capture} of points) {
            if (capture) {
                capture.removed = true;
                capture.cell.piece = null;
                if (capture.crowned) {
                    --this.kings[capture.color]
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
        ++this.moveCounter;
    }

    cancelMove ({piece, points}) {
        for (const {capture} of points) {
            if (capture) {
                capture.removed = false;
                capture.cell.piece = capture;
                if (capture.crowned) {
                    ++this.kings[capture.color];
                }
            }
        }
        const target = points[0];
        piece.cell.piece = null;
        piece.cell = target.cell;
        if (piece.crowned !== target.crowned) {
            --this.kings[piece.color];
        }
        piece.crowned = target.crowned;
        piece.cell.piece = piece;
    }
}