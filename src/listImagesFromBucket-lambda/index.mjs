import { S3Client, ListObjectsCommand } from "@aws-sdk/client-s3";

const s3Region = process.env.BUCKET_REGION

const s3 = new S3Client({ region: s3Region });
// BUCKET_NAME is specified in ListImagesLambdaFunction resource in CloudFormation template
//      Environment:
//        Variables:
//          BUCKET_NAME: !Ref FrontendBucket
const bucketName = process.env.BUCKET_NAME 

export const handler = async (event, context) => {
  const command = new ListObjectsCommand({ Bucket: bucketName, Prefix: "images/" });

  try {
    const data = await s3.send(command);
    const urls = createUrls(data.Contents);
    return createResponse(200, urls);
  } catch (error) {
    console.error("Error fetching data from S3:", error);
    return createResponse(500, { error: "An error occurred while fetching images" });
  }
};


const createUrls = (contents) => {
  return contents.map(
    (content) => `${content.Key}`
  );
}

const createResponse = (statusCode, body) => {
  return {
    statusCode,
        headers: {
      'Access-Control-Allow-Origin': '*', // Or your specific origin
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
}
