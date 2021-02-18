const aws = require('aws-sdk');
const cloudfront = new aws.CloudFront();
const codepipeline = new aws.CodePipeline();

exports.handler = (event, context, callback) => {
    const jobId = event["CodePipeline.job"].id;
    const distributionId = event['CodePipeline.job'].data.actionConfiguration.configuration.UserParameters;
    const putJobSuccess = (message) => {
        codepipeline.putJobSuccessResult({jobId}, (err, data) => {
            if(err) {
                context.fail(err);      
            } else {
                context.succeed(message);      
            }
        });
    };
    
    const putJobFailure = (message) => {
        codepipeline.putJobFailureResult({
            jobId,
            failureDetails: {
                message: JSON.stringify(message),
                type: 'JobFailed',
                externalExecutionId: context.invokeid
            }
        }, () => {
            context.fail(message);      
        });
    };

    cloudfront.createInvalidation({
        DistributionId: distributionId,
        InvalidationBatch: {
            CallerReference: Date.now() + '',
            Paths: {
                Quantity: 1,
                Items: ['/*']
            }
        }
    }, (err, data) => {
        if (err) {
            putJobFailure(err);
        } else {
            putJobSuccess(data);
        }
    });
};