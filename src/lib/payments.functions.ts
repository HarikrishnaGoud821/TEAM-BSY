import { z } from "zod";
import { apiFetch } from "@/lib/api";

const orderInput = z.object({
  amount: z.number().min(1, "Minimum ₹1").max(1_000_000, "Amount too large"),
  method: z.enum(["RAZORPAY", "QR"]),
  donorName: z.string().trim().min(2, "Enter donor name").max(100),
  donorMobile: z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile"),
  purpose: z.string().trim().max(150).optional().default(""),
  notes: z.string().trim().max(500).optional().default(""),
  village: z.string().trim().max(80).optional().default(""),
  mandal: z.string().trim().max(80).optional().default(""),
  district: z.string().trim().max(80).optional().default(""),
  pincode: z.string().trim().regex(/^(\d{6})?$/, "Pincode must be 6 digits").optional().default(""),
});

export type OrderInput = z.infer<typeof orderInput>;

export type PaymentConfig = {
  keyId: string;
};

export type PaymentOrder = {
  orderId: string;
  amount: number;
  keyId: string;
  contributionId: string;
};

export type VerifyPaymentInput = {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export async function getPaymentConfig(): Promise<PaymentConfig> {
  return apiFetch<PaymentConfig>("/payments/config");
}

export async function createPaymentOrder(data: OrderInput): Promise<PaymentOrder> {
  const validatedData = orderInput.parse(data);

  return apiFetch<PaymentOrder>("/payments/orders", {
    method: "POST",
    body: JSON.stringify(validatedData),
  });
}

export async function verifyPayment(data: VerifyPaymentInput): Promise<{ contributionId: string }> {
  return apiFetch<{ contributionId: string }>("/payments/verify", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function markPaymentFailed(data: { orderId: string }): Promise<void> {
  return apiFetch<void>("/payments/failed", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
