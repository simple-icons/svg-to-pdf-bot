const { convert, getSHA } = require('./lib/util.js')

const defaultConfig = {
  dry: false,
  sourceBranch: 'develop',
  sourceRepo: 'simple-icons',
  targetBranch: 'master',
  targetRepo: 'simple-icons-pdf'
}

const fileFilter = /icons\/.*\.svg/

module.exports = (robot) => {
  robot.on('push', async context => {
    robot.log.debug('New push detected')
    const config = await context.config('svg-to-pdf.yml', defaultConfig)

    let branch = context.payload.ref.replace('refs/heads/', '')
    let repo = context.payload.repository.name
    if (branch !== config.sourceBranch || repo !== config.sourceRepo) {
      robot.log.info({branch, repo}, 'event ignored, branch and/or repo not the correct source')
      return
    }

    for (let commit of context.payload.commits) {
      let newFiles = commit.added.filter(file => fileFilter.test(file))
      for (let file of newFiles) {
        robot.log.info({file}, 'new .svg file detected')
        let pdfFile = file.replace('.svg', '.pdf')

        robot.log.info(`Converting ${file} into a .pdf file`)
        let pdf = await convert(context, file, branch)

        robot.log.info(`Preparing commit for the newly created .pdf`)
        let commit = context.repo({
          branch: config.targetBranch,
          content: pdf,
          message: `Add ${file} as pdf`,
          path: pdfFile,
          repo: config.targetRepo
        })

        robot.log.info(`Commiting to repository ${config.targetRepo} on branch ${config.targetBranch}`)
        if (!config.dry) context.github.repos.createFile(commit)
      }

      let removedFiles = commit.removed.filter(file => fileFilter.test(file))
      for (let file of removedFiles) {
        robot.log.info({file}, '.svg file deletion detected')
        let pdfFile = file.replace('.svg', '.pdf')
        let sha = await getSHA(context, config, pdfFile)

        robot.log.info(`Preparing commit to delete ${pdfFile}`)
        let commit = context.repo({
          branch: config.targetBranch,
          message: `Remove ${pdfFile}`,
          path: pdfFile,
          repo: config.targetRepo,
          sha: sha
        })

        robot.log.info(`Commiting to repository ${config.targetRepo} on branch ${config.targetBranch}`)
        if (!config.dry) context.github.repos.deleteFile(commit)
      }

      let modifiedFiles = commit.modified.filter(file => fileFilter.test(file))
      for (let file of modifiedFiles) {
        robot.log.info({file}, '.svg file modification detected')
        let pdfFile = file.replace('.svg', '.pdf')
        let sha = await getSHA(context, config, pdfFile)

        robot.log.info(`Reconverting ${file} into a .pdf file`)
        let pdf = await convert(context, file, branch)

        robot.log.info(`Preparing commit to update ${pdfFile}`)
        let commit = context.repo({
          branch: config.targetBranch,
          content: pdf,
          message: `Update ${pdfFile}`,
          path: pdfFile,
          repo: config.targetRepo,
          sha: sha
        })

        robot.log.info(`Commiting to repository ${config.targetRepo} on branch ${config.targetBranch}`)
        if (!config.dry) context.github.repos.updateFile(commit)
      }
    }
  })
}
