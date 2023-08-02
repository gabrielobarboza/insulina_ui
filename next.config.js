const withPWA = require("next-pwa");
const withImages = require('next-images');

const isProduction =  process.env.NODE_ENV === 'production'

module.exports = withPWA(
  withImages({
    pwa: {
      dest: "public",
      register: true,
      disable: isProduction ? false : true
    },
    fileExtensions: ['jpg', 'jpeg', 'png', 'gif'],
    reactStrictMode: false,
    esModule: true,
    images: {
      disableStaticImages: true
    },
    webpack(config, _options) {
      return config
    },
    build: {
      env: {
        NEXT_PUBLIC_APP_KEY: process.env.NEXT_PUBLIC_APP_KEY,
        NODE_ENV: process.env.NODE_ENV
      },
    }
  })
);

