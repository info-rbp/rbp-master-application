
import { Company } from "./company";
import { UserProfile } from "./users";

// Define scoring criteria
const industryScores: Record<string, number> = {
  technology: 20,
  finance: 15,
  healthcare: 10,
  default: 5,
};

const companySizeScores: Record<string, number> = {
  "1-10": 5,
  "11-50": 10,
  "51-200": 15,
  "201+": 20,
};

/**
 * Calculates a lead score based on user and company data.
 * @param user The user profile data.
 * @param company The company data.
 * @returns The calculated lead score.
 */
export const calculateLeadScore = (user: UserProfile, company?: Company): number => {
  let score = 0;

  // Score based on industry
  if (company?.industry) {
    score += industryScores[company.industry] ?? industryScores.default;
  }

  // Score based on company size
  if (company?.size) {
    score += companySizeScores[company.size] ?? 0;
  }

  // Add points if the user has a professional email
  if (user.email && !isFreeEmailProvider(user.email)) {
    score += 10;
  }

  return score;
};

/**
 * Determines the qualification status of a lead based on their score.
 * @param score The lead score.
 * @returns The lead qualification status.
 */
export const getLeadQualification = (score: number): 'unqualified' | 'MQL' | 'high-intent' => {
  if (score >= 40) {
    return 'high-intent';
  }
  if (score >= 20) {
    return 'MQL';
  }
  return 'unqualified';
};

const freeEmailProviders = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'icloud.com',
]);

/**
 * Checks if an email address is from a free email provider.
 * @param email The email address to check.
 * @returns True if the email is from a free provider, false otherwise.
 */
const isFreeEmailProvider = (email: string): boolean => {
  const domain = email.split('@')[1];
  return freeEmailProviders.has(domain);
};
