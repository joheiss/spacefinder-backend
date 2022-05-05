import { CognitoUser } from "@aws-amplify/auth";
import { Amplify, Auth } from "aws-amplify";
import * as AWS from "aws-sdk";
import { Credentials } from "aws-sdk";
import { config } from "./config";

Amplify.configure({
    Auth: {
        mandatorySignIn: false,
        region: config.REGION,
        userPoolId: config.USERPOOL_ID,
        userPoolWebClientId: config.APP_CLIENT_ID,
        identityPoolId: config.IDENTITYPOOL_ID,
        authenticationFlowType: "USER_PASSWORD_AUTH",
    },
});

export class AuthService {
    public async login(userName: string, password: string): Promise<CognitoUser> {
        const user = await Auth.signIn(userName, password);
        return user;
    }

    public async getTemporaryCredentials(user: CognitoUser): Promise<void> {
        const userPool = `cognito-idp.${config.REGION}.amazonaws.com/${config.USERPOOL_ID}`;
        AWS.config.credentials = new AWS.CognitoIdentityCredentials(
            {
                IdentityPoolId: config.IDENTITYPOOL_ID,
                Logins: {
                    [userPool]: user.getSignInUserSession()!.getIdToken().getJwtToken(),
                },
            },
            {
                region: config.REGION,
            }
        );
        await this._refreshCredentials();
    }

    private async _refreshCredentials(): Promise<void> {
        return new Promise((resolve, reject) => {
            (AWS.config.credentials as Credentials).refresh((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}
