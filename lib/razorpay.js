import Razorpay from "razorpay";

// Ensure this module is only executed on the server
if (typeof window !== "undefined") {
  throw new Error("lib/razorpay.js cannot be imported on the client side.");
}

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

export const razorpayInstance = new Razorpay({
  key_id: key_id || "",
  key_secret: key_secret || "",
});

export const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn("Razorpay credentials are not properly configured in environment variables.");
  }
  return razorpayInstance;
};
