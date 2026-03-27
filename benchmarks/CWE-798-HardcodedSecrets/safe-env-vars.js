// Safe: Uses environment variables for secrets
const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    name: process.env.DB_NAME || 'app_dev',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  jwtSecret: process.env.JWT_SECRET
};

if (!config.openaiApiKey) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

module.exports = config;
