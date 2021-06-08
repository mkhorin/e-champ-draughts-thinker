/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    build: [{
        Class: 'Packer',
        sources: [
            'club/Solver.js',
            'club/SolverWorker.js'
        ],
        target: 'vendor/thinker.min.js',
        copyright: `/* @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com> */\n`
    }, {
        Class: 'Packer',
        sources: [
            'club/Worker.js',
            'club/WorkerWays.js'
        ],
        target: 'vendor/thinker-worker.min.js',
        copyright: `/* @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com> */\n`
    }]
};