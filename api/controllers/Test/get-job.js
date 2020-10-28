module.exports = {
  friendlyName: 'Check if URL is news site',

  description: 'Returns an object with properties, articles, and terms.',

  inputs: {
    jobid: {
      description: 'url to check for',
      type: 'string',
      required: true
    }
  },

  exits: {
    success: {
      responseType: 'ok',
      description: 'URL VALID'
    },
    failure: {
      responseType: 'ok',
      description: 'URL NOT VALID'
    },
    serverError: {
      responseType: 'serverError',
      description: 'Internal Server Error in the event of a server-side issue.'
    }
  },

  fn: async function(inputs, exits) {
    console.log('GET-JOB CALLED');
    try {
      let params = inputs;
      console.log('r: ', params.jobid);
      //WHAT HAPPENS WHEN JOB HAS ALREADY BEEN DE-Q'ed? ..need to check for timeline existence.
      let j = await testQueue.getJob(params.jobid);

      if (!j) {
        console.log('job is null');
        return exits.success({ jobid: params.jobid, state: 'no job found' });
      }
      // if(!j){
      //     console.log("job status is null");
      //     //VERY likely timeline created
      //     let savedTimeline =  await sails.helpers.getTimeline.with({url:params.jobid });
      //     if(!savedTimeline){

      //         return exits.serverError('No Timeline Found');
      //     }else{
      //         console.log("timeline found with a null job in queue: ", savedTimeline);
      //         return exits.success(savedTimeline);
      //     }
      // }

      let jstatus = j.progress();
      let jobdata = j.data;

      console.log('job progress: ', jstatus);
      console.log('job data keys : ', Object.keys(jobdata));

      let content = jstatus;
      if (jstatus === 100) {
        //if status is 0 or 100 - we should check for timeline.
        //content  = await sails.helpers.getTimeline.with(jobdata);
        return exits.success({ jobid: params.jobid, state: 'complete' });
      }
      if (jstatus === 0) {
        console.log('jstatus is zero');
        return exits.success({ jobid: params.jobid, state: 'waiting' });
      }
    } catch (err) {
      return exits.serverError(err);
    }
  }
};
