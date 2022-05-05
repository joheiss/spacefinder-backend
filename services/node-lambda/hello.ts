import { S3 } from "aws-sdk";

// create S3 client
const s3 = new S3();

async function handler(event: any, context: any): Promise<any> {
  const buckets = await s3.listBuckets().promise();

  return {
    statusCode: 200,
    body: "Here are my S3 buckets: \n" + JSON.stringify(buckets.Buckets),
  };
}

export { handler };
