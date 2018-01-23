const svg2pdf = require('./svg-to-pdf.js')

module.exports = {
  convert: async (context, file, branch) => {
    let source = context.repo({path: file, ref: branch})
    let content = await context.github.repos.getContent(source)
    return svg2pdf(content.data.content)
  },

  getSHA: async (context, file, branch) => {
    let target = context.repo({path: file, ref: branch})
    let content = await context.github.repos.getContent(target)
    return content.data.sha
  }
}
