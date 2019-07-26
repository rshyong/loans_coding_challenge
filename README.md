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

1. The coding portion took approximately 3 hours. Writing the tests took approximately 45 minutes, while the write-up took about two hours. The most difficult portion was considering how to sort the loans that came in. I was deciding on creating separate functions for each covenant, which would each spit out an array of facilities that worked for that particular covenant (likely O(n) time). Then, we would need to find the common facilities that appears in all the arrays, which would take O(n log(n) + m log(m) + ...), where n and m are the array of facilities that work for each particular covenant. However, I ultimately settled on the current solution because it was much simpler and faster to implement.
2. The way I am sorting the loans right now is to have a map of all the facilities with their associated covenants, and iterate through each of these facilities from lowest interest rate to highest interest rate, until an appropriate facility is selected. If new covenants were added, I anticipate that it would be fairly simple to add the covenants into the map. However, if the covenant itself involved iterating through a huge data set, my current solution might take too long. In that case, I would consider creating separate functions for each covenant, and then finding the common facilities as described above.
3. I anticipate new financing facilities would be relatively easy to add, as it would involve adding the financing facility, along with its associated covenants, to my map as well as my array of sorted facilities (from lowest interest rate to highest interest rate). Adding to my map should be an O(1) operation, while adding to the array of sorted facilities would be an O(n) operation. However, as mentioned above, if the covenant itself involved iterating through a huge data set, I would consider rewriting my code to have separate functions for each covenant.
4. A REST API for this would involve a script that constantly checks a queue to see if there is a new loan(s) in the queue. The list of facilities, covenants, loans, etc. will all be written to the database. If there is a new loan(s), it would process it using the sortLoans function. The sortLoans function will 

    1) Compile a list of all the facilities with the associated covenants, as well as its updated capacity, and order it from least interest rate to greatest interest rate. This process could be done on server start and then saved in memory instead of doing it everytime the sortLoans function is called. If a new facility is added, the information will be saved to the database as well as added to the array in memory (O(n) operation). If a facility needs to be updated, both memory and database will need to be updated.

    2) The loan will then go through the list of facilities until it finds one that it matches. 
    
    3) The facility's capacity will be reduced by the loan amount, and this change will be updated both in memory and the db.

    4) Both the loan assignment table and the yields table will be updated to reflect the new loan.

To request a loan to be assigned to a facility, the API would just call the addLoan route with the loan information, which will add the loan to the queue and include a loan_id that is incremented from the previous loan. For the stakeholder to see if a loan is funded, it would call the isLoanFunded route with the loan id, which would look for the loan id in the loan assignment table. To query the capacities remaining in the facilities, we would call the facilitiesInfo route, which would return the list of facilities held in memory, along with their remaining capacities and any other information we want to see.
5. Sort the loans by the covenants (state, default rate, etc.).
6. My solution's runtime is discussed below: 

    1) My solution first sorts the list of facilities from lowest interest rate to greatest interest rate. This is an O(flog(f)) operation, where f is the length of the facilities array.

    2) It then creates a facilitiesMap. To do so, it iterates through the list of banks (O(b) operation, where b is length of banks array), iterates through the facilities array (O(f) operation), and finally iterates through the covenants array. This operation will most likely be close to a O(c) operation, where c is the length of the covenants array, but worst case scenario if every covenant applies to every facility, this would be a O(c*f) operation. However, the most likely scenario is that this is a O(c) operation, since each covenant will usually apply to 1 facility, and since there are multiple banks, there is no way for each covenant to apply to all the facilities.

    3) It then assigns the loan to a facility and calculates the yield. If we were streaming the loans, this would be an O(f) operation, where f is the length of the facilities array, since worst case scenario the loan would have to go through each of the facilities. If we were to batch the loans, it would be a O(l * f) operation, where l is the length of the loans batch.

In total, my solution has a O(flog(f) + b + f + c ) runtime complexity to setup (which only happens once), but an O(f) runtime complexity after in the streaming scenario, and an O(l *f) runtime complexity in the batching scenario. Adding a new covenant would be a O(1) operation to add it to the map, and adding a new facility would be an O(f) operation since you would need to add it to the sorted array.