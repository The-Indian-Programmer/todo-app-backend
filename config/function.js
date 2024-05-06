
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const uuid = require('uuid');
const moment = require('moment');

const isEmpty = (obj) => { 
    if (obj === 'undefined') return true;
    if (obj === 'null') return true;
    if (obj === null) return true;
    if (obj === undefined) return true;
    if (obj === '') return true;
    if (obj === 0) return true;
    if (obj === false) return true;
    if (typeof obj === 'object' && Object.keys(obj).length === 0) return true;
    if (Array.isArray(obj) && obj.length === 0) return true;
    return false;
};

const generateToken = (data) => {
    return jwt.sign(data, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });
}

const verifyToken = (token) => { 
    return jwt.verify(token, process.env.JWT_SECRET_KEY);
 }

const hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
}

const comparePassword = (password, hash) => {
    return bcrypt.compareSync(password, hash);
}

const generateRandomString = (length) => {
    return crypto.randomBytes(length).toString('hex');
}

const generateUniqueId = () => {
    return uuid.v4();
}

const getCurrentTime = () => {
    return moment().utc().format('YYYY-MM-DD HH:mm:ss');
}
    
module.exports = {
    isEmpty, generateToken, verifyToken, hashPassword, comparePassword, generateRandomString, generateUniqueId, getCurrentTime
}