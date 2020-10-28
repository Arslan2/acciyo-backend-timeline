/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */
var Queue = require('bull');

module.exports.bootstrap = async function() {
  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return;
  // }
  //
  // await User.createEach([
  //   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
  //   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
  //   // etc.
  // ]);
  // ```
  //var redisPort = "ec2-54-164-4-249.compute-1.amazonaws.com";
  var testQueue;
  try {
    testQueue = new Queue('Website Queue', process.env.REDIS_URL);
    console.log('test Queue has been set up');
    // var client = require('redis').createClient(process.env.REDIS_URL);
  } catch (err) {
    console.log('error in bootstrap', err);
  }
  testQueue.process('createTimeline', async function(job, done) {
    testQueue.clean(1000 * 10);
    console.log('job started');
    console.log('job id: ', job.id);
    job.progress(50);
    var timeline = null;
    try {
      timeline = await sails.helpers.timelineCreation.with(job.data);
    } catch (err) {
      console.log('timeline failed: ', err);
      // job.progress(100);
      return done(null);
    }
    console.log('TIMELINE done? ');
    if (!timeline) {
      // job.progress(100);
      console.log('timeline could not be created');
      return done(timeline);
    } else {
      console.log('successful timeline');
      // job.progress(100);
      return done(timeline);
    }
  });
  testQueue.on('active', function(job, jpromise) {
    console.log(`job active: ${job.id}`);
  });
  testQueue.on('stalled', function(job) {
    console.log(`job stalled: ${job.id}`);
  });

  testQueue.on('failed', function(job, err) {
    console.log(`job failed: ${job.id} with error: ${err}`);
    job.remove();
  });
  global.testQueue = testQueue;
};
