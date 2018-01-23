const fs = require('fs-promise')
const { createRobot } = require('probot')
const yaml = require('yamljs')

const app = require('../index.js')

const { differentChanges, multipleCommits } = require('./payloads/advanced')
const { additions, removals, modifications } = require('./payloads/multiple')
const { addition, removal, modification } = require('./payloads/single')
const { jsonAdded, cssRemoved, htmlModified, wrongBranch } = require('./payloads/wrong')

describe('svg-to-pdf', () => {
  let robot
  let github
  let config
  let configBuffer
  let iconBuffer

  beforeAll(async () => {
    configBuffer = await fs.readFile('./test/fixtures/standard-config.yml')
    iconBuffer = await fs.readFile('./test/fixtures/icon.svg')

    let configString = configBuffer.toString('ascii')
    config = yaml.parse(configString)
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

  describe('New files', () => {
    test('Create a new PDF', async () => {
      let expectation = expect.objectContaining({path: 'test.pdf'})

      await robot.receive(addition)
      expect(github.repos.createFile).toHaveBeenCalledTimes(1)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectation)
    })

    test('Create multiple new PDFs', async () => {
      let expectationFoo = expect.objectContaining({path: 'foo.pdf'})
      let expectationBar = expect.objectContaining({path: 'bar.pdf'})

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
      await robot.receive(jsonAdded)
      expect(github.repos.createFile).not.toHaveBeenCalled()
    })
  })

  describe('Removed files', () => {
    test('Delete the PDF version of a file', async () => {
      let expectation = expect.objectContaining({path: 'test.pdf'})

      await robot.receive(removal)
      expect(github.repos.deleteFile).toHaveBeenCalledTimes(1)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectation)
    })

    test('Delete the PDF version of multiple files', async () => {
      let expectationFoo = expect.objectContaining({path: 'foo.pdf'})
      let expectationBar = expect.objectContaining({path: 'bar.pdf'})

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
      await robot.receive(cssRemoved)
      expect(github.repos.deleteFile).not.toHaveBeenCalled()
    })
  })

  describe('Modified files', () => {
    test('Update the PDF version of a file', async () => {
      let expectation = expect.objectContaining({path: 'test.pdf'})

      await robot.receive(modification)
      expect(github.repos.updateFile).toHaveBeenCalledTimes(1)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectation)
    })

    test('Update the PDF version of multiple files', async () => {
      let expectationFoo = expect.objectContaining({path: 'foo.pdf'})
      let expectationBar = expect.objectContaining({path: 'bar.pdf'})

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
      await robot.receive(htmlModified)
      expect(github.repos.updateFile).not.toHaveBeenCalled()
    })
  })

  describe('Multiple changes', () => {
    test('Different changes in multiple commits', async () => {
      let expectationAdded = expect.objectContaining({path: 'added.pdf'})
      let expectationRemoved = expect.objectContaining({path: 'removed.pdf'})
      let expectationModified = expect.objectContaining({path: 'modified.pdf'})

      await robot.receive(multipleCommits)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectationAdded)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectationRemoved)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectationModified)
    })

    test('Different changes in a single commit', async () => {
      let expectationAdded = expect.objectContaining({path: 'added.pdf'})
      let expectationRemoved = expect.objectContaining({path: 'removed.pdf'})
      let expectationModified = expect.objectContaining({path: 'modified.pdf'})

      await robot.receive(differentChanges)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectationAdded)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectationRemoved)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectationModified)
    })
  })

  describe('Branches', () => {
    test('Commit additions to the configured branch', async () => {
      let expectation = expect.objectContaining({branch: config.target})
      await robot.receive(addition)
      expect(github.repos.createFile).toHaveBeenCalledWith(expectation)
    })

    test('Commit removals to the configured branch', async () => {
      let expectation = expect.objectContaining({branch: config.target})
      await robot.receive(removal)
      expect(github.repos.deleteFile).toHaveBeenCalledWith(expectation)
    })

    test('Commit modifications to the configured branch', async () => {
      let expectation = expect.objectContaining({branch: config.target})
      await robot.receive(modification)
      expect(github.repos.updateFile).toHaveBeenCalledWith(expectation)
    })

    test('Ignores pushes to an incorrect branch', async () => {
      await robot.receive(wrongBranch)
      expect(github.repos.createFile).not.toHaveBeenCalled()
      expect(github.repos.deleteFile).not.toHaveBeenCalled()
      expect(github.repos.updateFile).not.toHaveBeenCalled()
    })
  })
})
