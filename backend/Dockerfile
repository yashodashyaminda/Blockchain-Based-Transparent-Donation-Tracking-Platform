# Layer 1: Base Image (පදනම - සැහැල්ලු Linux OS එකක් සහ Node.js)
FROM node:18-alpine

# Layer 2: වැඩ කරන ෆෝල්ඩර් එක හැදීම
WORKDIR /app

# Layer 3: Dependencies විතරක් වෙනම Copy කරලා Install කිරීම (කෝඩ් එක වෙනස් කරත් මේක Cache වෙනවා)
COPY package*.json ./
RUN npm install --production

# Layer 4: අපේ සම්පූර්ණ කෝඩ් එක Box එක ඇතුළට දැමීම
COPY . .

# Layer 5: Health Check (ඔයා කිව්ව Observability වල මූලික පියවර)
# සර්වර් එක Down වුණොත් Docker එකෙන් ඔටෝම මේක Restart කරනවා
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# සර්වර් එක එළියට දෙන Port එක
EXPOSE 5000

# App එක Start කරන විදිහ
CMD ["node", "server.js"]