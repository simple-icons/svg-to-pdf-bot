module.exports = (robot) => {
  console.log('Yay, the app was loaded!')

  robot.on('push', async context => {
    let push = context.payload;

    //
    let branch = push.ref.replace('refs/heads/', '');
    if (branch !== process.env.LISTEN_BRANCH) {
      robot.log.info({base: push.ref}, 'event ignored, branch not of interest')
      return
    }

    push.commits.forEach(commit => {
      let added = [];
      commit.added.filter(file => !added.includes(file))
        .forEach(async file => {
          added.push(file);

          //
          robot.log.info({file: file}, '1 new file detected')

          //
          let commit = context.repo({
            branch: 'test-bot',
            content: new Buffer("Hello World").toString('base64'),
            message: `Add ${file} as pdf`,
            path: file.replace('.svg', '.pdf')
          });

          //
          context.github.repos.createFile(commit);
        })
    })
  })
}
