'use strict';
const { models } = require('../config/modelConfig');

const SuperDao = require('./SuperDao');

class UsersDao extends SuperDao {
    constructor() {
        super(models.tasks);
    }

    getTaskList = async ({ userId, offset, limit, order }) => {
        let response = await this.model.findAndCountAll({
            where: { userId, status: 1 },
            attributes: ['taskId', 'title', 'description', 'priority', 'taskStatus', 'createdAt'],
            offset,
            limit,
            order
        });
        return response;

    }
    
}


module.exports = UsersDao;