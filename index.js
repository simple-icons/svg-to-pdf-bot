const { convert, getSHA } = require('./lib/util.js')

module.exports = (robot) => {
  robot.on('push', async context => {
    robot.log.debug('New push detected')
    let push = context.payload

    let branch = push.ref.replace('refs/heads/', '')
    if (branch !== process.env.SOURCE_BRANCH) {
      robot.log.info({base: push.ref}, 'event ignored, branch not of interest')
      return
    }

    for (let commit of push.commits) {
      let newFiles = commit.added.filter(file => file.endsWith('.svg'))
      for (let file of newFiles) {
        robot.log.info({file: file}, 'new file detected')
        let pdfFile = file.replace('.svg', '.pdf')

        robot.log.debug(`Converting ${file} into a .pdf file`)
        let pdf = await convert(context, file, branch)

        robot.log.debug(`Preparing commit for the newly created .pdf`)
        let commit = context.repo({
          branch: process.env.TARGET_BRANCH,
          content: pdf,
          message: `Add ${file} as pdf`,
          path: pdfFile
        })

        robot.log.debug(`Commiting to repository on branch ${process.env.TARGET_BRANCH}`)
        context.github.repos.createFile(commit)
      }

      let removedFiles = commit.removed.filter(file => file.endsWith('.svg'))
      for (let file of removedFiles) {
        robot.log.info({file: file}, 'file deletion detected')
        let pdfFile = file.replace('.svg', '.pdf')
        let sha = await getSHA(context, pdfFile, process.env.TARGET_BRANCH)

        robot.log.debug(`Preparing commit to delete ${pdfFile}`)
        let commit = context.repo({
          branch: process.env.TARGET_BRANCH,
          message: `Remove ${pdfFile}`,
          path: pdfFile,
          sha: sha
        })

        robot.log.debug(`Commiting to repository on branch ${process.env.TARGET_BRANCH}`)
        context.github.repos.deleteFile(commit)
      }

      let modifiedFiles = commit.modified.filter(file => file.endsWith('.svg'))
      for (let file of modifiedFiles) {
        robot.log.info({file: file}, 'file modification detected')
        let pdfFile = file.replace('.svg', '.pdf')
        let sha = await getSHA(context, pdfFile, process.env.TARGET_BRANCH)

        robot.log.debug(`Reconverting ${file} into a .pdf file`)
        let pdf = await convert(context, file, branch)

        robot.log.debug(`Preparing commit to update ${pdfFile}`)
        let commit = context.repo({
          branch: process.env.TARGET_BRANCH,
          content: pdf,
          message: `Update ${pdfFile}`,
          path: pdfFile,
          sha: sha
        })

        robot.log.debug(`Commiting to repository on branch ${process.env.TARGET_BRANCH}`)
        context.github.repos.updateFile(commit)
      }
    }
  })
}
