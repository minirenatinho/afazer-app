import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      eas: {
        projectId: "6c1a19bd-1c52-4b85-b95b-ef07cdf67aad"
      },
      EXPO_API_URL: process.env.EXPO_API_URL,
    },
  };
};
