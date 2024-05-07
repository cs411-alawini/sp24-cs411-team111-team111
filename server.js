var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql2');
var path = require('path');
var connection = mysql.createConnection({
  host: '35.239.16.146',
  user: 'root',
  password: 'password',
  database: 'project',
  multipleStatements: true
});

connection.connect();

var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Modify the route to accept maxBudget as a query parameter
app.get('/api/Neighborhoods', function(req, res) {
  // Extract maxBudget from query parameters
  var maxBudget = req.query.maxBudget;

  // Prepare the SQL query with a placeholder for maxBudget
  var sql = 'SELECT NeighborhoodName, AverageRent FROM Neighborhoods WHERE AverageRent <= ?';

  connection.query(sql, [maxBudget], function(err, results) {
    if (err) {
      console.error('Error fetching Neighborhood data:', err);
      res.status(500).send({ message: 'Error fetching Neighborhood data', error: err });
      return;
    }
    res.json(results);
  });
});

/* GET home page, respond by rendering index.ejs */
app.get('/', function(req, res) {
  res.render('index', { title: 'Get Neighborhoods' });
});

app.get('/success', function(req, res) {
      res.send({'message': 'Neighborhoods Fetched Successfully!'});
});
 
// this code is executed when a user clicks the form submit button
app.post('/mark', function(req, res) {
  var netid = req.body.netid;
   
  var sql = `INSERT INTO attendance (netid, present) VALUES ('${netid}',1)`;



console.log(sql);
  connection.query(sql, function(err, result) {
    if (err) {
      res.send(err)
      return;
    }
    res.redirect('/success');
  });
});


// SQL Query to get miscellaneous neighborhoods
app.get('/api/home-neighborhoods', (req, res) => {
    const sql = 'SELECT * FROM Neighborhoods'; // Replace 'apartments' with your table name
    connection.query(sql, (error, results, fields) => {
        if (error) throw error;
        res.json(results); // Send the data as JSON to the client
    });
});



// SQL Query to get Crime Event Data
app.get('/api/crime-events', (req, res) => {
  // Run your SQL command to fetch crime events from the database
  var name = req.query.neighborhoodName;

  console.log("NAME: ", name);
  const sql = 'SELECT Block, PrimaryType, Arrested FROM CrimeEvents WHERE CrimeNeighborhood = ?';
  connection.query(sql, [name], (error, results) => {
    if (error) {
      console.error('Error fetching crime events:', error);
      res.status(500).json({ error: 'Failed to fetch crime events' });
    } else {
      // Send the fetched data as JSON response
      	console.log(results);
	    res.json(results);
    }
  });
});


// SQL Query to get Neighborhood Stats
// Handle API call to fetch apartment data headers using a stored procedure
app.get('/api/apartment-data-headers', (req, res) => {
    const neighborhoodName = req.query.neighborhoodName;



	// Define variables for output parameters
let AverageCost = null;
let AverageRating = null;
let female_interest_percent = null;
let male_interest_percent = null;
let AverageAge = null;
let arrest_percent = null;
let num_crimes = null;

	console.log("Data: ", neighborhoodName);

// Run the stored procedure to fetch apartment data headers
const sql = 'CALL ApartmentData(?, ?, ?, ?, ?, ?, ?, ?)';
connection.query('CALL ApartmentData(?, @AverageCost, @AverageRating, @female_interest_percent, @male_interest_percent, @AverageAge, @arrest_percent, @num_crimes);', [neighborhoodName], (error, results, fields) => {
    if (error) {
        console.error('Error fetching apartment data headers:', error);
        res.status(500).json({ error: 'Failed to fetch apartment data headers' });
    } else {
    	// Extract output parameters from the results object
            const outputParams = results[0];
            //console.log(outputParams);
		// console.log("Avg Cost: ", AverageCost);
		// console.log("Output: ", outputParams[0]);


            // Format the JSON response
	    /*
            const jsonResponse = {
                AverageCost: outputParams['@AverageCost'],
                AverageRating: outputParams['@AverageRating'],
                FemaleInterestPercent: outputParams['@female_interest_percent'],
                MaleInterestPercent: outputParams['@male_interest_percent'],
                AverageAge: outputParams['@AverageAge'],
                ArrestPercent: outputParams['@arrest_percent'],
                NumCrimes: outputParams['@num_crimes']
            };
		*/
            // Send the JSON response
	    console.log(outputParams);
            res.json(outputParams);
    }
});

});




