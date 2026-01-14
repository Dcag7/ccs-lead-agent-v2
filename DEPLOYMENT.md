# Custom Domain Setup for CCS Lead Agent

## Current Deployment
- **Platform**: Vercel
- **Current URL**: `https://ccs-lead-agent-v2.vercel.app`
- **Target Domain**: `bizdev.ccsapparel.africa`
- **Hosting Provider**: Afrihost

## Step-by-Step Setup Instructions

### 1. Vercel Domain Configuration

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select the `ccs-lead-agent-v2` project
3. Navigate to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter your desired subdomain:
   - `bizdev.ccsapparel.africa` ✓ (configured)
6. Click **Add**
7. Vercel will display DNS configuration instructions

### 2. Afrihost DNS Configuration

#### Option A: CNAME Record (Recommended)

1. Log in to [Afrihost Control Panel](https://portal.ccsapparel.africa)
2. Navigate to **Domain Management** or **DNS Management**
3. Find your domain `ccsapparel.africa`
4. Add a new DNS record:
   - **Type**: `CNAME`
   - **Name/Host**: `bizdev`
   - **Value/Target**: `cname.vercel-dns.com` (Vercel will show the exact value)
   - **TTL**: `3600` (or leave default)
5. Save the record

#### Option B: A Record (If CNAME not supported)

If your hosting doesn't support CNAME for subdomains, use A records:
- Vercel will provide specific IP addresses in the domain settings
- Add A records pointing to those IPs

### 3. SSL Certificate

- Vercel automatically provisions SSL certificates via Let's Encrypt
- Once DNS propagates (5-60 minutes), HTTPS will be active
- No additional configuration needed

### 4. Verification

1. Wait 5-60 minutes for DNS propagation
2. Check DNS propagation: https://dnschecker.org/#CNAME/bizdev.ccsapparel.africa
3. Visit your domain: `https://bizdev.ccsapparel.africa`
4. Verify SSL certificate is active (green padlock)

### 5. Environment Variables

Ensure all environment variables are set in Vercel:
- Go to **Settings** → **Environment Variables**
- Verify all required variables are present
- Redeploy if you add new variables

## DNS Record Examples

### CNAME Record (Recommended)
```
Type: CNAME
Name: bizdev
Value: cname.vercel-dns.com
TTL: 3600
```

### A Record (Alternative)
```
Type: A
Name: bizdev
Value: [IP addresses provided by Vercel]
TTL: 3600
```

## Troubleshooting

### DNS Not Propagating
- Wait up to 24 hours for full propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Check DNS propagation status online

### SSL Certificate Issues
- Vercel automatically provisions SSL
- If issues persist, check DNS is correctly configured
- Contact Vercel support if needed

### Domain Not Resolving
- Verify DNS records are correct in Afrihost
- Check Vercel domain settings show "Valid Configuration"
- Ensure subdomain matches exactly (case-sensitive)

## Reference Links

- [Vercel Custom Domains Documentation](https://vercel.com/docs/concepts/projects/domains)
- [Afrihost DNS Management](https://portal.ccsapparel.africa)
- [DNS Checker](https://dnschecker.org/)
