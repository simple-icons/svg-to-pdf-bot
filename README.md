# svg-to-pdf

a GitHub App built with [probot](https://github.com/probot/probot) that
converts SVG files into PDF files.

## Setup

```
# Install dependencies
npm install

# Run the bot
npm start
```

## Deploying

If you would like to run your own instance of this app, see the [docs for deployment](https://probot.github.io/docs/deployment/). This app requires
these **Permissions & events** for the GitHub App:

- Repository Contents - **Read & Write**
  - [x] Check the box for **Push** events
- Single File - **Read-only**
  - Path: `.github/svg-to-pdf.yml`
