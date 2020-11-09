# PressFBot
![Workflow Status](https://github.com/auguwu/PressFBot/workflows/ESLint/badge.svg)

press f in chat bois

## Installation
### Requirements
- Docker (optional)
- Sentry (optional)
- Node.js v10 or higher
- Redis

### Process (locally)
- [Fork](https://github.com/auguwu/PressFBot/fork) the repository under your username and run `git clone https://github.com/$USERNAME/PressFBot`
  - omit `$USERNAME` with your actual username on GitHub.
- Change to the directory (`cd PressFBot`) and run `npm i` to install all dependencies
- Complete the `.env` file under the `.env.example` file (`cp .env.example .env`)
- Run `npm start` to start the bot

### Process (Docker)
> Notice: **This is the recommended way to run PressFBot so you don't need to install any dependencies on your machine.**
>
> :warning: **If you are using Windows or macOS, please install Docker Desktop for your system if you are going to use this method.**

- [Fork](https://github.com/auguwu/PressFBot/fork) the repository under your username and run `git clone https://github.com/$USERNAME/PressFBot`
  - omit `$USERNAME` with your actual username on GitHub.
- Change to the directory (`cd PressFBot`) and complete the `.env` file under the `.env.example` file (`cp .env.example .env`)
- Run `npm run docker:build` to create a image called **pressfbot** under the **latest** tag.
- Run the image by running `npm run docker:run` to start 2 processes of Redis and the bot itself.

## License
**PressFBot** is released under the MIT License, read [here](/LICENSE) for more information.
