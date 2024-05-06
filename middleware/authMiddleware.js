const jwt = require('jsonwebtoken');
const helper = require('../config/function');
const httpStatus = require('http-status');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers['authorization'];
        if (!token) return res.status(httpStatus.UNAUTHORIZED).json({ status: false, message: msgHelper.message('en', 'UNAUTHORIZED') });

        const verify = helper.verifyToken(token);
        if (!verify) return res.status(httpStatus.UNAUTHORIZED).json({ status: false, message: msgHelper.message('en', 'UNAUTHORIZED') });

        req.user = verify;
        next();

    } catch (error) {
        return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ status: false, message: error.message });
    }
}


module.exports = { verifyToken }