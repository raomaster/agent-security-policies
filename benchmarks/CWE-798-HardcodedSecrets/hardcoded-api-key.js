// Vulnerable: Hardcoded secrets
const OPENAI_API_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr678stu901vwx234";

const dbConfig = {
  host: "db.example.com",
  port: 5432,
  database: "production",
  user: "admin",
  password: "SuperSecret123!"
};

const STRIPE_SECRET_KEY = "sk_test_FAKE0000000000000000000000000000000000";
const WEBHOOK_SECRET = "whsec_abcdef1234567890abcdef1234567890";

module.exports = { OPENAI_API_KEY, dbConfig, STRIPE_SECRET_KEY, WEBHOOK_SECRET };
