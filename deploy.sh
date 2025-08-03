#!/bin/bash

# Legal Calculator SAM Deployment Script - Unified CloudFront Deployment
# Usage: ./deploy.sh [sandbox|live] [custom-domain] [api-domain]

set -e

ENVIRONMENT=${1:-sandbox}
CUSTOM_DOMAIN=${2:-""}
API_DOMAIN=${3:-""}
STACK_NAME="legal-calculator-${ENVIRONMENT}"
DEPLOYMENT_BUCKET="propertynewstest"

echo "🚀 Deploying Complete Legal Calculator with CloudFront to ${ENVIRONMENT} environment..."

# Validate environment parameter
if [[ "$ENVIRONMENT" != "sandbox" && "$ENVIRONMENT" != "live" ]]; then
    echo "❌ Error: Environment must be 'sandbox' or 'live'"
    echo "Usage: $0 [sandbox|live] [custom-domain] [api-domain]"
    exit 1
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo "❌ Error: SAM CLI is not installed. Please install it first."
    exit 1
fi

echo "📦 Building SAM application..."
sam build

echo "🎯 Deploying to environment: ${ENVIRONMENT}"
echo "📋 Stack name: ${STACK_NAME}"
echo "🪣 Deployment bucket: ${DEPLOYMENT_BUCKET}"

if [[ -n "$CUSTOM_DOMAIN" ]]; then
    echo "🌐 Custom domain for static content: ${CUSTOM_DOMAIN}"
fi

if [[ -n "$API_DOMAIN" ]]; then
    echo "🔗 Custom domain for API: ${API_DOMAIN}"
fi

# Prepare parameter overrides
PARAMETER_OVERRIDES="Environment=${ENVIRONMENT}"

if [[ -n "$CUSTOM_DOMAIN" ]]; then
    PARAMETER_OVERRIDES="${PARAMETER_OVERRIDES} DomainName=${CUSTOM_DOMAIN}"
fi

if [[ -n "$API_DOMAIN" ]]; then
    PARAMETER_OVERRIDES="${PARAMETER_OVERRIDES} ApiDomainName=${API_DOMAIN}"
fi

echo "📦 Parameter overrides: ${PARAMETER_OVERRIDES}"

# Deploy with SAM
sam deploy \
    --stack-name "${STACK_NAME}" \
    --s3-bucket "${DEPLOYMENT_BUCKET}" \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides ${PARAMETER_OVERRIDES} \
    --confirm-changeset \
    --region "${AWS_REGION:-us-east-1}"

# Get the outputs
echo "📊 Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
    --output text \
    --region "${AWS_REGION:-us-east-1}")

API_CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiCloudFrontUrl`].OutputValue' \
    --output text \
    --region "${AWS_REGION:-us-east-1}")

WEBSITE_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteUrl`].OutputValue' \
    --output text \
    --region "${AWS_REGION:-us-east-1}")

WEBSITE_CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`WebsiteCloudFrontUrl`].OutputValue' \
    --output text \
    --region "${AWS_REGION:-us-east-1}")

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

