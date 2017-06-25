import https from 'https';
import chalk from 'chalk';
import pry from 'pryjs';

export default async function (token) {
  let groupData = await getGroupData(token);
  console.log(groupData)
  console.log("Found " + groupData.length + " groups");
  return groupData.filter(function(group){
    return group.messages.count > 0;
  }).map(function(group) {
    return group.group_id;
  });
}

async function getGroupData(token) {
  return new Promise(
    function (resolve, reject) {
      let data = '';
      // TODO: Loop over pages until an empty page instead of setting large page size
      let path = '/v3/groups?per_page=500'
      let request = https.request({
        host: 'api.groupme.com',
        path: path,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/47.0.2526.106 Safari/537.36',
          'Referer': 'https://app.groupme.com/chats',
          'X-Access-Token': token
        }
      });

      request.on('response', response => {
        console.log(chalk.cyan(`Fetching data from: api.groupme.com${path}`));

        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {
          let parsed = JSON.parse(data.toString());
          let array = parsed.response;

          // console.log("Got a response...")
          // console.log(array)
          resolve(array);
        });
      });

      request.end();

      request.on('error', error => {
        console.error('Error with connector:', error.stack);
        reject(error);
      });
    }
  );
}
