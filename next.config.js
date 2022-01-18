const withImages = require('next-images')

module.exports =  withImages({
    fileExtensions: ['jpg', 'jpeg', 'png', 'gif'],
    reactStrictMode: false,
    esModule: true,
    images: {
      disableStaticImages: true
    },
    webpack(config, options) {
      return config
    },
    build: {
      env: {
        NEXT_PUBLIC_APP_KEY: process.env.NEXT_PUBLIC_APP_KEY,
      },
    }
})

