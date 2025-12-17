import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { merchantSignupSchema } from "@/lib/validations/auth";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/forms/FormInput";
import { NameInputs } from "@/components/forms/NameInputs";
import { PasswordInputs } from "@/components/forms/PasswordInputs";
import { PhoneInput } from "@/components/forms/PhoneInput";
import { BusinessInfoInputs } from "@/components/merchant/BusinessInfoInputs";
import { SignupSubmitButton } from "@/components/forms/SignupSubmitButton";
import { TermsAndConditions } from "@/components/forms/TermsAndConditions";
import { signupMerchantApi } from "@/api/authApi";
import { storeAuth } from "@/lib/util";
import { USER_PROFILE_CONTEXT } from "@/context";
import { formatErrorMessage } from "@/utils/errorUtils";
import {
  showAuthSuccess,
  showAuthError,
  showValidationError,
} from "@/utils/feedback";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const nameRegex = /^[a-zA-Z0-9@]+$/; // Allow letters, numbers, and @ symbol

export function MerchantSignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUserProfile } = useContext(USER_PROFILE_CONTEXT);
  const navigate = useNavigate();
  const [serverErrors, setServerErrors] = useState({});

  const form = useForm({
    resolver: zodResolver(merchantSignupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      businessType: "",
      country: "Nigeria",
      state: "",
      city: "",
      phoneNumber: "+234",
      code: "",
    },
  });

  const {
    isVerified,
    isSendingCode,
    isVerifyingCode,
    codeSent,
    timer,
    verificationCode,
    setVerificationCode,
    handleSendCode,
    handleVerifyCode,
  } = useEmailVerification(form);

  const onSubmit = async (values) => {
    setLoading(true);
    form.clearErrors();
    setServerErrors({});

    // Validate name fields first
    if (!nameRegex.test(values.firstName)) {
      form.setError("firstName", {
        type: "manual",
        message: "First name can only contain letters, numbers, and @",
      });
      showValidationError("Please check your form entries and try again");
      setLoading(false);
      return;
    }

    if (!nameRegex.test(values.lastName)) {
      form.setError("lastName", {
        type: "manual",
        message: "Last name can only contain letters, numbers, and @",
      });
      showValidationError("Please check your form entries and try again");
      setLoading(false);
      return;
    }

    try {
      const response = await signupMerchantApi(values);
      const data = await response.json();

      if (response.ok) {
        showAuthSuccess("Merchant account created successfully!");
        console.log("Merchant signup successful:", data);
        const accessToken = data.token;
        storeAuth(accessToken, "merchant", true);
        setUserProfile(
          data.user || {
            firstname: values.firstName,
            lastname: values.lastName,
            email: values.email,
          }
        );
        navigate("/merchant/virtual-account");
      } else {
        const errorData = formatErrorMessage(data);
        console.log("API Error response:", errorData);

        let hasSetError = false;

        if (errorData.error) {
          // Handle first name errors
          if (errorData.error.firstName || errorData.error.first_name) {
            const firstNameError = errorData.error.firstName || errorData.error.first_name;
            setServerErrors((prev) => ({
              ...prev,
              firstName: Array.isArray(firstNameError) ? firstNameError[0] : firstNameError,
            }));
            form.setError("firstName", {
              type: "manual",
              message: Array.isArray(firstNameError) ? firstNameError[0] : firstNameError,
            });
            hasSetError = true;
          }

          // Handle last name errors
          if (errorData.error.lastName || errorData.error.last_name) {
            const lastNameError = errorData.error.lastName || errorData.error.last_name;
            setServerErrors((prev) => ({
              ...prev,
              lastName: Array.isArray(lastNameError) ? lastNameError[0] : lastNameError,
            }));
            form.setError("lastName", {
              type: "manual",
              message: Array.isArray(lastNameError) ? lastNameError[0] : lastNameError,
            });
            hasSetError = true;
          }

          // Handle email errors
          if (errorData.error.email) {
            const emailError = Array.isArray(errorData.error.email)
              ? errorData.error.email[0]
              : errorData.error.email;

            console.log("Setting email error:", emailError);
            // Use setState instead of form.setError to guarantee update
            setServerErrors((prev) => ({ ...prev, email: emailError }));

            // Still set in form for validation purposes
            form.setError("email", {
              type: "manual",
              message: emailError,
            });
            hasSetError = true;
          }

          // Similarly handle other potential errors
          if (errorData.error.phone_number) {
            const phoneError = Array.isArray(errorData.error.phone_number)
              ? errorData.error.phone_number[0]
              : errorData.error.phone_number;

            console.log("Setting phone error:", phoneError);
            setServerErrors((prev) => ({ ...prev, phoneNumber: phoneError }));

            form.setError("phoneNumber", {
              type: "manual",
              message: phoneError,
            });
            hasSetError = true;
          }

          if (errorData.error.password) {
            const passwordError = Array.isArray(errorData.error.password)
              ? errorData.error.password[0]
              : errorData.error.password;

            console.log("Setting password error:", passwordError);
            setServerErrors((prev) => ({ ...prev, password: passwordError }));

            form.setError("password", {
              type: "manual",
              message: passwordError,
            });
            hasSetError = true;
          }
        }

        // After setting errors, log the form state to verify errors are set
        console.log("Form errors after setting:", form.formState.errors);

        // Show toast messages
        if (hasSetError) {
          showValidationError("Signup failed. Please check your information and try again.");
        }
      }
    } catch (error) {
      showAuthError("Network error occurred. Please check your connection and try again.");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Use useEffect to monitor form errors for debugging
  React.useEffect(() => {
    console.log("Current form errors:", form.formState.errors);
  }, [form.formState.errors]);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <NameInputs 
            form={form} 
            firstNameError={serverErrors.firstName}
            lastNameError={serverErrors.lastName}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2 text-left">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <div className="relative w-full">
                      <Input
                        type="email"
                        placeholder="example@gmail.com"
                        className="border-lightgray w-full"
                        disabled={isVerified}
                        {...field}
                      />
                      {isVerified && (
                        <CheckCircle className="absolute right-3 top-2.5 h-5 w-5 text-green-500" />
                      )}
                    </div>
                    {!isVerified && (
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={isSendingCode || timer > 0}
                      className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm whitespace-nowrap min-w-[100px] disabled:opacity-50 flex items-center justify-center transition-colors hover:bg-gray-700"
                      >
                        {isSendingCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : timer > 0 ? (
                          `${timer}s`
                        ) : (
                          "Get Code"
                        )}
                      </button>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
                {serverErrors.email && (
                  <p className="text-sm font-medium text-destructive">
                    {serverErrors.email}
                  </p>
                )}
              </FormItem>
            )}
          />

          <div className="flex gap-2 items-end animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-2 text-left flex-1">
              <FormLabel>Verification Code</FormLabel>
              <Input
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  form.setValue("code", e.target.value);
                }}
                placeholder="Enter verification code"
                className="border-lightgray w-full"
                maxLength={6}
              />
            </div>
          </div>

          <PasswordInputs
            form={form}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showConfirmPassword={showConfirmPassword}
            setShowConfirmPassword={setShowConfirmPassword}
            error={
              form.formState.errors.password?.message || serverErrors.password
            }
          />

          <BusinessInfoInputs form={form} />

          <PhoneInput
            label="Phone number"
            name="phoneNumber"
            placeholder="8012345678"
            control={form.control}
            error={
              form.formState.errors.phoneNumber?.message ||
              serverErrors.phoneNumber
            }
          />

          <SignupSubmitButton loading={loading} />
        </form>
      </Form>

      <TermsAndConditions />
    </>
  );
}
