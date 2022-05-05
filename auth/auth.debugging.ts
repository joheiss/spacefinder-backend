import * as AWS from "aws-sdk";
import { AuthService } from "./auth.service";
import { config } from "./config";

AWS.config.region = config.REGION;

async function main() {
    const authService = new AuthService();
    const user = await authService.login(config.USERNAME, config.PASSWORD);
    await authService.getTemporaryCredentials(user);
    const creds = AWS.config.credentials;
    const buckets = await getBuckets();
    console.log(user);
}

async function getBuckets(): Promise<any> {
    let buckets;

    try {
        buckets = await new AWS.S3().listBuckets().promise();
        return buckets?.Buckets;
    } catch (e) {
        buckets = undefined;
    }
}

main();
