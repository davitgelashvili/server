'use strict';

const register = require('./register');
const login = require('./login');
const refresh = require('./refresh');
const logout = require('./logout');
const me = require('./me');
const updateMe = require('./updateMe');

module.exports = {
    register,
    login,
    refresh,
    logout,
    me,
    updateMe,
};
