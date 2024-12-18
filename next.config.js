const withPWA = require("next-pwa");
const withImages = require('next-images');


module.exports = withPWA(
  withImages({
    pwa: {
      dest: "public",
      // register: true,
      // disable: process.env.NODE_ENV === 'production' ? false : true
    },
    fileExtensions: ['jpg', 'jpeg', 'png', 'gif'],
    reactStrictMode: false,
    esModule: true,
    images: {
      disableStaticImages: true
    },
    webpack(config, _options) {
      config.module.rules.push({
        test: /\.(graphql|gql)/,
        exclude: /node_modules/,
        loader: "graphql-tag/loader"
      });
  
      return config
    },
    build: {
      env: {
        NEXT_PUBLIC_APP_KEY: process.env.NEXT_PUBLIC_APP_KEY,
        NEXT_PUBLIC_OAUTH_ID: process.env.NEXT_PUBLIC_OAUTH_ID,
        NODE_ENV: process.env.NODE_ENV
      },
    }
  })
);

