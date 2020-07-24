const { convert, getSHA } = require('./src/util.js')

const defaultConfig = {
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

    let processed = []
    for (let commit of context.payload.commits.reverse()) {
      let modifiedFiles = commit.modified.filter(file => fileFilter.test(file))
      for (let file of modifiedFiles) {
        if (processed.includes(file)) {
          robot.log.debug({file}, 'skipping file becuase later commits overwrite this change')
          continue
        }

        robot.log.info({file}, '.svg file modification detected')
        let pdfFile = file.replace('.svg', '.pdf')

        let sha
        try {
          sha = await getSHA(context, config, pdfFile)
        } catch (e) {
          robot.log.info(`.pdf version of ${file} not found, adding instead`)
          commit.added.push(file)
          continue
        }

        robot.log.info(`Reconverting ${file} into a .pdf file`)
        let pdf = await convert(context, file, branch)

        robot.log.info(`Preparing commit to update ${pdfFile}`)
        let newCommit = context.repo({
          branch: config.targetBranch,
          content: pdf,
          message: `Update ${pdfFile}`,
          path: pdfFile,
          repo: config.targetRepo,
          sha: sha
        })

        robot.log.info(`Commiting to repository ${config.targetRepo} on branch ${config.targetBranch}`)
        if (process.env.dry !== 'true') context.github.repos.updateFile(newCommit)

        processed.push(file)
      }

      let newFiles = commit.added.filter(file => fileFilter.test(file))
      for (let file of newFiles) {
        if (processed.includes(file)) {
          robot.log.debug({file}, 'skipping file becuase later commits overwrite this change')
          continue
        }

        robot.log.info({file}, 'new .svg file detected')
        let pdfFile = file.replace('.svg', '.pdf')

        robot.log.info(`Converting ${file} into a .pdf file`)
        let pdf = await convert(context, file, branch)

        robot.log.info(`Preparing commit for the newly created .pdf`)
        let newCommit = context.repo({
          branch: config.targetBranch,
          content: pdf,
          message: `Add ${file} as pdf`,
          path: pdfFile,
          repo: config.targetRepo
        })

        robot.log.info(`Commiting to repository ${config.targetRepo} on branch ${config.targetBranch}`)
        if (process.env.dry !== 'true') context.github.repos.createOrUpdateFile(newCommit)

        processed.push(file)
      }

      let removedFiles = commit.removed.filter(file => fileFilter.test(file))
      for (let file of removedFiles) {
        if (processed.includes(file)) {
          robot.log.debug({file}, 'skipping file becuase later commits overwrite this change')
          continue
        }

        robot.log.info({file}, '.svg file deletion detected')
        let pdfFile = file.replace('.svg', '.pdf')

        let sha
        try {
          sha = await getSHA(context, config, pdfFile)
        } catch (e) {
          continue
        }

        robot.log.info(`Preparing commit to delete ${pdfFile}`)
        let newCommit = context.repo({
          branch: config.targetBranch,
          message: `Remove ${pdfFile}`,
          path: pdfFile,
          repo: config.targetRepo,
          sha: sha
        })

        robot.log.info(`Commiting to repository ${config.targetRepo} on branch ${config.targetBranch}`)
        if (process.env.dry !== 'true') context.github.repos.deleteFile(newCommit)

        processed.push(file)
      }
    }
  })
}
