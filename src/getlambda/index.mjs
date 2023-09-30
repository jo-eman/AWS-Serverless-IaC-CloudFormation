console.log('Loading function');
        
import {S3Client, GetObjectCommand} from '@aws-sdk/client-s3';
import {sharp} from 'sharp';
const s3 = new S3Client({region: 'eu-north-1'});

export const handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: bucket,
        Key: key,
    }; 
    try {
        //const ContentType = await s3.send(new GetObjectCommand(params));
        console.log (`parameters here: ${params} ${bucket} ${key}`);
        const command = new GetObjectCommand(params);
        console.log(command)
        const {ContentType} = await s3.send(command);
        console.log('CONTENT TYPE:', ContentType);
        return ContentType;
    } catch (err) {
        console.log(err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.log(message);
        throw new Error(message);
    }
};

//hello world with optimized buildspec and caching of the node modules in the CodePipeline