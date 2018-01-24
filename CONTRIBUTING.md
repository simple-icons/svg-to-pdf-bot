# Contributing to this Simple Icons Bot

Simple Icons welcomes contributions and corrections. Before contributing, please make sure you have read the guidelines below. If you would like to contribute enhancements or fixes, please do the following:

1. Fork this repository
1. Hack on a separate topic branch from the latest `master`
1. Commit and push to the topic branch
1. Make a pull request

## Table of contents

* [Running Locally](#running-locally)
* [Guidelines](#guidelines)
* [Writing Tests](#writing-tests)

## Running Locally

1. Go to [smee.io](https://smee.io/) and click **Start a new channel**. Set `WEBHOOK_PROXY_URL` in your `.env` to the URL that you are redirected to
1. Create a [new github app](https://github.com/settings/apps/new) with:
    - **Webhook URL**: Use your `WEBHOOK_PROXY_URL` from the previous step
    - **Webhook Secret**: Use the `WEBHOOK_SECRET` from your `.env` file
    - **Permissions and events**:
        - Repository Contents - **Read & Write**
            - Check the box for **Push** events
        - Single File - **Read-only**
            - Path: `.github/svg-to-pdf.yml`
1. Download the private key and move it to the project's directory
1. Edit `.env` and set `APP_ID` to the ID of the app you just created
1. Install the dependencies for the project using `npm install`
1. Start the bot using `npm start`

> based on the [Developing an App](https://probot.github.io/docs/development/) section of the Probot docs

## Guidelines

Please note that modifications should follow these coding guidelines:

- Indent is 2 spaces
- Use `async`/`await` over Promises and callbacks
- Code should pass `npm test`

## Writing Tests

Tests for this bot are written using [Jest](https://facebook.github.io/jest/). For more information about testing a Probot have a look over [here](https://probot.github.io/docs/testing/). The testing code adheres to the same style as production code. If you need a new event, have a look in `test/payloads`. If you need a new icon or configuration file (or other file) have a look in `test/fixtures`.
