const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer'); 
const path = require('path');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/moviess', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

const movieSchema = new mongoose.Schema({
  name: String,
  year: Number,
  description: String,
  imageUrl: String, 
});

const Movie = mongoose.model('Movie', movieSchema, 'movies');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public','images')); 
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

app.get('/movies/count', async (req, res) => {
  try {
    const count = await Movie.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error counting movies' });
  }
});

app.get('/movies', async (req, res) => {
  try {
    const foundMovies = await Movie.find({});
    res.send(foundMovies);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error retrieving movies');
  }
});

function getCurrentYear() {
  return new Date().getFullYear();
}

app.post('/movies', upload.single('image'), async (req, res) => {
  try {
    const { name, year, description } = req.body;
    const imageUrl = '/images/' + req.file.originalname;

    const currentYear = getCurrentYear();

    if (year > currentYear) {
      return res.status(400).json({ error: 'Invalid year. Please enter a year in the past or the current year.' });
    }

    const newMovie = new Movie({
      name,
      year,
      description,
      imageUrl,
    });

    await newMovie.save();
    res.json({ message: 'Movie added successfully', movie: newMovie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error adding movie' });
  }
});

app.put('/movies/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, year, description } = req.body;

    let imageUrl = '';

    if (req.file) {
      imageUrl = '/images/' + req.file.originalname; 
      const movie = await Movie.findById(id);
      if (movie.imageUrl) {
        const oldImagePath = path.join(__dirname, 'public', movie.imageUrl);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error('Error deleting old image:', err);
          } else {
            console.log('Old image deleted successfully');
          }
        });
      }
    } else {
      imageUrl = req.body.imageUrl; 
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      { name, year, description, imageUrl },
      { new: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.json({ message: 'Movie updated successfully', movie: updatedMovie });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error updating movie' });
  }
});

app.delete('/movies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    const deletedMovie = await Movie.findByIdAndDelete(id);
    if (!deletedMovie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const imagePath = path.join(__dirname, 'public', movie.imageUrl);
    fs.unlink(imagePath, (err) => {
      if (err) {
        console.error('Error deleting image:', err);
      } else {
        console.log('Image deleted successfully');
      }
    });

    res.json({ message: 'Movie deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error deleting movie' });
  }
});

app.listen(8080, () => {
  console.log('Server is running on port 8080');
});