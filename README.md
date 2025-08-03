# Legal Calculator - Property Transfer Cost Calculator

A complete AWS SAM-based solution for calculating property transfer costs in Namibia, featuring both a REST API and an embeddable JavaScript widget.

## 🚀 Features

- **CloudFront CDN**: Global content delivery for both API and static assets
- **Dual Environment Support**: Separate sandbox and live environments
- **REST API**: Fast and reliable transfer cost calculations
- **JavaScript Widget**: Easy-to-embed calculator for any website
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Theme Support**: Light and dark themes with customization options
- **Custom Domains**: Support for your own branded domains
- **Enhanced Security**: DDoS protection and security headers
- **Comprehensive Documentation**: Complete integration guide with examples

## 📋 Requirements

- AWS CLI configured with appropriate permissions
- AWS SAM CLI installed
- Node.js 18.x or later
- Bash shell (for deployment scripts)

## 🛠️ Quick Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd legalbcalculator
```

### 2. Deploy to AWS

```bash
# Make deployment script executable
chmod +x deploy.sh

# Deploy to sandbox environment
./deploy.sh sandbox

# Deploy to live environment
./deploy.sh live

# Deploy with custom domains (optional)
./deploy.sh live calculator.yourdomain.com api.yourdomain.com
```

### 3. Integration

After deployment, you'll get the integration code. Simply add it to your website:

```html
<script src="https://your-cloudfront-domain/legal-calculator-widget.js"></script>
<div id="legal-calculator"></div>
<script>
new LegalCalculatorWidget('legal-calculator', {
    apiUrl: 'https://your-api-cloudfront-domain/calculate',
    theme: 'light'
});
</script>
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   API Gateway   │────│  Lambda Function │────│  Transfer Cost  │
│   (API CDN)     │    │                 │    │                 │    │   Calculation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CloudFront    │────│   S3 Bucket     │────│ JavaScript Widget│
│ (Static CDN)    │    │                 │    │  & Documentation │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Components

1. **CloudFront CDN**: Global content delivery for enhanced performance
2. **AWS Lambda Function**: Handles transfer cost calculations
3. **API Gateway**: Provides REST API endpoints with CORS support
4. **S3 Bucket**: Hosts the JavaScript widget and documentation
5. **CloudFormation**: Infrastructure as Code with SAM template

## 📊 API Reference

### Endpoint
```
POST /calculate
```

### Request Body
```json
{
  "amount": 750000,
  "sub_type": "F",
  "dutytype": "N", 
  "date": "after"
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `amount` | Number | Yes | Property value in Namibian Dollars |
| `sub_type` | String | Yes | Property type: "S" (Sectional Title) or "F" (Freehold) |
| `dutytype` | String | Yes | Duty type: "N" (Normal), "A" (Agricultural), "C" (Commercial) |
| `date` | String | Yes | Transfer date: "before" (before Oct 1, 2024) or "after" |

### Response
```json
{
  "transferFees": 12000.00,
  "vatOnFees": 1800.00,
  "transferDuty": 5000.00,
  "stampDuty": 1200.00,
  "deedsOfficeFee": 400.00,
  "sundriesPostagesVAT": 1265.00,
  "total": 21665.00
}
```

## 🎨 Widget Customization

### Basic Configuration
```javascript
new LegalCalculatorWidget('container-id', {
    apiUrl: 'your-api-endpoint',
    theme: 'light',           // 'light' or 'dark'
    currency: 'N$',           // Currency symbol
    loadingText: 'Calculating...',
    errorText: 'Error calculating costs'
});
```

### Custom Styling
```css
.legal-calc-widget {
    border: 2px solid #your-brand-color;
    border-radius: 15px;
}

.legal-calc-widget .calc-button {
    background: #your-brand-color;
}
```

### Theme Examples

**Light Theme (Default)**
```javascript
new LegalCalculatorWidget('calculator', { theme: 'light' });
```

**Dark Theme**
```javascript
new LegalCalculatorWidget('calculator', { theme: 'dark' });
```

## 🌍 Environment Management

### Sandbox Environment
- **Purpose**: Development and testing
- **API URL**: `https://cloudfront-id.cloudfront.net/calculate` (via CloudFront)
- **Direct API**: `https://api-id.execute-api.region.amazonaws.com/sandbox/calculate`
- **Use Case**: Integration testing, development

