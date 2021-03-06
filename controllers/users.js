const User = require("../models/users");
const response = require("../utils/response");
const { isValidObjectId } = require("../utils/validateObjectId");
const { generateHash, compareHash } = require("../utils/hash");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(404).json({ WARNING: "EMAIL_DO_NOT_EXISTS" });
      return;
    }
    const validPass = await compareHash(req.body.password, user.password);
    if (!validPass) return res.status(403).json("INVALID_PASSWORD");

    const accessToken = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: "4m",
    });

    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "12h",
      }
    );

    res.cookie("RefreshToken", refreshToken);

    return res.status(200).json(`ACCESS_TOKEN: ${accessToken}`);
  } catch (error) {
    response.error(req, res, 500, "INTERNAL_SERVER_ERROR", error);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    response.error(req, res, 500, "INTERNAL_SERVER_ERROR", error);
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id))
      response.badRequest(req, res, 400, `USER_ID: [${id}] IS_NOT_VALID`);
    else {
      const oneUser = await User.findById(id);
      oneUser === null || oneUser.length === 0
        ? response.notFound(req, res, 404, "USER_NOT_FOUND")
        : res.status(200).json(oneUser);
    }
  } catch (error) {
    response.error(req, res, 500, "INTERNAL_SERVER_ERROR", error);
  }
};

const registerUser = async (req, res) => {
  const { name, lastname, email, password } = req.body;

  const hasheddPassword = await generateHash(password);
  
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    res.status(404).json({ WARNING: "EMAIL_ALREADY_EXISTS" });
    return;
  }

  const newUser = new User({
    name: name,
    lastname: lastname,
    email: email,
    password: hasheddPassword,
  });

  try {
    await newUser.save();
    response.success(req, res, 201, "USER_CREATED_SUCCESSFULL");
  } catch (error) {
    response.error(req, res, 500, "INTERNAL_SERVER_ERROR", error);
  }
};

const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      response.badRequest(req, res, 400, `USER_ID: [${id}] IS_NOT_VALID`);
    } else {
      const { name, lastname, email, password } = req.body;
      const user = await User.findByIdAndUpdate(
        id,
        { $set: { name, lastname, email, password } },
        { new: true }
      );

      !user
        ? response.notFound(req, res, 404, "USER_NOT_FOUND")
        : response.success(req, res, 200, "USER_UPDATED_SUCCESSFULL");
    }
  } catch (error) {
    response.error(req, res, 500, "INTERNAL_SERVER_ERROR", error);
  }
};

const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      response.badRequest(req, res, 400, `USER_ID: [${id}] IS_NOT_VALID`);
    } else {
      const user = await User.findByIdAndDelete(id);
      !user
        ? response.notFound(req, res, 404, "USER_NOT_FOUND")
        : response.success(req, res, 200, "USER_DELETED_SUCCESSFULL");
    }
  } catch (error) {
    response.error(req, res, 500, "INTERNAL_SERVER_ERROR", error);
  }
};

const getUserByName = async (req, res) => {
  try {
    const user = await User.find({ name: req.body.name });
    user.length === 0
      ? response.notFound(req, res, 404, "USER_NOT_FOUND")
      : res.status(200).json({ user });
  } catch (error) {
    response.error(req, res, 500, "INTERNAL_SERVER_ERROR", error);
  }
};

module.exports = {
  loginUser,
  getAllUsers,
  getUserById,
  registerUser,
  updateUserById,
  deleteUserById,
  getUserByName,
};
