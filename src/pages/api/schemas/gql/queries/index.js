const fs = require('fs');
const path = require('path');

module.exports.getUser = fs.readFileSync(path.join(__dirname, 'getUser.gql'), 'utf8');
module.exports.getUserDocuments = fs.readFileSync(path.join(__dirname, 'getUserDocuments.gql'), 'utf8');
