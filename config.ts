import 'dotenv/config'

const getEnvironmentVariable = (environmentVariable: string): string => {
    const unvalidatedEnvironmentVariable = process.env[environmentVariable];
    if (!unvalidatedEnvironmentVariable) {
      throw new Error(
        `Couldn't find environment variable: ${environmentVariable}`
      );
    } else {
      return unvalidatedEnvironmentVariable;
    }
  };
  
  export const config = {
    AppKey: getEnvironmentVariable('NEXT_PUBLIC_APP_KEY'),
    ApiUrl: getEnvironmentVariable('NEXT_PUBLIC_API_URL'),
    OAuthId: getEnvironmentVariable('NEXT_PUBLIC_OAUTH_ID'),
  };