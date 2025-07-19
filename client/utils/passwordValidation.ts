export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: "weak" | "medium" | "strong" | "very-strong";
  score: number;
}

export const validatePassword = (
  password: string,
): PasswordValidationResult => {
  const errors: string[] = [];
  let score = 0;

  // Minimum length requirement
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else if (password.length >= 12) {
    score += 2;
  } else {
    score += 1;
  }

  // Uppercase letter requirement
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else {
    score += 1;
  }

  // Lowercase letter requirement
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else {
    score += 1;
  }

  // Number requirement
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else {
    score += 1;
  }

  // Special character requirement
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)",
    );
  } else {
    score += 1;
  }

  // Additional strength checks
  if (password.length >= 16) {
    score += 1;
  }

  // Check for variety in character types
  const hasMultipleUppercase = (password.match(/[A-Z]/g) || []).length >= 2;
  const hasMultipleLowercase = (password.match(/[a-z]/g) || []).length >= 2;
  const hasMultipleNumbers = (password.match(/\d/g) || []).length >= 2;
  const hasMultipleSpecialChars =
    (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length >=
    2;

  if (hasMultipleUppercase) score += 0.5;
  if (hasMultipleLowercase) score += 0.5;
  if (hasMultipleNumbers) score += 0.5;
  if (hasMultipleSpecialChars) score += 0.5;

  // Check for common patterns to avoid
  const commonPatterns = [
    /(.)\1{2,}/, // Repeated characters (aaa, 111, etc.)
    /123|234|345|456|567|678|789|890/, // Sequential numbers
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i, // Sequential letters
    /password|123456|qwerty|admin|letmein|welcome|monkey|dragon|princess|football|baseball|basketball|superman|batman|master|shadow|jordan|harley/i, // Common passwords
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push(
        "Password contains common patterns and may be easily guessed",
      );
      score -= 1;
      break;
    }
  }

  // Determine strength based on score
  let strength: "weak" | "medium" | "strong" | "very-strong";
  if (score < 3) {
    strength = "weak";
  } else if (score < 5) {
    strength = "medium";
  } else if (score < 7) {
    strength = "strong";
  } else {
    strength = "very-strong";
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
    score: Math.max(0, score),
  };
};

export const getPasswordStrengthColor = (strength: string): string => {
  switch (strength) {
    case "weak":
      return "text-red-500";
    case "medium":
      return "text-yellow-500";
    case "strong":
      return "text-blue-500";
    case "very-strong":
      return "text-green-500";
    default:
      return "text-gray-500";
  }
};

export const getPasswordStrengthBg = (strength: string): string => {
  switch (strength) {
    case "weak":
      return "bg-red-500";
    case "medium":
      return "bg-yellow-500";
    case "strong":
      return "bg-blue-500";
    case "very-strong":
      return "bg-green-500";
    default:
      return "bg-gray-300";
  }
};

export const generateStrongPassword = (length: number = 16): string => {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  // Ensure at least one character from each category
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + symbols;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};