// SQL Query to get Apartment List
// Handle API call to fetch apartment data using a stored procedure
app.get('/api/apartment-data', (req, res) => {
    const neighborhoodName = req.query.neighborhoodName;

    // Define variables for output parameters

    // Run the stored procedure to fetch apartment data
    const sql = 'SELECT ApartmentId, RenterCompanyName, Rating, Cost FROM Apartments WHERE Neighborhood = ?';
    connection.query(sql, [neighborhoodName], (error, results) => {
        if (error) {
            console.error('Error fetching apartment data:', error);
            res.status(500).json({ error: 'Failed to fetch apartment data' });
        } else {
            // Send the fetched apartment data as JSON response
        	// Send the fetched data as JSON response
      		res.json(results);
	}
    });
});


// Load Prefers table data
app.get('/api/prefers', function(req, res) {
  var sql = 'SELECT *  FROM Prefers';

  connection.query(sql, function(err, results) {
    if (err) {
      console.error('Error fetching Prefers data:', err);
      res.status(500).send({ message: 'Error fetching Prefers data', error: err });
      return;
    }
    res.json(results);
  });
});

// Modify interest by ID
app.post('/api/prefers/modify/:ID', function(req, res) {
  var id = req.params.ID;
  var newInterest = req.body.newInterest; // Assuming 'newInterest' is sent in the request body
  var oldHood = req.body.oldHood;

  console.log(newInterest);
  var sql = 'UPDATE Prefers SET Interest = ? WHERE ID = ? AND Interest = ?';

  connection.query(sql, [newInterest, id, oldHood], function(err, result) {
    if (err) {
      console.error('Error modifying Interest:', err);
      res.status(500).send({ message: 'Error modifying Interest', error: err });
      return;
    }
    if (result.affectedRows === 0) {
      // No rows were affected, meaning no record was found with that ID
      res.status(404).send({ message: 'Interest not found' });
    } else {
      res.send({ message: 'Interest modified successfully' });
    }
  });
});

// Delete interest by ID
app.delete('/api/prefers/delete/:ID', function(req, res) {
  var id = req.params.ID;

  var sql = 'DELETE FROM Prefers WHERE ID = ?';

  connection.query(sql, [id], function(err, result) {
    if (err) {
      console.error('Error deleting Interest:', err);
      res.status(500).send({ message: 'Error deleting Interest', error: err });
      return;
    }
    if (result.affectedRows === 0) {
      // No rows were affected, meaning no record was found with that ID
      res.status(404).send({ message: 'Interest not found' });
    } else {
      res.send({ message: 'Interest deleted successfully' });
    }
  });
});




// Create Interest by ID
// Handle PUT request to add preference
app.put('/api/add-preference', (req, res) => {
    // Extract the neighborhood name from the request body
    const neighborhoodName = req.body.neighborhoodName;
	
	var sql = 'INSERT INTO Prefers VALUES(372, ?)';

	connection.query(sql, [neighborhoodName], function(err, result) {
    if (err) {
      console.error('Error creating Interest:', err);
      res.status(500).send({ message: 'Error creating Interest', error: err });
      return;
    }
    if (result.affectedRows === 0) {
      // No rows were affected, meaning no record was found with that ID
      res.status(404).send({ message: 'Interest not found' });
    } else {
      res.send({ message: 'Interest created successfully' });
    }
  });

});














app.listen(80, function () {
    console.log('Node app is running on port 80');
});
