import { CheckCircle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function PaymentSuccess() {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="flex items-center justify-center min-h-screen px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-md"
        >
          <CheckCircle className="text-primary mx-auto mb-6" size={56} />
          <h1 className="font-display text-5xl text-foreground mb-4">Payment Successful</h1>
          <p className="font-body text-muted-foreground text-sm mb-8 leading-relaxed">
            Your deposit has been received. Your date is now secured. You'll receive a confirmation email shortly. The remaining balance is due upon project completion.
          </p>
          <div className="space-y-3">
            <Link
              to="/portal"
              className="block font-body text-xs tracking-[0.3em] uppercase px-10 py-4 bg-primary text-primary-foreground hover:bg-primary-light transition-all"
            >
              View My Bookings
            </Link>
            <Link
              to="/"
              className="block font-body text-xs tracking-[0.3em] uppercase px-10 py-4 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-all"
            >
              Back to Home
            </Link>
          </div>
          <div className="mt-8 p-4 border border-border flex items-center gap-3 text-left">
            <Calendar className="text-primary flex-shrink-0" size={18} />
            <p className="font-body text-xs text-muted-foreground">
              A booking confirmation and receipt have been sent to your email address.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
