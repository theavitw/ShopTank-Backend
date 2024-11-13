// main.js
import express from 'express';
import { PrismaClient } from '@prisma/client';

import cors from 'cors';
import bcrypt from 'bcrypt';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { otpGenerate } from './utils/helper.js';
import { emailOTP } from './utils/emailuTILS.js';

dotenv.config();

const app = express();
const port = 8080;
const prisma = new PrismaClient();

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
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
    const otp = (await otpGenerate()).toString();

    if (!otp) {
      return res.status(500).send('Failed to generate OTP');
    }

    // const otpExpiry = new Date(new Date().getTime() + 10 * 60 * 1000);

    const otpSent = await emailOTP(otp, email);
    if (!otpSent) {
      return res.status(400).json({ status: false, message: 'Failed to send OTP' });
    }
    if (!otpSent) {
      return res.status(400).json({
        status: false,
        message: 'Invalid Email Address'
      });
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        googleToken: googleToken || '',
        otp
      }
    });

    return res.status(200).send.json({
      status: true,
      message: 'User registered successfully, Please check your email for OTP.'
    });
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
        data: { cart: JSON.stringify(cart) }
      });
    }

    res.send({ string: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).send({ string: 'Failed to logout' });
  }
});

// Start the server
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Example app listening at http://localhost:${port}`);
});
