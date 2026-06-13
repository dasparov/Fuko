// PARKED — verbatim extract of the phone+OTP login block that used to live in
// app/profile/page.tsx (logged-out branch). Preserved for revival; NOT wired up.
// State it depended on: phoneNumber, otp, showOtp, isVerifying, isLoggedIn.
// See _parked/phone-otp/README.md.

// ---- handlers ----
//
// const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (phoneNumber.length < 10) {
//         toast.error("Please enter a valid 10-digit phone number")
//         return
//     }
//     setIsVerifying(true)
//     try {
//         const response = await fetch("/api/auth/otp/send", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ phoneNumber })
//         })
//         const data = await response.json()
//         if (response.ok) {
//             toast.success("Verification code sent!")
//             setShowOtp(true)
//         } else {
//             toast.error(data.error || "Failed to send code")
//         }
//     } catch {
//         toast.error("Network error. Please try again.")
//     } finally {
//         setIsVerifying(false)
//     }
// }
//
// const handleVerifyOtp = async (e: React.FormEvent) => {
//     e.preventDefault()
//     if (otp.length < 4) {
//         toast.error("Please enter the 4-digit code")
//         return
//     }
//     setIsVerifying(true)
//     try {
//         const response = await fetch("/api/auth/otp/verify", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ phoneNumber, code: otp })
//         })
//         const data = await response.json()
//         if (response.ok) {
//             localStorage.setItem("fuko_user_phone", phoneNumber)
//             setIsLoggedIn(true)
//             setUserPhone(phoneNumber)
//             // ...load orders + profile by phone...
//             toast.success("Identity verified! Welcome to Fuko.")
//             setShowOtp(false)
//         } else {
//             toast.error(data.error || "Invalid code")
//         }
//     } catch {
//         toast.error("Verification failed. Please try again.")
//     } finally {
//         setIsVerifying(false)
//     }
// }

// ---- JSX (rendered inside the user-info card when !isLoggedIn) ----
//
// {showOtp ? (
//     <form onSubmit={handleVerifyOtp} className="space-y-3">
//         {/* 4-box segmented OTP, "Verify Identity", "Change Number" */}
//     </form>
// ) : (
//     <form onSubmit={handleLogin} className="space-y-6 py-4">
//         {/* "+91" prefixed phone input with circular submit arrow */}
//     </form>
// )}
//
// Full original markup is preserved in git history at app/profile/page.tsx
// prior to the Auth.js migration, and the styling/spinner pattern is reproduced
// in components/auth/AuthPanel.tsx.

export {}
