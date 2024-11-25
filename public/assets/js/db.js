const express = require('express');
const mysql = require('mysql');
const app = express();
const PORT = 3306;

// Set up database connection
const connection = mysql.createConnection({
  host: 'localhost',         // Your MySQL host
  user: 'root',      // Your MySQL username
  password: '270408_Louis',  // Your MySQL password
  database: 'data'   // Your MySQL database name
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ' + err.message);
    return;
  }
  console.log('Connected to MySQL database.');
});

// Fetch user data and associated cart items and products
app.get('/user-data', (req, res) => {
  const query = `
    SELECT u.userid, u.username, u.email, u.phone_number, u.is_vegan,
           p.product_id, p.name AS product_name, pt.type_name, pt.price, ci.quantity
    FROM user u
    LEFT JOIN cart c ON u.userid = c.userid
    LEFT JOIN cart_items ci ON c.cart_id = ci.cart_id
    LEFT JOIN products p ON ci.product_id = p.product_id
    LEFT JOIN product_types pt ON ci.type_id = pt.type_id
    WHERE u.userid = ?;
  `;
  
  // Example: Fetch data for user with userid = 1
  const userId = 1;

  connection.query(query, [userId], (err, results) => {
    if (err) {
      res.status(500).send('Error retrieving data from the database.');
      return;
    }

    // Process data to format it nicely if needed
    res.json(results); // Send the results as JSON
  });
});

// Serve static files from the 'public' folder
app.use(express.static('public'));

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});