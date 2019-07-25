'use strict';

const createCsvWriter = require('csv-writer').createObjectCsvWriter;

function writeCSV(obj) {
    let { name, records } = obj;
    let header = Object.keys(records[0]).map(key => {
        return {
            id: key,
            title: key
        };
    });
    const csvWriter = createCsvWriter({
        path: `output/${name}.csv`,
        header
    });
     
    return csvWriter.writeRecords(records);
}

module.exports = writeCSV;