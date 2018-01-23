const svg2pdf = require('./svg-to-pdf.js')

module.exports = {
  convert: async function(context, file, branch) {
    let source = context.repo({path: file, ref: branch})
    let content = await context.github.repos.getContent(source)
    return await svg2pdf(content.data.content)
  },

  getSHA: async function(context, file, branch) {
    let target = context.repo({path: file, ref: branch})
    let content = await context.github.repos.getContent(target)
    return content.data.sha
  }
}
