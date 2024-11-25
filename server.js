const express = require('express');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const fs = require('fs');

const app = express();
const port = 3000;

// MongoDB details
const uri = 'mongodb://localhost:27017';
const dbName = 'Fresh';
const collectionName = 'products';

let db, collection;

// Connect to MongoDB for Products
MongoClient.connect(uri)
  .then(client => {
    console.log('Connected to MongoDB for products');
    db = client.db(dbName);
    collection = db.collection(collectionName);
  })
  .catch(err => console.error('MongoDB connection error for products:', err));

// Connect to MongoDB for Users
mongoose.connect('mongodb://localhost:27017/Fresh')
  .then(() => console.log("Connected to MongoDB for users"))
  .catch(err => console.error('MongoDB connection error for users:', err));

// User Schema and Model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  cart: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'product' },
    productName : {type : String, required : true},
    category: { type: String, required: true },
    quantity: { type: Number, required: true },
    price : {type : Number , required : true},
    image : {type : String}
  }]
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

// Configure session store
const store = new MongoDBStore({
  uri: 'mongodb://localhost:27017/Fresh',
  collection: 'sessions'
});

store.on('error', err => {
  console.error('Session store error:', err);
});

// Session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (!req.session.user || !req.session.user.id) {
    return res.status(401).json({ message: 'Unauthorized: Please log in' });
  }
  next();
}


// API endpoint to fetch data from MongoDB (Products)
app.get('/api/data', async (req, res) => {
  try {
    console.log('API endpoint accessed: Fetching product data...');
    const data = await collection.find({}).toArray();

    if (!data.length) {
      console.warn('No data found in the Products collection.');
    } else {
      console.log('Fetched data from MongoDB (Products):', data);
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching product data:', error);
    res.status(500).send('Error fetching product data');
  }
});

// Sign-up route
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).send('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      cart: [] // Initialize an empty cart for the user
    });

    await newUser.save();

    // Create a session for the new user
    req.session.user = { id: newUser._id, username: newUser.username };

    res.status(200).json({ message: 'User registered and logged in successfully', user: { id: newUser._id, username: newUser.username } });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).send('Internal server error');
  }
});


// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('Email or password is incorrect');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Email or password is incorrect');
    }

    // Initialize session for user
    req.session.user = { id: user._id, username: user.username };

    // Fetch the cart data from the MongoDB user document
    const userCart = user.cart || []; // Default to an empty array if no cart exists

    // Return the user and their cart
    res.status(200).send({ message: 'Login successful', cart: userCart });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Internal server error');
  }
});

// Route to get the logged-in user's data
app.get('/user', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send('Unauthorized: Please log in');
  }

  try {
    const user = await User.findById(req.session.user.id).select('-password');
    if (!user) {
      return res.status(404).send('User not found');
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).send('Internal server error');
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send('Logout error');
    }
    res.status(200).send('Logged out successfully');
  });
});

app.get('/api/user/cart', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Send the cart data as a response
    res.status(200).json(user.cart);
  } catch (error) {
    console.error('Error fetching or creating cart:', error);
    res.status(500).json({ error: 'Failed to fetch or create cart' });
  }
});

// Add item to cart and update MongoDB
app.post('/api/user/cart', isAuthenticated, async (req, res) => {
  const { productId, productName, category, quantity, price, image} = req.body; // Ensure these fields are provided
  const userId = req.session.user.id;

  console.log("req body : ",image)
  try {
    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Check if the item already exists in the cart
    const existingItem = user.cart.find(item => 
      item.productId.toString() === productId && item.category === category
    );

    if (existingItem) {
      // Update quantity and price if the item exists
      existingItem.quantity += quantity;
      existingItem.price = price; // Update price (if needed, otherwise remove this line)
    } else {
      // Add a new item to the cart
      user.cart.push({
        productId,
        productName,
        category,
        quantity,
        price,
        image
      });
    }

    // Save the updated user document
    await user.save();

    // Return the updated cart as a response
    res.status(200).json({ message: 'Item added to cart successfully', cart: user.cart });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.delete('/api/user/cart/clear', isAuthenticated, async (req, res) => {
  const userId = req.session.user.id;
  try {
    const user = await User.findById(userId); // Fetch user
    if (!user) {
      return res.status(404).json({ message: 'User not found' }); // Handle user not found
    }

    user.cart = []; // Clear cart
    await user.save(); // Persist changes

    res.status(200).json({ message: 'Cart cleared successfully' }); // Success response
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Failed to clear cart' }); // Error response
  }
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
