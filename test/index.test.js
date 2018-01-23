const { createRobot } = require('probot')
const app = require('../index.js')

const { added, removed, modified } = require('./fixtures/payload')

describe('svg-to-pdf', () => {
  let robot
  let github

  beforeEach(() => {
    robot = createRobot()
    app(robot)

    github = {
      repos: {
        getContent: jest.fn().mockReturnValue(Promise.resolve({
          data: {
            content: 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNNTExIDE5N2MtMi01LTYtOS0xMi0xMGwtMTU4LTIzLTcxLTE0M2ExNSAxNSAwIDAgMC0yNiAwbC03MSAxNDMtMTYwIDIzYTE1IDE1IDAgMCAwLTggMjZsMTE2IDExMS0yNyAxNThhMTUgMTUgMCAwIDAgMjIgMTZsMTQxLTc1IDE0MSA3NWExNSAxNSAwIDAgMCAyMi0xNmwtMjctMTU4IDExNC0xMTFjNS00IDYtMTAgNC0xNnpNMzY3IDMwOGMtNCA0LTYgOS01IDE0bDIzIDEzNS0xMjEtNjRhMTUgMTUgMCAwIDAtMTQgMGwtMTIxIDY0IDIzLTEzNWMxLTUtMS0xMC01LTE0bC05OS05NSAxMzctMjBjNS0xIDktNCAxMS04bDYxLTEyMyA2MSAxMjNjMiA0IDYgNyAxMSA4bDEzNiAyMC05OCA5NXoiLz48L3N2Zz4='
          }
        })),
        createFile: jest.fn(),
        deleteFile: jest.fn(),
        updateFile: jest.fn()
      }
    }

    robot.auth = () => Promise.resolve(github)
  })

  it('detects a new file', async () => {
    await robot.receive(added)
    expect(github.repos.createFile).toHaveBeenCalled()
  })

  it('detects a removed file', async () => {
    await robot.receive(removed)
    expect(github.repos.deleteFile).toHaveBeenCalled()
  })

  it('detects a modified file', async () => {
    await robot.receive(modified)
    expect(github.repos.updateFile).toHaveBeenCalled()
  })
})
