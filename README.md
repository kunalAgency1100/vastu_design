# Vastu Design — Bootstrap website

This folder contains the complete responsive website and all local assets. No npm install or build step is required.

## Open the website

Open `index.html` in a browser to preview the layout. The navigation, FAQs and home-check interaction work locally. PHP email delivery requires PHP web hosting.

For a local PHP preview, from this folder run:

```bash
php -S localhost:8000
```

Then open `http://localhost:8000`.

## Enable enquiry emails

Open `contact-config.php` and enter:

```php
'recipient_email' => 'YOUR_RECEIVING_EMAIL',
'sender_email' => 'AN_EMAIL_ON_YOUR_HOSTED_DOMAIN',
```

Alternatively set `VASTU_CONTACT_EMAIL` and `VASTU_FROM_EMAIL` in your hosting environment. The sender should use the website's own domain and be allowed by the hosting provider. Upload all files to PHP 7.4+ hosting with mail delivery enabled. Test delivery to your receiving inbox after configuration. PHP accepting a message does not guarantee inbox delivery; mail configuration, SPF/DKIM and spam filtering are managed by your host.

The form includes front-end and server-side validation, a CSRF token, a honeypot, a session-based submission limit and honest failure states. It does not pretend to send before a recipient is configured. The session limit is a basic deterrent, not a replacement for host-level abuse controls.

## Story image and video

The original story video file or direct video URL was not supplied. The page preserves the original portrait from the supplied website screenshot as a still, using CSS clipping without generating or changing the face. Its resolution is limited by that reference. No fake play button is shown.

When you have the original video, set `storyVideoUrl` in `assets/js/site.js` to a direct local `.mp4`/`.webm` path or an HTTPS video file URL. It becomes a native, user-controlled video with no autoplay. For a high-resolution portrait instead, replace the story frame with your own portrait image.

## Included images

Six original illustrations were generated for this website:

- `hero-vastu-home.webp`
- `vastu-compass.webp`
- `home-in-hand.webp`
- `property-selection.webp`
- `home-consultation.webp`
- `renovation-model.webp`

Each illustration also has 480px and 800px responsive WebP variants. The primary images are 1000px or 1200px wide, WebP quality 81, with transparency preserved for the three cutout illustrations. Images below the hero are lazy-loaded; the hero receives high fetch priority. Intrinsic dimensions reserve layout space. `assets/images/image-manifest.json` records actual dimensions and file sizes.

The illustrations are conceptual brand artwork, not technical drawings or prescriptive Vastu room-direction plans. Advertising logos and contact details from the reference images are not included.

## Structure

```text
Vastu-Design-Website/
  index.html
  contact.php
  contact-config.php
  README.md
  assets/
    css/styles.css
    js/site.js
    images/                 # WebP images and responsive variants
    fonts/                  # Local fonts and licences
    vendor/bootstrap/       # Local Bootstrap CSS, JS and MIT licence
```

## Editing

- Text and section structure: `index.html`.
- Colours, spacing and responsive styles: `assets/css/styles.css`.
- Home check, video URL and form behaviour: `assets/js/site.js`.
- Enquiry destination: `contact-config.php`.

Palette: ivory `#F8F8F4`, graphite `#2E342D`, muted olive `#59634F`, pale sage `#EFF1EA`, borders `#D8DED1`.

Bootstrap 5.3.8 is bundled locally. Lora and DM Sans fonts are bundled as Latin-subset WOFF2 files under their Open Font licences. The website does not depend on a CDN, tracking script or external font request to render.

The main Vastu paragraph is reproduced from your supplied copy. The remaining content follows the approved mockup and should be reviewed as your business copy before publication.
