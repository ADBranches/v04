// src/components/booking/BookingModal.tsx
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useBooking } from "../../hooks/useBooking";
import BookingForm from "./BookingForm";
import TravelerInfo from "./TravelerInfo"; // Make sure this exists!

export default function BookingModal() {
  const { isOpen, closeBooking } = useBooking();
  const [step, setStep] = useState(1);

  const handleClose = () => {
    setStep(1); // Reset to first step when closing
    closeBooking();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-4 text-gray-500 hover:text-red-500 text-2xl z-10"
            >
              &times;
            </button>

            {/* Step indicator */}
            <div className="flex justify-center mb-4 pt-4">
              <div className="flex space-x-2">
                <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              </div>
            </div>

            {/* === Booking Step Flow === */}
            {step === 1 && (
              <TravelerInfo
                onNext={() => {
                  console.log("✅ Traveler info validated — loading booking form...");
                  setStep(2);
                }}
              />
            )}
            {step === 2 && <BookingForm />}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}