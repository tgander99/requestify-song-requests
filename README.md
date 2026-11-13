# Requestify Song Requests

Build a polished, mobile-first web app called Requestify for small parties. Visual design: near-black background with neon purple and electric blue accents, crisp DJ/music aesthetic. Guest flow: public request page usable from a QR code without installing an app; fields for song title and artist (required), guest name and dedication/message (optional); validation, duplicate/spam protection, friendly success confirmation. Admin flow: private DJ dashboard with live incoming requests and queue, approve/reject, mark played, remove requests, clear status labels and sensible empty/loading/error states. Include a built-in QR code display/download or print view pointing to the public request page. Use Lovable's supported full-stack stack and backend database if available; implement secure admin authentication and server-side authorization so guests cannot access admin controls. Realtime updates where supported. Do not claim push notifications are guaranteed on iOS; provide an in-dashboard live queue and browser notifications where supported with permission. Keep dependencies and infrastructure on free tiers, and explain any required setup or limits. Build the working MVP, not just a mockup. Test the main guest and admin flows and report any remaining setup steps. Do not require paid integrations.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://requestify-song-requests.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f60540b3-aadc-4c66-b358-32778cd17e98).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
