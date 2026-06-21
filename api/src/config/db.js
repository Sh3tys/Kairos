const mongoose = require("mongoose");
require("dotenv").config();

let connectionPromise;

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is required");
    }

    if (mongoose.connection.readyState === 1) {
      return mongoose.connection;
    }

    if (!connectionPromise) {
      connectionPromise = mongoose
        .connect(process.env.MONGO_URI)
        .then((connection) => {
          console.log("MongoDB connected successfully");
          return connection;
        })
        .catch((error) => {
          connectionPromise = null;
          throw error;
        });
    }

    return connectionPromise;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
};

module.exports = connectDB;
