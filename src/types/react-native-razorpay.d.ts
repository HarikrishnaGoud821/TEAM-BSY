declare module 'react-native-razorpay' {
  export interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description?: string;
    order_id?: string;

    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };

    notes?: Record<string, string>;

    theme?: {
      color?: string;
    };
  }

  export interface RazorpayPaymentSuccessResponse {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }

  const RazorpayCheckout: {
    open(
      options: RazorpayOptions
    ): Promise<RazorpayPaymentSuccessResponse>;
  };

  export default RazorpayCheckout;
}