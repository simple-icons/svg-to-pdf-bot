const { convert, getSHA } = require('./lib/util.js')

const defaultConfig = {
  dry: false,
  source: 'develop',
  target: 'develop'
}

module.exports = (robot) => {
  robot.on('push', async context => {
    robot.log.debug('New push detected')
    let push = context.payload

    const config = await context.config('svg-to-pdf.yml', defaultConfig)

    let branch = push.ref.replace('refs/heads/', '')
    if (branch !== config.source) {
      robot.log.info({base: push.ref}, 'event ignored, branch not of interest')
      return
    }

    for (let commit of push.commits) {
      let newFiles = commit.added.filter(file => file.endsWith('.svg'))
      for (let file of newFiles) {
        robot.log.info({file: file}, 'new .svg file detected')
        let pdfFile = file.replace('.svg', '.pdf')

        robot.log.info(`Converting ${file} into a .pdf file`)
        let pdf = await convert(context, file, branch)

        robot.log.info(`Preparing commit for the newly created .pdf`)
        let commit = context.repo({
          branch: config.target,
          content: pdf,
          message: `Add ${file} as pdf`,
          path: pdfFile
        })

        robot.log.info(`Commiting to repository on branch ${config.target}`)
        if (!config.dry) context.github.repos.createFile(commit)
      }

      let removedFiles = commit.removed.filter(file => file.endsWith('.svg'))
      for (let file of removedFiles) {
        robot.log.info({file: file}, '.svg file deletion detected')
        let pdfFile = file.replace('.svg', '.pdf')
        let sha = await getSHA(context, pdfFile, config.target)

        robot.log.info(`Preparing commit to delete ${pdfFile}`)
        let commit = context.repo({
          branch: config.target,
          message: `Remove ${pdfFile}`,
          path: pdfFile,
          sha: sha
        })

        robot.log.info(`Commiting to repository on branch ${config.target}`)
        if (!config.dry) context.github.repos.deleteFile(commit)
      }

      let modifiedFiles = commit.modified.filter(file => file.endsWith('.svg'))
      for (let file of modifiedFiles) {
        robot.log.info({file: file}, '.svg file modification detected')
        let pdfFile = file.replace('.svg', '.pdf')
        let sha = await getSHA(context, pdfFile, config.target)

        robot.log.info(`Reconverting ${file} into a .pdf file`)
        let pdf = await convert(context, file, branch)

        robot.log.info(`Preparing commit to update ${pdfFile}`)
        let commit = context.repo({
          branch: config.target,
          content: pdf,
          message: `Update ${pdfFile}`,
          path: pdfFile,
          sha: sha
        })

        robot.log.info(`Commiting to repository on branch ${config.target}`)
        if (!config.dry) context.github.repos.updateFile(commit)
      }
    }
  })
}
