const svg2pdf = require('./lib/svg-to-pdf.js')

module.exports = (robot) => {
  robot.on('push', async context => {
    robot.log.debug(`New push detected`)
    let push = context.payload

    let branch = push.ref.replace('refs/heads/', '')
    if (branch !== process.env.SOURCE_BRANCH) {
      robot.log.info({base: push.ref}, 'event ignored, branch not of interest')
      return
    }

    push.commits.forEach(commit => {
      let added = []
      commit.added.filter(file => !added.includes(file))
        .forEach(async file => {
          robot.log.info({file: file}, '1 new file detected')
          added.push(file)

          robot.log.debug(`Converting ${file} into a a .pdf file`)
          let targetFile = context.repo({path: file, ref: branch})
          let content = await context.github.repos.getContent(targetFile)
          let pdf = await svg2pdf(content.data.content)

          robot.log.debug(`Preparing commit for the newly created pdf`)
          let commit = context.repo({
            branch: process.env.TARGET_BRANCH,
            content: pdf,
            message: `Add ${file} as pdf`,
            path: file.replace('.svg', '.pdf')
          })

          robot.log.debug(`Commiting to repository on branch ${process.env.TARGET_BRANCH}`)
          context.github.repos.createFile(commit)
        })
    })
  })
}
