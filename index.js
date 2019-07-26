'use strict';

const readCSV = require('./lib/readCSV.js');
const writeCSV = require('./lib/writeCSV.js');
const Big = require('big.js');

/**
 * Create a facilities map with bank name and associated covenants
 * @param {Object} obj Object containing facilities, covenatns, and banks
 * @param {Array} obj.facilities Facilities array from csv file
 * @param {Array} obj.covenants Covenants array from csv file
 * @param {Array} obj.banks Banks array from csv file
 */
function createFacilitiesMap(obj) {
    let { facilities, covenants, banks } = obj;
    // map list of bank ids with bank names
    let banksMap = {};
    for (let i = 0 ; i< banks.length; i++) {
        let bank = banks[i];
        banksMap[bank.id] = {
            name: bank.name,
            facilities: []
        };
    }
    // map list of facility ids with facility info; also map facilities to bank
    let facilitiesMap = {};
    for (let i = 0 ; i < facilities.length; i++) {
        let facility = facilities[i];
        facilitiesMap[facility.id] = {
            amount: facility.amount,
            interest_rate: facility.interest_rate,
            bank_name: banksMap[facility.bank_id].name,
            banned_states: {}
        };
        banksMap[facility.bank_id].facilities.push(facility.id);
    }
    for (let i = 0; i < covenants.length; i++) {
        let covenant = covenants[i];
        let { facility_id, bank_id, max_default_likelihood, banned_state } = covenant;
        if (facility_id) {
            // add covenant to facility
            if (max_default_likelihood) facilitiesMap[facility_id].max_default_likelihood = max_default_likelihood;
            if (banned_state) facilitiesMap[facility_id].banned_states[banned_state] = true;
        } else {
            // add covenant to all facilities associated with bank_id
            let bankFacilities = banksMap[bank_id].facilities;
            for (let j = 0 ; j < bankFacilities.length; j++) {
                let bankFacilityId = bankFacilities[j];
                if (max_default_likelihood) facilitiesMap[bankFacilityId].max_default_likelihood = max_default_likelihood;
                if (banned_state) facilitiesMap[bankFacilityId].banned_states[banned_state] = true;
            }
        }
    }
    return facilitiesMap;
}

/**
 * Calculate yield for facility
 * @param {Object} obj Object containing loan object, facility id, facility obj and yields obj
 * @param {Object} loan Loan object
 * @param {String} id Facility id
 * @param {Object} facility Facility object
 * @param {Object} yields Running yields object
 */
function calculateYield(obj) {
    let { loan, id, facility, yields } = obj;
    let expInterest = (Big(1).minus(Big(loan.default_likelihood))).times(Big(loan.amount)).times(Big(loan.interest_rate));
    let expLoss = Big(loan.default_likelihood).times(Big(loan.amount));
    let facCost = Big(facility.interest_rate).times(Big(loan.amount));
    let loanYield = expInterest.minus(expLoss).minus(facCost);
    // Debugging line to make sure none of the yields are negative
    if (loanYield.lte(0)) {
        console.log('Loan yield should not be negative/ 0', { loan, id, facility });
    }
    if (yields[id]) {
        yields[id] = Big(yields[id]).plus(loanYield).toFixed(0);
    } else {
        yields[id] = loanYield.toFixed(0);
    }
}

/**
 * Assign loans to facilities and calculate running yield of each facility
 * @param {Object} obj Object contaiing loans, facilities and facilitiesMap
 * @param {Array} obj.loans Loans array from csv file
 * @param {Array} obj.facilities Facilities array from csv file
 * @param {Object} obj.facilitiesMap Map of facilities with covenants and bank name included
 */
function assignAndCalcYield(obj) {
    let { loans, facilities, facilitiesMap } = obj;
    let assignments = [];
    let yields = {};
    for (let i = 0; i < loans.length; i++) {
        let loan = loans[i];
        for (let j = 0; j < facilities.length; j++) {
            let facility = facilitiesMap[facilities[j].id];
            if (Big(loan.amount).lte(Big(facility.amount)) && !facility.banned_states[loan.state]) {
                if (!facility.max_default_likelihood || Big(loan.default_likelihood).lte(Big(facility.max_default_likelihood))) {
                    facility.amount = Big(facility.amount).minus(Big(loan.amount)).toFixed();
                    assignments.push({
                        loan_id: loan.id,
                        facility_id: facilities[j].id
                    });
                    calculateYield({ loan, id: facilities[j].id, facility, yields });
                    break;
                }
            }
        }
    };
    // turn yields obj to array
    let yieldsArr = Object.keys(yields).map(facility_id => {
        return {
            facility_id,
            expected_yield: yields[facility_id]
        };
    });
    return {
        assignments, 
        yields: yieldsArr
    };
}

/**
 * Main function. Sorts loans into facilities and calculates yields
 */
async function sortLoans() {
    // Read CSV files
    let files, loans, banks, facilities, covenants;
    let str = process.env.FOLDER;
    try {
        let loansCSV = readCSV(`input/${str}/loans.csv`);
        let banksCSV = readCSV(`input/${str}/banks.csv`);
        let facCSV = readCSV(`input/${str}/facilities.csv`);
        let covCSV = readCSV(`input/${str}/covenants.csv`);
        files = await Promise.all([loansCSV, banksCSV, facCSV, covCSV]);
    } catch (err) {
        return console.error('Error reading file(s)', err);
    }
    [loans, banks, facilities, covenants ] = files;
    // sort facilities from lowest to highest based on interest rate
    facilities.sort((a, b) => {
        return Big(a.interest_rate).gte(Big(b.interest_rate));
    });
    // add covenants and other info to each facility
    let facilitiesMap = createFacilitiesMap({facilities, covenants, banks});
    // assign loans to facilities and calculate yield for each facility
    let { assignments, yields } = assignAndCalcYield({loans, facilities, facilitiesMap});
    // write assignments and yields to csv
    try {
        let writeAssignments = writeCSV({ name: 'assignments', records: assignments });
        let writeYields = writeCSV({ name: 'yields', records: yields });
        await Promise.all([writeAssignments, writeYields ]);
        console.log('Done! Check output file');
    } catch(err) {
        console.error('Error writing file(s)', err);
    }
}

sortLoans();