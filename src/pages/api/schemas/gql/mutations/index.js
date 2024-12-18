const fs = require('fs');
const path = require('path');

module.exports.setUser = fs.readFileSync(path.join(__dirname, 'setUser.gql'), 'utf8');
module.exports.saveUserDocument = fs.readFileSync(path.join(__dirname, 'saveUserDocument.gql'), 'utf8');
module.exports.deleteUserDocument = fs.readFileSync(path.join(__dirname, 'deleteUserDocument.gql'), 'utf8');
