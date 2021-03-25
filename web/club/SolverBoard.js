/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
Club.DraughtsThinkerSolverBoard = class DraughtsThinkerSolverBoard {

    constructor (solver) {
        this.values = solver.values;
        this.playBoard = solver.play.board;
        this.size = this.playBoard.size;
        this.init();
    }

    getCell (x, y) {
        return this.cells[x]?.[y];
    }

    getPieceByPos (pos) {
        return this.cells[pos.x]?.[pos.y]?.piece;
    }

    init () {
        this.cells = Club.DraughtsBoard.createCellArrays(this.size);
        this.pieces = {
            [Club.Draughts.DARK]: [],
            [Club.Draughts.LIGHT]: []
        };
        this.kings = {
            [Club.Draughts.DARK]: 0,
            [Club.Draughts.LIGHT]: 0
        };
        for (const cell of Object.values(this.playBoard.cellMap)) {
            this.processCell(cell);
        }
    }

    processCell (source) {
        const cell = {
            x: source.pos.x,
            y: source.pos.y
        };
        this.cells[cell.x][cell.y] = cell;
        if (!source.piece) {
            return;
        }
        const piece = {
            color: source.piece.color,
            crowned: source.piece.crowned,
            value: source.piece.crowned ? this.values.king : this.values.man,
            cell
        };
        if (piece.crowned) {
            ++this.kings[piece.color];
        }
        this.pieces[piece.color].push(piece);
        cell.piece = piece;
    }
};