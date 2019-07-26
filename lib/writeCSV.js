'use strict';

const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function writeCSV(obj) {
    let { name, records } = obj;
    let header = Object.keys(records[0]).map(key => {
        return {
            id: key,
            title: key
        };
    });

    try {
        await new Promise ((resolve, reject) => {
            fs.mkdir('output', function(err) {
                if (err) {
                    if (err.code == 'EEXIST') resolve(); // ignore the error if the folder already exists
                    else reject(err); // something else went wrong
                } else resolve('success'); // successfully created folder
            });
        });
    } catch(err) {
        throw new Error(err);
    }

    const csvWriter = createCsvWriter({
        path: `output/${name}.csv`,
        header
    });
     
    return csvWriter.writeRecords(records);
}

module.exports = writeCSV;