const express = require("express");
const { PrismaClient } = require("@prisma/client");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = 3000;

app.use(
  cors({
    origin: "http://localhost:3001", // Allow your frontend's origin
  })
);
app.use(express.json());

// Mail service setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/api/referrals", async (req, res) => {
  const { referrer, referee, course, email } = req.body;

  if (!referrer || !referee || !course || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const referral = await prisma.referral.create({
      data: {
        referrer,
        referee,
        course,
        email,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Course Referral",
      text: `Hi ${referee},\n\n${referrer} has referred you for the ${course} course.\n\nBest regards,\nRefer & Earn Team`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .json({ error: "Internal server error", details: error.message });
      }
      console.log("Email sent:", info.response);
      res.status(201).json(referral);
    });
  } catch (error) {
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
