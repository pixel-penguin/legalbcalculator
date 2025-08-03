#!/bin/bash

# Widget Upload Script - Fast deployment for widget and documentation only
# Usage: ./upload-widget.sh [sandbox|live]

set -e

ENVIRONMENT=${1:-live}
STACK_NAME="legal-calculator-${ENVIRONMENT}"

echo "🚀 Uploading widget and documentation to ${ENVIRONMENT} environment..."

# Validate environment parameter
if [[ "$ENVIRONMENT" != "sandbox" && "$ENVIRONMENT" != "live" ]]; then
    echo "❌ Error: Environment must be 'sandbox' or 'live'"
    echo "Usage: $0 [sandbox|live]"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed. Please install it first."
    exit 1
fi

echo "📋 Stack name: ${STACK_NAME}"

# Get the bucket name and distribution ID from the existing stack
echo "📊 Getting deployment information from CloudFormation..."

BUCKET_NAME=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
    --output text \
    --region "${AWS_REGION:-us-east-1}")

STATIC_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`StaticDistributionId`].OutputValue' \
    --output text \
    --region "${AWS_REGION:-us-east-1}")

WEBSITE_CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteCloudFrontUrl`].OutputValue' \
    --output text \
    --region "${AWS_REGION:-us-east-1}")

# Validate that we got the required information
if [[ -z "$BUCKET_NAME" || "$BUCKET_NAME" == "None" ]]; then
    echo "❌ Error: Could not get bucket name from stack ${STACK_NAME}"
    echo "   Make sure the stack exists and has been deployed with SAM"
    exit 1
fi

if [[ -z "$STATIC_DISTRIBUTION_ID" || "$STATIC_DISTRIBUTION_ID" == "None" ]]; then
    echo "❌ Error: Could not get CloudFront distribution ID from stack ${STACK_NAME}"
    echo "   Make sure the stack exists and has been deployed with SAM"
    exit 1
fi

echo "🪣 S3 Bucket: ${BUCKET_NAME}"
echo "🌐 CloudFront Distribution ID: ${STATIC_DISTRIBUTION_ID}"

# Check if files exist
if [[ ! -f "widget/legal-calculator-widget.js" ]]; then
    echo "❌ Error: widget/legal-calculator-widget.js not found"
    exit 1
fi

if [[ ! -f "documentation.html" ]]; then
    echo "❌ Error: documentation.html not found"
    exit 1
fi

echo "📤 Uploading widget and documentation files to S3..."

# Upload widget file with cache headers
echo "   ↗️ Uploading widget/legal-calculator-widget.js..."
aws s3 cp widget/legal-calculator-widget.js "s3://${BUCKET_NAME}/" \
    --content-type "application/javascript" \
    --cache-control "max-age=86400" \
    --metadata-directive REPLACE

# Upload documentation with cache headers
echo "   ↗️ Uploading documentation.html..."
aws s3 cp documentation.html "s3://${BUCKET_NAME}/" \
    --content-type "text/html" \
    --cache-control "max-age=3600" \
    --metadata-directive REPLACE

echo "🔄 Invalidating entire CloudFront cache..."

# Invalidate entire CloudFront cache
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "${STATIC_DISTRIBUTION_ID}" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "   🆔 Invalidation ID: ${INVALIDATION_ID}"

echo ""
echo "✅ Upload completed successfully!"
echo ""
echo "📋 Uploaded Files:"
echo "   📄 Widget: ${WEBSITE_CLOUDFRONT_URL}/legal-calculator-widget.js"
echo "   📚 Documentation: ${WEBSITE_CLOUDFRONT_URL}/"
echo ""
echo "⏱️  CloudFront cache invalidation initiated (usually takes 1-3 minutes)"
echo ""
echo "🎯 You can now use the updated widget at:"
echo "   <script src=\"${WEBSITE_CLOUDFRONT_URL}/legal-calculator-widget.js\"></script>"
echo ""

# Optional: Wait for invalidation to complete
read -p "🤔 Do you want to wait for CloudFront invalidation to complete? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "⏳ Waiting for CloudFront invalidation to complete..."
    aws cloudfront wait invalidation-completed \
        --distribution-id "${STATIC_DISTRIBUTION_ID}" \
        --id "${INVALIDATION_ID}"
    echo "✅ CloudFront invalidation completed! Your files are now live."
else
    echo "ℹ️  You can check invalidation status with:"
    echo "   aws cloudfront get-invalidation --distribution-id ${STATIC_DISTRIBUTION_ID} --id ${INVALIDATION_ID}"
fi

echo ""
echo "🎉 Widget upload complete - ready to use!" 