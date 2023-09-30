#!/bin/bash
set -e

# PREREQUISITES: AWS CLI, PIP, PYENV OR PYTHON3.8

# Define the parameters
IP_ADDRESS="0.0.0.0/32"
FRONTEND_BUCKET_NAME="webbucket-helloworld-9"
CODE_BUCKET_NAME="serverless-image-gallery-codebucket-9"
REPO_NAME="Serverless-Image-Gallery-repo"
PIPELINE_PROJECT_NAME="Serverless-Image-Gallery-project"
STACK_NAME="YourRegionalStackName"
GLOBAL_STACK_NAME="YourGlobalStackName"
REGION="eu-central-1"
GITNAME="serverlessimagegallery"
GITEMAIL="serverless@image.gallery"

# Create the code bucket
if aws s3 ls "s3://$CODE_BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'
then
  aws s3api create-bucket --bucket $CODE_BUCKET_NAME --region $REGION --create-bucket-configuration LocationConstraint=$REGION
  echo "Created bucket: $CODE_BUCKET_NAME"
else
  echo "Bucket $CODE_BUCKET_NAME already exists"
fi

# pip3 or pip + pyenv and/or python3.8 required to build the aws cli lambda layer
if [ ! -f ./aws-cli-layer.zip ]; then
    echo "Creating the AWS CLI Layer..."
    mkdir -p awscli-lambda-layer/python/lib/python3.8/site-packages
    mkdir -p awscli-lambda-layer/python/bin
    # Create a virtual environment with Python 3.8
    pyenv exec python3.8 -m venv venv
    source venv/bin/activate
    # Install AWS CLI in the virtual environment
    pip install awscli
    # Copy the AWS CLI script to the target directory
    cp venv/bin/aws awscli-lambda-layer/
    # Copy the AWS CLI module and its dependencies to the target directory
    cp -r venv/lib/python3.8/site-packages/* awscli-lambda-layer/
    deactivate
    rm -rf venv
    # Modify the shebang line of the AWS CLI script
    sed -i '' '1s@^.*$@#!/var/lang/bin/python3.8@' awscli-lambda-layer/aws
    # Zip the layer
    cd awscli-lambda-layer
    zip -r ../aws-cli-layer.zip .
    cd ..
    rm -rf awscli-lambda-layer
    echo "AWS CLI Layer created."
else
    echo "AWS CLI Layer already exists"
fi

AWSCLI_LAMBDA_LAYER="aws-cli-layer.zip"


# Copy the Git layer to the S3 bucket
aws s3 cp ./aws-cli-layer.zip s3://$CODE_BUCKET_NAME/
aws s3 cp ./listimageslambda.zip s3://$CODE_BUCKET_NAME/

# Deploy the CloudFormation stack
aws cloudformation deploy \
  --template-file regional-bucket-lambda-api-pipeline-waf-acl.yaml \
  --stack-name $STACK_NAME \
  --region $REGION \
  --capabilities CAPABILITY_IAM CAPABILITY_AUTO_EXPAND \
  --parameter-overrides WebBucketName=$FRONTEND_BUCKET_NAME \
  AllowedIP=$IP_ADDRESS RepoName=$REPO_NAME CodeBucketName=$CODE_BUCKET_NAME \
  PipelineProjectName=$PIPELINE_PROJECT_NAME Region=$REGION \
  AwsCliLambdaLayerZip=$AWSCLI_LAMBDA_LAYER GitName=$GITNAME GitEmail=$GITEMAIL

# Parse the output from the stack to get the S3 Domain, OAI and CodeBucket
s3Domain=$(aws cloudformation describe-stacks --region $REGION --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketDomainName'].OutputValue" --output text)
oai=$(aws cloudformation describe-stacks --region $REGION --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketOAI'].OutputValue" --output text)
codepushLambda=$(aws cloudformation describe-stacks --region $REGION --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='PushToCodeCommitLambda'].OutputValue" --output text)
listImagesApiUrl=$(aws cloudformation describe-stacks --region $REGION --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='ListImagesApi'].OutputValue" --output text)
RepoURL=$(aws cloudformation describe-stacks --region $REGION --stack-name $STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='RepoURL'].OutputValue" --output text)

sed -i '' "s|%%LIST_IMAGES_API_URL%%|$listImagesApiUrl|" src/frontend/script.js

# Copy the code to the S3 bucket
aws s3 cp ./src/ s3://$CODE_BUCKET_NAME/src/ --recursive

# Trigger the Lambda function to push the code to the codecommit repo which will trigger the pipeline to execute
aws lambda invoke --function-name $codepushLambda --region $REGION /dev/null --cli-read-timeout 300

# Deploy the global CloudFormation stack
aws cloudformation deploy --template-file global-cloudfront-waf-acl.yaml --stack-name $GLOBAL_STACK_NAME --region us-east-1 --capabilities CAPABILITY_IAM \
--parameter-overrides FrontendBucketDomainName=$s3Domain FrontendBucketOAI=$oai AllowedIP=$IP_ADDRESS

CLOUDFRONT_DISTRIBUTION_ID=$(aws cloudformation describe-stacks --region us-east-1 --stack-name $GLOBAL_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionID'].OutputValue" --output text)
CLOUDFRONT_DISTRIBUTION_URL=$(aws cloudformation describe-stacks --region us-east-1 --stack-name $GLOBAL_STACK_NAME --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionUrl'].OutputValue" --output text)
# aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
echo "Cloudfront distribution created: $CLOUDFRONT_DISTRIBUTION_URL"
echo "Repository URL: $RepoURL"