'use strict';


const httpStatus = require('http-status');
const TaskDao = require('../dao/TaskDao');
const responsHandler = require('../helper/response');
const {logger} = require('../helper/logger');
const { generateUniqueId, getCurrentTime } = require('../config/function');
const { defaultPageLimit, defaultPage, defaultSort, defaultSortOrder } = require('../config/config');

class TaskService {
    constructor() { 
        this.taskDao = new TaskDao();
    }

    createTask = async (data, user) => {
        try {
            const { title, description, priority } = data;
            const { id: userId } = user;

            const task = {
                userId,
                taskId: generateUniqueId(),
                title,
                description,
                priority,
                createdBy: userId,
                updatedBy: userId,
                createdAt: getCurrentTime(),
                updatedAt: getCurrentTime()
            }

            const response = await this.taskDao.create(task);
            if (!response) return responsHandler.error(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));

            return responsHandler.returnSuccess(httpStatus.CREATED, msgHelper.message('en', 'TASK_CREATED'))

        } catch (error) {
            logger.error('TaskService.createTask', error);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
        }
    }

    taskStats = async (user) => {
        try {
            const { id: userId } = user;
            const response = await this.taskDao.findAllByWhere({ userId, status: 1 }, ['taskStatus']);

            if (!response) return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));

            const taskStats = {
                total: response.length,
                completed: response.filter(task => task.taskStatus === 'completed').length,
                inProgress: response.filter(task => task.taskStatus === 'in-progress').length,
                todo: response.filter(task => task.taskStatus === 'todo').length
            }

            return responsHandler.returnSuccess(httpStatus.OK, msgHelper.message('en', 'TASK_FETCHED'), taskStats);
        } catch (error) {
            console.log(error)
            logger.error('TaskService.taskStats', error);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
        }
    }

    getTaskList = async (formData, user) => {
        try {
            const { id: userId } = user;
            const { page = defaultPage, perPage = defaultPageLimit, sort = defaultSort, sortOrder = defaultSortOrder } = formData;

            const offset = (page - 1) * perPage;
            const limit = perPage;
            const order = [[sort, sortOrder]];

            const response = await this.taskDao.getTaskList({ userId, offset, limit, order });
            if (!response) return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));

            const { rows, count } = response;
            const responseData = {
                data: rows,
                total: count,
            }
            return responsHandler.returnSuccess(httpStatus.OK, msgHelper.message('en', 'TASK_FETCHED'), responseData);

        } catch (error) {
            console.log(error)
            logger.error('TaskService.getTaskList', error);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
        }
    }

    updateTaskPriority = async (data, user) => {
        try {
            const { taskId, priority } = data;
            const { id: userId } = user;

            const taskInfo = await this.taskDao.findOneByWhere({ userId, taskId }, ['taskId', 'priority']);

            if (!taskInfo) return responsHandler.returnError(httpStatus.NOT_FOUND, msgHelper.message('en', 'TASK_NOT_FOUND'));

            const response = await this.taskDao.update({ priority, updatedBy: userId, updatedAt: getCurrentTime() }, { userId, taskId });

            if (!response) return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));

            return responsHandler.returnSuccess(httpStatus.OK, msgHelper.message('en', 'TASK_UPDATED'));

        } catch (error) {
            console.log(error)
            logger.error('TaskService.updateTaskPriority', error);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));
        }
    }

    deleteTask = async (data, user) => {
        try {
            const { taskId } = data;
            const { id: userId } = user;

            const taskInfo = await this.taskDao.findOneByWhere({ userId, taskId }, ['taskId']);

            if (!taskInfo) return responsHandler.returnError(httpStatus.NOT_FOUND, msgHelper.message('en', 'TASK_NOT_FOUND'));

            const updateData = {
                status: 0,
                updatedBy: userId,
                updatedAt: getCurrentTime()
            }
            const response = await this.taskDao.update(updateData, { userId, taskId });

            if (!response) return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));

            return responsHandler.returnSuccess(httpStatus.OK, msgHelper.message('en', 'TASK_DELETED'));

        } catch (error) {
            console.log(error)
            logger.error('TaskService.deleteTask', error);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
        }
    }

    getTaskInfo = async (data, user) => {
        try {
            const { taskId } = data;
            const { id: userId } = user;

            const taskInfo = await this.taskDao.findOneByWhere({ userId, taskId }, ['taskId', 'title', 'priority', 'description']);

            if (!taskInfo) return responsHandler.returnError(httpStatus.NOT_FOUND, msgHelper.message('en', 'TASK_NOT_FOUND'));

            return responsHandler.returnSuccess(httpStatus.OK, msgHelper.message('en', 'TASK_FETCHED'), taskInfo);

        } catch (error) {
            console.log(error)
            logger.error('TaskService.getTaskInfo', error);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
        }
    }

    updateTask = async (data, user) => {
        try {
            const { taskId, title, priority, description } = data;
            const { id: userId } = user;

            const taskInfo = await this.taskDao.findOneByWhere({ userId, taskId }, ['taskId']);

            if (!taskInfo) return responsHandler.returnError(httpStatus.NOT_FOUND, msgHelper.message('en', 'TASK_NOT_FOUND'));

            const updateData = {
                title,
                priority,
                description,
                updatedBy: userId,
                updatedAt: getCurrentTime()
            }
            const response = await this.taskDao.update(updateData, { userId, taskId });

            if (!response) return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));

            return responsHandler.returnSuccess(httpStatus.OK, msgHelper.message('en', 'TASK_UPDATED'));
        } catch (error) {
            console.log(error)
            logger.error('TaskService.updateTask', error);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, 'Internal Server Error');
        }
    }
}

module.exports = TaskService;