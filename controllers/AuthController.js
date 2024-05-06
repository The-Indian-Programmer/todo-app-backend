'use strict';

const httpStatus = require('http-status');

const AuthService = require('../dbService/AuthService');
class AuthController {
    constructor() { 
        this.authService = new AuthService();
    }

    register = async (req, res) => {
        try {
            const formData = req.body;
            const response = await this.authService.register(formData);
            
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message:  error.message });
        }
    }

    login = async (req, res) => { 
        try {
            const formData = req.body;
            const response = await this.authService.login(formData);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message:  error.message });
        }
    }

    refreshToken = async (req, res) => {
        try {
            const userData = req.user;
            const response = await this.authService.refreshToken(userData);
            return res.status(response.code).json(response);
        } catch (error) {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message:  error.message });
        }
    }

}

module.exports = AuthController;