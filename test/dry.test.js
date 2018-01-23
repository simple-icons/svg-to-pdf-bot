const fs = require('fs-promise')
const { createRobot } = require('probot')

const app = require('../index.js')

const { addition, removal, modification } = require('./payloads/single')

describe('svg-to-pdf', () => {
  let robot
  let github
  let configBuffer
  let iconBuffer

  beforeAll(async () => {
    configBuffer = await fs.readFile('./test/fixtures/dry-config.yml')
    iconBuffer = await fs.readFile('./test/fixtures/icon.svg')
  })

  beforeEach(() => {
    robot = createRobot()
    robot.log.info = jest.fn() // Disable logging
    app(robot)

    github = {
      repos: {
        getContent: jest.fn()
          .mockReturnValueOnce(Promise.resolve({ data: { content: configBuffer.toString('base64') } }))
          .mockReturnValue(Promise.resolve({ data: { content: iconBuffer.toString('base64') } })),
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