### Live Environment  
- **Purpose**: Production use
- **API URL**: `https://cloudfront-id.cloudfront.net/calculate` (via CloudFront)
- **Direct API**: `https://api-id.execute-api.region.amazonaws.com/live/calculate`
- **Custom Domain**: `https://api.yourdomain.com/calculate` (optional)
- **Use Case**: Real-world calculations

### Switching Environments
```bash
# Deploy to sandbox
./deploy.sh sandbox

# Deploy to live
./deploy.sh live

# Deploy to live with custom domains
./deploy.sh live calculator.yourdomain.com api.yourdomain.com
```

## 🔧 Integration Examples

### WordPress
```php
// Add to functions.php
function add_legal_calculator() {
    wp_enqueue_script('legal-calculator', 'https://your-widget-url.js');
}
add_action('wp_enqueue_scripts', 'add_legal_calculator');

// Shortcode usage: [legal_calculator]
```

### React
```jsx
import { useEffect, useRef } from 'react';

function LegalCalculator({ apiUrl }) {
    const containerRef = useRef(null);
    
    useEffect(() => {
        new LegalCalculatorWidget(containerRef.current.id, { apiUrl });
    }, [apiUrl]);
    
    return <div id="legal-calc-react" ref={containerRef}></div>;
}
```

### Vue.js
```vue
<template>
  <div :id="containerId"></div>
</template>

<script>
export default {
  props: ['apiUrl'],
  data() {
    return {
      containerId: 'legal-calc-' + Math.random().toString(36).substr(2, 9)
    };
  },
  mounted() {
    new LegalCalculatorWidget(this.containerId, { apiUrl: this.apiUrl });
  }
};
</script>
```

## 📁 Project Structure

```
legalbcalculator/
├── template.yaml                 # SAM template with CloudFront
├── src/
│   └── index.js                  # Lambda function
├── cache-invalidation/
│   └── index.py                  # CloudFront cache invalidation
├── widget/
│   └── legal-calculator-widget.js # JavaScript widget
├── documentation.html            # Integration documentation
├── deploy.sh                     # Deployment script
├── README.md                     # This file
└── .env.sandbox                  # Environment config (generated)
└── .env.live                     # Environment config (generated)
```

## 🚀 Deployment Process

1. **Build**: SAM builds the Lambda function and cache invalidation
2. **Deploy**: CloudFormation creates AWS resources including CloudFront
3. **Upload**: Widget and documentation uploaded to S3
4. **Cache Invalidation**: CloudFront cache invalidated for updated files
5. **Configure**: Environment variables saved locally

## 🔍 Troubleshooting

### Common Issues

**Widget not displaying**
- Check script is loaded before initialization
- Verify container element exists
- Check browser console for errors

**API errors**
- Verify API URL is correct
- Check CORS settings
- Ensure all required parameters are sent

**Styling conflicts**
- Use more specific CSS selectors
- Check for existing CSS conflicts
- Verify theme parameter

### Debug Mode
```javascript
new LegalCalculatorWidget('calculator', {
    apiUrl: 'https://your-cloudfront-domain/calculate',
    debug: true  // Enable detailed logging
});
```

## 📈 Cost Calculation Logic

The calculator implements Namibian property transfer cost calculations with:

- **Transfer Fees**: Based on property value and type (Sectional/Freehold)
- **VAT**: 15% on transfer fees
- **Transfer Duty**: Progressive rates based on property value and duty type
- **Stamp Duty**: Additional duty calculations
- **Office Fees**: Deeds office processing fees
- **Sundries**: Postages and other administrative costs

### Date-based Calculations
- **Before October 1, 2024**: Uses older rate structure
- **From October 1, 2024**: Uses updated rates and thresholds

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in sandbox environment
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For technical support or questions:
- Check the troubleshooting section
- Review the documentation at your website URL
- Contact the development team

## 🎉 Getting Started

1. **Deploy**: Run `./deploy.sh sandbox`
2. **Test**: Visit the CloudFront documentation URL to try the calculator
3. **Integrate**: Add the widget to your website using CloudFront URLs
4. **Go Live**: Deploy to live environment when ready
5. **Custom Domains**: Optionally set up custom domains for professional branding

Your Legal Calculator with global CloudFront CDN is now ready to help users calculate property transfer costs in Namibia! 🏠💰🌍 