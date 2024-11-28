// main.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

import cors from 'cors';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { otpGenerate } from './utils/helper.js';
import { emailOTP } from './utils/emailUtils.js';

dotenv.config();

const app = express();
const port = 8080;
const prisma = new PrismaClient();

// const corsOptions = {
//   origin: [
//     'http://44.226.145.213',
//     'http://localhost:5173/',
//     'http://54.187.200.255',
//     'http://34.213.214.55',
//     'http://35.164.95.156',
//     'http://44.229.200.200',
//     'http://44.230.95.183'
//   ],
//   optionsSuccessStatus: 200
// };

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// User Registration
app.post('/register', async (req, res) => {
  try {
    const { name, email, password, id: googleToken } = req.body;
    if (!name || !email || (!password && !googleToken)) {
      return res.status(400).send('Missing required fields');
    }

    // Check if the email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      return res.status(400).send('Email already exists');
    }

    // Hash the password if provided
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }
    const otp = hashedPassword ? (await otpGenerate()).toString() : null;

    if (!otp && hashedPassword) {
      3;
      return res.status(500).send('Failed to generate OTP');
    }

    // const otpExpiry = new Date(new Date().getTime() + 10 * 60 * 1000);

    const otpSent = hashedPassword ? await emailOTP(otp, email) : null;
    if (!otpSent && hashedPassword) {
      return res
        .status(400)
        .json({ status: false, message: 'Failed to send OTP Kindly Recheck and try again' });
    } else {
      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          googleToken: googleToken || '',
          cart: [],
          otp
        }
      });
      return res.status(200).json({
        status: true,
        message: 'User registered successfully, Please check your email for OTP.'
      });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).send('Failed to register user');
  }
});

// User Login
app.post('/login', async (req, res) => {
  try {
    const { email, password, id: googleToken } = req.body;
    if (!email || (!password && !googleToken)) {
      return res.status(400).send({ string: 'Missing required fields' });
    }

    // Fetch user by email using Prisma
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).send({ string: 'Email not found' });
    }

    if (!googleToken && password) {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).send({ string: 'Incorrect password' });
      } else {
        res.status(200).send({
          string: 'Logged in successfully',
          token: user.password,
          user
        });
      }
    } else if (googleToken && googleToken === user.googleToken) {
      res.status(200).send({
        string: 'Logged in successfully',
        token: user.googleToken,
        user
      });
    } else {
      return res.status(401).send({ string: 'Kindly Login With Password' });
    }
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send({ string: 'Failed to login' });
  }
});

// validate otp
app.post('/validate-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).send({ string: 'Missing required fields' });
    }

    // Fetch user by email using Prisma
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).send({ string: 'Email not found' });
    }

    if (user.otp === otp) {
      res.status(200).send({ string: 'OTP validated successfully' });
    } else {
      return res.status(401).send({ string: 'Invalid OTP' });
    }
  } catch (error) {
    console.error('Error validating OTP:', error);
    res.status(500).send({ string: 'Failed to validate OTP' });
  }
});

// User Logout
app.post('/logout', async (req, res) => {
  try {
    res.clearCookie('token');
    const { email, cart } = req.body;

    if (email) {
      // Update the cart in the user's record using Prisma
      await prisma.user.update({
        where: { email },
        data: { cart: cart ? cart : [] }
      });
    }

    res.send({ string: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).send({ string: 'Failed to logout' });
  }
});

app.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Failed to fetch users');
  }
});

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening at http://localhost:${port}`);
});
