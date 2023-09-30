import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "eu-north-1" });
const bucketName = "testing-2106"; // replace with your bucket name


// Generates a pre-signed URL for uploading a file to S3
const getPresignedPutUrl = async (key) => {
    const command = new PutObjectCommand({ Bucket: bucketName, Key: key });
    const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

    return presignedUrl;
}

export const handler = async (event, context) => {
    // Set CORS headers for all responses
    const headers = {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
        "Access-Control-Allow-Credentials" : true // Required for cookies, authorization headers with HTTPS 
    };

    // Handle POST request
    if (event.httpMethod === 'POST') {
        const key = Math.random().toString(36).substring(2, 15); // a unique key for each image
        const presignedPutUrl = await getPresignedPutUrl(key);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ uploadUrl: presignedPutUrl, key }),
        };
    }
    else {
        // In case other HTTP methods are used
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Invalid HTTP method" }),
        };
    }
};
