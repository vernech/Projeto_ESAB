const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: "us-cdbr-east-06.cleardb.net",
    user: "b2bef1f1da2a51",
    password: "f8e7efff",
    database: "heroku_a193cf3c95f45fc",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;