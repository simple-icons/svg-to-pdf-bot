const fs = require('fs-promise')
const { createRobot } = require('probot')

const app = require('../index.js')

const { addition, removal, modification } = require('./payloads/single')

describe('svg-to-pdf', () => {
  let robot
  let github
  let getConfig
  let getIcon

  beforeAll(async () => {
    let configBuffer = await fs.readFile('./test/fixtures/config.yml')
    getConfig = { data: { content: configBuffer.toString('base64') } }

    let iconBuffer = await fs.readFile('./test/fixtures/icon.svg')
    getIcon = { data: { content: iconBuffer.toString('base64') } }

    // Make sure dry run is enabled
    process.env.dry = 'true'
  })

  beforeEach(() => {
    robot = createRobot()
    robot.log.info = jest.fn() // Disable logging
    app(robot)

    github = {
      repos: {
        getContent: jest.fn()
          .mockReturnValueOnce(Promise.resolve(getConfig))
          .mockReturnValue(Promise.resolve(getIcon)),
        createFile: jest.fn(),
        deleteFile: jest.fn(),
        updateFile: jest.fn()
      }
    }

    robot.auth = () => Promise.resolve(github)
  })

  test('Does not commit new files', async () => {
    await robot.receive(addition)
    expect(github.repos.createFile).not.toHaveBeenCalled()
  })

  test('Does not commit removed files', async () => {
    await robot.receive(removal)
    expect(github.repos.deleteFile).not.toHaveBeenCalled()
  })

  test('Does not commit modified files', async () => {
    await robot.receive(modification)
    expect(github.repos.updateFile).not.toHaveBeenCalled()
  })
})
