const express = require('express');
const router = express.Router();
const TaskController = require('../../controllers/TaskController');
const { createTaskValidator, getTaskListValidator, updateTaskPriorityValidator, deleteTaskValidator, getOneTaskValidator, updateTaskValidator } = require('../../validators/TaskValidator');
const { verifyToken } = require('../../middleware/authMiddleware');


const taskController = new TaskController();



router.post('/create', verifyToken, createTaskValidator, taskController.createTask);
router.post('/stats', verifyToken, taskController.taskStats);
router.post('/list', verifyToken, getTaskListValidator, taskController.getTaskList);
router.post('/update-priority', verifyToken, updateTaskPriorityValidator, taskController.updateTaskPriority);
router.post('/delete', verifyToken, deleteTaskValidator, taskController.deleteTask);
router.post('/get', verifyToken, getOneTaskValidator, taskController.getTaskInfo);
router.post('/update', verifyToken, updateTaskValidator, taskController.updateTask);



module.exports = router;