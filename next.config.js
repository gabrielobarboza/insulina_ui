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
    }
  })
);

