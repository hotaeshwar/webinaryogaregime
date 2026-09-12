import Razorpay from "razorpay";

// Ensure this module is only executed on the server
if (typeof window !== "undefined") {
  throw new Error("lib/razorpay.js cannot be imported on the client side.");
}

let instance = null;

export const getRazorpayInstance = () => {
  if (!instance) {
    const key_id =
      process.env.RAZORPAY_KEY_ID ||
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      "rzp_live_Tb4Km1evAI6DKr";
    const key_secret =
      process.env.RAZORPAY_KEY_SECRET || "dummy_secret_for_build";

    instance = new Razorpay({
      key_id,
      key_secret,
    });
  }
  return instance;
};

// Export proxy for backwards compatibility without throwing on module load
export const razorpayInstance = {
  get orders() {
    return getRazorpayInstance().orders;
  },
  get payments() {
    return getRazorpayInstance().payments;
  },
};
