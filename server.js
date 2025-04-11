const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const authJwtController = require("./auth_jwt"); // You're not using authController, consider removing it
const jwt = require("jsonwebtoken");
const cors = require("cors");
const User = require("./Users");
const Movie = require("./Movies"); // You're not using Movie, consider removing it
require("dotenv").config(); // Load environment variables from .env file
const Review = require("./Reviews")

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());

const router = express.Router(); 

router.post("/signup", async (req, res) => {
  // Use async/await
  if (!req.body.username || !req.body.password) {
    return res.status(400).json({
      success: false,
      msg: "Please include both username and password to signup.",
    }); // 400 Bad Request
  }

  try {
    const user = new User({
      // Create user directly with the data
      name: req.body.name,
      username: req.body.username,
      password: req.body.password,
    });

    await user.save(); // Use await with user.save()

    res
      .status(201)
      .json({ success: true, msg: "Successfully created new user." }); // 201 Created
  } catch (err) {
    if (err.code === 11000) {
      // Strict equality check (===)
      return res.status(409).json({
        success: false,
        message: "A user with that username already exists.",
      }); // 409 Conflict
    } else {
      console.error(err); // Log the error for debugging
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      }); // 500 Internal Server Error
    }
  }
});

router.post("/signin", async (req, res) => {
  // Use async/await
  try {
    const user = await User.findOne({ username: req.body.username }).select(
      "name username password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: "Authentication failed. User not found.",
      }); // 401 Unauthorized
    }

    const isMatch = await user.comparePassword(req.body.password); // Use await

    if (isMatch) {
      const userToken = { id: user._id, username: user.username }; // Use user._id (standard Mongoose)
      const token = jwt.sign(userToken, process.env.SECRET_KEY, {
        expiresIn: "1h",
      }); // Add expiry to the token (e.g., 1 hour)
      res.json({ success: true, token: "JWT " + token });
    } else {
      res.status(401).json({
        success: false,
        msg: "Authentication failed. Incorrect password.",
      }); // 401 Unauthorized
    }
  } catch (err) {
    console.error(err); // Log the error
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    }); // 500 Internal Server Error
  }
});

router
  .route("/movies")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movies = await Movie.find({}); // Fetch all movies from the database
      console.log(movies); // Log the movies for debugging

      res.json(movies);
    } catch (err) {
      console.error(err); // Log the error for debugging
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      }); // 500 Internal Server Error
    }
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {
    const movie = new Movie(req.body); // Create a new movie instance with the request body
    try {
      await movie.save(); // Save the movie to the database
    } catch (err) {
      console.error(err); // Log the error for debugging
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      }); // 500 Internal Server Error
    }

    res.status(201).json({ success: true, movie: movie }); // 201 Created
  });
 
router
  .route("/movies/:movieId")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findById(req.params.movieId);
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Movie not found" });
      }
      res.json(movie);
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Movie ID." });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    }
  })
  .put(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findByIdAndUpdate(
        req.params.movieId,
        req.body,
        { new: true, runValidators: true } // Return the updated document and run validators
      );
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Movie not found" });
      }
      res.json({ success: true, movie: movie });
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Movie ID." });
      }
      if (err.name === 'ValidationError'){
         return res.status(400).json({
        success: false,
        message: "Invalid Movie information.",
      });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    }
  })
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Movie.findByIdAndDelete(req.params.movieId);
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Movie not found" });
      }
      res.json({ success: true, message: "Movie deleted successfully" });
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Movie ID." });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    }
  });


router
  .route("/reviews")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movies = await Review.find({}); // Fetch all movies from the database
      console.log(movies); // Log the movies for debugging

      res.json(movies);
    } catch (err) {
      console.error(err); // Log the error for debugging
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      }); // 500 Internal Server Error
    }
  })
  .post(authJwtController.isAuthenticated, async (req, res) => {
    const movie = new Review(req.body); // Create a new movie instance with the request body
    try {
      await movie.save(); // Save the movie to the database
    } catch (err) {
      console.error(err); // Log the error for debugging
      return res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      }); // 500 Internal Server Error
    }

    res.status(201).json({ success: true, movie: movie }); // 201 Created
  });

// GET request for Reviews - Review ID (get a request by ID)
router
  .route("/reviews/:reviewId")
  .get(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Review.findById(req.params.reviewId);
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Review not found" });
      }
      res.json(movie);
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Review ID." });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
  }
})

// PUT request for Reviews - Review ID (update an exisiting request)
router
  .route("/reviews/:reviewId")
  .put(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Review.findByIdAndUpdate(
        req.params.reviewId,
        req.body,
        { new: true, runValidators: true } // Return the updated document and run validators
      );
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Request not found" });
      }
      res.json({ success: true, movie: movie });
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Request ID." });
      }
      if (err.name === 'ValidationError'){
         return res.status(400).json({
        success: false,
        message: "Invalid Request information.",
      });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    }
  })

  // DELETE request for Reviews - Review ID (delete a request)
router
  .route("/reviews/:reviewId")
  .delete(authJwtController.isAuthenticated, async (req, res) => {
    try {
      const movie = await Review.findByIdAndDelete(req.params.reviewId);
      if (!movie) {
        return res
          .status(404)
          .json({ success: false, message: "Review not found" });
      }
      res.json({ success: true, message: "Review deleted successfully" });
    } catch (err) {
      console.error(err);
      if (err.name === "CastError") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Review ID." });
      }
      res.status(500).json({
        success: false,
        message: "Something went wrong. Please try again later.",
      });
    }
app.use("/", router);
});

const PORT = process.env.PORT || 8080; // Define PORT before using it
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // for testing only