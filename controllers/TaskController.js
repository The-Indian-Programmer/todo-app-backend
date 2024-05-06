'use strict';

const httpStatus = require('http-status');
const TaskService = require('../dbService/TaskService');

class TaskController {
    constructor() { 
        this.taskService = new TaskService();
    }

    createTask = async (req, res) => { 
        try {
            const user = req.user;
            const data = req.body;
            const response = await this.taskService.createTask(data, user);
            return res.status(response.code).json(response);
        } catch (error) {
            console.log(error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: msgHelper.message('en', "INTERNAL_SERVER_ERROR") });
        }
    }

    taskStats = async (req, res) => {
        try {
            const user = req.user;
            const response = await this.taskService.taskStats(user);
            return res.status(response.code).json(response);
        } catch (error) {
            console.log(error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: msgHelper.message('en', "INTERNAL_SERVER_ERROR") });
        }
     }

    getTaskList = async (req, res) => {
        try {
            const user = req.user;
            const formData = req.body;
            const response = await this.taskService.getTaskList(formData, user);

            return res.status(response.code).json(response);

        } catch (error) {
            console.log(error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: msgHelper.message('en', "INTERNAL_SERVER_ERROR") });
        }
     }

    updateTaskPriority = async (req, res) => { 
        try {
            const user = req.user;
            const data = req.body;
            const response = await this.taskService.updateTaskPriority(data, user);
            return res.status(response.code).json(response);
        } catch (error) {
            console.log(error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: msgHelper.message('en', "INTERNAL_SERVER_ERROR") });
        }
    }

    deleteTask = async (req, res) => {
        try {
            const user = req.user;
            const data = req.body;
            const response = await this.taskService.deleteTask(data, user);
            return res.status(response.code).json(response);
        } catch (error) {
            console.log(error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: msgHelper.message('en', "INTERNAL_SERVER_ERROR") });
        }
        
     }


    getTaskInfo = async (req, res) => { 
        try {
            const user = req.user;
            const data = req.body;
            const response = await this.taskService.getTaskInfo(data, user);
            return res.status(response.code).json(response);
        } catch (error) {
            console.log(error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: msgHelper.message('en', "INTERNAL_SERVER_ERROR") });
        }
    }

    updateTask = async (req, res) => { 
        try {
            const user = req.user;
            const data = req.body;
            const response = await this.taskService.updateTask(data, user);
            return res.status(response.code).json(response);
        } catch (error) {
            console.log(error);
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: msgHelper.message('en', "INTERNAL_SERVER_ERROR") });
        }
    }

}


module.exports = TaskController;