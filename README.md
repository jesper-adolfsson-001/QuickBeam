# QuickBeam

Quickbeam is a lightweight Node 23/Fastify web app that lets you move photos from any phone to a computer **without installing anything**.  
Pair the two browsers with a one-time QR-code, shoot/select pictures on the phone, and they appear (and can auto-download) on the desktop almost instantly.

---


# How it works

- Receiver (desktop) browses to /receiver: The server starts a short-lived session and renders a QR-code.
- Sender (phone) scans the code → opens /sender?SessionId=… : The page lets you take or pick photos and POSTs them to the server.
- The receiver page polls /status/:sessionId, fetches each file via : /image/:sessionId/:imageId, shows a thumbnail and (optionally) saves it locally using FileSaver.js.
- Sessions time out automatically (default 2 min) to clean up storage.

# Key files

- public/receiver.js – Receiver logic (polling and downloading)
- public/sender.js – Sender logic (taking/selecting photos)
- public/admin.js - Admin view for event logging
- server.js – Session and upload handling
- log-service.js – Logging events to .data/events.log
- views/ – EJS templates for receiver, sender, admin views

# Main endpoints

- POST /api/session/request – Receiver asks for a session; returns {sessionId, qrCodeData}
- POST /api/session/:id/connect – Sender announces it joined
- POST /upload/:id – Multipart photo upload
- GET /status/:id – Receiver polls for pending files / peer presence
- GET /image/:id/:imageId – Fetch and delete one image
- GET /admin – View logs Basic-Auth dashboard (set ADMIN_CREDENTIALS)

# Environment Variables
See server.js



## You built this with Glitch and then moved it to Replit!
- Originally built on [Glitch](https://glitch.com) but then moved to [Replit](https://replit.com)
- Used namecheap.com to by site name quickbeam.app
- Used fastly.com as DNS

