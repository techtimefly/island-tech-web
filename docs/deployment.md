# Deployment

## Recommended GitHub Setup

GitHub Pages works best with one custom domain per Pages site. Keep this source repository as the working copy, then deploy each site root independently.

Recommended production shape:

```text
islandtech.io
-> GitHub Pages site for sites/islandtech

mobilemeridianco.com
-> GitHub Pages site for sites/mobilemeridian
```

If using separate GitHub repositories:

```text
islandtech.io        -> islandtech-io-pages
mobilemeridianco.com -> mobilemeridian-pages
```

If using one source repository, configure GitHub Actions to publish each folder to its own deployment target or split the built/static folders into separate Pages repositories.

## Island Tech GitHub Pages Deployment

The Island Tech Pages workflow is tracked at:

```text
.github/workflows/deploy-islandtech-pages.yml
```

Before enabling the public deployment, configure GitHub Pages for the repository to use **GitHub Actions** as the publishing source.

Add this repository secret in GitHub:

```text
WEB3FORMS_ACCESS_KEY
```

The source HTML intentionally keeps this placeholder:

```text
YOUR_WEB3FORMS_ACCESS_KEY
```

During GitHub Actions deployment, `npm run build:islandtech` copies `sites/islandtech` to `dist/islandtech` and injects `WEB3FORMS_ACCESS_KEY` into the deploy artifact only. The workflow sets `REQUIRE_WEB3FORMS_KEY=1`, so public deployment fails if the secret is missing.

Local and homelab builds should not set `WEB3FORMS_ACCESS_KEY`. In that mode, the placeholder remains and the contact form gracefully falls back to opening a prefilled email.

Local build checks:

```bash
npm run build:islandtech
REQUIRE_WEB3FORMS_KEY=1 npm run build:islandtech
WEB3FORMS_ACCESS_KEY=test_key REQUIRE_WEB3FORMS_KEY=1 npm run build:islandtech
```

## Mobile Meridian Redirects

Production DNS:

```text
notary.mobilemeridianco.com
weddings.mobilemeridianco.com
courier.mobilemeridianco.com
```

Redirect targets:

```text
notary.mobilemeridianco.com   -> https://mobilemeridianco.com/notary.html
weddings.mobilemeridianco.com -> https://mobilemeridianco.com/wedding-officiant.html
courier.mobilemeridianco.com  -> https://mobilemeridianco.com/medical-courier.html
```

GitHub Pages does not provide server-side redirect rules. Use DNS/provider redirects, Cloudflare Redirect Rules, or a tiny redirect-only Pages repository for each subdomain.

## Homelab Preview

Internal routes are deployed on the dedicated business web LXC:

```text
LXC 128 business-web
10.0.10.145
/var/www/business-sites/islandtech
/var/www/business-sites/mobilemeridian
```

LAN URLs:

```text
https://islandtech.lan
https://mobilemeridian.lan
https://mobilemeridianco.lan
https://notary.mobilemeridian.lan   -> https://mobilemeridian.lan/notary.html
https://weddings.mobilemeridian.lan -> https://mobilemeridian.lan/wedding-officiant.html
https://courier.mobilemeridian.lan  -> https://mobilemeridian.lan/medical-courier.html
```

Homelab routing:

```text
Pi-hole LXC 106 dns.hosts -> 10.0.10.20
nginx LXC 107 TLS edge -> 10.0.10.145
business-web LXC 128 nginx -> static roots
```

Tracked deployment config:

```text
deploy/business-web-lxc.nginx
deploy/business-web-edge.nginx
deploy/set-pihole-business-hosts.py
```

Smoke checks:

```bash
curl -k -I https://islandtech.lan/
curl -k -I https://mobilemeridian.lan/
curl -k -I https://notary.mobilemeridian.lan/
```

Rollback:

```text
Disable /etc/nginx/sites-enabled/business-web.lan in LXC 107.
Remove the six business records from Pi-hole dns.hosts.
Stop LXC 128 if the static host must be taken offline.
```


## TLS CA Warning

The active homelab TLS CA lives inside nginx LXC 107 at `/home/hal9000/mkcert-ca`. Regenerate shared LAN certificates inside LXC 107 with that CAROOT. Do not regenerate the shared cert with a local Odyssey/user mkcert CA; client devices trust the `hal9000@nginx` root from `http://pki.lan/rootCA.pem`, and a different CA will trigger `ERR_CERT_AUTHORITY_INVALID`.
