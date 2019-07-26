'use strict';

const expect = require('chai').expect;
const { createFacilitiesMap, calculateYield, assignAndCalcYield } = require('../index.js');
const { readCSV } = require('../lib');
const path = require('path');
const Big = require('big.js');

describe('Loan sorting tests', function () {
  let files, loans, banks, facilities, covenants;
  before(async function() {
    // runs before all tests in this block
    try {
        let loansCSV = readCSV(path.join(__dirname, '../input/small/loans.csv'));
        let banksCSV = readCSV(path.join(__dirname, '../input/small/banks.csv'));
        let facCSV = readCSV(path.join(__dirname, '../input/small/facilities.csv'));
        let covCSV = readCSV(path.join(__dirname, '../input/small/covenants.csv'));
        files = await Promise.all([loansCSV, banksCSV, facCSV, covCSV]);
    } catch (err) {
        return console.error('Error reading file(s)', err);
    }
    [loans, banks, facilities, covenants ] = files;
    facilities.sort((a, b) => {
      return Big(a.interest_rate).minus(Big(b.interest_rate));
    });
  });

  describe('createFacilitiesMap', function () {
    it('returns a map of different facilities with associated bank name and covenants', function () {
      let facilitiesMap = createFacilitiesMap({ facilities, covenants, banks });
      let expectedAns = {
        '2': {
          amount: '61104.0',
          interest_rate: '0.07',
          bank_name: 'Chase',
          max_default_likelihood: '0.09',
          banned_states: {
            'MT': true
          }
        },
        '1': {
          amount: '126122.0',
          interest_rate: '0.06',
          bank_name: 'Bank of America',
          max_default_likelihood: '0.06',
          banned_states: {
            'VT': true,
            'CA': true
          }
        }
      };
      expect(facilitiesMap).to.deep.equal(expectedAns);
    });
  });

  describe('assignAndCalcYield', function () {
    it('returns a map of assignments and yields', function () {
      let facilitiesMap = createFacilitiesMap({ facilities, covenants, banks }); 
      let { assignments, yields } = assignAndCalcYield({ loans, facilities, facilitiesMap });
      const expAssignments = [
        { loan_id: '1', facility_id: '1' },
        { loan_id: '2', facility_id: '2' },
        { loan_id: '3', facility_id: '1' }
      ];
      const expYields = [
        { facility_id: '1', expected_yield: '16375' },
        { facility_id: '2', expected_yield: '3504' }
      ];
      expect(assignments).to.deep.equal(expAssignments);
      expect(yields).to.deep.equal(expYields);
    });
  });

  describe('calculateYield', function () {
    it('returns a map of yields', function () {
      let facilitiesMap = createFacilitiesMap({ facilities, covenants, banks }); 
      let yields = {'1': 0 };
      let loan = {
        interest_rate: '0.35',
        amount: '74965',
        id: '3',
        default_likelihood: '0.06',
        state: 'AL'
      };
      let expYields = {
        '1': (((1 - 0.06) * 0.35 * 74965) - (0.06 * 74965) - (0.06 * 74965)).toFixed(0)
      };
      calculateYield({ loan, id: '1', facility: facilitiesMap['1'], yields });
      expect(yields).to.deep.equal(expYields);
    });
  });

});