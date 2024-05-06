

const returnSuccess = (code, message, data) => {
    return { status: true, code: code, message: message, data: data };
}

const returnError = (code, message) => {
    return { status: false, code: code, message: message };
}




module.exports = {
    returnSuccess,
    returnError
}