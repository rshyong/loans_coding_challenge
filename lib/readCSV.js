'use strict';

const fs = require('fs');
const csv = require('csv-parser')

function readCSV(filepath) {
    let results = [];
    return new Promise((resolve, reject) => {
        let rs = fs.createReadStream(filepath);
        rs.on('error', function(err){ reject(err) });
        rs.pipe(csv()).on('data', (data) => results.push(data))
        .on('end', () => {
          resolve(results);
        });
    });
}

module.exports = readCSV;