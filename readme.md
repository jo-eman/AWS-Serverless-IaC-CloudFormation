## Serverless Image Gallery + Infrastructure as Code + Pipeline

Disclaimer: This project was created for educational purposes while learning AWS from scratch. It utilizes principle of least privilige and AWS Well Architechted Framework principles. However I acknowledge that it contains some areas of improvement and not-best-practices. I display it here to demonstrate some knowlege in AWS, serverless architecture and IaC

This project contains an AWS Serverless Application/CloudFormation template that deploys a serverless image gallery application in AWS behind CloudFront CDN and a WAF that restricts access to only allow 1 ip.

- Regional template creates a stack with necessary aws resources such as lambdas, lambdalayers, buckets, API, IAM policies, WAF
- Global template creates a stack with CloudFront distribution + WAF, IAM
- deploy.sh script:
  - passes initial parameters to the deployment of regional template
  - creates necessary resources and passes output from regional template as input parameters to global template
  - invoke lambda to push code to codecommit repo created by template to execute the codepipeline
  - output cloudfront url to the deployed web app + codecommit repo url for developing in the codepipeline

To run this you will need an AWS Account + AWS CLI

Edit the parameters in deploy.sh and run
