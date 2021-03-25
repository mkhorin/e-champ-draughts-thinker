/**
 * @copyright Copyright (c)2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('e-champ/arena/Bot');

module.exports = class ThinkerBot extends Base {

    constructor (config) {
        super({
            staticSource: 'web',
            ...config
        })
    }
};
module.exports.init(module);
