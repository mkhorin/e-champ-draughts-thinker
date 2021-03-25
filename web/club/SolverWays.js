/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DraughtsThinkerSolverWays = class DraughtsThinkerSolverWays {

    static DARK_FORWARD_STEPS = [[1, -1], [-1, -1]];
    static LIGHT_FORWARD_STEPS = [[1, 1], [-1, 1]];
    static STEPS = [[1, -1], [-1, -1], [1, 1], [-1, 1]];

    constructor (solver) {
        this.board = solver.board;
        this.values = solver.values;
    }

    resolve (color) {
        this.color = color;
        if (color === Club.Draughts.LIGHT) {
            this.crownY = this.board.size - 1;
            this.forwardSteps = this.constructor.LIGHT_FORWARD_STEPS;
        } else {
            this.crownY = 0;
            this.forwardSteps = this.constructor.DARK_FORWARD_STEPS;
        }
        this.pieces = this.board.pieces[color];
        this.ways = [];
        this.resolveCaptures();
        if (!this.ways.length) {
            this.resolveMoves();
        }
        return this.ways;
    }

    resolveCaptures () {
        for (const piece of this.pieces) {
            if (piece.removed) {
                continue;
            }
            this.way = {
                points: [{
                    cell: piece.cell,
                    crowned: piece.crowned
                }],
                value: 0,
                piece
            };
            piece.crowned
                ? this.resolveKingCaptures()
                : this.resolveManCaptures();
        }
    }

    resolveKingCaptures () {
        let captured = false;
        let point = this.way.points[this.way.points.length - 1];
        for (const [dx, dy] of this.constructor.STEPS) {
            const piece = this.getClosestPiece(point.cell, dx, dy);
            if (!piece || piece.color === this.color || piece.captured) {
                continue;
            }
            piece.captured = true;
            this.way.value += piece.value;
            let cell = null;
            let x = piece.cell.x;
            let y = piece.cell.y;
            let nextCapture = false;
            let points = [];
            while (true) {
                cell = this.board.getCell(x += dx, y += dy);
                if (!cell || cell.piece) {
                    break;
                }
                const point = {
                    capture: piece,
                    crowned: true,
                    cell
                };
                points.push(point);
                this.way.points.push(point);
                if (this.resolveKingCaptures()) {
                    nextCapture = true;
                }
                this.way.points.pop();
                captured = true;
            }
            if (captured && !nextCapture) {
                for (const point of points) {
                    const points = this.way.points.slice();
                    points.push(point);
                    this.ways.push({
                        piece: this.way.piece,
                        value: this.way.value,
                        points
                    });
                }
            }
            this.way.value -= piece.value;
            piece.captured = false;
        }
        return captured;
    }

    getClosestPiece (cell, dx, dy) {
        let x = cell.x;
        let y = cell.y;
        do {
            cell = this.board.getCell(x += dx, y += dy);
        } while (cell && !cell.piece);
        return cell?.piece;
    }

    resolveManCaptures () {
        let captured = false;
        let point = this.way.points[this.way.points.length - 1];
        for (let [dx, dy] of this.constructor.STEPS) {
            let x = point.cell.x + dx;
            let y = point.cell.y + dy;
            let piece = this.board.getCell(x, y)?.piece;
            if (!piece || piece.color === this.color || piece.captured) {
                continue;
            }
            let cell = this.board.getCell(x += dx, y += dy);
            if (!cell || cell.piece) {
                continue;
            }
            if (y === this.crownY) {
                this.way.value += this.values.coronation;
                this.resolveNextCapture(cell, true, piece);
                this.way.value -= this.values.coronation;
            } else {
                this.resolveNextCapture(cell, false, piece);
            }
            captured = true;
        }
        return captured;
    }

    resolveNextCapture (cell, crowned, capture) {
        capture.captured = true;
        this.way.points.push({cell, crowned, capture});
        this.way.value += capture.value;
        const captured = crowned
            ? this.resolveKingCaptures()
            : this.resolveManCaptures();
        if (!captured) {
            this.ways.push({
                piece: this.way.piece,
                points: this.way.points.slice(),
                value: this.way.value
            });
        }
        this.way.value -= capture.value;
        this.way.points.pop();
        capture.captured = false;
    }

    resolveMoves () {
        for (const piece of this.pieces) {
            if (piece.removed) {
                continue;
            }
            this.way = {
                points: [{
                    cell: piece.cell,
                    crowned: piece.crowned
                }],
                piece
            };
            piece.crowned
                ? this.resolveKingMoves()
                : this.resolveManMoves();
        }
    }

    resolveKingMoves () {
        const piece = this.way.piece;
        for (const [dx, dy] of this.constructor.STEPS) {
            let x = piece.cell.x;
            let y = piece.cell.y;
            let cell = null;
            while (true) {
                cell = this.board.getCell(x += dx, y += dy);
                if (!cell || cell.piece) {
                    break;
                }
                this.ways.push({
                    piece: this.way.piece,
                    points: [this.way.points[0], {crowned: true, cell}],
                    value: 0
                });
            }
        }
    }

    resolveManMoves () {
        for (let [dx, dy] of this.forwardSteps) {
            let x = this.way.piece.cell.x + dx;
            let y = this.way.piece.cell.y + dy;
            let cell = this.board.getCell(x, y);
            if (!cell || cell.piece) {
                continue;
            }
            let crowned = this.crownY === y;
            this.ways.push({
                piece: this.way.piece,
                points: [this.way.points[0], {crowned, cell}],
                value: crowned ? this.values.coronation : 0
            });
        }
    }
};