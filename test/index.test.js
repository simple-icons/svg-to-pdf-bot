const fs = require('fs-promise')
const { createRobot } = require('probot')
const yaml = require('yamljs')

const app = require('../index.js')

const { multipleChanges, multipleCommits, overwrites } = require('./payloads/advanced')
const { additions, removals, modifications } = require('./payloads/multiple')
const { addition, removal, modification } = require('./payloads/single')
const { wrongType, wrongFolder, wrongBranch, wrongRepo } = require('./payloads/wrong')

describe('svg-to-pdf', () => {
  let robot
  let github
  let config
  let getConfig
  let getIcon

  beforeAll(async () => {
    let configBuffer = await fs.readFile('./test/fixtures/config.yml')
    getConfig = { data: { content: configBuffer.toString('base64') } }

    let iconBuffer = await fs.readFile('./test/fixtures/icon.svg')
    getIcon = { data: { content: iconBuffer.toString('base64') } }

    let configString = configBuffer.toString('ascii')
    config = yaml.parse(configString)

    // Make sure dry run is disabled
    process.env.dry = 'false'
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

  describe('New files', () => {
    test('Create a new PDF', async () => {
      let expectation = expect.objectContaining({path: 'icons/test.pdf'})

      await robot.receive(addition)
      expect(github.repos.createFile).toHaveBeenCalledTimes(1)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectation)
    })

    test('Create multiple new PDFs', async () => {
      let expectationFoo = expect.objectContaining({path: 'icons/foo.pdf'})
      let expectationBar = expect.objectContaining({path: 'icons/bar.pdf'})

      await robot.receive(additions)
      expect(github.repos.createFile).toHaveBeenCalledTimes(2)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectationFoo)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectationBar)
    })

    test('Don\'t delete any files', async () => {
      await robot.receive(addition)
      expect(github.repos.deleteFile).not.toHaveBeenCalled()
    })

    test('Don\'t update any files', async () => {
      await robot.receive(addition)
      expect(github.repos.updateFile).not.toHaveBeenCalled()
    })

    test('Ignore non SVG files', async () => {
      await robot.receive(wrongType)
      expect(github.repos.createFile).not.toHaveBeenCalled()
    })

    test('Ignore SVG files in the wrong directory', async () => {
      await robot.receive(wrongFolder)
      expect(github.repos.createFile).not.toHaveBeenCalled()
    })
  })

  describe('Removed files', () => {
    test('Delete the PDF version of a file', async () => {
      let expectation = expect.objectContaining({path: 'icons/test.pdf'})

      await robot.receive(removal)
      expect(github.repos.deleteFile).toHaveBeenCalledTimes(1)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectation)
    })

    test('Delete the PDF version of multiple files', async () => {
      let expectationFoo = expect.objectContaining({path: 'icons/foo.pdf'})
      let expectationBar = expect.objectContaining({path: 'icons/bar.pdf'})

      await robot.receive(removals)
      expect(github.repos.deleteFile).toHaveBeenCalledTimes(2)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectationFoo)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectationBar)
    })

    test('Don\'t create any files', async () => {
      await robot.receive(removal)
      expect(github.repos.createFile).not.toHaveBeenCalled()
    })

    test('Don\'t update any files', async () => {
      await robot.receive(removal)
      expect(github.repos.updateFile).not.toHaveBeenCalled()
    })

    test('Ignore non SVG files', async () => {
      await robot.receive(wrongType)
      expect(github.repos.deleteFile).not.toHaveBeenCalled()
    })

    test('Ignore SVG files in the wrong directory', async () => {
      await robot.receive(wrongFolder)
      expect(github.repos.deleteFile).not.toHaveBeenCalled()
    })

    test('Ignore if a PDF version does not exist', async () => {
      github.repos.getContent = jest.fn()
        .mockReturnValueOnce(Promise.resolve(getConfig))
        .mockReturnValue(Promise.resolve({ }))

      await robot.receive(removal)
      expect(github.repos.deleteFile).toHaveBeenCalledTimes(0)
    })
  })

  describe('Modified files', () => {
    test('Update the PDF version of a file', async () => {
      let expectation = expect.objectContaining({path: 'icons/test.pdf'})

      await robot.receive(modification)
      expect(github.repos.updateFile).toHaveBeenCalledTimes(1)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectation)
    })

    test('Update the PDF version of multiple files', async () => {
      let expectationFoo = expect.objectContaining({path: 'icons/foo.pdf'})
      let expectationBar = expect.objectContaining({path: 'icons/bar.pdf'})

      await robot.receive(modifications)
      expect(github.repos.updateFile).toHaveBeenCalledTimes(2)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectationFoo)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectationBar)
    })

    test('Don\'t create any files', async () => {
      await robot.receive(modification)
      expect(github.repos.createFile).not.toHaveBeenCalled()
    })

    test('Don\'t delete any files', async () => {
      await robot.receive(modification)
      expect(github.repos.deleteFile).not.toHaveBeenCalled()
    })

    test('Ignore non SVG files', async () => {
      await robot.receive(wrongType)
      expect(github.repos.updateFile).not.toHaveBeenCalled()
    })

    test('Ignore SVG files in the wrong directory', async () => {
      await robot.receive(wrongFolder)
      expect(github.repos.updateFile).not.toHaveBeenCalled()
    })

    test('Ignore if a PDF version does not exist', async () => {
      github.repos.getContent = jest.fn()
        .mockReturnValueOnce(Promise.resolve(getConfig))
        .mockReturnValueOnce(Promise.resolve({ }))
        .mockReturnValue(Promise.resolve(getIcon))

      await robot.receive(modification)
      expect(github.repos.updateFile).toHaveBeenCalledTimes(0)
      expect(github.repos.createFile).toHaveBeenCalledTimes(1)
    })
  })

  describe('Multiple changes', () => {
    test('Different changes in multiple commits', async () => {
      let expectationAdded = expect.objectContaining({path: 'icons/added.pdf'})
      let expectationRemoved = expect.objectContaining({path: 'icons/removed.pdf'})
      let expectationModified = expect.objectContaining({path: 'icons/modified.pdf'})

      await robot.receive(multipleCommits)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectationAdded)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectationRemoved)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectationModified)
    })

    test('Different changes in a single commit', async () => {
      let expectationAdded = expect.objectContaining({path: 'icons/added.pdf'})
      let expectationRemoved = expect.objectContaining({path: 'icons/removed.pdf'})
      let expectationModified = expect.objectContaining({path: 'icons/modified.pdf'})

      await robot.receive(multipleChanges)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectationAdded)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectationRemoved)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectationModified)
    })

    test('New commits ovewrite older commits', async () => {
      github.repos.getContent = jest.fn()
        .mockReturnValueOnce(Promise.resolve(getConfig))
        .mockReturnValueOnce(Promise.resolve(getIcon)) // add dolor.svg
        .mockReturnValueOnce(Promise.resolve(getIcon)) // remove ipsum.svg
        .mockReturnValueOnce(Promise.resolve({ })) // modify lorem.svg
        .mockReturnValueOnce(Promise.resolve(getIcon)) // add lorem.svg

      await robot.receive(overwrites)
      expect(github.repos.createFile).toHaveBeenCalledTimes(2)
      expect(github.repos.deleteFile).toHaveBeenCalledTimes(1)
      expect(github.repos.updateFile).toHaveBeenCalledTimes(0)
    })
  })

  describe('Branches & Repos', () => {
    test('Commit additions to the configured branch', async () => {
      let expectation = expect.objectContaining({branch: config.targetBranch})
      await robot.receive(addition)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectation)
    })

    test('Commit additions to the configured repository', async () => {
      let expectation = expect.objectContaining({repo: config.targetRepo})
      await robot.receive(addition)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectation)
    })

    test('Commit removals to the configured branch', async () => {
      let expectation = expect.objectContaining({branch: config.targetBranch})
      await robot.receive(removal)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectation)
    })

    test('Commit removals to the configured repository', async () => {
      let expectation = expect.objectContaining({repo: config.targetRepo})
      await robot.receive(removal)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectation)
    })

    test('Commit modifications to the configured branch', async () => {
      let expectation = expect.objectContaining({branch: config.targetBranch})
      await robot.receive(modification)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectation)
    })

    test('Commit modifications to the configured repository', async () => {
      let expectation = expect.objectContaining({repo: config.targetRepo})
      await robot.receive(modification)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectation)
    })

    test('Ignores pushes to a branch other than the "sourcBranch"', async () => {
      await robot.receive(wrongBranch)
      expect(github.repos.createFile).not.toHaveBeenCalled()
      expect(github.repos.deleteFile).not.toHaveBeenCalled()
      expect(github.repos.updateFile).not.toHaveBeenCalled()
    })

    test('Ignores pushes to a repository other than the "sourceRepo"', async () => {
      await robot.receive(wrongRepo)
      expect(github.repos.createFile).not.toHaveBeenCalled()
      expect(github.repos.deleteFile).not.toHaveBeenCalled()
      expect(github.repos.updateFile).not.toHaveBeenCalled()
    })
  })
})
