'use strict';


const httpStatus = require('http-status');

const UsersDao = require('../dao/UsersDao');
const responsHandler = require('../helper/response');
const {logger} = require('../helper/logger');
const { isEmpty, hashPassword, generateUniqueId, getCurrentTime, comparePassword, generateToken } = require('../config/function');

class AuthService {
    constructor() { 
        this.usersDao = new UsersDao();
    }

    register = async (bodyData) => {
        try {
            const { email, password, confirmPassword } = bodyData;
            
            const isEmailExists = await this.usersDao.findOneByWhere({ email }, ['email']);


            if (email.includes('+')) return responsHandler.returnError(httpStatus.BAD_REQUEST, msgHelper.message('en', 'INVALID_EMAIL'));

            if (isEmailExists) return responsHandler.returnError(httpStatus.BAD_REQUEST, msgHelper.message('en', 'EMAIL_EXISTS'));

            if (password !== confirmPassword) return responsHandler.returnError(httpStatus.BAD_REQUEST, msgHelper.message('en', 'PASSWORD_MISMATCH'));
            
            const newUserData = {
                userId: generateUniqueId(),
                email,
                password: hashPassword(password),
                createdAt: getCurrentTime(),
                updatedAt: getCurrentTime()
            }

            const response = await this.usersDao.create(newUserData);

            if (isEmpty(response)) return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));

            return responsHandler.returnSuccess(httpStatus.CREATED, msgHelper.message('en', 'REGISTER_SUCCESS'), {});


        } catch (error) {
            logger.error(`AuthService.register ${error.message}`);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));

        }
    }

    login = async (bodyData) => {
        try {
            const { email, password } = bodyData;
            const user = await this.usersDao.findOneByWhere({ email }, ['email', 'password', 'id', 'userId']);

            if (!user) return responsHandler.returnError(httpStatus.BAD_REQUEST, msgHelper.message('en', 'INVALID_CREDENTIALS'));

            const isPasswordMatch = comparePassword(password, user.password);


            if (!isPasswordMatch) return responsHandler.returnError(httpStatus.BAD_REQUEST, msgHelper.message('en', 'INVALID_CREDENTIALS'));


            const userData = {
                id: user.id,
                email: user.email,
                userId: user.userId,
            }

            const token = generateToken(userData);

            return responsHandler.returnSuccess(httpStatus.OK, msgHelper.message('en', 'LOGIN_SUCCESS'), {
                token: token,
                user: userData
            });

        } catch (error) {
            
            logger.info(`AuthService.login ${error.message}`);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));
        }
    }

    refreshToken = async (userData) => {
        try {
            const { id, email, userId } = userData;
            const user = await this.usersDao.findOneByWhere({ id }, ['id', 'email', 'userId']);

            if (!user) return responsHandler.returnError(httpStatus.BAD_REQUEST, msgHelper.message('en', 'INVALID_USER'));

            return responsHandler.returnSuccess(httpStatus.OK, msgHelper.message('en', 'TOKEN_REFRESH'), user);

        } catch (error) {
            logger.error(`AuthService.refreshToken ${error.message}`);
            return responsHandler.returnError(httpStatus.INTERNAL_SERVER_ERROR, msgHelper.message('en', 'INTERNAL_SERVER_ERROR'));
        }
    }
}

module.exports = AuthService;