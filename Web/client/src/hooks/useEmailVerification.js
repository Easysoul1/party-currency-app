import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { sendVerificationCode, verifyEmailCode } from "@/api/authApi";

export function useEmailVerification(form, emailFieldName = "email") {
  const [isVerified, setIsVerified] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [timer, setTimer] = useState(0);
  const [verificationCode, setVerificationCode] = useState("");

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendCode = async () => {
    const email = form.getValues(emailFieldName);
    
    // Validate email first
    const isEmailValid = await form.trigger(emailFieldName);
    if (!isEmailValid) {
      toast.error("Please enter a valid email address first");
      return;
    }

    try {
      setIsSendingCode(true);
      const response = await sendVerificationCode(email);
      const data = await response.json();

      if (response.ok) {
        setCodeSent(true);
        setTimer(60); // 60 seconds cooldown
        toast.success("Verification code sent to your email");
      } else {
        toast.error(data.message || "Failed to send verification code");
      }
    } catch (error) {
      console.error("Send code error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length < 4) {
      toast.error("Please enter a valid code");
      return;
    }

    const email = form.getValues(emailFieldName);

    try {
      setIsVerifyingCode(true);
      const response = await verifyEmailCode(email, verificationCode);
      const data = await response.json();

      if (response.ok) {
        setIsVerified(true);
        toast.success("Email verified successfully");
      } else {
        toast.error(data.message || "Invalid verification code");
      }
    } catch (error) {
      console.error("Verify code error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const resetVerification = () => {
    setIsVerified(false);
    setCodeSent(false);
    setVerificationCode("");
    setTimer(0);
  };

  return {
    isVerified,
    isSendingCode,
    isVerifyingCode,
    codeSent,
    timer,
    verificationCode,
    setVerificationCode,
    handleSendCode,
    handleVerifyCode,
    resetVerification,
  };
}
