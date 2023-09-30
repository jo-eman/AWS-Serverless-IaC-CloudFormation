import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3';
const s3 = new S3Client({region: 'eu-north-1'});

export const handler = async(event) => {
    // TODO implement
    const input = {
  "Body": "smurf.jpg",
  "Bucket": "testing-2106",
  "Key": "abc123123.jpg"
};
const command = new PutObjectCommand(input);
const res = await s3.send(command);
    const response = {
        statusCode: 200,
        body: JSON.stringify(res),
    };
    return response;
};

//hello world from new repository -> codepipeline 
