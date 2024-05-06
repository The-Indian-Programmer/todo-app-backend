'use strict';
const { models } = require('../config/modelConfig');

const SuperDao = require('./SuperDao');

class UsersDao extends SuperDao {
    constructor() {
        super(models.users);
    }
}


module.exports = UsersDao;