import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    """
    Lambda function to invalidate CloudFront cache when files are updated
    """
    
    cloudfront = boto3.client('cloudfront')
    distribution_id = os.environ.get('DISTRIBUTION_ID')
    
    if not distribution_id:
        return {
            'statusCode': 400,
            'body': json.dumps('DISTRIBUTION_ID environment variable not set')
        }
    
    try:
        # Create invalidation for all paths
        paths = [
            '/legal-calculator-widget.js',
            '/documentation.html',
            '/index.html'
        ]
        
        # If specific paths provided in event, use those
        if 'paths' in event:
            paths = event['paths']
        
        response = cloudfront.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': len(paths),
                    'Items': paths
                },
                'CallerReference': f"cache-invalidation-{datetime.now().isoformat()}"
            }
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Cache invalidation initiated successfully',
                'invalidationId': response['Invalidation']['Id'],
                'paths': paths
            })
        }
        
    except Exception as e:
        print(f"Error creating invalidation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f'Error creating invalidation: {str(e)}')
        } 