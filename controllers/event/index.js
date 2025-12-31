'use strict';

const create = require('./create');
const list = require('./list');
const listByUser = require('./listByUser');
const view = require('./view');

const ticketsSetup = require('./ticketsSetup');
const ticketsList = require('./ticketsList');
const ticketsBuy = require('./ticketsBuy');

module.exports = {
    create,
    list,
    listByUser,
    view,
    ticketsSetup,
    ticketsList,
    ticketsBuy,
};
