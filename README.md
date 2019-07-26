# Balance Loan Books

## Overview

This app sorts a stream of loans into different facilities based on interest rates and other criteria.

## Running the App

To run the app, first type ```npm i``` in your terminal.

Once that is done, either type ```npm run small``` to run the small files or ```npm run large``` to run the large files.

The csv files (assignments.csv and yields.csv) will appear in the outputs folder.

## Testing the App

To test the app, type ```npm test``` in your terminal.

## Write-Up

1. The coding portion took approximately 3 hours. Writing the tests took approximately an hour, while the write-up took another hour. The most difficult portion was considering how to sort the loans that came in. I was deciding on creating a matrix where banned states would be on one axis and maximum default rates would be on the other axis, and the intersection of these two axis would be an array of facilities that would accept the loan. However, I ultimately settled on the current solution because it was much simpler and faster to implement.
2. The way I am sorting the loans right now is to have a map of all the facilities with their associated covenants, and iterate through each of these facilities from lowest interest rate to highest interest rate, until an appropriate facility is selected. If new covenants were added, I anticipate that it would be fairly simple to add the covenants into the map. However, if the covenant itself involved iterating through a huge data set, I would instead have a function that checks that covenant first and filters out all the appropriate facilities before going on to my map.
3. I anticipate new financing facilities to be relatively easy to add, as it would involve adding the financing facility, along with its associated covenants, to my map as well as my array of sorted facilities (from lowest interest rate to highest interest rate). Adding to my map should be a O(1) operation, while adding to the array of sorted facilities would be a O(n) operation.
4.
5. Sort the loans by the covenants (state, default rate, etc.).