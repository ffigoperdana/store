import { OrderPayment } from "@/components/order-payment";
export const dynamic = "force-dynamic";
export default async function CheckoutPage({ params }: { params: Promise<{ token: string }> }) { const { token } = await params; return <main className="payment-page"><OrderPayment token={token} /></main>; }