API_DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiDistributionId`].OutputValue' \
    --output text \
    --region "${AWS_REGION:-us-east-1}")

# Custom domain URLs if provided
if [[ -n "$CUSTOM_DOMAIN" ]]; then
    WEBSITE_CUSTOM_URL=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}" \
        --query 'Stacks[0].Outputs[?OutputKey==`WebsiteCustomDomainUrl`].OutputValue' \
        --output text \
        --region "${AWS_REGION:-us-east-1}" 2>/dev/null || echo "")
fi

if [[ -n "$API_DOMAIN" ]]; then
    API_CUSTOM_URL=$(aws cloudformation describe-stacks \
        --stack-name "${STACK_NAME}" \
        --query 'Stacks[0].Outputs[?OutputKey==`ApiCustomDomainUrl`].OutputValue' \
        --output text \
        --region "${AWS_REGION:-us-east-1}" 2>/dev/null || echo "")
fi

echo "📤 Uploading widget and documentation files to S3..."

# Upload widget file with cache headers
aws s3 cp widget/legal-calculator-widget.js "s3://${BUCKET_NAME}/" \
    --content-type "application/javascript" \
    --cache-control "max-age=86400" \
    --metadata-directive REPLACE

# Upload documentation with cache headers
aws s3 cp documentation.html "s3://${BUCKET_NAME}/" \
    --content-type "text/html" \
    --cache-control "max-age=3600" \
    --metadata-directive REPLACE

echo "🔄 Invalidating CloudFront cache..."

# Invalidate CloudFront cache for static content
aws cloudfront create-invalidation \
    --distribution-id "${STATIC_DISTRIBUTION_ID}" \
    --paths "/legal-calculator-widget.js" "/documentation.html" "/index.html" \
    --query 'Invalidation.Id' \
    --output text

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Environment Details:"
echo "   Environment: ${ENVIRONMENT}"
echo "   Stack Name: ${STACK_NAME}"
echo ""
echo "🔗 Important URLs:"
echo "   API Endpoint (Direct): ${API_URL}/calculate"
echo "   API Endpoint (CloudFront): ${API_CLOUDFRONT_URL}/calculate"
if [[ -n "$API_CUSTOM_URL" ]]; then
    echo "   API Endpoint (Custom Domain): ${API_CUSTOM_URL}/calculate"
fi
echo ""
echo "   Documentation (S3): ${WEBSITE_URL}"
echo "   Documentation (CloudFront): ${WEBSITE_CLOUDFRONT_URL}"
if [[ -n "$WEBSITE_CUSTOM_URL" ]]; then
    echo "   Documentation (Custom Domain): ${WEBSITE_CUSTOM_URL}"
fi
echo ""
echo "   Widget URL (S3): https://${BUCKET_NAME}.s3.amazonaws.com/legal-calculator-widget.js"
echo "   Widget URL (CloudFront): ${WEBSITE_CLOUDFRONT_URL}/legal-calculator-widget.js"
echo ""
echo "🏗️  CloudFront Distribution IDs:"
echo "   Static Content: ${STATIC_DISTRIBUTION_ID}"
echo "   API: ${API_DISTRIBUTION_ID}"
echo ""
echo "🛠️  Integration Code (Recommended - using CloudFront):"
echo "   <script src=\"${WEBSITE_CLOUDFRONT_URL}/legal-calculator-widget.js\"></script>"
echo "   <div id=\"legal-calculator\"></div>"
echo "   <script>"
echo "   new LegalCalculatorWidget('legal-calculator', {"
echo "       apiUrl: '${API_CLOUDFRONT_URL}/calculate',"
echo "       theme: 'light'"
echo "   });"
echo "   </script>"
echo ""

# Save configuration to file
cat > ".env.${ENVIRONMENT}" << EOF
# Legal Calculator Configuration with CloudFront - ${ENVIRONMENT}
ENVIRONMENT=${ENVIRONMENT}
API_URL=${API_URL}/calculate
API_CLOUDFRONT_URL=${API_CLOUDFRONT_URL}/calculate
WEBSITE_URL=${WEBSITE_URL}
WEBSITE_CLOUDFRONT_URL=${WEBSITE_CLOUDFRONT_URL}
BUCKET_NAME=${BUCKET_NAME}
WIDGET_URL_S3=https://${BUCKET_NAME}.s3.amazonaws.com/legal-calculator-widget.js
WIDGET_URL_CLOUDFRONT=${WEBSITE_CLOUDFRONT_URL}/legal-calculator-widget.js
STACK_NAME=${STACK_NAME}
STATIC_DISTRIBUTION_ID=${STATIC_DISTRIBUTION_ID}
API_DISTRIBUTION_ID=${API_DISTRIBUTION_ID}
EOF

if [[ -n "$CUSTOM_DOMAIN" ]]; then
    echo "CUSTOM_DOMAIN=${CUSTOM_DOMAIN}" >> ".env.${ENVIRONMENT}"
    echo "WEBSITE_CUSTOM_URL=${WEBSITE_CUSTOM_URL}" >> ".env.${ENVIRONMENT}"
fi

if [[ -n "$API_DOMAIN" ]]; then
    echo "API_DOMAIN=${API_DOMAIN}" >> ".env.${ENVIRONMENT}"
    echo "API_CUSTOM_URL=${API_CUSTOM_URL}" >> ".env.${ENVIRONMENT}"
fi

echo "💾 Configuration saved to .env.${ENVIRONMENT}"
echo ""
echo "🎉 Your Complete Legal Calculator with CloudFront CDN is now live!"
echo ""
echo "⚡ CloudFront Benefits Active:"
echo "   ✓ Global CDN for faster loading worldwide"
echo "   ✓ HTTPS/SSL encryption for all content"
echo "   ✓ DDoS protection and security headers"
echo "   ✓ Professional CloudFront domains"
echo "   ✓ Better caching for static assets"
echo "   ✓ Support for custom domains"
echo ""

if [[ "$ENVIRONMENT" == "sandbox" ]]; then
    echo "⚠️  Remember: This is the SANDBOX environment."
    echo "   Use this for testing and development only."
    echo "   Deploy to 'live' environment for production use."
fi

echo ""
echo "📝 Next Steps:"
echo "   1. Test your calculator at: ${WEBSITE_CLOUDFRONT_URL}"
echo "   2. Use the CloudFront URLs for production integration"
echo "   3. Set up custom domains if needed (requires SSL certificates)"
echo "   4. Monitor CloudFront metrics in AWS Console"
echo ""
echo "🌟 All services deployed in one stack - ready for production!" 