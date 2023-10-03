const fs = require('fs');
const path = require('path');

module.exports.setUser = fs.readFileSync(path.join(__dirname, 'setUser.gql'), 'utf8');
module.exports.saveUserTable = fs.readFileSync(path.join(__dirname, 'saveUserTable.gql'), 'utf8');
module.exports.deleteUserTable = fs.readFileSync(path.join(__dirname, 'deleteUserTable.gql'), 'utf8');
