# Contributing to this Simple Icons Bot

Simple Icons welcomes contributions and corrections. Before contributing, please make sure you have read the guidelines below. If you decide to contribute anything, please do the following:

1. Fork this repository
1. Create a new branch from the latest `master` (read more [here](https://guides.github.com/introduction/flow/))
1. Start hacking on the new branch
1. Commit and push to the new branch
1. Make a pull request

Also consider the following, this bot is tailor-made for [Simple Icons](https://github.com/simple-icons/simple-icons) and changes should always be made with that in mind. If you wish to implement significant changes you are perhaps better off forking of off this repository entirely.

## Table of contents

* [Guidelines](#guidelines)
* [Writing Tests](#writing-tests)
* [Running Locally](#running-locally)

## Guidelines

Please note that modifications should follow these coding guidelines:

- Indent is 2 spaces
- Use `async`/`await` over Promises and callbacks
- Code should pass `npm test`

## Writing Tests

Tests for this bot are written using [Jest](https://facebook.github.io/jest/). For more information about testing a Probot have a look over [here](https://probot.github.io/docs/testing/). The testing code adheres to the same style guidelines as the source code. If you need a new event, have a look in `test/payloads`. If you need a new icon or configuration file (or other file) have a look in `test/fixtures`.

## Running Locally

To run the bot locally, follow the [Developing an App](https://probot.github.io/docs/development/) instructions from the Probot documentation. This particular bot requires these **Permissions & events** for the GitHub App:

- Repository Contents - **Read & Write**
    - Check the box for **Push** events
- Single File - **Read-only**
    - Path: `.github/svg-to-pdf.yml`
