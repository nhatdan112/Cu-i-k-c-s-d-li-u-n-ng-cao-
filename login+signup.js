const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('Frontend'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/Frontend/Login+signup.html');
});
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))

mongoose.connect('mongodb://localhost:27017/moviess', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const UserSchema = new mongoose.Schema({
  email: String,
  password: {
    type: String,
    required: true,
  },
});

UserSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    const hashedPassword = await bcrypt.hash(this.password, 10);
    this.password = hashedPassword;
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', UserSchema);

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValidEmail = emailRegex.test(email);

  if (!isValidEmail) {
    return res.status(400).send('Invalid email format. Please provide a valid email address.');
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send('Email already exists');
    }

    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(500).send('Error registering user');
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password); 
    if (!isPasswordValid) {
      return res.status(400).send('Invalid email or password');
    }

    res.status(200).send('Login successful');
  } catch (error) {
    res.status(500).send('Error logging in');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});