# 1. Download latest from Docker Hub
FROM node:alpine

# 2. Set the directory
WORKDIR /opt/PressFBot

# 3. Copy package.json to the working directory
COPY package*.json ./

# 4. Runs `npm install`
RUN npm install

# 5. Install global dependencies
RUN npm install -g eslint

# 6. Copy the source code
COPY . .

# 7. Lints the repository
RUN npm run lint

# 8. Setup entrypoint
CMD [ "npm", "run", "start" ]
