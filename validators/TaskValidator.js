const joi = require('joi');
const httpStatus = require('http-status');

const options = {
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true
};

const createTaskValidator = (req, res, next) => {
    const { title, priority, description } = req.body;
    const schema = joi.object({ 
        title: joi.string().required().messages({ 'any.required': 'Title is required' }).max(50).messages({ 'string.max': 'Title must be at most 50 characters' }),
        priority: joi.string().required().messages({ 'any.required': 'Priority is required' }).valid('low', 'medium', 'high').messages({ 'any.only': 'Priority must be low, medium or high' }),
        description: joi.string().required().messages({ 'any.required': 'Description is required' }).min(10).messages({ 'string.min': 'Description must be at least 10 characters' }).max(500).messages({ 'string.max': 'Description must be at most 500 characters' })
    });

    const { error } = schema.validate({ title, priority, description }, options);

    if (error) {
        const message = error.details[0].message.replace(/['"]+/g, '');
        return res.status(httpStatus.BAD_REQUEST).json({ status: false, message })
    }



    next();

}

const getTaskListValidator = (req, res, next) => {
    const schema = joi.object({
        page: joi.number().integer().min(1).messages({ 'number.min': 'Page must be at least 1' }),
        perPage: joi.number().integer().min(1).messages({ 'number.min': 'Per page must be at least 1' }),
        sort: joi.string().valid('id', 'title', 'priority', 'createdAt').messages({ 'any.only': 'Sort must be id, title, priority or createdAt' }),
        sortOrder: joi.string().valid('asc', 'desc').messages({ 'any.only': 'Sort order must be asc or desc' })
    });
    
    const { error } = schema.validate({ taskId: req.params.taskId }, options);
    
    if (error) {
        const message = error.details[0].message.replace(/['"]+/g, '');
        return res.status(httpStatus.BAD_REQUEST).json({ status: false, message })
    }
    
    next();
}


const updateTaskPriorityValidator = (req, res, next) => {
    const { taskId, priority } = req.body;
    const schema = joi.object({
        taskId: joi.string().required().messages({ 'any.required': 'Task ID is required' }),
        priority: joi.string().required().messages({ 'any.required': 'Priority is required' }).valid('low', 'medium', 'high').messages({ 'any.only': 'Priority must be low, medium or high' })
    });
    
    const { error } = schema.validate({ taskId, priority }, options);
    
    if (error) {
        const message = error.details[0].message.replace(/['"]+/g, '');
        return res.status(httpStatus.BAD_REQUEST).json({ status: false, message })
    }
    
    next();
    
}

const deleteTaskValidator = (req, res, next) => {
    const { taskId } = req.body;
    const schema = joi.object({
        taskId: joi.string().required().messages({ 'any.required': 'Task ID is required' }),
    });
    
    const { error } = schema.validate({ taskId }, options);
    
    if (error) {
        const message = error.details[0].message.replace(/['"]+/g, '');
        return res.status(httpStatus.BAD_REQUEST).json({ status: false, message })
    }
    
    next();
    
}



const getOneTaskValidator = (req, res, next) => {
    const schema = joi.object({
        taskId: joi.string().required().messages({ 'any.required': 'Task ID is required' }),
    });
    
    const { error } = schema.validate({ taskId: req.body.taskId }, options);
    
    if (error) {
        const message = error.details[0].message.replace(/['"]+/g, '');
        return res.status(httpStatus.BAD_REQUEST).json({ status: false, message })
    }
    
    next();
}


const updateTaskValidator = (req, res, next) => {
    const { title, priority, description, taskId } = req.body;
    const schema = joi.object({ 
        taskId: joi.string().required().messages({ 'any.required': 'Task ID is required' }),
        title: joi.string().required().messages({ 'any.required': 'Title is required' }).max(50).messages({ 'string.max': 'Title must be at most 50 characters' }),
        priority: joi.string().required().messages({ 'any.required': 'Priority is required' }).valid('low', 'medium', 'high').messages({ 'any.only': 'Priority must be low, medium or high' }),
        description: joi.string().required().messages({ 'any.required': 'Description is required' }).min(10).messages({ 'string.min': 'Description must be at least 10 characters' }).max(500).messages({ 'string.max': 'Description must be at most 500 characters' })
    });

    const { error } = schema.validate({ title, priority, description, taskId }, options);

    if (error) {
        const message = error.details[0].message.replace(/['"]+/g, '');
        return res.status(httpStatus.BAD_REQUEST).json({ status: false, message })
    }



    next();

}

module.exports = {
    createTaskValidator, getTaskListValidator,  updateTaskPriorityValidator, deleteTaskValidator, getOneTaskValidator, updateTaskValidator
}


