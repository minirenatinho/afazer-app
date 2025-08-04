// app.config.js
module.exports = ({ config }) => {
  // Get the current environment
  const isProd = process.env.APP_ENV === 'production';

  return {
    ...config,
    extra: {
      eas: {
        projectId: "6c1a19bd-1c52-4b85-b95b-ef07cdf67aad"
      },
      apiUrl: isProd 
        ? 'http://localhost:8000/api/v1/tasks/'
        : 'http://localhost:8000/api/v1/tasks/',
//        : 'https://afazer-backend.onrender.com/api/v1/tasks/',

    },
  };
};
