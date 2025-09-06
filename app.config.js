import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '.env') });

module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID,
      },
      EXPO_API_URL: process.env.EXPO_API_URL,
    },
  };
};
