/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = {

    Class: require('../ThinkerBot'),

    label: 'Thinker',
    params: {
        depth: [1, 2],
        solver: 'DraughtsThinkerSolver',
        values: {
            coronation: 4,
            firstKing: 8,
            king: 6,
            man: 2
        },
        losingValues: {
            coronation: 0,
            firstKing: 0,
            king: -6,
            man: -2
        }
    },
    templates: {
        play: 'template/play'
    },
    translations: {
        'ru': {
            label: 'Мыслитель'
        }
    },
    assets: require('./default-assets')
};